"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

/**
 * Wraps page content and enforces authentication.
 *
 * - While the auth state is being restored on initial mount, renders a
 *   loading spinner to avoid a flash-redirect on page refresh.
 * - Once loading is complete, redirects unauthenticated users to
 *   `/login?redirect=<currentPath>` (Requirement 9.1).
 * - Authenticated users see the wrapped children normally.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Show a spinner while the AuthContext is restoring the session.
  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <svg
          className="h-8 w-8 animate-spin text-[var(--accent)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  // While the redirect is in flight (unauthenticated), render nothing to
  // avoid briefly flashing the protected content.
  if (!isAuthenticated) {
    return <></>;
  }

  return <>{children}</>;
}
