---
phase: 4
title: "Route Protection — Apply to Auth Endpoints"
status: complete
effort: 1h
completed: 2026-03-07
---

# Phase 4: Route Protection

## Overview

Apply rate limits to specific auth endpoints with configurable thresholds.

## Key Insights

- Different endpoints need different limits
- Login: Strictest (5/min) — brute-force prevention
- Callback: Moderate (10/min) — OAuth flood protection
- Refresh: Relaxed (30/hour) — token abuse prevention
- Dev-login: Lenient (10/min, can disable)

## Requirements

### Functional
- Apply `@rate_limit()` to each auth route
- Endpoint-specific configurations
- Consistent header responses

### Non-functional
- No code duplication
- Easy to modify limits
- Clear documentation

## Route Configuration

| Route | Method | Limit | Window | Config Key |
|-------|--------|-------|--------|------------|
| `/auth/login` | GET, POST | 5 | minute | `AUTH_LOGIN_RATE` |
| `/auth/callback/*` | GET | 10 | minute | `AUTH_CALLBACK_RATE` |
| `/auth/refresh` | GET | 30 | hour | `AUTH_REFRESH_RATE` |
| `/auth/dev-login` | POST | 10 | minute | `AUTH_DEV_LOGIN_RATE` |

## Implementation Steps

1. **Read existing routes** (`src/auth/routes.py`)

2. **Apply decorators to routes**
   ```python
   @router.post("/login")
   @rate_limit(limit="5/minute")
   async def login_page(...):
   ```

3. **Add environment variable overrides**
   - Parse `AUTH_LOGIN_RATE`, etc.
   - Default to recommended values

4. **Test each endpoint**
   - Verify headers present
   - Verify 429 after limit exceeded

## Related Code Files

**Modify:**
- `src/auth/routes.py` (add @rate_limit decorators)

## Success Criteria

- [x] `/auth/login` limited to 5/min (via login_page route - renders OAuth links)
- [x] `/auth/google/login` limited to 5/min (AUTH_LOGIN preset)
- [x] `/auth/google/callback` limited to 10/min (AUTH_CALLBACK preset)
- [x] `/auth/github/login` limited to 5/min (AUTH_LOGIN preset)
- [x] `/auth/github/callback` limited to 10/min (AUTH_CALLBACK preset)
- [x] `/auth/refresh` limited to 30/hour (AUTH_REFRESH preset)
- [x] `/auth/dev-login` limited to 10/min (custom limit)
- [x] `/auth/logout` limited to 30/hour (custom limit)
- [x] X-RateLimit headers on all responses
- [x] 429 when limit exceeded (decorator raises HTTPException)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Limits too strict for legitimate users | Medium | Monitor, adjust based on usage |
| Limits too loose for attack prevention | High | Start conservative, loosen if needed |
| Callback routes miss rate limits | Low | Wildcard pattern covers all callbacks |

## Next Steps

→ Phase 5: Write comprehensive tests
