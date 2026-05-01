"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import * as authApi from "../../lib/authApi";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register(email.trim(), password);
      await login(email.trim(), password);
      router.replace("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === "Email already registered.") {
          setError("An account with this email already exists.");
        } else {
          setError(err.message || "Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Background glows */}
      <div
        className="auth-bg-glow"
        style={{ top: "-100px", left: "-100px" }}
        aria-hidden="true"
      />
      <div
        className="auth-bg-glow"
        style={{ bottom: "-150px", right: "-150px", opacity: 0.5 }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="auth-card"
      >
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark" aria-hidden="true">A</div>
          <span className="auth-logo-text">AltersSearch</span>
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid rgba(255,120,73,0.25)",
              color: "var(--accent)",
            }}
          >
            beta
          </span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {error && (
            <div role="alert" className="auth-error">
              {error}
            </div>
          )}

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
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isSubmitting}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="auth-label">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="auth-input"
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="auth-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
