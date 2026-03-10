# Rate Limiting - API Protection

**Date:** 2026-03-05
**Status:** Production Ready

---

## Overview

Rate limiting protection for API endpoints to prevent abuse of premium trading features and control infrastructure costs.

## Features

- **Tier-based limits:** FREE < PRO < ENTERPRISE
- **Sliding window algorithm:** Accurate rate tracking
- **Burst protection:** Prevents request flooding
- **Per-key isolation:** Each API key has independent limits
- **Header responses:** X-RateLimit-* headers for client visibility

## Rate Limits by Tier

| Tier | Requests/Minute | Requests/Hour | Burst/Second |
|------|-----------------|---------------|--------------|
| FREE | 10 | 100 | 2 |
| PRO | 100 | 1,000 | 10 |
| ENTERPRISE | 1,000 | 10,000 | 50 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Request                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  rateLimitMiddleware() - Extract client identifier      │
│  Priority: X-API-Key > Authorization Bearer > IP        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  checkRateLimit(key, tier) - Sliding window check       │
│  - Check burst limit (last 1 second)                    │
│  - Check per-minute limit (last 60 seconds)             │
│  - Check per-hour limit (last 3600 seconds)             │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ┌─────────┐             ┌─────────┐
        │ Allowed │             │ Blocked │
        └─────────┘             └─────────┘
              │                       │
              ▼                       ▼
        Call next()           Return 429 + headers
        Add headers           Retry-After: 60
```

## Implementation

### Core Module: `src/lib/rate-limiter.ts`

```typescript
// Get rate limit config for tier
const config = getRateLimitConfig(LicenseTier.PRO);
// { requestsPerMinute: 100, requestsPerHour: 1000, burstLimit: 10 }

// Check if request should be allowed
const allowed = checkRateLimit('api-key-123', LicenseTier.PRO);

// Get current usage
const usage = getRateLimitUsage('api-key-123');
// { minuteUsage: 5, hourUsage: 50, limit: config }

// Get response headers
const headers = getRateLimitHeaders('api-key-123');
// { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '95', ... }
```

### Middleware: `src/lib/rate-limiter-middleware.ts`

**Hono middleware:**
```typescript
import { rateLimitMiddleware } from './lib/rate-limiter-middleware';

app.use('/api/*', rateLimitMiddleware());
```

**Fastify plugin:**
```typescript
import { rateLimitPlugin } from './lib/rate-limiter-middleware';

fastify.register(rateLimitPlugin);
```

## Response Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Hour-Limit: 1000
X-RateLimit-Hour-Remaining: 950
X-RateLimit-Reset: 1678012345
```

**429 Too Many Requests response:**
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60
}
```

## Usage Examples

### Example 1: Basic API Call

```bash
# FREE tier - 10 requests/minute
curl -X GET "https://api.algo-trader.com/api/v1/health" \
  -H "X-API-Key: raas-free-key"

# Response headers:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
```

### Example 2: PRO Tier Higher Limits

```bash
# PRO tier - 100 requests/minute
curl -X POST "https://api.algo-trader.com/api/v1/optimization/run" \
  -H "X-API-Key: raas-pro-key" \
  -H "Content-Type: application/json"

# Response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
```

### Example 3: Rate Limit Exceeded

```bash
# After exceeding limit
curl -X GET "https://api.algo-trader.com/api/v1/strategies" \
  -H "X-API-Key: raas-free-key"

# HTTP 429 Too Many Requests
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60
}
```

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern="rate-limiter"
```

**Test coverage:**
- Tier configuration
- Burst limit enforcement
- Per-minute limit tracking
- Per-key isolation
- Header generation
- Reset functionality

### Integration Tests

```bash
npm test -- --testPathPattern="rate-limiter-middleware"
```

**Test scenarios:**
- Middleware integration with Hono
- 429 response on limit exceeded
- Different limits per API key
- Header extraction priority

## Production Considerations

### Current Implementation (Development)

- In-memory storage (Map)
- Per-process rate limiting
- Suitable for single-instance deployment

### Production Upgrade (Recommended)

For multi-instance deployments, replace in-memory store with Redis:

```typescript
// Use Redis for distributed rate limiting
const redis = new Redis();

async function checkRateLimitRedis(key: string, limit: number) {
  const windowStart = Date.now() - 60000;
  const score = await redis.zcount(`ratelimit:${key}`, windowStart, '+inf');

  if (score >= limit) return false;

  await redis.zadd(`ratelimit:${key}`, Date.now(), Date.now().toString());
  await redis.expire(`ratelimit:${key}`, 3600);
  return true;
}
```

## Monitoring

### Metrics to Track

- `rate_limit_exceeded_total` - Count of 429 responses
- `rate_limit_usage_by_tier` - Usage distribution per tier
- `rate_limit_burst_events` - Burst limit triggers

### Alerting Thresholds

- FREE tier: Alert if > 50% of requests hit rate limit
- PRO tier: Alert if > 30% of requests hit rate limit
- ENTERPRISE: Alert if > 10% of requests hit rate limit

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/rate-limiter.ts` | Core rate limiting logic |
| `src/lib/rate-limiter-middleware.ts` | Hono/Fastify middleware |
| `src/lib/rate-limiter.test.ts` | Unit tests |
| `src/lib/rate-limiter-middleware.test.ts` | Integration tests |
| `src/api/gateway.ts` | Gateway with middleware applied |

## Future Enhancements

1. **Redis backend:** For distributed rate limiting
2. **Dynamic limits:** Adjust based on system load
3. **Quota tracking:** Monthly API quotas per tier
4. **Webhook notifications:** Alert users at 80% usage
5. **Custom limits:** Per-customer limit overrides

## References

- Sliding window algorithm: https://en.wikipedia.org/wiki/Sliding_window_protocol
- Rate limiting best practices: https://docs.cloudflare.com/rate-limiting
- Redis rate limiting: https://redis.io/commands/incr/
