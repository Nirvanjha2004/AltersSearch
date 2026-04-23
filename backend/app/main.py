from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agent import process_search_query
from app.logger import logger
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
	logger.info("Received search request query='{}' has_context={}", request.query, bool(request.context))
	try:
		response = await process_search_query(request)
		logger.info("Search request completed query='{}' status='{}'", request.query, response.status)
		return response
	except Exception:
		logger.exception("Search endpoint failed for query='{}'", request.query)
		raise HTTPException(status_code=500, detail="Internal server error")
