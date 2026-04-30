# Requirements Document

## Introduction

This feature adds user authentication to the AltersSearch application. The backend (repo-api, Node.js/Express on port 4000) will expose registration, login, logout, and token-refresh endpoints secured with JSON Web Tokens (JWT). The frontend (Next.js on port 3000) will provide login and registration pages, persist the session via HTTP-only cookies or localStorage, protect routes that require a signed-in user, and replace the hardcoded "NJ" avatar in the Topbar with the authenticated user's identity.

## Glossary

- **Auth_Service**: The authentication module within the repo-api Express server responsible for issuing and validating credentials.
- **Token_Store**: The in-memory or persistent store (e.g., a Map or database table) that tracks issued refresh tokens and their revocation status.
- **Access_Token**: A short-lived JWT (15 minutes) used to authenticate API requests.
- **Refresh_Token**: A long-lived opaque token (7 days) stored server-side and used to obtain a new Access_Token without re-entering credentials.
- **Auth_Context**: The React context in the frontend that holds the current user's identity and exposes login/logout actions to all components.
- **Protected_Route**: A Next.js page or layout that redirects unauthenticated users to the login page.
- **User**: A registered account identified by a unique email address and a hashed password.
- **Password_Hash**: A bcrypt-derived hash of the user's plaintext password stored in place of the password.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account with my email and password, so that I can access the application as an authenticated user.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/register` with a valid email and a password of at least 8 characters, THE Auth_Service SHALL create a new User record, store the Password_Hash, and return a 201 response containing the user's id and email.
2. WHEN a registration request is received with an email that already exists in the system, THE Auth_Service SHALL return a 409 response with the message "Email already registered."
3. WHEN a registration request is received with a missing or malformed email, THE Auth_Service SHALL return a 400 response with a descriptive validation error message.
4. WHEN a registration request is received with a password shorter than 8 characters, THE Auth_Service SHALL return a 400 response with the message "Password must be at least 8 characters."
5. THE Auth_Service SHALL store passwords exclusively as Password_Hash values and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I receive tokens that grant me access to the application.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/login` with a valid email and matching password, THE Auth_Service SHALL return a 200 response containing a signed Access_Token and a Refresh_Token.
2. WHEN a login request is received with an email that does not exist, THE Auth_Service SHALL return a 401 response with the message "Invalid credentials."
3. WHEN a login request is received with a correct email but incorrect password, THE Auth_Service SHALL return a 401 response with the message "Invalid credentials."
4. THE Auth_Service SHALL sign the Access_Token with an expiry of 15 minutes and embed the user's id and email as claims.
5. THE Auth_Service SHALL generate the Refresh_Token as a cryptographically random 64-byte hex string and store it in the Token_Store with the associated user id and an expiry timestamp of 7 days from issuance.

---

### Requirement 3: Token Refresh

**User Story:** As an authenticated user, I want my session to be silently renewed before my access token expires, so that I am not interrupted while using the application.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/refresh` with a valid, non-expired Refresh_Token, THE Auth_Service SHALL return a 200 response containing a new Access_Token and a new Refresh_Token, and SHALL invalidate the previous Refresh_Token in the Token_Store.
2. WHEN a refresh request is received with a Refresh_Token that does not exist in the Token_Store, THE Auth_Service SHALL return a 401 response with the message "Invalid refresh token."
3. WHEN a refresh request is received with a Refresh_Token whose expiry timestamp has passed, THE Auth_Service SHALL return a 401 response with the message "Refresh token expired."
4. THE Auth_Service SHALL rotate the Refresh_Token on every successful refresh (issue a new one and revoke the old one) to limit the impact of token theft.

---

### Requirement 4: Logout

**User Story:** As an authenticated user, I want to log out, so that my session is terminated and my tokens can no longer be used.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/auth/logout` with a valid Refresh_Token, THE Auth_Service SHALL remove the Refresh_Token from the Token_Store and return a 200 response with the message "Logged out."
2. WHEN a logout request is received with a Refresh_Token that does not exist in the Token_Store, THE Auth_Service SHALL return a 200 response (idempotent logout) to avoid leaking token existence information.
3. WHILE a user is logged out, THE Auth_Service SHALL reject any subsequent use of the revoked Refresh_Token with a 401 response.

---

### Requirement 5: Route Protection (Backend Middleware)

**User Story:** As a system operator, I want API endpoints that require authentication to reject unauthenticated requests, so that user data is protected.

#### Acceptance Criteria

1. THE Auth_Service SHALL expose an `authenticate` middleware that extracts the Bearer token from the `Authorization` header and verifies its signature and expiry.
2. WHEN a request reaches a protected endpoint without an `Authorization` header, THE Auth_Service SHALL return a 401 response with the message "Authentication required."
3. WHEN a request reaches a protected endpoint with an expired Access_Token, THE Auth_Service SHALL return a 401 response with the message "Token expired."
4. WHEN a request reaches a protected endpoint with a tampered or invalid Access_Token, THE Auth_Service SHALL return a 401 response with the message "Invalid token."
5. WHEN a request passes the `authenticate` middleware, THE Auth_Service SHALL attach the decoded user claims (id, email) to the request object for downstream handlers.

---

### Requirement 6: Frontend Login Page

**User Story:** As a visitor, I want a login page where I can enter my credentials, so that I can authenticate and access the application.

#### Acceptance Criteria

1. THE Frontend SHALL provide a login page at the route `/login` containing an email input, a password input, and a submit button.
2. WHEN the login form is submitted with valid credentials, THE Frontend SHALL store the received Access_Token and Refresh_Token, update the Auth_Context with the user's identity, and redirect the user to the home page.
3. WHEN the login API returns a 401 response, THE Frontend SHALL display the error message "Invalid email or password." inline on the form without navigating away.
4. WHILE the login form submission is in progress, THE Frontend SHALL disable the submit button and display a loading indicator to prevent duplicate submissions.
5. IF the login form is submitted with an empty email or password field, THEN THE Frontend SHALL display a validation error message before making any network request.

---

### Requirement 7: Frontend Registration Page

**User Story:** As a new visitor, I want a registration page where I can create an account, so that I can start using the application.

#### Acceptance Criteria

1. THE Frontend SHALL provide a registration page at the route `/register` containing an email input, a password input, a confirm-password input, and a submit button.
2. WHEN the registration form is submitted and the password and confirm-password values do not match, THE Frontend SHALL display the error "Passwords do not match." without making a network request.
3. WHEN the registration API returns a 201 response, THE Frontend SHALL automatically log the user in (store tokens, update Auth_Context) and redirect to the home page.
4. WHEN the registration API returns a 409 response, THE Frontend SHALL display the error "An account with this email already exists." inline on the form.
5. IF the registration form is submitted with a password shorter than 8 characters, THEN THE Frontend SHALL display the error "Password must be at least 8 characters." without making a network request.

---

### Requirement 8: Auth Context and Session Persistence

**User Story:** As an authenticated user, I want my session to persist across page refreshes, so that I do not have to log in every time I open the application.

#### Acceptance Criteria

1. THE Auth_Context SHALL expose the current user object (id, email), an `isAuthenticated` boolean, a `login` action, and a `logout` action to all child components.
2. WHEN the application loads, THE Auth_Context SHALL attempt to restore the session by reading a stored Access_Token, verifying it has not expired, and populating the user state accordingly.
3. WHEN an Access_Token is within 60 seconds of expiry, THE Auth_Context SHALL automatically call the refresh endpoint using the stored Refresh_Token and replace the stored tokens with the new ones.
4. WHEN the refresh endpoint returns a 401 response during silent refresh, THE Auth_Context SHALL clear all stored tokens and set `isAuthenticated` to false.
5. THE Frontend SHALL store the Access_Token in memory (React state) and the Refresh_Token in `localStorage` to balance security and persistence.

---

### Requirement 9: Protected Routes (Frontend)

**User Story:** As a system operator, I want unauthenticated users to be redirected to the login page when they try to access protected pages, so that the application content is only visible to signed-in users.

#### Acceptance Criteria

1. WHILE a user is not authenticated, THE Frontend SHALL redirect any navigation to a Protected_Route to the `/login` page, preserving the originally requested path as a `redirect` query parameter.
2. WHEN a user successfully logs in and a `redirect` query parameter is present, THE Frontend SHALL navigate the user to the path specified in the `redirect` parameter instead of the default home page.
3. THE Frontend SHALL treat the home page (`/`) as a Protected_Route requiring authentication.

---

### Requirement 10: Topbar User Identity Display

**User Story:** As an authenticated user, I want to see my identity in the top navigation bar, so that I know I am logged in and can access account actions.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE Topbar SHALL display the user's initials (derived from the email address) in the avatar button in place of the hardcoded "NJ" value.
2. WHEN the avatar button is clicked, THE Topbar SHALL display a dropdown menu containing a "Log out" option.
3. WHEN the "Log out" option is selected, THE Topbar SHALL call the Auth_Context `logout` action, which clears stored tokens and calls the `/api/auth/logout` endpoint, then redirect the user to the `/login` page.
4. WHILE a user is not authenticated, THE Topbar SHALL display a "Sign in" link in place of the avatar button.
