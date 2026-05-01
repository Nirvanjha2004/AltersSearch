"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation — Requirement 6.5
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // On success, redirect to the `redirect` query param or home — Requirement 6.2
      const redirectTo = searchParams.get("redirect") ?? "/";
      router.replace(redirectTo);
    } catch (err: unknown) {
      // Show inline error for 401 / any auth failure — Requirement 6.3
      const message =
        err instanceof Error && err.message === "Invalid credentials."
          ? "Invalid email or password."
          : "Invalid email or password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            AltersSearch
          </span>
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">
            beta
          </span>
        </div>

        <h1 className="auth-title">Sign in to your account</h1>
        <p className="auth-subtitle">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="auth-link">
            Create one
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Inline error — Requirement 6.3 */}
          {error ? (
            <div role="alert" className="auth-error">
              {error}
            </div>
          ) : null}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              disabled={isSubmitting}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit — disabled + spinner while in flight — Requirement 6.4 */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-sm"
                  role="status"
                  aria-label="Signing in…"
                />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
