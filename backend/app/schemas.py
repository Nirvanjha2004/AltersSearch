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
    full_name: Optional[str] = None
    owner_avatar_url: Optional[str] = None
    owner_login: Optional[str] = None
    visibility: Optional[str] = None
    topics: Optional[List[str]] = None
    language: Optional[str] = None
    stargazers_count: Optional[int] = None
    forks_count: Optional[int] = None
    open_issues_count: Optional[int] = None
    license_name: Optional[str] = None
    github_pushed_at: Optional[str] = None
    github_created_at: Optional[str] = None
    is_archived: Optional[bool] = None
    is_fork: Optional[bool] = None

class AgentResponse(BaseModel):
    status: Literal["success", "clarification_needed", "error"]
    results: Optional[List[SearchResult]] = None
    clarification_question: Optional[str] = None