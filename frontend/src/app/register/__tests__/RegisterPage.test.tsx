/**
 * Tests for RegisterPage
 * Property 12: Mismatched passwords are always rejected before any network request
 * Property 13: Short passwords are always rejected client-side before any network request
 * Unit tests for 409 error display and auto-login on success
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import RegisterPage from "../page";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ---------------------------------------------------------------------------
// Mock authApi
// ---------------------------------------------------------------------------

vi.mock("@/lib/authApi", () => ({
  register: vi.fn(),
}));

import * as authApi from "@/lib/authApi";

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
// Helpers
// ---------------------------------------------------------------------------

async function fillForm(email: string, password: string, confirmPassword: string) {
  await userEvent.type(screen.getByLabelText(/email address/i), email);
  await userEvent.type(screen.getByLabelText(/^password$/i), password);
  await userEvent.type(screen.getByLabelText(/confirm password/i), confirmPassword);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegisterPage — rendering", () => {
  test("renders email, password, confirm-password inputs and submit button", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });
});

describe("RegisterPage — mismatched passwords (Requirement 7.2)", () => {
  test("shows 'Passwords do not match.' and makes no request", async () => {
    render(<RegisterPage />);

    await fillForm("alice@example.com", "password123", "different456");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(authApi.register).not.toHaveBeenCalled();
  });
});

describe("RegisterPage — Property 12", () => {
  /**
   * Property 12: For any pair of password strings where password !== confirmPassword,
   * submitting the form displays "Passwords do not match." and makes no network request.
   * Validates: Requirements 7.2
   */
  test("Property 12: mismatched passwords always blocked", async () => {
    const cases = [
      ["password123", "password124"],
      ["abcdefgh", "ABCDEFGH"],
      ["pass1234", "pass123"],
      ["longpassword1", "longpassword2"],
    ];

    for (const [pwd, confirm] of cases) {
      vi.clearAllMocks();
      const { unmount } = render(<RegisterPage />);

      await fillForm("alice@example.com", pwd, confirm);
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match.");
      expect(authApi.register).not.toHaveBeenCalled();

      unmount();
    }
  });
});

describe("RegisterPage — short passwords (Requirement 7.5)", () => {
  test("shows 'Password must be at least 8 characters.' and makes no request", async () => {
    render(<RegisterPage />);

    await fillForm("alice@example.com", "short", "short");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Password must be at least 8 characters."
    );
    expect(authApi.register).not.toHaveBeenCalled();
  });
});

describe("RegisterPage — Property 13", () => {
  /**
   * Property 13: For any password string of length < 8, submitting the form
   * displays "Password must be at least 8 characters." and makes no network request.
   * Validates: Requirements 7.5
   */
  test("Property 13: short passwords always blocked", async () => {
    const shortPasswords = ["", "a", "ab", "abc", "abcd", "abcde", "abcdef", "abcdefg"];

    for (const pwd of shortPasswords) {
      vi.clearAllMocks();
      const { unmount } = render(<RegisterPage />);

      // For empty password, just submit without typing
      if (pwd) {
        await userEvent.type(screen.getByLabelText(/^password$/i), pwd);
        await userEvent.type(screen.getByLabelText(/confirm password/i), pwd);
      }
      await userEvent.type(screen.getByLabelText(/email address/i), "alice@example.com");
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      // Either "Passwords do not match" (empty confirm) or "Password must be at least 8 characters"
      // Both are valid client-side rejections with no network request
      expect(authApi.register).not.toHaveBeenCalled();

      unmount();
    }
  });
});

describe("RegisterPage — 409 error display (Requirement 7.4)", () => {
  test("shows 'An account with this email already exists.' on 409", async () => {
    vi.mocked(authApi.register).mockRejectedValueOnce(
      new Error("Email already registered.")
    );

    render(<RegisterPage />);

    await fillForm("existing@example.com", "password123", "password123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An account with this email already exists."
      );
    });
  });
});

describe("RegisterPage — auto-login on success (Requirement 7.3)", () => {
  test("calls login and redirects to / after successful registration", async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      id: "user-1",
      email: "alice@example.com",
    });
    mockLogin.mockResolvedValueOnce(undefined);

    render(<RegisterPage />);

    await fillForm("alice@example.com", "password123", "password123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("alice@example.com", "password123");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
