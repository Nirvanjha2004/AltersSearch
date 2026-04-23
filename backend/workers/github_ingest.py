import asyncio
import importlib
import time
from typing import Any
from dotenv import load_dotenv
import os

# Ye line .env file se variables read karke os.environ mein daal degi
load_dotenv() 

# Ab aapka _get_supabase_client() function inhein dhoond payega
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
import httpx
from supabase import acreate_client

from loguru import logger


GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"


def _get_embeddings_model():
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY is required for Gemini embeddings.")

    google_embeddings_class = getattr(
        importlib.import_module("langchain_google_genai"),
        "GoogleGenerativeAIEmbeddings",
    )
    return google_embeddings_class(
        model="models/gemini-embedding-001",
        google_api_key=google_api_key,
        output_dimensionality=768,
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

    raise RuntimeError("No supported embedding method found on the Gemini embeddings model.")


def _build_insert_payload(repo: dict[str, Any], query: str, embedding: list[float]) -> dict[str, Any]:
    return {
        "repo_name": repo.get("full_name") or repo.get("name") or "unknown",
        "description": repo.get("description") or "",
        "url": repo.get("html_url") or "",
        "domain": _infer_domain(query=query, repo=repo),
        "embedding": embedding,
    }


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


def _build_embedding_text(repo: dict[str, Any]) -> str:
    description = str(repo.get("description") or "").strip()
    repo_name = str(repo.get("full_name") or repo.get("name") or "").strip()
    if description:
        return description
    if repo_name:
        return repo_name
    return "repository"


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
        job_id,
        query,
        current_page,
        len(repos),
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
            job_id,
            query,
            current_page + 1,
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
        or os.getenv("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )
    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY) are required."
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

            # Respect API rate limits and keep a predictable polling cadence.
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(run_daemon())