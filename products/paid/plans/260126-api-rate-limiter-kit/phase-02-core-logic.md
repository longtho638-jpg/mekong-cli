# Phase 2: Core Rate Limiter Logic

**Status**: In Progress
**Goal**: Implement the core rate limiting algorithms using Redis and expose them via a FastAPI dependency.

## Steps

1. **Lua Scripts**
   - Implement `fixed_window.lua`: Atomically increment and set expiry.
   - Implement `sliding_window.lua`: Use Redis Sorted Sets (ZSET) for precise rolling windows.
   - Store these as python strings or load from files in `app/limiter/scripts/`.

2. **Rate Limiter Strategy Interface**
   - Create `BaseRateLimiter` abstract class.
   - Methods: `is_allowed(key: str, limit: int, window: int) -> tuple[bool, dict]`.
   - Returns boolean (allowed/blocked) and metadata (remaining, reset_time).

3. **Implement Strategies**
   - `FixedWindowLimiter`: Simple counter with TTL.
   - `SlidingWindowLimiter`: ZSET based (remove old timestamps, count current).

4. **FastAPI Integration**
   - Create `RateLimit` dependency class.
   - Support `key_func` (how to identify the user: IP, UserID, Header).
   - Inject headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
   - Handle `429 Too Many Requests` response.

5. **Demo Endpoint**
   - Add a `/api/v1/test-limit` endpoint protected by the limiter to verify functionality.

## Deliverables
- Functional `RateLimit` dependency.
- Correctly functioning 429 errors when limits are exceeded.
- Redis keys being created and expiring correctly.
