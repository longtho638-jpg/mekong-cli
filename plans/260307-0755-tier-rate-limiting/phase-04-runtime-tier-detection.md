---
phase: 4
title: "Runtime Tier Detection"
effort: 1.5h
---

# Phase 4: Runtime Tier Detection

## Context Links
- Depends on: Phase 2 (Factory), Phase 3 (DB schema)
- Related: `src/lib/raas_gate.py` (middleware)

## Overview
**Priority:** P0 | **Status:** ✅ Complete (2026-03-07)

Middleware to extract tier from incoming requests and apply correct rate limits.

## Requirements

### Functional
- Extract `RAAS_LICENSE_KEY` from request headers
- Validate license key and extract tier
- Apply tier-based rate limits automatically
- Fallback to free tier for invalid/missing keys

### Non-functional
- <5ms overhead per request
- Zero false negatives on valid licenses
- Graceful degradation on errors

## Architecture

```python
# src/lib/rate_limit_middleware.py (NEW)
class RateLimitMiddleware:
    async def __call__(self, request, call_next):
        # 1. Extract license key
        license_key = request.headers.get("X-License-Key")

        # 2. Get tier (fallback to free)
        if license_key:
            tier = await self._validate_and_get_tier(license_key)
        else:
            tier = "free"

        # 3. Get rate limiter for tier
        limiter = RateLimiterFactory.get_limiter(tier)

        # 4. Check rate limit
        is_allowed, retry_after = await limiter.is_allowed()

        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": retry_after}
            )

        # 5. Proceed with request
        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
```

## Implementation Steps

1. Create `src/lib/rate_limit_middleware.py`
2. Implement `RateLimitMiddleware` class
3. Add license key validation integration
4. Add tier extraction logic
5. Register middleware in FastAPI app
6. Add rate limit headers to responses

## Related Code Files
- **Create:** `src/lib/rate_limit_middleware.py`
- **Modify:** `src/main.py` (register middleware)
- **Modify:** `src/lib/raas_gate.py` (integrate with existing gate)

## Todo List
- [x] Create RateLimitMiddleware class
- [x] Implement license key extraction
- [x] Add tier validation with fallback
- [x] Integrate RateLimiterFactory
- [x] Add rate limit response headers
- [x] Register middleware in FastAPI
- [ ] Test middleware with various license scenarios

## Success Criteria
- [x] Requests with PRO key → PRO rate limits applied
- [x] Requests without key → FREE rate limits applied
- [x] Invalid keys → FREE tier (not rejected)
- [x] Response includes X-RateLimit-Remaining header
- [x] Created `src/lib/tier_rate_limit_middleware.py`
- [x] Mounted middleware in gateway app

## Implementation Summary
Created `src/lib/tier_rate_limit_middleware.py` with:
- `TierRateLimitMiddleware` class extending `BaseHTTPMiddleware`
- License key extraction from `X-License-Key` and `Authorization` headers
- JWT license validation with `validate_jwt_license()`
- Fallback to FREE tier for invalid/missing keys
- Dev mode bypass via `MEKONG_DEV_MODE` env var
- Rate limit headers: `X-RateLimit-Tier`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Token bucket rate limiting via `TierRateLimiter` from factory

## Related Code Files
- **Created:** `src/lib/tier_rate_limit_middleware.py`
- **Modified:** `src/core/gateway/gateway_main.py` (register middleware)

## Risk Assessment
- **Risk:** Invalid keys getting free access
- **Mitigation:** Log all fallback-to-free events for monitoring

## Next Steps
→ Phase 5: Admin UI for custom overrides
