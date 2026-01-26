# Phase 3: OAuth Providers

## 1. Overview
**Priority**: High
**Status**: Pending
**Goal**: Implement the specific logic for Google, GitHub, and Discord authentication flows.

## 2. Requirements
- **Standardization**: All providers must map to a single `UnifiedUserProfile`.
- **Extensibility**: Easy to add more providers (e.g., LinkedIn, Twitter) later.
- **Security**: Validate `state` parameter to prevent CSRF.

## 3. Architecture
- **Abstract Base Class**: `BaseProvider`
  - `get_auth_url(state: str)`
  - `get_token(code: str)`
  - `get_user_info(token: str)`
- **Unified Profile**:
  - `email`, `provider`, `provider_user_id`, `full_name`, `avatar_url`.

## 4. Implementation Steps

### Step 1: Provider Interface
- Define `app/providers/base.py`.
- Define `UnifiedUserProfile` Pydantic model.

### Step 2: Google Implementation
- `app/providers/google.py`
- Scopes: `openid`, `email`, `profile`.
- Endpoint: `https://accounts.google.com/o/oauth2/v2/auth`.

### Step 3: GitHub Implementation
- `app/providers/github.py`
- Scopes: `user:email`, `read:user`.
- Note: GitHub emails endpoint requires separate call if email is private.

### Step 4: Discord Implementation
- `app/providers/discord.py`
- Scopes: `identify`, `email`.

### Step 5: Provider Factory
- `app/providers/factory.py`.
- `get_provider(name: str) -> BaseProvider`.

## 5. Success Criteria
- [ ] Google Auth flow retrieves email/profile.
- [ ] GitHub Auth flow retrieves email/profile (handling private emails).
- [ ] Discord Auth flow retrieves email/profile.
- [ ] All outputs match `UnifiedUserProfile`.

## 6. Related Files
- `backend/app/providers/base.py`
- `backend/app/providers/google.py`
- `backend/app/providers/github.py`
- `backend/app/providers/discord.py`
