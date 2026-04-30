/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/**/__tests__/**/*.test.js"],
  // repo-api uses CommonJS modules — no transform needed
};
