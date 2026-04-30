'use strict';

const crypto = require('crypto');

/**
 * Generates a cryptographically random refresh token.
 * @returns {string} A 128-character lowercase hexadecimal string.
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Derives initials from an email address.
 * Returns the uppercase first character of the local part (before '@').
 * @param {string} email
 * @returns {string} Single uppercase character.
 */
function getInitials(email) {
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase();
}

module.exports = { generateRefreshToken, getInitials };
