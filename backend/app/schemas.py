from pydantic import BaseModel
from typing import List, Optional, Literal

class SearchRequest(BaseModel):
    query: str
    context: Optional[str] = None # Used if answering a clarification

class SearchResult(BaseModel):
    repo_name: str
    description: str
    url: str
    domain: str

class AgentResponse(BaseModel):
    status: Literal["success", "needs_clarification"]
    results: Optional[List[SearchResult]] = None
    clarification_question: Optional[str] = None