# RaaS Phase 1 License Gate - Planning Report

**Date:** 2026-03-08
**Plan Dir:** `plans/260308-1930-raas-phase1-license-gate/`
**Effort:** 8h total
**Priority:** P1 (Critical for RaaS monetization)

---

## Summary

Created comprehensive 5-phase plan for RaaS license key validation gate:

| Phase | Component | Effort | Status |
|-------|-----------|--------|--------|
| 1 | License Validator Core | 2h | pending |
| 2 | FastAPI Middleware | 2h | pending |
| 3 | KV Rate Limiter | 2h | pending |
| 4 | Startup Validation | 1h | pending |
| 5 | Testing | 1h | pending |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RaaS API Gateway                            │
├─────────────────────────────────────────────────────────────────┤
│  Request → Auth Middleware → License Middleware → Route Handler│
│                              │                                  │
│                              ├── KV Rate Limit (5/min per IP)  │
│                              ├── JWT/API Key Validation         │
│                              ├── Tier Check (FREE/PRO/ENT)     │
│                              └── Audit Logging to KV            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Remote Validator (`src/lib/raas-remote-validator.ts`)
- Connects to `raas.agencyos.network` for real-time validation
- Supports JWT + mk_ API key authentication
- 5-minute caching to reduce API calls
- Graceful fallback to local validation on gateway error

### 2. License Middleware (`src/api/middleware/license-middleware.ts`)
- Protects all `/api/*` routes
- Returns 403 `{error: 'license_required'}` on failure
- Excludes health/metrics/webhook routes
- Injects license tier into request context

### 3. KV Rate Limiter (`src/lib/kv-rate-limiter.ts`)
- Cloudflare KV-based (production)
- In-memory fallback (local dev)
- 5 attempts/minute per IP
- 5-minute block on exceed
- Audit logging for compliance

### 4. Startup Validation (`src/lib/license-validator.ts` enhanced)
- Async validation with 5s timeout
- Clear error messages for missing/invalid keys
- Remote validation with local JWT fallback
- Optional FREE tier mode for development

## Files Created

```
plans/260308-1930-raas-phase1-license-gate/
├── plan.md                              # Overview plan
├── phase-01-license-validator.md        # Core validation
├── phase-02-fastapi-middleware.md       # HTTP middleware
├── phase-03-kv-rate-limiter.md          # KV rate limiting
├── phase-04-startup-validation.md       # Startup gate
├── phase-05-testing.md                  # Unit + integration tests
└── reports/
    └── planner-260308-1930-raas-phase1-license-gate.md  # This report
```

## Success Criteria

- [ ] All `/api/*` routes protected by license middleware
- [ ] 403 returned for missing/invalid license
- [ ] Rate limiting: 5 attempts/min per IP, 5-min block on exceed
- [ ] Startup validation blocks app if license invalid (production)
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: middleware + rate limiting + startup

## Dependencies

**Existing (reuse):**
- `src/lib/raas-gate.ts` - LicenseService with JWT validation
- `src/lib/license-validator.ts` - Startup validation
- `src/api/fastify-raas-server.ts` - Fastify server

**New (to create):**
- `src/lib/raas-remote-validator.ts` - Remote API client
- `src/lib/kv-rate-limiter.ts` - KV rate limiter
- `src/lib/kv-client.ts` - KV client wrapper
- `src/api/middleware/license-middleware.ts` - Fastify middleware

## Unresolved Questions

1. **Cloudflare KV binding setup** - Need to configure `RAAS_KV` binding in Workers config
2. **Local dev mode** - Use in-memory store (implemented) or mock KV?
3. **FREE tier in production** - Allow `ALLOW_FREE_TIER=true` for demos?

## Next Steps

1. Claim Phase 1 task → Implement remote validator
2. Claim Phase 2 task → Implement middleware
3. Claim Phase 3 task → Implement KV rate limiter
4. Claim Phase 4 task → Enhance startup validation
5. Claim Phase 5 task → Write tests

---

**Plan ready for implementation. All phases documented with code samples.**
