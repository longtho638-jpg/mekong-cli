# Phase 4: API & Security

## 1. Overview
**Priority**: High
**Status**: Pending
**Goal**: Expose the auth logic via secure API endpoints and implement OWASP best practices.

## 2. Requirements
- **Endpoints**: `/login/{provider}`, `/callback/{provider}`, `/refresh`, `/logout`, `/me`.
- **Security**: Rate limiting, CORS, CSRF, Secure Headers.

## 3. Implementation Steps

### Step 1: Auth Endpoints
- `GET /auth/login/{provider}`: Generates state, redirects to provider.
- `GET /auth/callback/{provider}`: Exchanges code, creates/updates user, issues tokens.
  - Sets `access_token` (JSON response).
  - Sets `refresh_token` (HttpOnly Cookie).

### Step 2: User Endpoints
- `GET /users/me`: Returns current user profile (Protected).
- `POST /auth/refresh`: Rotates tokens using cookie.
- `POST /auth/logout`: Revokes refresh token, clears cookie.

### Step 3: Social Account Linking (Optional but High Value)
- Support linking multiple providers to the same account (by email matching or explicit link).
- *Decision*: For MVP, link by verified email automatically.

### Step 4: Security Middleware
- **CORS**: Configure allowed origins strictly.
- **Rate Limiting**: Use `fastapi-limiter` (Redis or memory).
- **Secure Headers**: `Secure`, `HttpOnly`, `SameSite=Lax`.

## 4. Success Criteria
- [ ] Full login flow works via API tools (Postman/Curl).
- [ ] Refresh token cookie is set correctly (HttpOnly).
- [ ] Access token allows access to protected routes.
- [ ] Invalid tokens return 401.

## 5. Related Files
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/api/v1/endpoints/users.py`
- `backend/app/main.py` (Middleware)
