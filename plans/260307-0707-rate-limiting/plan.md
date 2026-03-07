---
title: "Rate Limiting on Auth Endpoints"
description: "Token bucket rate limiter with per-IP throttling for auth routes"
status: pending
priority: P2
effort: 6h
branch: master
tags: [security, rate-limiting, auth, middleware]
created: 2026-03-07
---

# Rate Limiting Implementation Plan

**Goal:** Protect auth endpoints from brute-force and DoS attacks via token bucket rate limiting.

**Research:** Complete — Token bucket algorithm, custom implementation needed.

**Existing:** OAuth2 middleware (`src/auth/middleware.py`), auth routes (`src/auth/routes.py`), FastAPI gateway (`src/api/`).

---

## Phases Overview

| Phase | Description | Status | Link |
|-------|-------------|--------|------|
| 1 | Rate Limiter Core — Token bucket algorithm | ⏳ Pending | [phase-01-rate-limiter-core.md](./phase-01-rate-limiter-core.md) |
| 2 | Rate Limit Decorator — `@rate_limit()` decorator | ⏳ Pending | [phase-02-rate-limit-decorator.md](./phase-02-rate-limit-decorator.md) |
| 3 | Middleware Integration — Auth middleware wiring | ⏳ Pending | [phase-03-middleware-integration.md](./phase-03-middleware-integration.md) |
| 4 | Route Protection — Apply to auth endpoints | ⏳ Pending | [phase-04-route-protection.md](./phase-04-route-protection.md) |
| 5 | Testing — Unit + integration tests | ⏳ Pending | [phase-05-testing.md](./phase-05-testing.md) |

---

## Rate Limit Configuration

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/auth/login` | 5 | minute | Prevent password brute-force |
| `/auth/callback/*` | 10 | minute | OAuth callback flood protection |
| `/auth/refresh` | 30 | hour | Token refresh abuse prevention |
| `/auth/dev-login` | 10 | minute | Dev-only, can disable |

---

## Success Criteria

- [ ] Token bucket algorithm with thread-safe in-memory storage
- [ ] `@rate_limit()` decorator with configurable limits
- [ ] X-RateLimit-* headers on all responses
- [ ] 429 Too Many Requests with Retry-After header
- [ ] IP whitelist bypass (for dev/testing)
- [ ] All tests passing

---

## Dependencies

- Python 3.9+
- FastAPI
- Existing auth middleware (`src/auth/middleware.py`)
- No external rate limiting libraries (custom implementation)

---

## Unresolved Questions

1. Should rate limit data persist across restarts? (Current: No, in-memory only)
2. Need Redis for distributed rate limiting in production? (Future enhancement)
