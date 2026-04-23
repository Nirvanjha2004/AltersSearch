import asyncio
import importlib
import os
import time
from typing import Any

import httpx


GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"


def _get_supabase_client():
    supabase_module = importlib.import_module("supabase")
    create_client = getattr(supabase_module, "create_client")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )

    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY) are required."
        )

    return create_client(supabase_url, supabase_key)


def _get_embeddings_model():
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY is required for Gemini embeddings.")

    google_embeddings_class = getattr(
        importlib.import_module("langchain_google_genai"),
        "GoogleGenerativeAIEmbeddings",
    )
    return google_embeddings_class(
        model=os.getenv("EMBEDDING_MODEL", "gemini-embedding-001"),
        google_api_key=google_api_key,
        output_dimensionality=int(os.getenv("EMBEDDING_DIMENSION", "1536")),
    )


def _infer_domain(query: str, repo: dict[str, Any]) -> str:
    query_lower = query.lower()
    keyword_map = {
        "frontend": "frontend",
        "backend": "backend",
        "devops": "devops",
        "ai": "ai",
        "ml": "ai",
        "data": "data",
        "mobile": "mobile",
    }
    for key, value in keyword_map.items():
        if key in query_lower:
            return value

    language = repo.get("language")
    if isinstance(language, str) and language.strip():
        return language.strip().lower()

    return "all"


def _build_github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AltersSearch-Ingest-Worker",
    }

    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    return headers


async def _fetch_top_repositories(client: httpx.AsyncClient, query: str, limit: int = 50) -> list[dict[str, Any]]:
    headers = _build_github_headers()

    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": min(limit, 100),
        "page": 1,
    }

    try:
        response = await client.get(GITHUB_SEARCH_URL, params=params, headers=headers)
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Failed to call GitHub API: {exc}") from exc

    if response.status_code == 403:
        # Respect GitHub rate-limit reset when available.
        reset_header = response.headers.get("x-ratelimit-reset")
        wait_seconds = 15
        if reset_header and reset_header.isdigit():
            wait_seconds = max(1, int(reset_header) - int(time.time()) + 1)
        await asyncio.sleep(wait_seconds)
        response = await client.get(GITHUB_SEARCH_URL, params=params, headers=headers)

    if response.status_code >= 400:
        raise RuntimeError(f"GitHub API returned {response.status_code}: {response.text}")

    payload = response.json()
    items = payload.get("items") if isinstance(payload, dict) else None
    if not isinstance(items, list):
        return []

    return items[:limit]


async def _embed_texts(model, texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    if hasattr(model, "aembed_documents"):
        vectors = await model.aembed_documents(texts)
        return [list(map(float, vector)) for vector in vectors]

    if hasattr(model, "embed_documents"):
        vectors = model.embed_documents(texts)
        return [list(map(float, vector)) for vector in vectors]

    raise RuntimeError("No supported embedding method was found on the Gemini embeddings model.")


def _build_insert_payload(repo: dict[str, Any], query: str, embedding: list[float]) -> dict[str, Any]:
    return {
        "repo_name": repo.get("full_name") or repo.get("name") or "unknown",
        "description": repo.get("description") or "",
        "url": repo.get("html_url") or "",
        "domain": _infer_domain(query=query, repo=repo),
        "embedding": embedding,
    }


async def _ingest_query(supabase, client: httpx.AsyncClient, query: str) -> dict[str, int]:
    if not query or not query.strip():
        raise ValueError("query must be a non-empty string")

    repos = await _fetch_top_repositories(client=client, query=query, limit=30)
    texts: list[str] = []
    for repo in repos:
        description = repo.get("description") or ""
        fallback = repo.get("full_name") or repo.get("name") or ""
        texts.append((description.strip() or fallback).strip())

    embeddings_model = _get_embeddings_model()
    vectors = await _embed_texts(model=embeddings_model, texts=texts)

    inserted = 0
    failed = 0

    for repo, embedding_vector in zip(repos, vectors):
        url = repo.get("html_url") or ""
        if not url:
            failed += 1
            continue

        try:
            row = _build_insert_payload(repo=repo, query=query, embedding=embedding_vector)
            supabase.table("repos").upsert(row, on_conflict="url").execute()
            inserted += 1
        except Exception:
            failed += 1

        # Small pause between writes to reduce API pressure and smooth throughput.
        await asyncio.sleep(0.25)

    return {
        "fetched": len(repos),
        "inserted": inserted,
        "failed": failed,
    }


def _claim_next_job(supabase, max_retries: int) -> dict[str, Any] | None:
    response = (
        supabase.table("ingestion_queue")
        .select("id,query,status,retry_count,last_updated")
        .in_("status", ["pending", "failed"])
        .lt("retry_count", max_retries)
        .order("last_updated", desc=False)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None

    job = rows[0]
    job_id = job.get("id")
    if job_id is None:
        return None

    supabase.table("ingestion_queue").update(
        {
            "status": "processing",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()

    return job


def _mark_job_completed(supabase, job_id: int):
    supabase.table("ingestion_queue").update(
        {
            "status": "completed",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()


def _mark_job_failed(supabase, job_id: int, retry_count: int):
    supabase.table("ingestion_queue").update(
        {
            "status": "failed",
            "retry_count": retry_count + 1,
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()


async def run_daemon():
    """Poll ingestion_queue and ingest top GitHub repos into repos with embeddings."""
    supabase = _get_supabase_client()
    poll_interval_seconds = float(os.getenv("INGEST_POLL_INTERVAL_SECONDS", "10"))
    loop_sleep_seconds = float(os.getenv("INGEST_LOOP_SLEEP_SECONDS", "1.5"))
    max_retries = int(os.getenv("INGEST_MAX_RETRIES", "5"))

    async with httpx.AsyncClient(timeout=45.0) as client:
        while True:
            job = None
            try:
                job = _claim_next_job(supabase=supabase, max_retries=max_retries)
                if job is None:
                    await asyncio.sleep(poll_interval_seconds)
                    continue

                job_id = int(job["id"])
                query = str(job.get("query") or "").strip()
                retry_count = int(job.get("retry_count") or 0)

                if not query:
                    _mark_job_failed(supabase=supabase, job_id=job_id, retry_count=retry_count)
                    await asyncio.sleep(loop_sleep_seconds)
                    continue

                await _ingest_query(supabase=supabase, client=client, query=query)
                _mark_job_completed(supabase=supabase, job_id=job_id)
            except Exception:
                if job and job.get("id") is not None:
                    _mark_job_failed(
                        supabase=supabase,
                        job_id=int(job["id"]),
                        retry_count=int(job.get("retry_count") or 0),
                    )

            # Global throttle for queue polling/processing loops.
            await asyncio.sleep(loop_sleep_seconds)


if __name__ == "__main__":
    asyncio.run(run_daemon())