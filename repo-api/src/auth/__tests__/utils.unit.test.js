'use strict';

const { generateRefreshToken, getInitials } = require('../utils');

describe('generateRefreshToken', () => {
  test('returns a 128-character string', () => {
    expect(generateRefreshToken()).toHaveLength(128);
  });

  test('returns only lowercase hex characters', () => {
    expect(generateRefreshToken()).toMatch(/^[0-9a-f]{128}$/);
  });

  test('returns a different value on each call', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });
});

describe('getInitials', () => {
  test('returns uppercase first char of local part', () => {
    expect(getInitials('alice@example.com')).toBe('A');
  });

  test('works with dot-separated local parts', () => {
    expect(getInitials('bob.smith@company.org')).toBe('B');
  });

  test('uppercases a lowercase first character', () => {
    expect(getInitials('charlie@test.io')).toBe('C');
  });

  test('preserves already-uppercase first character', () => {
    expect(getInitials('Dave@example.com')).toBe('D');
  });
});
