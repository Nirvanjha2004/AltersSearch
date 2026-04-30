"use strict";

const { randomUUID } = require("crypto");

class UserStore {
  constructor() {
    /** @type {Map<string, { id: string, email: string, passwordHash: string, createdAt: Date }>} */
    this._byEmail = new Map();
    /** @type {Map<string, { id: string, email: string, passwordHash: string, createdAt: Date }>} */
    this._byId = new Map();
  }

  /**
   * Creates a new user with the given email and password hash.
   * Email is normalized to lowercase and trimmed before storage.
   *
   * @param {string} email
   * @param {string} passwordHash
   * @returns {{ id: string, email: string, passwordHash: string, createdAt: Date }}
   * @throws {Error} if the email is already taken
   */
  create(email, passwordHash) {
    const normalizedEmail = email.trim().toLowerCase();

    if (this._byEmail.has(normalizedEmail)) {
      const err = new Error("Email already registered.");
      err.code = "EMAIL_TAKEN";
      throw err;
    }

    const user = {
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date(),
    };

    this._byEmail.set(normalizedEmail, user);
    this._byId.set(user.id, user);

    return user;
  }

  /**
   * Finds a user by email (case-insensitive).
   *
   * @param {string} email
   * @returns {{ id: string, email: string, passwordHash: string, createdAt: Date } | null}
   */
  findByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    return this._byEmail.get(normalizedEmail) ?? null;
  }

  /**
   * Finds a user by their unique id.
   *
   * @param {string} id
   * @returns {{ id: string, email: string, passwordHash: string, createdAt: Date } | null}
   */
  findById(id) {
    return this._byId.get(id) ?? null;
  }
}

module.exports = { UserStore };
