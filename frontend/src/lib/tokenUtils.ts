/**
 * Utilities for decoding and inspecting JWT access tokens on the client side.
 */

interface DecodedToken {
  id: string;
  email: string;
  exp: number;
}

/**
 * Base64-decodes the JWT payload segment and returns the relevant claims.
 * Returns null on any error (malformed token, invalid JSON, missing fields).
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // JWT uses base64url encoding — replace URL-safe chars and add padding
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or cannot be decoded.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

/**
 * Returns true if the token expires within `thresholdSeconds` seconds (default 60),
 * or if the token cannot be decoded.
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 60): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now() + thresholdSeconds * 1000;
}

/**
 * Returns the uppercase first character of the local part of an email address.
 * e.g. "alice@example.com" → "A"
 * Handles edge cases gracefully (empty string, no "@").
 */
export function getInitials(email: string): string {
  if (!email) return "";
  const localPart = email.includes("@") ? email.split("@")[0] : email;
  if (!localPart) return "";
  return localPart[0].toUpperCase();
}
