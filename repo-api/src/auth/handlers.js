'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserStore } = require('./userStore');
const { TokenStore } = require('./tokenStore');
const { generateRefreshToken } = require('./utils');

// Singleton instances shared across all handlers
const userStore = new UserStore();
const tokenStore = new TokenStore();

// Dummy bcrypt hash used when the email is not found, to prevent timing-based
// user enumeration attacks (ensures bcrypt.compare always runs).
const DUMMY_HASH = '$2a$12$invalidhashvaluethatisusedtopreventimenumerationattacks1';

/**
 * Simple email validation: must contain @ with a non-empty local part and domain.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  // Must have exactly one @, non-empty local part, and domain with at least one dot
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * POST /api/auth/register
 *
 * Request body: { email: string, password: string }
 * Response 201: { id: string, email: string }
 * Response 400: { message: string }  — validation failure
 * Response 409: { message: "Email already registered." }  — duplicate email
 * Response 500: { message: "Internal server error." }  — unexpected error
 */
async function register(req, res) {
  try {
    const { email, password } = req.body ?? {};

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Validate password length
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Hash the password at cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Store the user — UserStore.create throws with code EMAIL_TAKEN if duplicate
    const user = userStore.create(email, passwordHash);

    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    // Unexpected error
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/login
 *
 * Request body: { email: string, password: string }
 * Response 200: { accessToken: string, refreshToken: string }
 * Response 401: { message: "Invalid credentials." }  — unknown email or wrong password
 * Response 500: { message: "Internal server error." }  — unexpected error
 *
 * Security: bcrypt.compare is always executed (even for unknown emails) to prevent
 * timing-based user enumeration. Both unknown-email and wrong-password cases return
 * the same 401 message to prevent user enumeration.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    // Look up the user by email (case-insensitive via UserStore)
    const user = (email && typeof email === 'string')
      ? userStore.findByEmail(email)
      : null;

    // Always run bcrypt compare — use dummy hash for unknown users to prevent
    // timing attacks that could reveal whether an email is registered.
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordToCompare = (typeof password === 'string') ? password : '';
    const passwordMatch = await bcrypt.compare(passwordToCompare, hashToCompare);

    // Reject if user not found OR password doesn't match
    if (!user || !passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Build JWT access token
    const secret = process.env.JWT_SECRET;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 900; // 15 minutes

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, iat, exp },
      secret
    );

    // Generate refresh token and persist it in the TokenStore
    const refreshToken = generateRefreshToken();
    tokenStore.save(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/refresh
 *
 * Request body: { refreshToken: string }
 * Response 200: { accessToken: string, refreshToken: string }
 * Response 401: { message: "Invalid refresh token." }  — token not found
 * Response 401: { message: "Refresh token expired." }  — token expired
 *
 * Rotates the refresh token on every successful call (issues a new one and
 * revokes the old one) to limit the impact of token theft (Requirement 3.4).
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    // Look up the token in the store
    const entry = (refreshToken && typeof refreshToken === 'string')
      ? tokenStore.find(refreshToken)
      : null;

    // Token not found → 401
    if (!entry) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    // Token found but expired → 401
    if (entry.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired.' });
    }

    // Revoke the old refresh token (rotation)
    tokenStore.revoke(refreshToken);

    // Look up the user associated with this token
    const user = userStore.findById(entry.userId);

    // Issue a new JWT access token
    const secret = process.env.JWT_SECRET;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 900; // 15 minutes

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, iat, exp },
      secret
    );

    // Generate and persist a new refresh token
    const newRefreshToken = generateRefreshToken();
    tokenStore.save(newRefreshToken, {
      userId: entry.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/logout
 *
 * Request body: { refreshToken: string }
 * Response 200: { message: "Logged out." }
 *
 * Idempotent — revokes the provided refresh token from the TokenStore.
 * If the token is not present, the call is a no-op and still returns 200
 * to avoid leaking token existence information (Requirements 4.1, 4.2).
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    // Revoke the token if it exists; TokenStore.revoke is a no-op when absent
    if (refreshToken && typeof refreshToken === 'string') {
      tokenStore.revoke(refreshToken);
    }

    return res.status(200).json({ message: 'Logged out.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { register, login, refresh, logout, userStore, tokenStore };
