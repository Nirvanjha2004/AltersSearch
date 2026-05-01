"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as authApi from "@/lib/authApi";
import { decodeToken, isTokenExpired, isTokenExpiringSoon } from "@/lib/tokenUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_TOKEN_KEY = "auth_refresh_token";

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Ref so the proactive-refresh timer always sees the latest tokens without
  // needing to be recreated on every state change.
  const accessTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Persist tokens and update user state. */
  const applyTokens = useCallback((newAccessToken: string, newRefreshToken: string) => {
    const decoded = decodeToken(newAccessToken);
    if (!decoded) return;

    accessTokenRef.current = newAccessToken;
    setAccessToken(newAccessToken);
    setUser({ id: decoded.id, email: decoded.email });
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

    scheduleProactiveRefresh(newAccessToken, newRefreshToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Clear all auth state and storage. */
  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Schedule a proactive token refresh to fire 60 seconds before the access
   * token expires. Clears any previously scheduled timer first.
   */
  const scheduleProactiveRefresh = useCallback(
    (currentAccessToken: string, currentRefreshToken: string) => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      const decoded = decodeToken(currentAccessToken);
      if (!decoded) return;

      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      const msUntilRefresh = msUntilExpiry - 60_000; // fire 60 s before expiry

      if (msUntilRefresh <= 0) {
        // Token is already expiring soon — refresh immediately.
        void silentRefresh(currentRefreshToken);
        return;
      }

      refreshTimerRef.current = setTimeout(() => {
        void silentRefresh(currentRefreshToken);
      }, msUntilRefresh);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /**
   * Attempt a silent token refresh using the stored refresh token.
   * Clears auth state on 401 / any failure.
   */
  const silentRefresh = useCallback(
    async (storedRefreshToken: string) => {
      try {
        const tokens = await authApi.refresh(storedRefreshToken);
        applyTokens(tokens.accessToken, tokens.refreshToken);
      } catch {
        // 401 or network error — clear session
        clearAuth();
      }
    },
    [applyTokens, clearAuth]
  );

  // ---------------------------------------------------------------------------
  // On mount: attempt session restoration
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return;

    // If we have an access token in state that is still valid, just schedule
    // the proactive refresh. Otherwise, do a silent refresh now.
    const currentToken = accessTokenRef.current;
    if (currentToken && !isTokenExpired(currentToken)) {
      scheduleProactiveRefresh(currentToken, storedRefreshToken);
    } else {
      void silentRefresh(storedRefreshToken);
    }

    return () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const tokens = await authApi.login(email, password);
      applyTokens(tokens.accessToken, tokens.refreshToken);
    },
    [applyTokens]
  );

  const logout = useCallback(async (): Promise<void> => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      // Fire-and-forget — authApi.logout swallows errors internally
      void authApi.logout(storedRefreshToken);
    }
    clearAuth();
  }, [clearAuth]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------

/**
 * Returns the current AuthContext value.
 * Must be used inside an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
