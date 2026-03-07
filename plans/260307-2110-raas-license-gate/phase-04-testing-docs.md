---
title: "Phase 4: Testing + Documentation"
description: "E2E tests, integration tests, and user documentation for license gate"
status: pending
priority: P2
effort: 1h
---

# Phase 4: Testing + Documentation

## Context Links

- Related: `tests/test_*.py` — Existing test suite
- Related: `docs/LICENSE_SYSTEM.md` — License documentation
- Related: `docs/raas-foundation.md` — RaaS documentation

## Overview

**Priority:** P2 (Important)
**Status:** pending
**Description:** Comprehensive testing and documentation for license gate integration.

## Requirements

### Testing

1. Unit tests for secure storage backends
2. Unit tests for gateway client
3. Unit tests for validation cache
4. Integration tests for login flow
5. E2E tests for full authentication flow
6. Mock gateway for offline testing

### Documentation

1. User guide: `docs/user-auth-guide.md`
2. Admin guide: `docs/license-admin-guide.md`
3. API docs: `docs/raas-api.md` updates
4. Changelog: `docs/project-changelog.md` update

## Test Files to Create

### Unit Tests

- `tests/test_secure_storage.py` — Storage backend tests
- `tests/test_gateway_client.py` — Gateway API client tests
- `tests/test_validation_cache.py` — Cache TTL tests
- `tests/test_user_agent.py` — User-Agent builder tests
- `tests/test_license_middleware.py` — Middleware logic tests

### Integration Tests

- `tests/integration/test_login_flow.py` — Full login E2E
- `tests/integration/test_gateway_verify.py` — Gateway integration

### Mock Fixtures

- `tests/fixtures/mock_gateway.py` — Mock gateway server
- `tests/fixtures/test_keychain.py` — Mock keychain for testing

## Implementation Steps

### Step 1: Unit Tests for Secure Storage (30min)

```python
# tests/test_secure_storage.py
import pytest
from src.auth.secure_storage import (
    MacOSKeychainBackend,
    LinuxEncryptedBackend,
    SecureStorage,
)

def test_macos_keychain_store():
    backend = MacOSKeychainBackend()
    backend.store("test-key-123")
    assert backend.retrieve() == "test-key-123"
    backend.delete()

def test_linux_encrypted_backend():
    backend = LinuxEncryptedBackend()
    backend.store("test-key-456")
    assert backend.retrieve() == "test-key-456"
    backend.delete()

def test_secure_storage_platform_detect():
    storage = SecureStorage()
    assert storage.backend is not None
```

### Step 2: Unit Tests for Gateway Client (20min)

```python
# tests/test_gateway_client.py
import pytest
from src.auth.gateway_client import GatewayClient, build_user_agent

@pytest.mark.asyncio
async def test_verify_license_success(mock_gateway):
    client = GatewayClient()
    response = await client.verify_license("mk_valid_key")
    assert response.valid is True
    assert response.tier == "pro"

@pytest.mark.asyncio
async def test_verify_license_invalid(mock_gateway):
    client = GatewayClient()
    response = await client.verify_license("mk_invalid_key")
    assert response.valid is False

def test_user_agent_format():
    ua = build_user_agent()
    assert ua.startswith("mekong-cli/")
    assert "darwin" in ua or "linux" in ua or "windows" in ua
```

### Step 3: Unit Tests for Validation Cache (15min)

```python
# tests/test_validation_cache.py
import pytest
from datetime import datetime, timedelta
from src.auth.validation_cache import ValidationCache, CACHE_TTL

def test_cache_save_load():
    response = LicenseValidationResponse(
        valid=True, tier="pro", features=["feature1"],
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    ValidationCache.save(response)
    cached = ValidationCache.load()
    assert cached is not None
    assert cached.valid is True
    ValidationCache.clear()

def test_cache_expired():
    # Manually create expired cache entry
    ...
    assert ValidationCache.load() is None
```

### Step 4: Integration Tests (30min)

```python
# tests/integration/test_login_flow.py
import pytest
from click.testing import CliRunner
from src.commands.auth_commands import app as auth_app

def test_login_flow_success(mock_gateway):
    runner = CliRunner()
    result = runner.invoke(auth_app, ['login'], input='user@example.com\nmk_test_key\n')
    assert result.exit_code == 0
    assert "Logged in successfully" in result.output

def test_logout_clears_credentials():
    runner = CliRunner()
    runner.invoke(auth_app, ['login'], input='user@example.com\nmk_test_key\n')
    result = runner.invoke(auth_app, ['logout'])
    assert result.exit_code == 0
    # Verify credentials cleared
    from src.auth.secure_storage import get_license_key
    assert get_license_key() is None
```

### Step 5: User Documentation (30min)

Create `docs/user-auth-guide.md`:

```markdown
# User Authentication Guide

## Quick Start

### Login

```bash
mekong login
```

You will be prompted for:
1. Email address (for license association)
2. License key (paste or manual entry)

### Check Status

```bash
mekong auth status
```

Shows:
- Logged in state
- License tier
- Expiration date
- Features enabled

### Logout

```bash
mekong logout
```

Clears all stored credentials.

## Troubleshooting

### "Not logged in"

Run `mekong login` to authenticate.

### "License expired"

Renew your license at https://raas.mekong.dev/pricing

### "Gateway unreachable"

Check network connection. Cached license will be used if available.

## Secure Storage

Credentials are stored in:
- **macOS**: Keychain (access via `security` CLI)
- **Windows**: Credential Vault
- **Linux**: Encrypted file `~/.mekong/credentials.enc`
```

### Step 6: Update Existing Docs (15min)

1. Update `docs/LICENSE_SYSTEM.md`:
   - Add login/logout commands
   - Document secure storage locations
   - Add troubleshooting section

2. Update `docs/project-changelog.md`:
   ```markdown
   ## [Unreleased] - 2026-03-07

   ### Added
   - `mekong login` command for interactive authentication
   - `mekong logout` command to clear credentials
   - `mekong auth status` to show license state
   - Platform-native secure storage (Keychain, Credential Vault, encrypted file)
   - Gateway `/v1/auth/verify` endpoint for server-side validation
   - License validation middleware with offline mode

   ### Changed
   - License validation now uses gateway API (not just client-side)
   - Credentials stored securely (not in .env files)

   ### Security
   - JWT-based license validation
   - Rate limiting on gateway (10 req/min per IP)
   - Audit logging for all validation attempts
   ```

## Success Criteria

- [ ] All unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] E2E login flow works end-to-end
- [ ] User guide complete
- [ ] Changelog updated
- [ ] No TODO/FIXME comments in code
- [ ] Type hints on all test functions
- [ ] Docstrings on test classes

## Todo List

- [ ] Create test_secure_storage.py
- [ ] Create test_gateway_client.py
- [ ] Create test_validation_cache.py
- [ ] Create test_user_agent.py
- [ ] Create test_license_middleware.py
- [ ] Create integration test_login_flow.py
- [ ] Create mock_gateway fixture
- [ ] Write user-auth-guide.md
- [ ] Update LICENSE_SYSTEM.md
- [ ] Update project-changelog.md
- [ ] Run pytest and verify all tests pass
- [ ] Remove console.log statements from tests
