"""
Re-embed all existing repos in Supabase using Jina AI (jina-embeddings-v3, 1024d).

Run this AFTER applying migration 20260510000001_update_embedding_dim_1024.sql.
Reads all repo rows, generates new 1024d embeddings, writes them back.
No GitHub API calls -- only reads/writes Supabase.

Features:
  - Retries failed batches up to MAX_RETRIES times with exponential backoff
  - Skips already-embedded rows (embedding IS NOT NULL) so re-runs are safe
  - Saves progress: if interrupted, re-run and it picks up where it left off

Usage:
    python -m workers.reembed

Required env vars:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    JINA_API_KEY  (free at https://jina.ai -- 1M tokens, no credit card)
"""

import asyncio
import os
import time
from dotenv import load_dotenv
from loguru import logger
from supabase import acreate_client

load_dotenv()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.embeddings import embed_texts

PAGE_SIZE = 100       # rows fetched per Supabase page
MAX_RETRIES = 5       # max attempts per batch before giving up
BASE_BACKOFF = 2.0    # seconds — doubles each retry


def _build_embedding_text(row: dict) -> str:
    parts = []
    description = str(row.get("description") or "").strip()
    repo_name = str(row.get("full_name") or row.get("repo_name") or "").strip()
    topics = row.get("topics") or []

    if description:
        parts.append(description)
    if repo_name:
        parts.append(repo_name)
    if isinstance(topics, list) and topics:
        parts.append(" ".join(topics))

    return " ".join(parts) if parts else "repository"


async def _embed_with_retry(texts: list[str], batch_label: str) -> list[list[float]] | None:
    """
    Embed texts with exponential backoff retry.
    Returns vectors on success, None if all retries exhausted.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return await embed_texts(texts)
        except Exception as exc:
            wait = BASE_BACKOFF ** attempt
            if attempt < MAX_RETRIES:
                logger.warning(
                    "Embed failed {} attempt={}/{} error='{}' retrying in {:.0f}s",
                    batch_label, attempt, MAX_RETRIES, str(exc)[:120], wait,
                )
                await asyncio.sleep(wait)
            else:
                logger.error(
                    "Embed failed {} after {} attempts -- giving up on this batch. error='{}'",
                    batch_label, MAX_RETRIES, str(exc)[:120],
                )
    return None


async def reembed_all():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    if not os.getenv("JINA_API_KEY"):
        raise ValueError("JINA_API_KEY is required. Get one free at https://jina.ai")

    supabase = await acreate_client(supabase_url, supabase_key)

    # Count only rows that still need embedding (safe to re-run)
    count_resp = (
        await supabase.table("repos")
        .select("url", count="exact")
        .is_("embedding", "null")
        .execute()
    )
    total_pending = count_resp.count or 0

    total_resp = await supabase.table("repos").select("url", count="exact").execute()
    total_all = total_resp.count or 0

    logger.info(
        "Re-embed starting: pending={} already_done={} total={}",
        total_pending, total_all - total_pending, total_all,
    )

    if total_pending == 0:
        logger.info("All repos already have embeddings. Nothing to do.")
        return

    processed = 0
    failed_permanent = 0
    start_total = time.time()
    offset = 0

    while True:
        # Only fetch rows that still need embedding
        resp = await (
            supabase.table("repos")
            .select("url, repo_name, full_name, description, topics")
            .is_("embedding", "null")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break

        texts = [_build_embedding_text(r) for r in rows]
        batch_label = f"offset={offset} size={len(rows)}"

        vectors = await _embed_with_retry(texts, batch_label)

        if vectors is None:
            # All retries exhausted — skip this batch, move on
            failed_permanent += len(rows)
            offset += PAGE_SIZE
            logger.error(
                "Permanently skipping {} repos at offset={}. Will need manual re-run.",
                len(rows), offset,
            )
            continue

        # Write embeddings back one by one
        write_errors = 0
        for row, vector in zip(rows, vectors):
            for write_attempt in range(1, 4):  # 3 write retries
                try:
                    await (
                        supabase.table("repos")
                        .update({"embedding": list(map(float, vector))})
                        .eq("url", row["url"])
                        .execute()
                    )
                    processed += 1
                    break
                except Exception as exc:
                    if write_attempt < 3:
                        await asyncio.sleep(2 ** write_attempt)
                    else:
                        logger.error(
                            "Write failed after 3 attempts url='{}' error='{}'",
                            row.get("url"), str(exc)[:120],
                        )
                        write_errors += 1
                        failed_permanent += 1

        # Don't advance offset — next iteration re-queries NULL rows from the start
        # so successfully written rows are naturally skipped
        elapsed = time.time() - start_total
        rate = processed / elapsed if elapsed > 0 else 0
        eta = (total_pending - processed) / rate if rate > 0 else 0
        logger.info(
            "Progress: {}/{} embedded | {} failed | {:.1f} repos/s | ETA {:.0f}s",
            processed, total_pending, failed_permanent, rate, eta,
        )

        # Small pause to be polite to Jina API
        await asyncio.sleep(0.3)

    logger.info(
        "Re-embed complete: embedded={} failed={} total_pending={} elapsed={:.1f}s",
        processed, failed_permanent, total_pending, time.time() - start_total,
    )
    if failed_permanent > 0:
        logger.warning(
            "{} repos could not be embedded. Re-run this script to retry them.",
            failed_permanent,
        )


if __name__ == "__main__":
    asyncio.run(reembed_all())
