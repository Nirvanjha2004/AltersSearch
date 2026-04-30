'use strict';

const bcrypt = require('bcryptjs');
const { UserStore } = require('./userStore');
const { TokenStore } = require('./tokenStore');

// Singleton instances shared across all handlers
const userStore = new UserStore();
const tokenStore = new TokenStore();

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

module.exports = { register, userStore, tokenStore };
