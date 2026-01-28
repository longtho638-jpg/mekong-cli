---
description: 🔑 LICENSE - Manage software entitlements and keys
---

# /license - License Management Command

> **"Chìa khóa vạn năng"** - The Master Key

## Usage

```bash
/license [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `issue` | Issue new license key | `/license issue --tenant acme --plan pro` |
| `validate` | Check key validity | `/license validate --key AGY-123...` |
| `revoke` | Revoke a license | `/license revoke --key AGY-123...` |
| `info` | Get license details | `/license info --key AGY-123...` |

## Execution Protocol

1.  **Agent**: Delegates to `license-guardian`.
2.  **Tool**: Uses `backend/api/routers/license.py`.
3.  **Security**: Logs all key generation events.

## Examples

```bash
# Issue a 1-year Pro license
/license issue --tenant "Acme Corp" --plan pro --duration 365

# Validate a key from a customer ticket
/license validate --key "AGY-acme-20260128-xyz"
```

## Win-Win-Win
- **Owner**: Monetization control.
- **Agency**: Recurring revenue engine.
- **Client**: Secure access to value.
