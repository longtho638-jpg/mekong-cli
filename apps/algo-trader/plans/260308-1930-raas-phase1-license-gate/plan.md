---
title: "RaaS Phase 1: License Key Validation Gate"
description: "License middleware + KV rate limiting + startup validation for RaaS API"
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, license, security, fastapi, middleware]
created: 2026-03-08
---

# RaaS Phase 1: License Key Validation Gate

## Overview

Implement license key validation middleware for RaaS API gateway with KV-based rate limiting and startup validation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RaaS API Gateway                            │
├─────────────────────────────────────────────────────────────────┤
│  Request → License Middleware → KV Rate Limit → Route Handler  │
│             ↓                      ↓                            │
│         JWT Validation    │   Log Attempt                       │
│         Tier Check        │   Block if >5/min                   │
│         Feature Gate      │   5-min block on exceed              │
└─────────────────────────────────────────────────────────────────┘
```

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [License Validator Core](./phase-01-license-validator.md) | pending | 2h |
| 2 | [FastAPI Middleware](./phase-02-fastapi-middleware.md) | pending | 2h |
| 3 | [KV Rate Limiter](./phase-03-kv-rate-limiter.md) | pending | 2h |
| 4 | [Startup Validation](./phase-04-startup-validation.md) | pending | 1h |
| 5 | [Testing](./phase-05-testing.md) | pending | 1h |

## Dependencies

- Existing: `src/lib/raas-gate.ts` (LicenseService)
- Existing: `src/lib/license-validator.ts` (startup validation)
- Existing: `src/api/fastify-raas-server.ts` (FastAPI server)
- New: Cloudflare KV for rate limiting (production)

## Success Criteria

- [ ] All `/api/*` routes protected by license middleware
- [ ] 403 returned for missing/invalid license
- [ ] Rate limiting: 5 attempts/min per IP, 5-min block on exceed
- [ ] Startup validation blocks app if license invalid
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: middleware + rate limiting

## Unresolved Questions

1. Cloudflare KV binding setup for production?
2. Local dev: use in-memory store or mock KV?
