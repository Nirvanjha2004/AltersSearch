from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent import process_search_query
from app.schemas import AgentResponse, SearchRequest


app = FastAPI(title="Open Source Search API")

# Allow the local Next.js frontend during development.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.post("/api/search", response_model=AgentResponse)
async def search(request: SearchRequest) -> AgentResponse:
	return await process_search_query(request)
