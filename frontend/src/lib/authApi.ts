/**
 * Typed wrappers for the repo-api authentication endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Parses a non-2xx response and throws an error with the message from the JSON body.
 */
async function handleError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = await res.json();
    if (typeof body?.message === "string") {
      message = body.message;
    }
  } catch {
    // ignore JSON parse errors — use fallback
  }
  throw new Error(message);
}

/**
 * Registers a new user account.
 * POST /api/auth/register
 */
export async function register(
  email: string,
  password: string
): Promise<{ id: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    await handleError(res, "Registration failed.");
  }

  return res.json();
}

/**
 * Logs in with email and password, returning access and refresh tokens.
 * POST /api/auth/login
 */
export async function login(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    await handleError(res, "Login failed.");
  }

  return res.json();
}

/**
 * Exchanges a refresh token for a new access token and refresh token pair.
 * POST /api/auth/refresh
 */
export async function refresh(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await handleError(res, "Token refresh failed.");
  }

  return res.json();
}

/**
 * Revokes the given refresh token (fire-and-forget — does not throw on failure).
 * POST /api/auth/logout
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Intentionally swallowed — logout is idempotent and fire-and-forget
  }
}
