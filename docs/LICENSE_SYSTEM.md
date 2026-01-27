# AgencyOS License System Documentation

> **Production-ready license generation, validation, and activation system**

## Overview

The AgencyOS License System provides secure, cryptographically-signed license keys for production deployments. It includes:

- **Secure Key Generation**: SHA-256 checksums prevent tampering
- **Hardware Binding**: Lock licenses to specific domains or hardware fingerprints
- **Seat Activation**: Enforce concurrent instance limits (max_activations)
- **Expiration Handling**: Automatic expiration tracking and renewal notifications
- **REST API**: Full-featured API for license operations
- **Database Persistence**: Supabase/PostgreSQL storage

---

## License Key Format

```
AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}
```

**Example:**
```
AGY-tenant123-20260127-a3f8c9d2
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| `AGY` | Product prefix | `AGY` |
| `TENANT_ID` | Customer identifier | `tenant123` |
| `TIMESTAMP` | Issue date (YYYYMMDD) | `20260127` |
| `CHECKSUM` | SHA-256 hash (8 chars) | `a3f8c9d2` |

---

## Subscription Tiers & Limits

| Tier | Price | Max Users | Max Agents | Max Activations | Features |
|------|-------|-----------|------------|-----------------|----------|
| **Solo** | $395/year | 1 | 3 | 3 | Basic AI, Dashboard, API |
| **Team** | $995/year | 5 | 10 | 10 | + Advanced AI, Multi-user |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited (9999) | + White-label, SLA Support |

---

## Architecture

### 1. Database Schema

The system uses two tables in Supabase:

**`licenses` Table:**
Stores the master license records.
```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(100) UNIQUE NOT NULL,
    tenant_id VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- active, revoked, expired
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    bound_domain VARCHAR(255),
    hardware_fingerprint VARCHAR(255), -- Strict binding
    max_users INT NOT NULL,
    max_agents INT NOT NULL,
    max_activations INT NOT NULL, -- Seat limit
    features JSONB,
    last_validated_at TIMESTAMP,
    validation_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_licenses_tenant_id ON licenses(tenant_id);
```

**`license_activations` Table:**
Tracks individual devices/instances consuming a seat.
```sql
CREATE TABLE license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES licenses(id),
    fingerprint VARCHAR(255) NOT NULL, -- Device ID
    hostname VARCHAR(255),
    ip_address VARCHAR(45),
    activated_at TIMESTAMP DEFAULT NOW(),
    last_check_in TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(license_id, fingerprint)
);
```

### 2. Service Layer

The `LicenseService` handles business logic:
- **Generation**: Creates license key and persists to DB.
- **Validation**: Checks format, signature, expiry, and status.
- **Activation**: Registers a device fingerprint against the `max_activations` limit.

---

## REST API Reference

**Base URL**: `/api/licenses`

### 1. Generate License (Admin)
**POST** `/generate`

Request:
```json
{
  "tenant_id": "customer_123",
  "plan": "team",
  "duration_days": 365,
  "bound_domain": "app.customer.com"
}
```

Response:
```json
{
  "license_key": "AGY-customer_123-...",
  "status": "active",
  "max_activations": 10
}
```

### 2. Validate License
**POST** `/validate`

Request:
```json
{
  "license_key": "AGY-customer_123-...",
  "domain": "app.customer.com",
  "hardware_fingerprint": "device_hwid_1"
}
```

Response:
```json
{
  "valid": true,
  "reason": "License valid",
  "license": { ... }
}
```

### 3. Activate Seat
**POST** `/activate`

Registers a new device/instance. Fails if `max_activations` is reached.

Request:
```json
{
  "license_key": "AGY-customer_123-...",
  "fingerprint": "server-instance-01",
  "hostname": "prod-api-01",
  "ip_address": "10.0.0.1"
}
```

Response:
```json
{
  "success": true,
  "message": "Activated successfully"
}
```

### 4. Deactivate Seat
**POST** `/deactivate`

Frees up a seat.

Request:
```json
{
  "license_key": "AGY-customer_123-...",
  "fingerprint": "server-instance-01"
}
```

### 5. Renew License (Admin)
**POST** `/renew/{license_key}`

Extends the license expiration.

---

## Python SDK Usage

```python
from backend.api.services.license_service import LicenseService
from backend.core.licensing import LicensePlan

service = LicenseService()

# 1. Create License
license = service.create_license(
    tenant_id="new_customer",
    plan=LicensePlan.TEAM
)

# 2. Validate
result = service.validate_license(license.license_key)
if result.valid:
    print("Valid!")

# 3. Activate
success, msg = service.activate_license(
    license_key=license.license_key,
    fingerprint="my-macbook"
)
```

---

## Integration Guide

### Middleware
The `LicenseValidatorMiddleware` automatically checks for `X-Agency-License-Key` header on protected routes.

### Environment Variables
Required for production:
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
LICENSE_SALT=... # Must be kept secret!
```
