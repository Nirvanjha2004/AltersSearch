import asyncio
import time
from typing import Any
from dotenv import load_dotenv
import os
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

import httpx
from supabase import acreate_client
from loguru import logger


GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"


def _get_embeddings_model():
    """
    Returns a local HuggingFace embedding model (384 dimensions).
    Runs 100% locally. Zero API keys. Zero rate limits.
    """
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


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


async def _fetch_repositories_page(
    client: httpx.AsyncClient,
    query: str,
    page: int,
    per_page: int = 30,
) -> list[dict[str, Any]]:
    headers = _build_github_headers()
    params = {
        "q": query,
        "page": page,
        "per_page": per_page,
        "sort": "stars",
        "order": "desc",
    }

    try:
        response = await client.get(GITHUB_SEARCH_URL, params=params, headers=headers)
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Failed to call GitHub API: {exc}") from exc

    if response.status_code >= 400:
        raise RuntimeError(f"GitHub API returned {response.status_code}: {response.text}")

    payload = response.json()
    items = payload.get("items") if isinstance(payload, dict) else None
    if not isinstance(items, list):
        return []

    return items


async def _embed_texts(model, texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    if hasattr(model, "aembed_documents"):
        vectors = await model.aembed_documents(texts)
        return [list(map(float, vector)) for vector in vectors]

    if hasattr(model, "embed_documents"):
        vectors = model.embed_documents(texts)
        return [list(map(float, vector)) for vector in vectors]

    raise RuntimeError("No supported embedding method found on the embeddings model.")


def _safe_str(value: Any) -> str | None:
    """Return stripped string or None."""
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


def _safe_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _safe_bool(value: Any) -> bool | None:
    if value is None:
        return None
    return bool(value)


def _build_insert_payload(repo: dict[str, Any], query: str, embedding: list[float]) -> dict[str, Any]:
    """
    Maps all meaningful GitHub API repo fields to DB columns.

    GitHub Search API returns these fields per repo:
    https://docs.github.com/en/rest/search/search#search-repositories
    """
    owner: dict[str, Any] = repo.get("owner") or {}
    license_info: dict[str, Any] = repo.get("license") or {}

    return {
        # ── Identity ────────────────────────────────────────────────────────────
        "github_id":            _safe_int(repo.get("id")),
        "repo_name":            _safe_str(repo.get("full_name") or repo.get("name")) or "unknown",
        "name":                 _safe_str(repo.get("name")),
        "full_name":            _safe_str(repo.get("full_name")),
        "url":                  _safe_str(repo.get("html_url")) or "",
        "git_url":              _safe_str(repo.get("git_url")),
        "ssh_url":              _safe_str(repo.get("ssh_url")),
        "clone_url":            _safe_str(repo.get("clone_url")),
        "api_url":              _safe_str(repo.get("url")),          # GitHub REST API URL
        "homepage":             _safe_str(repo.get("homepage")),

        # ── Description / content ───────────────────────────────────────────────
        "description":          _safe_str(repo.get("description")),
        "topics":               repo.get("topics") or [],            # text[]

        # ── Owner ───────────────────────────────────────────────────────────────
        "owner_login":          _safe_str(owner.get("login")),
        "owner_id":             _safe_int(owner.get("id")),
        "owner_type":           _safe_str(owner.get("type")),        # "User" | "Organization"
        "owner_avatar_url":     _safe_str(owner.get("avatar_url")),

        # ── Stats ────────────────────────────────────────────────────────────────
        "stargazers_count":     _safe_int(repo.get("stargazers_count")),
        "watchers_count":       _safe_int(repo.get("watchers_count")),
        "forks_count":          _safe_int(repo.get("forks_count")),
        "open_issues_count":    _safe_int(repo.get("open_issues_count")),
        "size":                 _safe_int(repo.get("size")),         # kilobytes

        # ── Language / tech ─────────────────────────────────────────────────────
        "language":             _safe_str(repo.get("language")),
        "domain":               _infer_domain(query=query, repo=repo),

        # ── Flags ────────────────────────────────────────────────────────────────
        "is_fork":              _safe_bool(repo.get("fork")),
        "is_private":           _safe_bool(repo.get("private")),
        "is_archived":          _safe_bool(repo.get("archived")),
        "is_disabled":          _safe_bool(repo.get("disabled")),
        "is_template":          _safe_bool(repo.get("is_template")),
        "has_issues":           _safe_bool(repo.get("has_issues")),
        "has_projects":         _safe_bool(repo.get("has_projects")),
        "has_wiki":             _safe_bool(repo.get("has_wiki")),
        "has_pages":            _safe_bool(repo.get("has_pages")),
        "has_downloads":        _safe_bool(repo.get("has_downloads")),
        "has_discussions":      _safe_bool(repo.get("has_discussions")),
        "allow_forking":        _safe_bool(repo.get("allow_forking")),

        # ── Licence ─────────────────────────────────────────────────────────────
        "license_key":          _safe_str(license_info.get("key")),
        "license_name":         _safe_str(license_info.get("name")),
        "license_spdx_id":      _safe_str(license_info.get("spdx_id")),

        # ── Default branch / visibility ─────────────────────────────────────────
        "default_branch":       _safe_str(repo.get("default_branch")),
        "visibility":           _safe_str(repo.get("visibility")),   # "public" | "private"

        # ── Timestamps ─────────────────────────────────────────────────────────
        "github_created_at":    _safe_str(repo.get("created_at")),
        "github_updated_at":    _safe_str(repo.get("updated_at")),
        "github_pushed_at":     _safe_str(repo.get("pushed_at")),

        # ── Embedding ───────────────────────────────────────────────────────────
        "embedding":            embedding,
    }


def _build_embedding_text(repo: dict[str, Any]) -> str:
    parts = []
    description = str(repo.get("description") or "").strip()
    repo_name = str(repo.get("full_name") or repo.get("name") or "").strip()
    topics = repo.get("topics") or []

    if description:
        parts.append(description)
    if repo_name:
        parts.append(repo_name)
    if topics:
        parts.append(" ".join(topics))

    return " ".join(parts) if parts else "repository"


async def _claim_next_job(supabase, max_retries: int) -> dict[str, Any] | None:
    response = await (
        supabase.table("ingestion_queue")
        .select("id,query,status,retry_count,current_page,last_updated")
        .in_("status", ["pending", "failed"])
        .lt("retry_count", max_retries)
        .order("last_updated", desc=False)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        logger.debug("No pending ingestion jobs found")
        return None

    job = rows[0]
    job_id = job.get("id")
    if job_id is None:
        return None

    await supabase.table("ingestion_queue").update(
        {
            "status": "processing",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()

    return job


async def _mark_job_completed(supabase, job_id: str):
    await supabase.table("ingestion_queue").update(
        {
            "status": "completed",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()


async def _mark_job_failed(supabase, job_id: str, retry_count: int):
    await supabase.table("ingestion_queue").update(
        {
            "status": "failed",
            "retry_count": retry_count + 1,
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()


async def _mark_job_continue_pagination(supabase, job_id: str, next_page: int):
    await supabase.table("ingestion_queue").update(
        {
            "status": "pending",
            "current_page": next_page,
            "retry_count": 0,
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    ).eq("id", job_id).execute()


async def _process_job(supabase, client: httpx.AsyncClient, job: dict[str, Any]):
    job_id = str(job["id"])
    query = str(job.get("query") or "").strip()
    retry_count = int(job.get("retry_count") or 0)
    current_page = int(job.get("current_page") or 1)

    if not query:
        raise ValueError("query must be a non-empty string")

    logger.info("Processing ingestion job job_id={} query='{}' page={}", job_id, query, current_page)

    repos = await _fetch_repositories_page(client=client, query=query, page=current_page, per_page=30)
    logger.info(
        "Fetched repositories job_id={} query='{}' page={} count={}",
        job_id, query, current_page, len(repos),
    )

    texts = [_build_embedding_text(repo) for repo in repos]
    embeddings_model = _get_embeddings_model()
    vectors = await _embed_texts(model=embeddings_model, texts=texts)

    for repo, embedding_vector in zip(repos, vectors):
        repo_name = repo.get("full_name") or repo.get("name") or "unknown"
        url = repo.get("html_url") or ""
        if not url:
            logger.warning("Skipping repository without URL job_id={} repo_name='{}'", job_id, repo_name)
            continue

        row = _build_insert_payload(repo=repo, query=query, embedding=embedding_vector)
        await supabase.table("repos").upsert(row, on_conflict="url").execute()
        logger.debug("Upserted repository job_id={} repo_name='{}'", job_id, repo_name)

    if len(repos) == 30:
        await _mark_job_continue_pagination(supabase=supabase, job_id=job_id, next_page=current_page + 1)
        logger.info(
            "Job has next page job_id={} query='{}' next_page={}",
            job_id, query, current_page + 1,
        )
    else:
        await _mark_job_completed(supabase=supabase, job_id=job_id)
        logger.info("Completed ingestion job job_id={} query='{}'", job_id, query)

    return retry_count


async def run_daemon():
    """Poll ingestion_queue and ingest top GitHub repos into repos with embeddings."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )
    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required."
        )

    supabase = await acreate_client(supabase_url, supabase_key)
    max_retries = 3
    logger.info("GitHub ingestion daemon started max_retries={}", max_retries)

    async with httpx.AsyncClient(timeout=45.0) as client:
        while True:
            job = None
            try:
                job = await _claim_next_job(supabase=supabase, max_retries=max_retries)
                if job is None:
                    await asyncio.sleep(10)
                    continue

                await _process_job(supabase=supabase, client=client, job=job)
            except Exception:
                job_id = str(job.get("id")) if job else "unknown"
                query = str(job.get("query")) if job else "unknown"
                logger.exception("Failed processing ingestion_queue item job_id={} query='{}'", job_id, query)
                if job and job.get("id") is not None:
                    await _mark_job_failed(
                        supabase=supabase,
                        job_id=str(job["id"]),
                        retry_count=int(job.get("retry_count") or 0),
                    )
                    logger.warning(
                        "Marked ingestion job as failed job_id={} retry_count={}",
                        str(job["id"]),
                        int(job.get("retry_count") or 0) + 1,
                    )

            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(run_daemon())