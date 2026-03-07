---
title: "RaaS LICENSE_KEY Gate Integration"
description: "Implement mekong login command, secure storage, gateway validation, and license middleware"
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, license, auth, cli]
created: 2026-03-07
---

# RaaS LICENSE_KEY Gate Integration

## Overview

Implement complete license key management for RaaS CLI with secure storage, gateway validation, and execution blocking.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    mekong login Command                         │
│  1. Interactive prompt (email + tier)                           │
│  2. Gateway call: POST /v1/auth/verify                          │
│  3. Store validated key in secure storage                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Platform Secure Storage                        │
│  macOS: Keychain (security CLI)                                 │
│  Windows: Credential Vault (powershell)                         │
│  Linux: ~/.mekong/config (AES-256 encrypted)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               License Validation Middleware                     │
│  1. Load key from secure storage                                │
│  2. Validate format (mk_ prefix)                                │
│  3. Check gateway /v1/auth/verify                               │
│  4. Block execution with clear error if invalid                 │
└─────────────────────────────────────────────────────────────────┘
```

## Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1: Login Command + Storage](./phase-01-login-command.md) | `mekong login` + secure storage | 2h | pending |
| [Phase 2: Gateway Verify Endpoint](./phase-02-gateway-verify.md) | Gateway `/v1/auth/verify` endpoint | 2h | pending |
| [Phase 3: License Middleware](./phase-03-validation-middleware.md) | Validation middleware + blocking | 3h | pending |
| [Phase 4: Testing + Docs](./phase-04-testing-docs.md) | E2E tests + documentation | 1h | pending |

## Dependencies

- RaaS Gateway (Cloudflare Worker) — deploy first
- Pydantic v2 for validation models
- Rich CLI for interactive prompts

## Unresolved Questions

1. Gateway base URL for production vs staging environments?
2. License key format: `mk_` prefix or `RPP-/REP-` from existing system?
3. Encryption key for Linux config: derive from password or use system keyring?
