# IPO-018-OAuth - OAuth 2.0 Authorization Server Implementation Plan

## 1. Overview
This plan details the implementation of a production-grade OAuth 2.0 Authorization Server for the Mekong-CLI (AgencyOS) platform. This will enable secure API access, third-party integrations, and enterprise SSO capabilities.

## 2. Architecture
The solution will be built on top of the existing FastAPI backend, integrating with Supabase for user authentication but maintaining its own OAuth client and token management.

### Components
1.  **Database Layer**: New tables for `oauth_clients`, `oauth_tokens`, and `oauth_grants`.
2.  **Service Layer**:
    *   `JWTService`: Stateless token generation and validation.
    *   `TokenService`: Token persistence and lifecycle management.
    *   `OAuthService`: Orchestration of OAuth flows (Auth Code, Client Creds, Refresh).
3.  **API Layer**: New `oauth` router with standard endpoints.
4.  **Middleware**: Bearer token validation using the new service.

## 3. Implementation Steps

### Phase 1: Models & Database
- [ ] Define SQLAlchemy models for `OAuthClient`, `OAuthToken`, `OAuthGrant`.
- [ ] Create SQL migration scripts.
- [ ] Define Pydantic schemas for API requests/responses.

### Phase 2: Core Services
- [ ] Implement `JWTService` (HS256/RS256, payload structure).
- [ ] Implement `TokenService` (Store, retrieve, revoke).
- [ ] Implement `OAuthService` (Client validation, grant handling).

### Phase 3: API Endpoints
- [ ] `/authorize`: Authorization Code flow initialization.
- [ ] `/token`: Token exchange (Code, Client Creds, Refresh).
- [ ] `/introspect`: Token validation (RFC 7662).
- [ ] `/revoke`: Token revocation (RFC 7009).

### Phase 4: Integration & Security
- [ ] Implement PKCE verification.
- [ ] Integrate with existing User Auth (Supabase/Fake DB for now).
- [ ] Add scope-based permission checks.

### Phase 5: Testing & Verification
- [ ] Unit tests for services.
- [ ] Integration tests for full OAuth flows.

## 4. Technical Specifications

### Token Format (JWT)
```json
{
  "iss": "https://api.mekong.com",
  "sub": "user_id",
  "aud": "client_id",
  "exp": 1738000000,
  "iat": 1737996400,
  "scope": "read write"
}
```

### Database Schema (Simplified)
- **oauth_clients**: `client_id`, `client_secret_hash`, `redirect_uris`, `scopes`, `grant_types`.
- **oauth_tokens**: `access_token` (hash), `refresh_token` (hash), `client_id`, `user_id`, `expires_at`, `revoked`.
- **oauth_grants**: `code`, `client_id`, `user_id`, `redirect_uri`, `expires_at`, `code_challenge`, `code_challenge_method`.

## 5. Unresolved Questions
- Should we use RS256 (Asymmetric) from the start? -> Yes, better for distributed verification. (Will stick to HS256 for speed if keys not available, but design for RS256). *Decision: Start with HS256 using `settings.secret_key` for simplicity, migrate to RS256 later.*

