/**
 * Tests for LoginPage
 * Property 11: Client-side validation rejects empty login fields before any network request
 * Unit tests for 401 error display, loading state, redirect-on-success
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import LoginPage from "../page";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockGet = vi.fn(() => null);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));

// ---------------------------------------------------------------------------
// Mock AuthContext
// ---------------------------------------------------------------------------

const mockLogin = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
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

describe("LoginPage — rendering", () => {
  test("renders email input, password input, and submit button", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("LoginPage — client-side validation (Requirement 6.5)", () => {
  test("shows error and makes no request when email is empty", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("shows error and makes no request when password is empty", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("shows error and makes no request when both fields are empty", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("shows error and makes no request when email is whitespace only", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "   ");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

describe("LoginPage — Property 11", () => {
  /**
   * Property 11: For any login form submission where email or password is empty
   * (or whitespace-only), no network request is made and a validation error is shown.
   * Validates: Requirements 6.5
   */
  test("Property 11: empty email always blocks request", async () => {
    const passwords = ["password123", "short", "a", "   "];

    for (const pwd of passwords) {
      vi.clearAllMocks();
      const { unmount } = render(<LoginPage />);

      // Leave email empty, fill password
      if (pwd.trim()) {
        await userEvent.type(screen.getByLabelText(/password/i), pwd);
      }
      await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
      unmount();
    }
  });

  test("Property 11: empty password always blocks request", async () => {
    const emails = ["alice@example.com", "bob@test.io", "x@y.z"];

    for (const email of emails) {
      vi.clearAllMocks();
      const { unmount } = render(<LoginPage />);

      await userEvent.type(screen.getByLabelText(/email address/i), email);
      // Leave password empty
      await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
      unmount();
    }
  });
});

describe("LoginPage — 401 error display (Requirement 6.3)", () => {
  test("shows 'Invalid email or password.' on 401", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials."));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
    });
  });
});

describe("LoginPage — loading state (Requirement 6.4)", () => {
  test("disables submit button while request is in flight", async () => {
    let resolveLogin!: () => void;
    mockLogin.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveLogin = resolve;
      })
    );

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    resolveLogin();
  });
});

describe("LoginPage — redirect on success (Requirement 6.2)", () => {
  test("redirects to / by default after successful login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    mockGet.mockReturnValue(null);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  test("redirects to the redirect query param after successful login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    mockGet.mockReturnValue("/dashboard");

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
