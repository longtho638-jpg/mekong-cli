---
title: "Phase 6 CLI: License & Usage Commands"
description: "CLI commands cho RaaS license management và usage reporting với JWT-signed payloads"
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, phase-6, cli, license, usage]
created: 2026-03-08
---

# Phase 6 CLI: License & Usage Management

## Executive Summary

Implementation của `mekong license` và `mekong usage` commands với:
- Authentication qua RaaS Gateway (`mk_` API key từ `~/.mekong/credentials`)
- JWT-signed payload cho usage reporting
- Idempotency key generation
- Retry logic với exponential backoff
- Display license tier, quota limits, analytics opt-in

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mekong CLI                                   │
├─────────────────────────────────────────────────────────────────┤
│  mekong license                    │  mekong usage               │
│  ├─ status                         │  ├─ show                    │
│  ├─ validate                       │  ├─ sync                    │
│  ├─ activate                       │  ├─ history                 │
│  └─ inspect                        │  └─ analytics               │
├─────────────────────────────────────────────────────────────────┤
│                    RaaS Auth Client (src/core/raas_auth.py)      │
│  - Credential storage (~/.mekong/credentials)                   │
│  - JWT validation & session cache (5min TTL)                    │
│  - Certificate-based auth (X-Cert-ID, X-Cert-Sig)               │
├─────────────────────────────────────────────────────────────────┤
│                    RaaS Gateway (https://raas.agencyos.network)  │
│  - /v1/auth/validate - License validation                       │
│  - /v1/usage/submit - Usage reporting (JWT-signed)              │
│  - /v1/quota/check - Quota status                               │
└─────────────────────────────────────────────────────────────────┘
```

## Tier Structure

| Tier | Daily Limit | Monthly Limit | Features |
|------|-------------|---------------|----------|
| FREE | 100 | 1,000 | Base commands |
| PRO | 1,000 | 20,000 | Premium commands, priority support |
| ENTERPRISE | 10,000 | 100,000 | Unlimited, dedicated gateway |

## Dependencies

- `src/core/raas_auth.py` - Auth client (ĐÃ CÓ)
- `src/lib/raas_gate.py` - License validation (ĐÃ CÓ)
- `src/cli/raas_auth_commands.py` - Auth commands (ĐÃ CÓ)
- `src/cli/roi_commands.py` - ROI unified commands (ĐÃ CÓ)
- `src/cli/roi_usage.py` - Usage commands (ĐÃ CÓ)

## Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   │          │         │         │         │         │
   ▼          ▼         ▼         ▼         ▼         ▼
License    Usage    Idempotency  Retry   Analytics  Tests
Status     Show     Generator    Logic   Opt-in
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/cli/license_commands.py` | Modify | License subcommands |
| `src/commands/license_commands.py` | Modify | Existing license commands |
| `src/cli/usage_commands.py` | CREATE | Usage subcommands |
| `src/core/idempotency_key_generator.py` | CREATE | Idempotency key generation |
| `src/core/retry_handler.py` | CREATE | Exponential backoff retry |
| `src/core/usage_signer.py` | CREATE | JWT-signed usage payloads |
| `src/cli/analytics_consent.py` | CREATE | Analytics opt-in prompt |

## Verification Criteria

- [ ] `mekong license status` - Hiển thị tier, quota, expiry
- [ ] `mekong license validate` - Validate với gateway
- [ ] `mekong license activate` - Activate license key
- [ ] `mekong license inspect` - Inspect JWT payload
- [ ] `mekong usage show` - Hiển thị usage stats
- [ ] `mekong usage sync` - Sync usage lên gateway
- [ ] `mekong usage history` - Lịch sử usage events
- [ ] `mekong usage analytics` - Analytics với opt-in prompt
- [ ] Tất cả commands có retry logic (3 attempts, exponential backoff)
- [ ] Idempotency keys cho usage submission
- [ ] JWT-signed payloads cho usage reporting

## Unresolved Questions

1. **Credential path**: `~/.mekong/credentials` hay `~/.mekong/raas/credentials.json`?
   - → `raas_auth.py` đang dùng `~/.mekong/raas/credentials.json`

2. **Gateway endpoints**: Đã có `/v1/auth/validate`, cần thêm `/v1/usage/submit`?
   - → Cần verify gateway API documentation

3. **JWT signing**: Client-side signing hay gateway signing?
   - → Gateway signing (client chỉ gửi usage events, gateway签 JWT)

4. **Analytics opt-in**: Lưu consent ở đâu?
   - → `~/.mekong/telemetry_consent.json` (đã có trong `src/core/telemetry_consent.py`)
