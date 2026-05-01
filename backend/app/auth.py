"""
Authentication routes for AltersSearch.

Uses Supabase Auth as the identity provider.

Registration uses the Admin API (service-role key) with email_confirm=True
so users can log in immediately without needing to confirm their email —
appropriate for a development/demo environment.

Routes:
  POST /api/auth/register  — create a new account (auto-confirmed)
  POST /api/auth/login     — sign in, returns access + refresh tokens
  POST /api/auth/refresh   — exchange a refresh token for a new pair
  POST /api/auth/logout    — revoke the refresh token
"""

import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refreshToken: str


class LogoutRequest(BaseModel):
    refreshToken: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _supabase_url() -> str:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not url:
        raise RuntimeError("SUPABASE_URL is not set.")
    return url


def _service_role_key() -> str:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not set.")
    return key


def _admin_headers() -> dict:
    """Headers for Supabase Admin Auth API calls (requires service-role key)."""
    return {
        "apikey": _service_role_key(),
        "Authorization": f"Bearer {_service_role_key()}",
        "Content-Type": "application/json",
    }


def _anon_headers() -> dict:
    """Headers for Supabase public Auth API calls."""
    anon_key = os.getenv("SUPABASE_ANON_KEY") or _service_role_key()
    return {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: RegisterRequest):
    """
    Create a new user account.

    Uses the Admin API with email_confirm=True so the user can log in
    immediately without going through an email confirmation flow.
    """
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    url = f"{_supabase_url()}/auth/v1/admin/users"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            headers=_admin_headers(),
            json={
                "email": body.email,
                "password": body.password,
                "email_confirm": True,   # ← skip email confirmation
            },
        )

    if resp.status_code == 422:
        # Supabase returns 422 for duplicate email via admin API
        data = resp.json()
        msg = data.get("msg") or data.get("message") or ""
        if "already" in msg.lower() or "registered" in msg.lower() or "exists" in msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered.")
        raise HTTPException(status_code=400, detail=msg or "Invalid registration data.")

    if resp.status_code not in (200, 201):
        data = resp.json()
        msg = data.get("msg") or data.get("message") or data.get("error_description") or "Registration failed."
        raise HTTPException(status_code=500, detail=msg)

    data = resp.json()
    user_id = data.get("id")
    user_email = data.get("email")

    if not user_id or not user_email:
        raise HTTPException(status_code=500, detail="Registration failed: unexpected response from auth provider.")

    return UserResponse(id=str(user_id), email=str(user_email))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Sign in with email + password, returns JWT access and refresh tokens."""
    url = f"{_supabase_url()}/auth/v1/token?grant_type=password"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            headers=_anon_headers(),
            json={"email": body.email, "password": body.password},
        )

    if resp.status_code == 400:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    if not resp.is_success:
        data = resp.json()
        msg = data.get("error_description") or data.get("message") or "Login failed."
        raise HTTPException(status_code=401, detail=msg)

    data = resp.json()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")

    if not access_token or not refresh_token:
        raise HTTPException(status_code=500, detail="Login failed: unexpected response from auth provider.")

    return TokenResponse(accessToken=access_token, refreshToken=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    """Exchange a refresh token for a new access + refresh token pair."""
    url = f"{_supabase_url()}/auth/v1/token?grant_type=refresh_token"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            headers=_anon_headers(),
            json={"refresh_token": body.refreshToken},
        )

    if not resp.is_success:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    data = resp.json()
    access_token = data.get("access_token")
    new_refresh_token = data.get("refresh_token")

    if not access_token or not new_refresh_token:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    return TokenResponse(accessToken=access_token, refreshToken=new_refresh_token)


@router.post("/logout")
async def logout(body: LogoutRequest):
    """
    Revoke the session.

    Calls the Supabase logout endpoint if a refresh token is provided.
    Always returns 200 — logout is idempotent.
    """
    if body.refreshToken:
        # First exchange the refresh token to get an access token to revoke
        url = f"{_supabase_url()}/auth/v1/logout"
        try:
            # We need an access token to call /logout; do a silent refresh first
            refresh_url = f"{_supabase_url()}/auth/v1/token?grant_type=refresh_token"
            async with httpx.AsyncClient(timeout=10.0) as client:
                refresh_resp = await client.post(
                    refresh_url,
                    headers=_anon_headers(),
                    json={"refresh_token": body.refreshToken},
                )
                if refresh_resp.is_success:
                    access_token = refresh_resp.json().get("access_token", "")
                    if access_token:
                        await client.post(
                            url,
                            headers={
                                **_anon_headers(),
                                "Authorization": f"Bearer {access_token}",
                            },
                        )
        except Exception:
            pass  # logout is fire-and-forget

    return {"message": "Logged out."}
