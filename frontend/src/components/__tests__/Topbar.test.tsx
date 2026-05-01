/**
 * Tests for Topbar component
 * Unit tests for authenticated state (initials, dropdown, logout)
 * and unauthenticated state (Sign in link)
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Topbar from "../Topbar";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

// ---------------------------------------------------------------------------
// Mock AuthContext
// ---------------------------------------------------------------------------

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  onToggleSidebar: vi.fn(),
  sidebarOpen: false,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Topbar — unauthenticated state", () => {
  test("shows Sign in link when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /user menu/i })).not.toBeInTheDocument();
  });

  test("Sign in link points to /login", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});

describe("Topbar — authenticated state", () => {
  test("shows user initials in avatar button when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "alice@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /user menu/i })).toHaveTextContent("A");
  });

  test("does not show Sign in link when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "bob@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  test("dropdown is hidden initially", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "alice@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    expect(screen.queryByRole("menuitem", { name: /log out/i })).not.toBeInTheDocument();
  });

  test("clicking avatar opens dropdown with Log out option", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "alice@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /user menu/i }));

    expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
  });

  test("clicking backdrop closes dropdown", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "alice@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /user menu/i }));
    expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();

    // Click the backdrop (aria-hidden div) — use data-testid
    const backdrop = screen.getByTestId("dropdown-backdrop");
    await userEvent.click(backdrop);

    expect(screen.queryByRole("menuitem", { name: /log out/i })).not.toBeInTheDocument();
  });

  test("clicking Log out calls logout and redirects to /login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", email: "alice@example.com" },
      logout: mockLogout,
    });

    render(<Topbar {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /user menu/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /log out/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  test("displays correct initials for different emails", () => {
    const cases = [
      { email: "charlie@example.com", expected: "C" },
      { email: "Dave@example.com", expected: "D" },
      { email: "z@test.io", expected: "Z" },
    ];

    for (const { email, expected } of cases) {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "u1", email },
        logout: mockLogout,
      });

      const { unmount } = render(<Topbar {...defaultProps} />);
      expect(screen.getByRole("button", { name: /user menu/i })).toHaveTextContent(expected);
      unmount();
    }
  });
});
