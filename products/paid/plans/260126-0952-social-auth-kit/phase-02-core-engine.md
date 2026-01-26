# Phase 2: Core Auth Engine

## 1. Overview
**Priority**: Critical
**Status**: Pending
**Goal**: Implement the core logic for user management, token issuance, and session handling.

## 2. Requirements
- **Token Standard**: JWT (JSON Web Tokens).
- **Algorithm**: HS256 (Speed) or RS256 (Security). *Decision: HS256 is sufficient for self-contained kit.*
- **Session**: Database-backed refresh tokens for revocation capability.

## 3. Architecture
- **UserService**: CRUD operations for users.
- **AuthService**: Verify credentials (if hybrid), Issue Tokens, Refresh Tokens.
- **Security**: Password hashing (Argon2 or BCrypt) - strict implementation even if primarily social.

## 4. Implementation Steps

### Step 1: User Models
- Create `User` model (SQLAlchemy).
  - `id` (UUID)
  - `email` (Unique, Indexed)
  - `hashed_password` (Nullable, for future hybrid support)
  - `is_active`, `is_superuser`
  - `avatar_url`, `full_name`

### Step 2: Security Utilities
- Implement `core/security.py`.
- Functions: `create_access_token`, `verify_password`, `get_password_hash`.
- JWT Config: Expiration time, Algorithm, Secret Key.

### Step 3: Refresh Token Logic
- Create `RefreshToken` model.
  - `token` (Hash), `user_id`, `expires_at`, `revoked`.
- Implement rotation logic: When a refresh token is used, revoke it and issue a new one.

### Step 4: Pydantic Schemas
- `Token`, `TokenPayload`.
- `UserCreate`, `UserUpdate`, `UserResponse`.

## 5. Success Criteria
- [ ] Can create a user in DB.
- [ ] Can generate valid JWT access token.
- [ ] Can generate and store refresh token.
- [ ] Can validate and decode token.

## 6. Related Files
- `backend/app/models/user.py`
- `backend/app/models/token.py`
- `backend/app/core/security.py`
- `backend/app/schemas/token.py`
