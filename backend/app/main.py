import asyncio
import base64
import os

import httpx
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.logger import logger
from app.search_pipeline import process_search_query
from app.schemas import SearchRequest
from app.auth import router as auth_router


app = FastAPI(title="Open Source Search API")
GITHUB_API_BASE = "https://api.github.com"

# Allow the local Next.js frontend during development.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router)


@app.post("/api/search")
async def search(request: SearchRequest) -> dict:
	logger.info("Received search request query='{}' has_context={}", request.query, bool(request.context))
	try:
		response = await process_search_query(request)
		logger.info("Search request completed query='{}' status='{}'", request.query, response.get("status"))
		return response
	except Exception:
		logger.exception("Search endpoint failed for query='{}'", request.query)
		raise HTTPException(status_code=500, detail="Internal server error")


def _github_headers() -> dict[str, str]:
	headers = {
		"Accept": "application/vnd.github+json",
		"User-Agent": "AltersSearch-Backend",
	}
	token = os.getenv("GITHUB_TOKEN")
	if token:
		headers["Authorization"] = f"Bearer {token}"
	return headers


@app.get("/api/repo/{owner}/{repo}")
async def get_repo_details(owner: str, repo: str) -> dict:
	repo_path = f"/repos/{owner}/{repo}"
	endpoints = {
		"repo": repo_path,
		"languages": f"{repo_path}/languages",
		"contributors": f"{repo_path}/contributors?per_page=10",
		"readme": f"{repo_path}/readme",
	}

	async with httpx.AsyncClient(timeout=20.0, headers=_github_headers()) as client:
		repo_response, languages_response, contributors_response, readme_response = await asyncio.gather(
			client.get(f"{GITHUB_API_BASE}{endpoints['repo']}"),
			client.get(f"{GITHUB_API_BASE}{endpoints['languages']}"),
			client.get(f"{GITHUB_API_BASE}{endpoints['contributors']}"),
			client.get(f"{GITHUB_API_BASE}{endpoints['readme']}"),
		)

	if repo_response.status_code == 404:
		raise HTTPException(status_code=404, detail="Repository not found")

	if repo_response.status_code == 403 and repo_response.headers.get("x-ratelimit-remaining") == "0":
		raise HTTPException(status_code=429, detail="GitHub rate limit exceeded. Please retry shortly.")

	if repo_response.status_code >= 400:
		raise HTTPException(status_code=502, detail="Failed to fetch repository details from GitHub")

	repo_data = repo_response.json()
	languages_data = languages_response.json() if languages_response.status_code < 400 else {}
	contributors_data = contributors_response.json() if contributors_response.status_code < 400 else []
	readme_data = readme_response.json() if readme_response.status_code < 400 else {}

	readme_markdown = ""
	if readme_data.get("content"):
		try:
			readme_markdown = base64.b64decode(readme_data["content"]).decode("utf-8")
		except Exception:
			readme_markdown = ""

	return {
		"repo": repo_data,
		"languages": languages_data,
		"contributors": contributors_data,
		"readme": readme_markdown,
	}
