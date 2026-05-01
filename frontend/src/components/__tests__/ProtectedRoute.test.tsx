/**
 * Tests for ProtectedRoute component
 * Property 15: Unauthenticated navigation to any protected route redirects to /login
 * Unit tests for authenticated pass-through and redirect query parameter preservation
 *
 * Validates: Requirements 9.1, 9.2
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import ProtectedRoute from "../ProtectedRoute";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname(),
}));

// ---------------------------------------------------------------------------
// Mock AuthContext
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProtectedRoute — loading state", () => {
  test("renders a loading spinner while auth is loading", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});

describe("ProtectedRoute — unauthenticated", () => {
  test("redirects to /login when not authenticated", async () => {
    mockPathname.mockReturnValue("/");
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2F");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  test("preserves the current path in the redirect query parameter", async () => {
    mockPathname.mockReturnValue("/dashboard");
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2Fdashboard");
    });
  });
});

describe("ProtectedRoute — authenticated", () => {
  test("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("ProtectedRoute — Property 15", () => {
  /**
   * Property 15: For any protected route path, navigating while unauthenticated
   * must redirect to /login?redirect=<path>.
   * Validates: Requirements 9.1
   */
  test("Property 15: any path redirects to /login with path preserved", async () => {
    const paths = ["/", "/search", "/repo/owner/name", "/settings/profile"];

    for (const path of paths) {
      vi.clearAllMocks();
      mockPathname.mockReturnValue(path);
      mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

      const { unmount } = render(
        <ProtectedRoute>
          <div>content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          `/login?redirect=${encodeURIComponent(path)}`
        );
      });

      unmount();
    }
  });
});
