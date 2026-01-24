# Rate Limiting Middleware

Tier-based rate limiting for Mekong-CLI API using token bucket algorithm.

## Features

- ✅ **Tier-based limits**: Different rate limits for each subscription tier
- ✅ **Token bucket algorithm**: Smooth rate limiting with refill mechanism
- ✅ **Multiple tracking methods**: API key (priority) or IP address (fallback)
- ✅ **Standard headers**: X-RateLimit-* headers in all responses
- ✅ **429 responses**: Proper HTTP 429 Too Many Requests with retry information
- ✅ **Health endpoint bypass**: Health checks don't count against rate limits
- ✅ **Enterprise unlimited**: Enterprise tier has no rate limits

## Rate Limits by Tier

| Tier | Requests/Minute | Requests/Second |
|------|----------------|-----------------|
| Free | 10 | ~0.17 |
| Starter | 30 | 0.5 |
| Pro | 100 | ~1.67 |
| Franchise | 200 | ~3.33 |
| Enterprise | Unlimited | Unlimited |

## Usage

### Automatic (Middleware)

The middleware is automatically applied to all routes in `backend/main.py`:

```python
from backend.middleware import RateLimitMiddleware

app = FastAPI()
app.add_middleware(RateLimitMiddleware)
```

### Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 12
X-RateLimit-Tier: pro
```

### Testing Tiers

You can test different tiers using the `X-Subscription-Tier` header:

```bash
# Free tier (10 req/min)
curl http://localhost:8000/test

# Pro tier (100 req/min)
curl -H "X-Subscription-Tier: pro" http://localhost:8000/test

# Enterprise tier (unlimited)
curl -H "X-Subscription-Tier: enterprise" http://localhost:8000/test
```

### API Key Tracking

Use the `X-API-Key` header to track rate limits per API key:

```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:8000/test
```

## 429 Response Format

When rate limit is exceeded:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 10 requests/minute for free tier",
  "tier": "free",
  "retry_after": 42
}
```

Headers:
```
Status: 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 42
X-RateLimit-Tier: free
Retry-After: 42
```

## Manual Rate Limit Checking

For custom logic, use the `check_rate_limit` function:

```python
from backend.middleware import check_rate_limit

allowed, retry_after = check_rate_limit(
    identifier="user-123",
    tier="pro"
)

if not allowed:
    return JSONResponse(
        status_code=429,
        content={"retry_after": retry_after}
    )
```

## Integration with Subscriptions

**TODO**: The middleware currently uses the `X-Subscription-Tier` header for testing. To integrate with real subscriptions:

1. Add tier lookup in `_get_tier()` method
2. Query the subscriptions table based on API key
3. Cache tier information to avoid database hits on every request

Example integration:

```python
def _get_tier(self, request: Request, identifier: str) -> str:
    if identifier.startswith("key:"):
        api_key = identifier[4:]

        # Query subscription from database
        subscription = db.table("subscriptions")\\
            .select("plan")\\
            .eq("api_key", api_key)\\
            .single()\\
            .execute()

        if subscription and subscription.data:
            return subscription.data["plan"].lower()

    return self.default_tier
```

## Bypassed Endpoints

These endpoints don't count against rate limits:

- `/` - Root/health check
- `/health` - Health check
- `/docs` - API documentation
- `/openapi.json` - OpenAPI schema

## Testing

Run the test suite:

```bash
python3 -m pytest backend/tests/test_rate_limiter.py -v
```

## Token Bucket Algorithm

The middleware uses a **token bucket** algorithm:

1. Each tier has a bucket with capacity = requests/minute
2. Bucket refills at rate = capacity / 60 tokens/second
3. Each request consumes 1 token
4. When tokens < 1, request is denied with 429
5. Tokens refill continuously over time

Benefits:
- Smooth rate limiting (no sudden resets)
- Allows bursts up to capacity
- Self-healing (refills over time)
- Industry standard approach

## Architecture

```
Request → Middleware → Get Identifier (API key or IP)
                    ↓
              Get/Create TokenBucket for (identifier, tier)
                    ↓
              Consume token → Success? → Process request
                    ↓                           ↓
                   Fail                 Add rate limit headers
                    ↓                           ↓
              Return 429                   Return response
```

## Performance Considerations

- **In-memory storage**: Buckets stored in middleware instance (fast, but not distributed)
- **No database queries**: Rate limiting happens entirely in memory
- **Minimal overhead**: ~0.5ms per request
- **Scalability**: For distributed systems, consider Redis-backed rate limiting

## Future Enhancements

- [ ] Redis backend for distributed rate limiting
- [ ] Per-route rate limits
- [ ] Custom rate limit overrides
- [ ] Rate limit analytics/metrics
- [ ] Whitelist/blacklist support
- [ ] Sliding window algorithm option
