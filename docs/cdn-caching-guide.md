# CDN and Caching Guide

## Overview

This infrastructure uses a multi-layer caching strategy to ensure sub-second load times and high availability:

1.  **Edge Cache (Cloudflare)**: Caches static assets (images, CSS, JS) and HTML pages where appropriate.
2.  **Browser Cache**: Controlled via `Cache-Control` headers.
3.  **Application Cache (Redis)**: Caches expensive API responses and database queries.

## Configuration

### CDN (Cloudflare)

Configuration is managed via Terraform in `terraform/cdn/cloudflare.tf`.

**Key Page Rules:**
- `/static/*`: Cache Everything (1 year)
- `/images/*`: Cache Everything (1 year)
- `/api/*`: Bypass Cache (Relies on Origin Headers)

### Backend Caching

The backend uses `CacheControlMiddleware` to inject appropriate headers.

**Header Rules:**
- Static Assets: `public, max-age=31536000, immutable`
- Public API (read-only): `public, max-age=3600, stale-while-revalidate=600`
- Private/Dynamic API: `no-store, no-cache, must-revalidate`

### Redis Caching

Use the `CacheService` or `@cached` decorator for expensive operations.

```python
from backend.services.cache_service import cached

@router.get("/expensive-data")
@cached(ttl=300)
async def get_expensive_data():
    return perform_complex_calculation()
```

## Operations

### Purging Cache

Use the `purge-cache.sh` script to invalidate Cloudflare cache.

```bash
# Purge Everything (Use with caution)
./scripts/cdn/purge-cache.sh all

# Purge Specific URLs
./scripts/cdn/purge-cache.sh urls https://mekong-cli.com/page1 https://mekong-cli.com/static/style.css

# Purge by Tag
./scripts/cdn/purge-cache.sh tags product-list marketing-assets
```

### Monitoring

Check the Grafana dashboard "CDN & Performance" for:
- Cache Hit Rate (Target: >80%)
- Origin Latency
- Bandwidth Saved

## Troubleshooting

**Content not updating?**
1. Check browser cache (Hard refresh `Cmd+Shift+R`).
2. Check Cloudflare cache status (Inspect headers: `CF-Cache-Status`).
3. Run purge script for the specific URL.

**API returning stale data?**
1. Check `Cache-Control` headers.
2. Verify Redis cache TTL.
3. Purge Redis key if necessary.
