'use strict';

const jwt = require('jsonwebtoken');

/**
 * Express middleware that authenticates requests using a JWT Bearer token.
 *
 * Extracts the Bearer token from the Authorization header, verifies it using
 * JWT_SECRET, and attaches { id, email } to req.user on success.
 *
 * Failure cases:
 *   - Missing/malformed Authorization header → 401 { message: "Authentication required." }
 *   - Expired token (TokenExpiredError)       → 401 { message: "Token expired." }
 *   - Any other JWT error                     → 401 { message: "Invalid token." }
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Require a header in the form "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  // An empty string after stripping is also invalid
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);

    // Attach the user identity derived from the token claims
    req.user = { id: payload.sub, email: payload.email };

    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired.' });
    }
    // Covers JsonWebTokenError, NotBeforeError, and any other JWT errors
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = { authenticate };
