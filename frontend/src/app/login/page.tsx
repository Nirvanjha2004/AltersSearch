"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Spotlight } from "../../components/ui/spotlight";
import { ShimmerButton } from "../../components/ui/shimmer-button";
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

    // Client-side validation — Requirements 3.5, 6.5
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // On success, redirect to the `redirect` query param or home — Requirements 4.3, 6.2
      const redirectTo = searchParams.get("redirect") ?? "/";
      router.replace(redirectTo);
    } catch {
      // Show inline error for 401 / any auth failure — Requirements 3.6, 6.3
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Task 4.1: Full-viewport layout with dark background and Spotlight */
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#08080f" }}
    >
      {/* Purple radial glow behind the card */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Spotlight — Task 4.1 */}
      <Spotlight className="top-0 left-0" fill="purple" />

      {/* Task 4.2: Centered auth card with branding */}
      <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8">
        {/* Brand row */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            AltersSearch
          </span>
          {/* BETA_Badge pill — border derived from --glow-accent */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--glow-accent)]"
            style={{ border: "1px solid var(--glow-accent)" }}
          >
            beta
          </span>
        </div>

        {/* Heading — Task 4.2 */}
        <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">
          Sign in to your account
        </h1>

        {/* Subtext — Task 4.2 */}
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Create one
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Inline error — Requirements 3.5, 3.6, 6.3 */}
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </div>
          ) : null}

          {/* Task 4.3: Email input with focus glow */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Task 4.3: Password input with focus glow */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Task 4.5: ShimmerButton submit — full width, spinner while submitting */}
          <ShimmerButton
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting ? "true" : "false"}
            className="mt-2 w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </ShimmerButton>
        </form>
      </div>
    </div>
  );
}
