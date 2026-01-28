# Caching Strategy & Architecture

## Overview
AgencyOS implements a multi-layer caching strategy to optimize performance, reduce database load, and ensure scalability. This system aligns with Ch.7 軍爭 (Maneuvering) of Binh Pháp, emphasizing speed and position.

## Layers

### 1. Browser/CDN Layer (Edge)
- **Technology**: Cloudflare / Fastly
- **Content**: Static assets, public API responses
- **Strategy**: Cache-Control headers
- **TTL**: 1 year (static), 5m (public API)

### 2. HTTP Response Layer (Middleware)
- **Technology**: Redis (via FastAPI Middleware)
- **Content**: API GET responses
- **Strategy**: Cache-Aside
- **TTL**: 5m (Public), 1m (Private/User-specific)
- **Keys**: `api:response:{hash(method,path,query,user_id,vary)}`

### 3. Application Object Cache
- **Technology**: Redis
- **Content**: Computed objects, session data, user profiles
- **Strategy**: Cache-Aside & Write-Through (for Sessions)
- **Modules**:
    - `QueryCache`: Database query results
    - `SessionCache`: User sessions (Critical)
    - `RateLimitCache`: Request counters

## Invalidation Strategy

We support three invalidation methods:

1. **TTL (Time-To-Live)**: All keys must have an expiry.
2. **Key-based**: Explicit deletion of specific keys.
3. **Tag-based**: Grouping keys by logical tags (e.g., `user:123`, `product:catalog`).

### Tagging
When caching a database query for User 123, we tag it with `user:123`. When User 123 is updated, we invalidate all keys with tag `user:123`.

## Configuration
Cache policies are defined in `backend/config/cache_config.yaml`.

## Monitoring
Metrics are exposed via the Admin Dashboard:
- Hit Rate
- Miss Rate
- Latency
- Eviction Count

## Usage Guide

### Caching a Function
```python
from backend.services.cache import cache_factory

@router.get("/users/{user_id}")
async def get_user(user_id: str):
    query_cache = await cache_factory.get_query_cache()

    return await query_cache.cached_query(
        f"user:{user_id}",
        lambda: db.get_user(user_id),
        tags=[f"user:{user_id}"]
    )
```

### Invalidating Data
```python
invalidator = await cache_factory.get_invalidator()
await invalidator.invalidate_tags([f"user:{user_id}"])
```
