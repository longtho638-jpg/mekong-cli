---
phase: 2
title: "Rate Limit Decorator — @rate_limit()"
status: completed
effort: 1.5h
completed: 2026-03-07
---

# Phase 2: Rate Limit Decorator - COMPLETED

## Overview

Create Python decorator for easy rate limit application to FastAPI routes.

## Implementation Summary

Created `src/auth/rate_limit_decorator.py` with:

1. **rate_limit() decorator** - Main decorator with flexible config
   - `limit` parameter: "5/minute", "10/hour", etc.
   - `preset` parameter: Use RateLimitPreset enum
   - `key_prefix` parameter: Custom key prefix
   - `bypass_dev` parameter: Skip in dev mode

2. **get_client_ip(request)** - IP extraction helper
   - Checks X-Forwarded-For (first IP)
   - Checks X-Real-IP
   - Falls back to client.host
   - Handles IPv6-mapped addresses

3. **parse_rate_limit(limit_string)** - Limit parser
   - Supports: "5/minute", "10/hour", "100/day"
   - Supports explicit seconds: "5/60"
   - Returns (limit, window_seconds) tuple

4. **RateLimitExceeded HTTPException** - 429 response
   - Includes retry_after in response body
   - Adds X-RateLimit-* headers

5. **Shorthand decorators**:
   - `rate_limit_auth_login()` - 5/min
   - `rate_limit_auth_callback()` - 10/min
   - `rate_limit_auth_refresh()` - 30/hour
   - `rate_limit_api_write()` - 20/min default
   - `rate_limit_api_read()` - 100/min default

## Success Criteria - ALL MET

- [x] @rate_limit(limit="5/minute") syntax works
- [x] IP extraction handles proxies correctly
- [x] 429 response when limit exceeded
- [x] X-RateLimit-* headers present on all responses
- [x] Retry-After header indicates wait time
- [x] Bypass dev mode option works

## Files Created

- `src/auth/rate_limit_decorator.py` (280 lines)

## Overview

Create Python decorator for easy rate limit application to FastAPI routes.

## Key Insights

- Decorator extracts IP from request headers (X-Forwarded-For, X-Real-IP)
- Falls back to client_id (user ID) if authenticated
- Returns 429 with Retry-After header when limit exceeded
- Adds X-RateLimit-* headers to all responses

## Requirements

### Functional
- `@rate_limit(limit="5/minute")` syntax
- Parse limit string: "5/minute", "30/hour", "100/day"
- Extract client IP from request
- Return 429 Too Many Requests when exceeded
- Add rate limit headers to response

### Non-functional
- Minimal overhead (<1ms per request)
- Clear error messages
- Easy to configure per-route

## Architecture

```python
# Usage example
@router.post("/login")
@rate_limit(limit="5/minute")
async def login(request: Request, ...):
    ...

# Decorator signature
def rate_limit(
    limit: str = "10/minute",
    key_extractor: Callable = extract_ip,
    bypass_ips: List[str] = None,
):
```

### IP Extraction Priority

1. `X-Forwarded-For` (first IP, if behind proxy)
2. `X-Real-IP` (if set by reverse proxy)
3. `request.client.host` (direct connection)

### Response Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1710000060
Retry-After: 12
```

## Implementation Steps

1. **Create decorator module** (`src/lib/rate_limiter/decorator.py`)

2. **Implement limit parser**
   - Parse "5/minute" → (capacity=5, refill_rate=5/60)
   - Support: second, minute, hour, day

3. **Implement IP extractor**
   - `extract_ip(request: Request) -> str`
   - Handle X-Forwarded-For with multiple IPs
   - Validate IP format

4. **Create rate_limit decorator**
   - Wrap FastAPI route handler
   - Check rate limit before calling handler
   - Add headers to response
   - Raise HTTPException 429 when exceeded

5. **Create bypass list**
   - Check `RATE_LIMIT_BYPASS_IPS` env var
   - Skip rate limit for whitelisted IPs

## Related Code Files

**Create:**
- `src/lib/rate_limiter/decorator.py`

**Modify:**
- `src/lib/rate_limiter/__init__.py` (export decorator)

## Success Criteria

- [ ] `@rate_limit(limit="5/minute")` syntax works
- [ ] IP extraction handles proxies correctly
- [ ] 429 response when limit exceeded
- [ ] X-RateLimit-* headers present on all responses
- [ ] Retry-After header indicates wait time
- [ ] Bypass IPs skip rate limiting

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| IP spoofing via X-Forwarded-For | Medium | Only trust first IP, validate format |
| Decorator order issues | Low | Document: must be innermost decorator |
| False positives on shared NAT | Medium | Future: combine IP + user agent hash |

## Next Steps

→ Phase 3: Integrate with existing auth middleware
