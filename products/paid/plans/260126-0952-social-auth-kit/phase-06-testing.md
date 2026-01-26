# Phase 6: Testing & QA

## 1. Overview
**Priority**: Critical
**Status**: Complete
**Goal**: Ensure reliability and regression prevention.

## 2. Strategy
- **Unit Tests**: Test logic in isolation (User service, Token generation).
- **Integration Tests**: Test API endpoints with DB.
- **Mocking**: Mock external OAuth provider responses (don't hit real APIs during test).

## 3. Implementation Steps

### Step 1: Test Fixtures
- DB setup/teardown fixture (`conftest.py`).
- Client fixture (`TestClient`).
- Mock Data factories (Polyfactory or manually).

### Step 2: Auth Flow Tests
- Test redirects (Status 307/302).
- Test callback handling with valid/invalid codes.
- Test token refresh mechanics.

### Step 3: Security Tests
- Test expired tokens.
- Test malformed signatures.
- Test CSRF state mismatch.

## 4. Success Criteria
- [x] 100% Code Coverage on `app/core` and `app/services`.
- [x] All tests pass in CI environment (GitHub Actions workflow included).

## 5. Related Files
- `backend/tests/conftest.py`
- `backend/tests/api/test_auth.py`
- `backend/tests/services/test_user.py`
