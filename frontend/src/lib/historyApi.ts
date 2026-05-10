/**
 * Typed wrappers for the /api/history endpoints.
 * All calls require a valid access token passed as Bearer.
 */

import type { SearchResult } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  query: string;
  results: SearchResult[] | null;
  answer: string | null;
  action: string | null;
  created_at: string;
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") message = body.detail;
  } catch { /* ignore */ }
  throw new Error(message);
}

/** List all sessions for the current user, newest first. */
export async function listSessions(token: string): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/api/history/sessions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await handleError(res, "Failed to load chat history.");
  return res.json();
}

/** Create a new session with the given title (first query). */
export async function createSession(token: string, title: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/api/history/sessions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) await handleError(res, "Failed to create session.");
  return res.json();
}

/** Get all messages in a session. */
export async function listMessages(token: string, sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/history/sessions/${sessionId}/messages`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await handleError(res, "Failed to load messages.");
  return res.json();
}

/** Append a message (query + results) to a session. */
export async function addMessage(
  token: string,
  sessionId: string,
  payload: {
    query: string;
    results?: SearchResult[];
    answer?: string | null;
    action?: string | null;
  }
): Promise<Message> {
  const res = await fetch(`${API_BASE}/api/history/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleError(res, "Failed to save message.");
  return res.json();
}

/** Delete a session and all its messages. */
export async function deleteSession(token: string, sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/history/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) await handleError(res, "Failed to delete session.");
}
