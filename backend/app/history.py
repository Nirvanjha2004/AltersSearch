"""
Chat history routes for AltersSearch.

Stores and retrieves per-user search sessions and messages in Supabase.
All routes require a valid Supabase JWT (passed as Bearer token).

Routes:
  GET  /api/history/sessions              — list user's sessions (newest first)
  POST /api/history/sessions              — create a new session
  GET  /api/history/sessions/{id}/messages — get all messages in a session
  POST /api/history/sessions/{id}/messages — append a message to a session
  DELETE /api/history/sessions/{id}       — delete a session + its messages
"""

import os
from typing import Any, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from app.logger import logger

router = APIRouter(prefix="/api/history", tags=["history"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    title: str


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class MessageCreate(BaseModel):
    query: str
    results: Optional[list[dict]] = None
    answer: Optional[str] = None
    action: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    session_id: str
    query: str
    results: Optional[list[dict]] = None
    answer: Optional[str] = None
    action: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Auth helper — extract user_id from Supabase JWT via the Supabase REST API
# ---------------------------------------------------------------------------

def _supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").rstrip("/")


def _service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


async def get_current_user_id(authorization: str = Header(...)) -> str:
    """
    Validates the Bearer token against Supabase Auth and returns the user's UUID.
    Raises 401 if the token is missing, malformed, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = authorization.removeprefix("Bearer ").strip()
    url = f"{_supabase_url()}/auth/v1/user"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            url,
            headers={
                "apikey": _service_key(),
                "Authorization": f"Bearer {token}",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    data = resp.json()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not resolve user identity.")

    return str(user_id)


def _supabase_headers() -> dict:
    return {
        "apikey": _service_key(),
        "Authorization": f"Bearer {_service_key()}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(user_id: str = Depends(get_current_user_id)):
    """Return all sessions for the authenticated user, newest first."""
    url = (
        f"{_supabase_url()}/rest/v1/chat_sessions"
        f"?user_id=eq.{user_id}&order=updated_at.desc&limit=50"
        f"&select=id,title,created_at,updated_at"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_supabase_headers())

    if not resp.is_success:
        logger.error("list_sessions failed status={} body={}", resp.status_code, resp.text[:200])
        raise HTTPException(status_code=502, detail="Failed to fetch sessions.")

    return resp.json()


@router.post("/sessions", response_model=SessionOut, status_code=201)
async def create_session(
    body: SessionCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new chat session."""
    url = f"{_supabase_url()}/rest/v1/chat_sessions"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            url,
            headers=_supabase_headers(),
            json={"user_id": user_id, "title": body.title},
        )

    if not resp.is_success:
        logger.error("create_session failed status={} body={}", resp.status_code, resp.text[:200])
        raise HTTPException(status_code=502, detail="Failed to create session.")

    rows = resp.json()
    return rows[0] if isinstance(rows, list) else rows


@router.get("/sessions/{session_id}/messages", response_model=list[MessageOut])
async def list_messages(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Return all messages in a session (oldest first). Verifies ownership."""
    # Verify the session belongs to this user
    await _assert_session_owner(session_id, user_id)

    url = (
        f"{_supabase_url()}/rest/v1/chat_messages"
        f"?session_id=eq.{session_id}&order=created_at.asc"
        f"&select=id,session_id,query,results,answer,action,created_at"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_supabase_headers())

    if not resp.is_success:
        raise HTTPException(status_code=502, detail="Failed to fetch messages.")

    return resp.json()


@router.post("/sessions/{session_id}/messages", response_model=MessageOut, status_code=201)
async def add_message(
    session_id: str,
    body: MessageCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Append a message (query + results) to a session."""
    await _assert_session_owner(session_id, user_id)

    url = f"{_supabase_url()}/rest/v1/chat_messages"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            url,
            headers=_supabase_headers(),
            json={
                "session_id": session_id,
                "query": body.query,
                "results": body.results,
                "answer": body.answer,
                "action": body.action,
            },
        )

    if not resp.is_success:
        logger.error("add_message failed status={} body={}", resp.status_code, resp.text[:200])
        raise HTTPException(status_code=502, detail="Failed to save message.")

    rows = resp.json()
    return rows[0] if isinstance(rows, list) else rows


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a session and all its messages (cascade)."""
    await _assert_session_owner(session_id, user_id)

    url = f"{_supabase_url()}/rest/v1/chat_sessions?id=eq.{session_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.delete(url, headers=_supabase_headers())

    if not resp.is_success:
        raise HTTPException(status_code=502, detail="Failed to delete session.")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _assert_session_owner(session_id: str, user_id: str):
    """Raises 404 if the session doesn't exist or doesn't belong to user_id."""
    url = (
        f"{_supabase_url()}/rest/v1/chat_sessions"
        f"?id=eq.{session_id}&user_id=eq.{user_id}&select=id"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_supabase_headers())

    if not resp.is_success or not resp.json():
        raise HTTPException(status_code=404, detail="Session not found.")
