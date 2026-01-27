# Security Audit System Documentation

## Overview

This document describes the security auditing and JWT rotation system implemented for the Agency OS platform. The system is designed to meet SOC 2, GDPR, and PCI-DSS requirements for audit logging and access control.

## 1. JWT Rotation & Revocation

### Architecture
- **Token Lifetime**: Access tokens expire every 15 minutes.
- **Refresh Tokens**: Used to obtain new access tokens without re-login (7-day lifetime).
- **Rotation**: Refresh tokens are rotated upon use (old one invalidated, new one issued).
- **Revocation**: A Redis-based blacklist is used to immediately revoke tokens (e.g., on logout or security breach).

### Components
- **Service**: `backend.services.jwt_service.JWTService`
- **Middleware**: `backend.middleware.jwt_rotation.JWTRotationMiddleware`
- **Storage**: Redis (for blacklist)

### Usage

#### Decoding & Verification
```python
from backend.services.jwt_service import jwt_service

payload = jwt_service.decode_token(token)
if payload:
    # Token is valid and not blacklisted
    user_id = payload["sub"]
```

#### Revocation
```python
# Revoke a token (adds JTI to blacklist)
jwt_service.revoke_token(jti, expires_in=900)
```

## 2. Immutable Audit Logging

### Architecture
- **Immutability**:
    - Database triggers prevent `UPDATE` or `DELETE` on the `audit_logs` table.
    - SHA-256 hash chaining links each log entry to the previous one, making tampering detectable.
- **Storage**: PostgreSQL `audit_logs` table.
- **Performance**: Async logging via `AuditMiddleware`.

### Schema (`audit_logs`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | BigInteger | Primary Key |
| `user_id` | UUID | User performing action |
| `action` | String | Action name (e.g., `auth.login`, `invoice.create`) |
| `resource_type` | String | Target resource (e.g., `invoice`, `user`) |
| `timestamp` | DateTime | UTC timestamp |
| `hash` | String | SHA-256 hash of entry + previous hash |
| `metadata` | JSONB | Contextual details |

### Usage

#### Automatic Logging
The `AuditMiddleware` automatically logs all API requests.

#### Manual/Custom Logging
Use the `AuditLogger` facade for business logic events:

```python
from backend.core.audit_logger import audit_logger

await audit_logger.log_event(
    db=db,
    action="contract.sign",
    user_id=user.id,
    resource_type="contract",
    resource_id=contract.id,
    metadata={"amount": 5000, "currency": "USD"}
)
```

## 3. Configuration

Configuration is managed in `backend/api/config/settings.py`:

```python
access_token_expire_minutes = 15
refresh_token_expire_minutes = 10080  # 7 days
audit_retention_days = 365
```

## 4. Testing

Run security tests:
```bash
pytest backend/tests/unit/test_security_audit.py
```
