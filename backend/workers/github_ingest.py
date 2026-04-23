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
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required.")

    return create_client(supabase_url, supabase_key)


def _get_embeddings_model():
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY is required for GoogleGenerativeAIEmbeddings.")

    google_embeddings_class = getattr(
        importlib.import_module("langchain_google_genai"),
        "GoogleGenerativeAIEmbeddings",
    )
    return google_embeddings_class(
        model=os.getenv("EMBEDDING_MODEL", "gemini-embedding-2-preview"),
        google_api_key=google_api_key,
        output_dimensionality=int(os.getenv("EMBEDDING_DIMENSION", "1536")),
    )


async def _embed_text(model, text: str) -> list[float]:
    if hasattr(model, "aembed_query"):
        vector = await model.aembed_query(text)
        return list(vector)

    if hasattr(model, "embed_query"):
        vector = model.embed_query(text)
        return list(vector)

    raise RuntimeError("No supported embedding method was found on the embeddings model.")


async def _fetch_top_repositories(client: httpx.AsyncClient, query: str, limit: int = 50) -> list[dict[str, Any]]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

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


def _build_insert_payload(repo: dict[str, Any], domain: str, embedding: list[float]) -> dict[str, Any]:
    return {
        "repo_name": repo.get("full_name") or repo.get("name") or "unknown",
        "description": repo.get("description") or "",
        "url": repo.get("html_url") or "",
        "domain": domain,
        "embedding": embedding,
        "metadata": {
            "stars": repo.get("stargazers_count"),
            "language": repo.get("language"),
            "topics": repo.get("topics") if isinstance(repo.get("topics"), list) else [],
            "github_id": repo.get("id"),
        },
    }


async def ingest_github_repos(domain: str, query: str):
    """Fetch top GitHub repos, embed descriptions, and store them in Supabase repos table."""
    if not query or not query.strip():
        raise ValueError("query must be a non-empty string")

    normalized_domain = (domain or "all").strip().lower()
    supabase = _get_supabase_client()
    embeddings_model = _get_embeddings_model()

    async with httpx.AsyncClient(timeout=30.0) as client:
        repos = await _fetch_top_repositories(client=client, query=query, limit=50)

    inserted = 0
    failed = 0

    for repo in repos:
        description = repo.get("description") or ""
        text_for_embedding = description.strip() or (repo.get("full_name") or repo.get("name") or "")

        try:
            embedding_vector = await _embed_text(embeddings_model, text_for_embedding)
            row = _build_insert_payload(repo=repo, domain=normalized_domain, embedding=embedding_vector)
            supabase.table("repos").upsert(row, on_conflict="url").execute()
            inserted += 1
        except Exception:
            failed += 1

        # Small pause between writes to reduce API pressure and smooth throughput.
        await asyncio.sleep(0.25)

    return {
        "domain": normalized_domain,
        "query": query,
        "fetched": len(repos),
        "inserted": inserted,
        "failed": failed,
    }


if __name__ == "__main__":
    async def _run():
        result = await ingest_github_repos(
            domain=os.getenv("INGEST_DOMAIN", "all"),
            query=os.getenv("INGEST_QUERY", "open source vector search"),
        )
        print(result)

    asyncio.run(_run())