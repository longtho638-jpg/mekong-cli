---
phase: 2
title: "Auth & Tenant Isolation"
status: completed
effort: 4h
parallel: true
depends_on: []
---

# Phase 2: Auth & Tenant Isolation

## Context

- Current: No auth on raas-api-router; WebSocket uses simple token env var
- Current: TenantStrategyManager has tenant ID but no authentication enforcement
- Goal: JWT + API key auth, rate limiting, tenant-scoped middleware

## Key Insights

- JWT for browser/WebSocket sessions (stateless, 1h expiry)
- API keys for programmatic access (hashed in store, scoped permissions)
- Rate limiting per API key prevents abuse (Redis-backed in Phase 3, in-memory initially)

## Requirements

### Functional
- JWT generation (HS256 for MVP) with tenantId, scopes, expiry
- API key generation (algo_ prefix + 32 random chars), SHA-256 hashed storage
- Fastify preHandler hook extracts tenant from JWT or API key
- Rate limiting: configurable per-key limits with sliding window
- Scopes: `backtest`, `live:trade`, `live:monitor`, `admin`

### Non-Functional
- Auth middleware < 1ms overhead
- API key lookup O(1) via hash map (in-memory) or Redis (Phase 3)

## Architecture

```
src/auth/
├── jwt-service.ts          # Sign, verify, refresh JWT tokens
├── api-key-service.ts      # Generate, hash, validate API keys
├── auth-middleware.ts       # Fastify preHandler: JWT or API key
├── rate-limiter.ts          # In-memory sliding window (upgrades to Redis in Phase 3)
├── scopes.ts               # Scope definitions and checker
└── types.ts                # AuthContext, TenantToken interfaces
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/auth/types.ts` | AuthContext, TenantToken, ApiKeyRecord interfaces |
| `src/auth/jwt-service.ts` | signToken, verifyToken, refreshToken |
| `src/auth/api-key-service.ts` | generateKey, hashKey, validateKey |
| `src/auth/scopes.ts` | SCOPES enum, hasScope checker |
| `src/auth/auth-middleware.ts` | Fastify preHandler: extract tenant, enforce scope |
| `src/auth/rate-limiter.ts` | SlidingWindowLimiter class (in-memory Map) |

## Files to Modify

| File | Change |
|------|--------|
| `src/api/server.ts` | Register auth middleware as preHandler |
| `src/api/routes/tenant-routes.ts` | Add scope requirements per route |
| `src/api/routes/backtest-routes.ts` | Require `backtest` scope |
| `package.json` | Add jsonwebtoken, @types/jsonwebtoken |

## Implementation Steps

1. Install: `jsonwebtoken`, `@types/jsonwebtoken`
2. Create `src/auth/types.ts` -- AuthContext (tenantId, scopes, keyId)
3. Create `src/auth/scopes.ts` -- enum + `hasScope(required, actual)` checker
4. Create `src/auth/jwt-service.ts`:
   - `signToken(payload: TenantToken): string` -- HS256, 1h expiry
   - `verifyToken(token: string): TenantToken` -- throws on invalid
   - `refreshToken(token: string): string` -- extend if < 15min remaining
5. Create `src/auth/api-key-service.ts`:
   - `generateApiKey(tenantId: string): {raw, hashed}` -- `algo_` + 32 chars
   - `hashKey(raw: string): string` -- SHA-256
   - `validateKey(raw: string, store: Map): AuthContext | null`
6. Create `src/auth/rate-limiter.ts`:
   - `SlidingWindowLimiter` class -- Map<keyId, {count, windowStart}>
   - `check(keyId: string, limit: number, windowMs: number): boolean`
   - Returns headers: X-RateLimit-Remaining, X-RateLimit-Reset
7. Create `src/auth/auth-middleware.ts`:
   - Check `Authorization: Bearer <jwt>` first
   - Fallback to `X-API-Key: <key>` header
   - Attach `request.authContext = { tenantId, scopes, keyId }`
   - 401 if neither valid; 403 if scope insufficient
8. Register middleware in `src/api/server.ts` as global preHandler
9. Add per-route scope requirements
10. Write tests

## Todo

- [x] Install jsonwebtoken — SKIPPED: used built-in crypto (HS256 via HMAC-SHA256)
- [x] Create types.ts with AuthContext interface → src/auth/types.ts
- [x] Create scopes.ts with enum + checker → src/auth/scopes.ts
- [x] Create jwt-service.ts (sign, verify, refresh) → src/auth/jwt-token-service.ts
- [x] Create api-key-service.ts (generate, hash, validate) → src/auth/api-key-manager.ts
- [x] Create rate-limiter.ts (in-memory sliding window) → src/auth/sliding-window-rate-limiter.ts
- [x] Create auth-middleware.ts (Fastify preHandler) → src/auth/tenant-auth-middleware.ts
- [ ] Register middleware in server.ts — deferred: fastify not yet installed (Phase 3)
- [ ] Add scope requirements to routes — deferred: depends on server.ts
- [x] Write 10+ auth tests — 42 tests across 3 suites

## Tests

- `tests/auth/jwt-service.test.ts` -- sign, verify, expired, malformed
- `tests/auth/api-key-service.test.ts` -- generate format, hash match, invalid
- `tests/auth/rate-limiter.test.ts` -- within limit, exceed, window reset
- `tests/auth/auth-middleware.test.ts` -- JWT path, API key path, 401, 403

## Success Criteria

- [ ] JWT sign+verify roundtrip works
- [ ] API key generation produces `algo_` + 32 chars
- [ ] Rate limiter blocks after N requests, resets after window
- [ ] Protected routes return 401 without auth
- [ ] Protected routes return 403 with wrong scope
- [ ] TenantId from auth matches request path tenantId

## Security

- JWT secret from env var `JWT_SECRET` (min 32 chars)
- API keys hashed before storage (raw never persisted)
- Rate limit prevents brute-force key guessing
- Scope check prevents horizontal privilege escalation

## Risk

- **HS256 vs RS256:** HS256 simpler for MVP, migrate to RS256 when adding external IdP
- **In-memory rate limiter:** Per-process only; Phase 3 upgrades to Redis for distributed
