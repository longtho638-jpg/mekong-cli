# Rate Limiting Documentation

## Overview

Mekong CLI implements token bucket rate limiting to prevent API abuse and ensure fair usage across all tiers.

---

## Algorithm

**Token Bucket** - Industry standard for rate limiting:

```typescript
interface TokenBucket {
  capacity: number;      // Max tokens
  tokens: number;        // Current tokens
  refillRate: number;    // Tokens per second
  lastRefill: Date;      // Last refill timestamp
}
```

**How it works:**
1. Each request consumes 1 token
2. Tokens refill continuously at `refillRate`
3. If no tokens available → request rejected (429 Too Many Requests)

---

## Rate Limits by Tier

| Tier | Requests/Min | Burst | Use Case |
|------|--------------|-------|----------|
| **FREE** | 10 | 20 | Trial users, development |
| **PRO** | 100 | 200 | Licensed users, production |
| **ENTERPRISE** | 1000 | 2000 | High-volume, agencies |

---

## Implementation

### Location

```
apps/algo-trader/src/lib/
├── rate-limiter.ts              # Token bucket core
├── rate-limiter.test.ts         # Unit tests
└── rate-limiter-middleware.test.ts  # Middleware tests
```

### Usage

```typescript
import { RateLimiter } from './rate-limiter';

const limiter = new RateLimiter({
  capacity: 100,
  refillRate: 1.67  // 100 per minute
});

// Check if request allowed
if (limiter.consume()) {
  // Process request
} else {
  // Return 429
  res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfter: limiter.getRetryAfter()
  });
}
```

### Middleware Integration

```typescript
import { rateLimitMiddleware } from './rate-limiter-middleware';

app.use('/api', rateLimitMiddleware({
  tier: 'PRO',
  keyExtractor: (req) => req.headers['x-api-key']
}));
```

---

## Headers

Rate limit information returned in HTTP headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Total requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds to wait before retrying (on 429) |

**Example Response:**

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709654400
```

---

## Best Practices

### Client-Side

1. **Check headers** - Monitor remaining quota
2. **Implement backoff** - Exponential backoff on 429
3. **Cache responses** - Reduce unnecessary requests
4. **Batch requests** - Combine multiple operations

### Server-Side

1. **Use Redis** - For distributed rate limiting
2. **Log rejections** - Monitor abuse patterns
3. **Adjust limits** - Based on usage analytics
4. **Whitelist IPs** - For trusted partners

---

## Testing

```bash
# Run rate limiter tests
cd apps/algo-trader
npm test -- rate-limiter

# Stress test
ab -n 1000 -c 10 http://localhost:3000/api/test
```

---

## Production Deployment

### Cloudflare Worker Pattern

```typescript
// wrangler.toml
[secrets]
RATE_LIMIT_REDIS_URL

// gateway.ts
import { RedisRateLimiter } from '@cloudflare/rate-limiter';

const limiter = new RedisRateLimiter({
  redisUrl: RATE_LIMIT_REDIS_URL,
  keyPrefix: 'mekong:ratelimit'
});
```

### Configuration

| Env Var | Description | Default |
|---------|-------------|---------|
| `RATE_LIMIT_FREE` | FREE tier limit/min | 10 |
| `RATE_LIMIT_PRO` | PRO tier limit/min | 100 |
| `RATE_LIMIT_ENTERPRISE` | ENTERPRISE tier limit/min | 1000 |
| `RATE_LIMIT_REDIS_URL` | Redis URL for distributed limiting | (local) |

---

## Monitoring

Track rate limiting metrics:

```typescript
// Metrics to collect
{
  rate_limit_hits: number,      // Total requests
  rate_limit_misses: number,    // Rejected requests
  rate_limit_tokens: number,    // Current tokens
  rate_limit_tier: string       // User tier
}
```

**Alerts:**
- Rejection rate > 10% → Review limits
- Single IP > 50% rejections → Possible abuse
- Token depletion < 1s → Increase capacity

---

*Last updated: 2026-03-05*
