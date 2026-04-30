# Implementation Plan: User Authentication

## Overview

Implement dual-token JWT authentication across repo-api (Node.js/Express) and the Next.js frontend. The backend gains four auth endpoints, an `authenticate` middleware, and in-memory User/Token stores. The frontend gains login and registration pages, an `AuthContext`, a `ProtectedRoute` wrapper, and a dynamic Topbar that shows the authenticated user's initials.

## Tasks

- [x] 1. Install dependencies and configure environment variables
  - Install `bcryptjs`, `jsonwebtoken`, `jest`, `supertest`, and `fast-check` in `repo-api`
  - Install `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, and `fast-check` in `frontend`
  - Add `JWT_SECRET` and `JWT_EXPIRES_IN=900` to `repo-api/.env.example` and local `.env`
  - Add `NEXT_PUBLIC_API_URL=http://localhost:4000` to `frontend/.env.local`
  - Add `jest.config.js` and `vitest.config.ts` test runner configs
  - _Requirements: 1.1, 2.1, 2.4, 2.5_

- [ ] 2. Implement backend data stores and utilities
  - [x] 2.1 Create `repo-api/src/auth/userStore.js` with `UserStore` class
    - Implement `create(email, passwordHash)`, `findByEmail(email)`, `findById(id)` methods
    - Use `crypto.randomUUID()` for user ids; store email as lowercase trimmed
    - _Requirements: 1.1, 1.5_

  - [ ]* 2.2 Write property test for UserStore
    - **Property 1: Valid registration always creates a user with a hashed password**
    - **Validates: Requirements 1.1, 1.5**
    - File: `repo-api/src/auth/__tests__/register.property.test.js`

  - [x] 2.3 Create `repo-api/src/auth/tokenStore.js` with `TokenStore` class
    - Implement `save(token, { userId, expiresAt })`, `find(token)`, `revoke(token)` methods
    - _Requirements: 2.5, 3.1, 4.1_

  - [x] 2.4 Create `repo-api/src/auth/utils.js` with helper functions
    - Implement `generateRefreshToken()` — `crypto.randomBytes(64).toString('hex')`
    - Implement `getInitials(email)` — uppercase first char of local part
    - _Requirements: 2.5, 10.1_

- [ ] 3. Implement backend auth handlers
  - [-] 3.1 Create `repo-api/src/auth/handlers.js` with `register` handler
    - Validate email format and password length (≥ 8 chars); return 400 on failure
    - Return 409 if email already exists
    - Hash password with `bcryptjs` at cost factor 12; store user; return 201 `{ id, email }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Write property tests for register handler
    - **Property 1: Valid registration always creates a user with a hashed password** — `register.property.test.js`
    - **Property 2: Short passwords are always rejected** — `register.property.test.js`
    - **Property 3: Invalid email strings are always rejected** — `register.property.test.js`
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [~] 3.3 Add `login` handler to `handlers.js`
    - Look up user by email; always run bcrypt compare (use dummy hash for unknown emails)
    - On success: sign JWT with `sub`, `email`, `iat`, `exp` (iat + 900s); generate refresh token; save to TokenStore; return 200 `{ accessToken, refreshToken }`
    - On failure: return 401 `{ message: "Invalid credentials." }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.4 Write property tests for login handler
    - **Property 4: Login issues a well-formed access token for any registered user** — `login.property.test.js`
    - **Property 5: Login issues a well-formed refresh token for any registered user** — `login.property.test.js`
    - **Validates: Requirements 2.1, 2.4, 2.5**

  - [~] 3.5 Add `refresh` handler to `handlers.js`
    - Look up refresh token in TokenStore; return 401 if not found or expired
    - Revoke old token; issue new access token and new refresh token; save new refresh token; return 200 `{ accessToken, refreshToken }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.6 Write property tests for refresh handler
    - **Property 6: Token refresh rotates tokens and revokes the old one** — `refresh.property.test.js`
    - **Property 7: Revoked refresh tokens are always rejected** — `revoke.property.test.js`
    - **Validates: Requirements 3.1, 3.4, 4.3**

  - [~] 3.7 Add `logout` handler to `handlers.js`
    - Revoke the provided refresh token from TokenStore (no-op if absent); return 200 `{ message: "Logged out." }`
    - _Requirements: 4.1, 4.2_

  - [ ]* 3.8 Write property test for logout handler
    - **Property 8: Logout removes the token from the store for any valid session** — `revoke.property.test.js`
    - **Validates: Requirements 4.1**

  - [ ]* 3.9 Write example-based unit tests for all handlers
    - File: `repo-api/src/auth/__tests__/auth.unit.test.js`
    - Cover: duplicate email, wrong password, missing fields, expired token, idempotent logout
    - _Requirements: 1.2, 2.2, 2.3, 3.2, 3.3, 4.2_

- [ ] 4. Implement backend authenticate middleware
  - [~] 4.1 Create `repo-api/src/auth/middleware.js` with `authenticate` function
    - Extract Bearer token from `Authorization` header; return 401 `{ message: "Authentication required." }` if absent
    - Verify JWT signature; return 401 `{ message: "Token expired." }` for `TokenExpiredError`, `{ message: "Invalid token." }` for all other errors
    - On success: attach `{ id, email }` to `req.user` and call `next()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.2 Write property tests for authenticate middleware
    - **Property 9: Invalid tokens are always rejected by the authenticate middleware** — `middleware.property.test.js`
    - **Property 10: Valid tokens always have claims attached to the request** — `middleware.property.test.js`
    - **Validates: Requirements 5.4, 5.5**

- [ ] 5. Wire auth router into Express server
  - [~] 5.1 Create `repo-api/src/auth/router.js` mounting all four handlers on `/api/auth/*`
    - Add `express.json()` middleware; mount `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`
    - Export the router
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [~] 5.2 Mount auth router in `repo-api/src/server.js`
    - `app.use(authRouter)` before existing routes
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [~] 6. Checkpoint — backend tests pass
  - Run `npm test` in `repo-api`; ensure all property and unit tests pass. Ask the user if questions arise.

- [ ] 7. Implement frontend utility libraries
  - [~] 7.1 Create `frontend/src/lib/tokenUtils.ts`
    - Implement `decodeToken(token)`, `isTokenExpired(token)`, `isTokenExpiringSoon(token, thresholdSeconds = 60)`, `getInitials(email)`
    - _Requirements: 8.2, 8.3, 10.1_

  - [ ]* 7.2 Write property and unit tests for tokenUtils
    - **Property 16: Email initials derivation is correct for any email address** — `frontend/src/lib/__tests__/tokenUtils.test.ts`
    - Unit tests for `decodeToken`, `isTokenExpired`, `isTokenExpiringSoon`
    - **Validates: Requirements 8.2, 8.3, 10.1**

  - [~] 7.3 Create `frontend/src/lib/authApi.ts`
    - Implement typed `register`, `login`, `refresh`, `logout` wrappers using `fetch` against `NEXT_PUBLIC_API_URL`
    - _Requirements: 6.2, 7.3, 8.3, 4.1_

- [ ] 8. Implement AuthContext and AuthProvider
  - [~] 8.1 Create `frontend/src/contexts/AuthContext.tsx` with `AuthProvider` and `useAuth` hook
    - On mount: read `auth_refresh_token` from `localStorage`; if present, attempt silent refresh; populate `user` state on success; clear storage on 401
    - Implement `login(email, password)`: call `authApi.login`, store refresh token in `localStorage`, keep access token in React state, set `user`
    - Implement `logout()`: call `authApi.logout`, clear `localStorage` and React state
    - Set up proactive refresh timer: fire 60 s before access token expiry, call `authApi.refresh`, update tokens
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.2 Write property and unit tests for AuthContext
    - **Property 14: Session restoration correctly populates or clears user state** — `frontend/src/contexts/__tests__/AuthContext.test.tsx`
    - Unit tests for silent refresh on 401, proactive refresh timer, login/logout state transitions
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

  - [~] 8.3 Wrap the root layout with `AuthProvider` in `frontend/src/app/layout.tsx`
    - Add `"use client"` boundary or a thin client wrapper component to host the provider
    - _Requirements: 8.1_

- [ ] 9. Implement ProtectedRoute component
  - [~] 9.1 Create `frontend/src/components/ProtectedRoute.tsx`
    - If `!isAuthenticated`, redirect to `/login?redirect=<currentPath>` using `useRouter`
    - While auth state is loading (initial mount), render a loading spinner rather than redirecting
    - _Requirements: 9.1, 9.2_

  - [ ]* 9.2 Write property and unit tests for ProtectedRoute
    - **Property 15: Unauthenticated navigation to any protected route redirects to /login with the path preserved** — `frontend/src/components/__tests__/ProtectedRoute.test.tsx`
    - Unit tests for authenticated pass-through and redirect query parameter preservation
    - **Validates: Requirements 9.1, 9.2**

- [ ] 10. Implement login and registration pages
  - [~] 10.1 Create `frontend/src/app/login/page.tsx`
    - Render email input, password input, and submit button
    - Client-side validation: show error and block request if either field is empty/whitespace
    - On submit: call `useAuth().login`; on success redirect to `redirect` query param or `/`; on 401 show "Invalid email or password." inline
    - Disable submit button and show spinner while request is in flight
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.2 Write property and unit tests for LoginPage
    - **Property 11: Client-side validation rejects empty login fields before any network request** — `frontend/src/app/login/__tests__/LoginPage.test.tsx`
    - Unit tests for 401 error display, loading state, redirect-on-success
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [~] 10.3 Create `frontend/src/app/register/page.tsx`
    - Render email, password, confirm-password inputs and submit button
    - Client-side validation: reject mismatched passwords and passwords < 8 chars before any request
    - On 201: call `useAuth().login` automatically then redirect to `/`; on 409 show "An account with this email already exists." inline
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 10.4 Write property and unit tests for RegisterPage
    - **Property 12: Mismatched passwords are always rejected before any network request** — `frontend/src/app/register/__tests__/RegisterPage.test.tsx`
    - **Property 13: Short passwords are always rejected client-side before any network request** — `frontend/src/app/register/__tests__/RegisterPage.test.tsx`
    - Unit tests for 409 error display and auto-login on success
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 11. Protect the home page and update Topbar
  - [~] 11.1 Wrap the home page (`frontend/src/app/page.tsx`) with `ProtectedRoute`
    - Import and render `<ProtectedRoute>` around the page content
    - _Requirements: 9.3_

  - [~] 11.2 Update `frontend/src/components/Topbar.tsx` to consume `AuthContext`
    - When authenticated: replace hardcoded "NJ" avatar with `getInitials(user.email)`; add click handler to open dropdown with "Log out" option
    - When not authenticated: replace avatar button with a "Sign in" link pointing to `/login`
    - Clicking "Log out" calls `useAuth().logout()` then redirects to `/login`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 11.3 Write unit tests for Topbar
    - File: `frontend/src/components/__tests__/Topbar.test.tsx`
    - Test authenticated state (initials display, dropdown open/close, logout action)
    - Test unauthenticated state ("Sign in" link visible, avatar absent)
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [~] 12. Final checkpoint — all tests pass
  - Run `npm test -- --run` in `frontend` and `npm test` in `repo-api`; ensure all tests pass. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 6 and 12) ensure incremental validation before moving to the next layer
- Property tests use `fast-check` on both sides; each property maps 1-to-1 to a property in the design document
- Unit tests cover specific examples, edge cases, and error messages not covered by property tests
- The in-memory UserStore and TokenStore are intentionally simple — the design document describes how to swap them for a persistent store later
