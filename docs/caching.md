# Caching & Performance Optimization

**Status:** Implemented (IPO-055)
**Date:** 2026-01-27

## Overview

The Agency OS backend now implements a robust, hybrid caching strategy to ensure sub-50ms response times for high-traffic read endpoints. It uses Redis as the primary cache store with an automatic fallback to in-memory caching if Redis is unavailable.

## Architecture

### Cache Service (`backend.services.cache_service`)

The `CacheService` provides a unified interface for caching operations:

-   **Hybrid Storage:** Uses `redis` if available; falls back to `InMemoryCache`.
-   **Serialization:** Uses `msgpack` for high-performance binary serialization (faster and smaller than JSON). Falls back to JSON if `msgpack` is missing.
-   **Compression:** Automatically compresses values larger than 1KB using `zlib` to save bandwidth and memory.
-   **Decorators:** Provides a `@cached` decorator for easy function/endpoint caching.

### Key Features

1.  **Smart Invalidation:**
    -   CRUD services (`LandingPageService`, `AdminService`) automatically invalidate relevant cache keys upon data modification.
    -   Supports pattern-based invalidation (e.g., `invalidate_pattern("users:*")`).

2.  **Monitoring:**
    -   Tracks hits/misses (in-memory).
    -   Exposes cache statistics via API (`GET /api/admin/cache/stats`).

3.  **Performance:**
    -   Batch operations (`mget`, `mset`) supported.
    -   Connection pooling enabled for Redis.

## Usage

### Using the Decorator

```python
from backend.services.cache_service import cached

@router.get("/heavy-metric")
@cached(ttl=300, prefix="metrics", key_func=lambda metric_id: f"id:{metric_id}")
async def get_heavy_metric(metric_id: str):
    return calculate_metric(metric_id)
```

### Using the Service Directly

```python
from backend.services.cache_service import CacheService

cache = CacheService(prefix="users")

# Set
cache.set("user:123", {"name": "John"}, ttl=600)

# Get
user = cache.get("user:123")

# Delete
cache.delete("user:123")

# Invalidate all user lists
cache.invalidate_pattern("list:*")
```

## Configuration

Settings in `.env` or `backend/api/config/settings.py`:

-   `REDIS_URL`: Connection string (e.g., `redis://localhost:6379/0`)
-   `CACHE_TTL_FAST`: Default short TTL (e.g., 60s)
-   `CACHE_TTL_MEDIUM`: Default medium TTL (e.g., 300s)
-   `CACHE_TTL_SLOW`: Default long TTL (e.g., 3600s)

## Admin API

-   `GET /api/admin/cache/stats`: View cache usage statistics.
-   `POST /api/admin/cache/clear`: Manually flush the entire cache (Admin only).

## Cached Endpoints

The following endpoints are currently cached:

-   `GET /api/dashboard/data/{metric}` (TTL: 300s)
-   `GET /api/landing-pages/` (TTL: 60s)
-   `GET /api/landing-pages/{id}` (TTL: 60s)
-   `GET /api/admin/users` (TTL: 60s)
-   `GET /api/admin/system/stats` (TTL: 300s)
-   `GET /api/v1/inventory/products` (TTL: 300s)
