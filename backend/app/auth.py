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

import asyncio
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

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
    return {
        "apikey": _service_role_key(),
        "Authorization": f"Bearer {_service_role_key()}",
        "Content-Type": "application/json",
    }

def _anon_headers() -> dict:
    anon_key = os.getenv("SUPABASE_ANON_KEY") or _service_role_key()
    return {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
    }

def _get_json_safe(response: httpx.Response) -> dict:
    try:
        return response.json() if response.content else {}
    except Exception:
        return {}


async def _post_with_retry(
    url: str,
    headers: dict,
    json: dict,
    timeout: float = 15.0,
    max_retries: int = 3,
) -> httpx.Response:
    """
    POST with exponential backoff retry on DNS/connection errors.
    Retries only on network-level failures (ConnectError, TimeoutException),
    not on HTTP error status codes.
    """
    last_exc: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                return await client.post(url, headers=headers, json=json)
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            last_exc = exc
            if attempt < max_retries:
                wait = 2.0 ** attempt  # 2s, 4s, 8s
                await asyncio.sleep(wait)
    raise last_exc  # type: ignore[misc]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    url = f"{_supabase_url()}/auth/v1/admin/users"
    try:
        resp = await _post_with_retry(
            url,
            headers=_admin_headers(),
            json={"email": body.email, "password": body.password, "email_confirm": True},
        )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=503, detail=f"Auth service unreachable: {exc}")

    if resp.status_code == 422:
        data = _get_json_safe(resp)
        msg = data.get("msg") or data.get("message") or ""
        if "already" in msg.lower() or "registered" in msg.lower() or "exists" in msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered.")
        raise HTTPException(status_code=400, detail=msg or "Invalid registration data.")

    if resp.status_code not in (200, 201):
        data = _get_json_safe(resp)
        msg = data.get("msg") or data.get("message") or data.get("error_description") or "Registration failed."
        raise HTTPException(status_code=500, detail=msg)

    data = _get_json_safe(resp)
    user_id = data.get("id")
    user_email = data.get("email")
    if not user_id or not user_email:
        raise HTTPException(status_code=500, detail="Registration failed: unexpected response from auth provider.")

    return UserResponse(id=str(user_id), email=str(user_email))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    url = f"{_supabase_url()}/auth/v1/token?grant_type=password"
    try:
        resp = await _post_with_retry(
            url,
            headers=_anon_headers(),
            json={"email": body.email, "password": body.password},
        )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=503, detail=f"Auth service unreachable: {exc}")

    if resp.status_code == 400:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not resp.is_success:
        data = _get_json_safe(resp)
        msg = data.get("error_description") or data.get("message") or "Login failed."
        raise HTTPException(status_code=401, detail=msg)

    data = _get_json_safe(resp)
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(status_code=500, detail="Login failed: unexpected response from auth provider.")

    return TokenResponse(accessToken=access_token, refreshToken=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    url = f"{_supabase_url()}/auth/v1/token?grant_type=refresh_token"
    try:
        resp = await _post_with_retry(
            url,
            headers=_anon_headers(),
            json={"refresh_token": body.refreshToken},
        )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=503, detail=f"Auth service unreachable: {exc}")

    if not resp.is_success:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    data = _get_json_safe(resp)
    access_token = data.get("access_token")
    new_refresh_token = data.get("refresh_token")
    if not access_token or not new_refresh_token:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    return TokenResponse(accessToken=access_token, refreshToken=new_refresh_token)


@router.post("/logout")
async def logout(body: LogoutRequest):
    if body.refreshToken:
        try:
            refresh_url = f"{_supabase_url()}/auth/v1/token?grant_type=refresh_token"
            resp = await _post_with_retry(
                refresh_url,
                headers=_anon_headers(),
                json={"refresh_token": body.refreshToken},
                timeout=10.0,
                max_retries=2,
            )
            if resp.is_success:
                access_token = _get_json_safe(resp).get("access_token", "")
                if access_token:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.post(
                            f"{_supabase_url()}/auth/v1/logout",
                            headers={**_anon_headers(), "Authorization": f"Bearer {access_token}"},
                        )
        except Exception:
            pass  # logout is fire-and-forget

    return {"message": "Logged out."}
