import importlib
import os
from typing import Any, Optional
from app.schemas import SearchResult
from dotenv import load_dotenv
import os

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
		description=str(description),
		url=str(url),
		domain=str(resolved_domain),
	)


def vector_search(query_embedding: list[float], domain: str = None) -> list[SearchResult]:
    """Search Supabase pgvector index using an embedding and optional domain metadata filter."""
    client = _get_supabase_client()
    
    # 1. Changed default to match_repos
    rpc_name = os.getenv("SUPABASE_VECTOR_SEARCH_RPC", "match_repos") 
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