'use strict';

/**
 * In-memory store for refresh tokens.
 *
 * Key:   128-char hex refresh token string
 * Value: { userId: string, expiresAt: Date }
 */
class TokenStore {
  constructor() {
    /** @type {Map<string, { userId: string, expiresAt: Date }>} */
    this._store = new Map();
  }

  /**
   * Persist a refresh token entry.
   *
   * @param {string} token - The 128-char hex refresh token.
   * @param {{ userId: string, expiresAt: Date }} entry
   */
  save(token, { userId, expiresAt }) {
    this._store.set(token, { userId, expiresAt });
  }

  /**
   * Look up a refresh token entry.
   *
   * @param {string} token
   * @returns {{ userId: string, expiresAt: Date } | null}
   */
  find(token) {
    return this._store.get(token) ?? null;
  }

  /**
   * Remove a refresh token from the store.
   * No-op if the token is not present.
   *
   * @param {string} token
   */
  revoke(token) {
    this._store.delete(token);
  }
}

module.exports = { TokenStore };
