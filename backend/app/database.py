import importlib
import os
from typing import Any, Optional
from app.schemas import SearchResult
from dotenv import load_dotenv

# Ye line .env file se variables read karke os.environ mein daal degi
load_dotenv() 

def _get_supabase_client():
    """Build a Supabase client from environment variables."""
    supabase_module = importlib.import_module("supabase")
    create_client = getattr(supabase_module, "create_client")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required.")

    return create_client(supabase_url, supabase_key)


def _normalize_result_row(row: dict[str, Any], requested_domain: Optional[str]) -> Optional[SearchResult]:
    repo_name = row.get("repo_name") or row.get("name") or row.get("repository_name")
    description = row.get("description") or row.get("summary") or ""
    url = row.get("url") or row.get("repo_url") or row.get("html_url")

    metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    resolved_domain = row.get("domain") or metadata.get("domain") or requested_domain or "unknown"

    if not repo_name or not url:
        return None

    return SearchResult(
        repo_name=str(repo_name),
        full_name=str(row.get("full_name") or "") or None,
        description=str(description),
        url=str(url),
        domain=str(resolved_domain),
        owner_avatar_url=(str(row.get("owner_avatar_url")) if row.get("owner_avatar_url") else None),
        owner_login=(str(row.get("owner_login")) if row.get("owner_login") else None),
        visibility=(str(row.get("visibility")) if row.get("visibility") else None),
        topics=(row.get("topics") if isinstance(row.get("topics"), list) else None),
        language=(str(row.get("language")) if row.get("language") else None),
        stargazers_count=(int(row.get("stargazers_count")) if row.get("stargazers_count") is not None else None),
        forks_count=(int(row.get("forks_count")) if row.get("forks_count") is not None else None),
        open_issues_count=(int(row.get("open_issues_count")) if row.get("open_issues_count") is not None else None),
        license_name=(str(row.get("license_name")) if row.get("license_name") else None),
        github_pushed_at=(str(row.get("github_pushed_at")) if row.get("github_pushed_at") else None),
        github_created_at=(str(row.get("github_created_at")) if row.get("github_created_at") else None),
        is_archived=(bool(row.get("is_archived")) if row.get("is_archived") is not None else None),
        is_fork=(bool(row.get("is_fork")) if row.get("is_fork") is not None else None),
    )


def vector_search(query_embedding: list[float], domain: str = None) -> list[SearchResult]:
    """Search Supabase pgvector index using an embedding and optional domain metadata filter."""
    client = _get_supabase_client()
    
    # Use a non-overloaded RPC name to avoid PostgREST ambiguity.
    rpc_name = os.getenv("SUPABASE_VECTOR_SEARCH_RPC", "match_repos_vector")
    match_count = int(os.getenv("VECTOR_MATCH_COUNT", "12"))

    normalized_domain = (domain or "").strip().lower()
    
    # 2. Perfect match for our SQL function arguments
    payload: dict[str, Any] = {
        "query_embedding": query_embedding,
        "match_threshold": 0.1,  # Added the missing threshold argument!
        "match_count": match_count,
        "filter_domain": normalized_domain if normalized_domain and normalized_domain != "all" else None
    }

    # 3. Execute the search
    response = client.rpc(rpc_name, payload).execute()
    rows = response.data or []

    results: list[SearchResult] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        normalized = _normalize_result_row(row, normalized_domain if normalized_domain else None)
        if normalized is not None:
            results.append(normalized)

    return results