/**
 * Tests for AuthContext / AuthProvider
 * Property 14: Session restoration correctly populates or clears user state
 * Unit tests for login/logout state transitions, silent refresh on 401
 *
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthProvider, useAuth } from "../AuthContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64url(obj: object): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(json);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function buildToken(payload: object): string {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url(payload);
  return `${header}.${body}.fakesig`;
}

function makeAccessToken(overrides: Partial<{ sub: string; email: string; exp: number }> = {}) {
  const exp = Math.floor(Date.now() / 1000) + 900;
  return buildToken({ sub: "user-1", email: "alice@example.com", exp, ...overrides });
}

// ---------------------------------------------------------------------------
// Mock authApi
// ---------------------------------------------------------------------------

vi.mock("@/lib/authApi", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  register: vi.fn(),
}));

import * as authApi from "@/lib/authApi";

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

// ---------------------------------------------------------------------------
// Test component that exposes auth state
// ---------------------------------------------------------------------------

function AuthConsumer() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user-email">{user?.email ?? "none"}</div>
      <button onClick={() => login("alice@example.com", "password123")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthContext — initial state (no stored token)", () => {
  test("starts with isLoading=true then resolves to unauthenticated", async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
  });
});

describe("AuthContext — login action", () => {
  test("sets user state after successful login", async () => {
    const accessToken = makeAccessToken();
    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken,
      refreshToken: "refresh-abc",
    });

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user-email").textContent).toBe("alice@example.com");
    expect(localStorageMock.getItem("auth_refresh_token")).toBe("refresh-abc");
  });
});

describe("AuthContext — logout action", () => {
  test("clears user state and localStorage after logout", async () => {
    const accessToken = makeAccessToken();
    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken,
      refreshToken: "refresh-abc",
    });
    vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("true");

    await act(async () => {
      await userEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
    expect(localStorageMock.getItem("auth_refresh_token")).toBeNull();
  });
});

describe("AuthContext — session restoration", () => {
  test("restores session when stored refresh token is valid", async () => {
    const accessToken = makeAccessToken();
    localStorageMock.setItem("auth_refresh_token", "stored-refresh");
    vi.mocked(authApi.refresh).mockResolvedValueOnce({
      accessToken,
      refreshToken: "new-refresh",
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user-email").textContent).toBe("alice@example.com");
  });

  test("clears auth state when silent refresh returns 401", async () => {
    localStorageMock.setItem("auth_refresh_token", "expired-refresh");
    vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error("Invalid refresh token."));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(localStorageMock.getItem("auth_refresh_token")).toBeNull();
  });
});

describe("AuthContext — Property 14: session restoration populates or clears user state", () => {
  /**
   * Property 14: For any JWT stored as the access token:
   * - If valid and not expired → user is populated on mount
   * - If expired or absent → user is null and isAuthenticated is false
   * Validates: Requirements 8.2
   */
  test("Property 14: valid stored refresh token populates user state", async () => {
    const accessToken = makeAccessToken({ sub: "u-42", email: "test@example.com" });
    localStorageMock.setItem("auth_refresh_token", "valid-refresh");
    vi.mocked(authApi.refresh).mockResolvedValueOnce({
      accessToken,
      refreshToken: "rotated-refresh",
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user-email").textContent).toBe("test@example.com");
  });

  test("Property 14: absent refresh token leaves user null", async () => {
    // No token in localStorage
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
  });
});
