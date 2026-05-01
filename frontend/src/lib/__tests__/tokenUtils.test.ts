/**
 * Tests for tokenUtils.ts
 * Property 16: Email initials derivation is correct for any email address
 * Unit tests for decodeToken, isTokenExpired, isTokenExpiringSoon
 *
 * Validates: Requirements 8.2, 8.3, 10.1
 */

import { describe, test, expect } from "vitest";
import * as fc from "fast-check";
import { decodeToken, isTokenExpired, isTokenExpiringSoon, getInitials } from "../tokenUtils";

// ---------------------------------------------------------------------------
// Helpers to build test JWTs without a real signing library
// ---------------------------------------------------------------------------

function base64url(obj: object): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(json);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function buildToken(payload: object): string {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url(payload);
  // Signature is not verified by decodeToken — any value works
  return `${header}.${body}.fakesig`;
}

// ---------------------------------------------------------------------------
// decodeToken
// ---------------------------------------------------------------------------

describe("decodeToken", () => {
  test("returns null for an empty string", () => {
    expect(decodeToken("")).toBeNull();
  });

  test("returns null for a non-JWT string", () => {
    expect(decodeToken("not.a.jwt.at.all")).toBeNull();
  });

  test("returns null when payload is missing required fields", () => {
    const token = buildToken({ foo: "bar" });
    expect(decodeToken(token)).toBeNull();
  });

  test("decodes a valid token and returns id, email, exp", () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const token = buildToken({ sub: "user-123", email: "alice@example.com", exp });
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe("user-123");
    expect(decoded!.email).toBe("alice@example.com");
    expect(decoded!.exp).toBe(exp);
  });

  test("returns null for a two-part string", () => {
    expect(decodeToken("header.payload")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isTokenExpired
// ---------------------------------------------------------------------------

describe("isTokenExpired", () => {
  test("returns true for an invalid token", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });

  test("returns false for a token expiring in the future", () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const token = buildToken({ sub: "u1", email: "a@b.com", exp });
    expect(isTokenExpired(token)).toBe(false);
  });

  test("returns true for an already-expired token", () => {
    const exp = Math.floor(Date.now() / 1000) - 1;
    const token = buildToken({ sub: "u1", email: "a@b.com", exp });
    expect(isTokenExpired(token)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isTokenExpiringSoon
// ---------------------------------------------------------------------------

describe("isTokenExpiringSoon", () => {
  test("returns true for an invalid token", () => {
    expect(isTokenExpiringSoon("garbage")).toBe(true);
  });

  test("returns false when token expires well beyond the threshold", () => {
    const exp = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const token = buildToken({ sub: "u1", email: "a@b.com", exp });
    expect(isTokenExpiringSoon(token, 60)).toBe(false);
  });

  test("returns true when token expires within the threshold", () => {
    const exp = Math.floor(Date.now() / 1000) + 30; // 30 seconds
    const token = buildToken({ sub: "u1", email: "a@b.com", exp });
    expect(isTokenExpiringSoon(token, 60)).toBe(true);
  });

  test("uses 60 seconds as the default threshold", () => {
    const exp = Math.floor(Date.now() / 1000) + 30;
    const token = buildToken({ sub: "u1", email: "a@b.com", exp });
    expect(isTokenExpiringSoon(token)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 16: Email initials derivation is correct for any email address
// Feature: user-authentication, Property 16: email initials derivation
// Validates: Requirements 10.1
// ---------------------------------------------------------------------------

describe("getInitials — unit tests", () => {
  test("returns uppercase first char of local part", () => {
    expect(getInitials("alice@example.com")).toBe("A");
  });

  test("works when local part starts with uppercase", () => {
    expect(getInitials("Bob@example.com")).toBe("B");
  });

  test("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });

  test("handles email with no @ sign", () => {
    expect(getInitials("noatsign")).toBe("N");
  });

  test("handles single-char local part", () => {
    expect(getInitials("z@example.com")).toBe("Z");
  });
});

describe("getInitials — Property 16", () => {
  /**
   * Property 16: For any email address, getInitials returns the uppercase
   * first character of the local part (before @).
   * Validates: Requirements 10.1
   */
  test("Property 16: initials are always the uppercase first char of the local part", () => {
    // Generate valid email-like strings: localPart@domain
    const emailArb = fc
      .tuple(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,10}$/),
        fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(emailArb, (email) => {
        const result = getInitials(email);
        const localPart = email.split("@")[0];
        const expected = localPart[0].toUpperCase();
        return result === expected;
      }),
      { numRuns: 200 }
    );
  });
});
