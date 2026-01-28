# CDN Integration Guide

## Overview
We use Cloudflare as our Content Delivery Network (CDN) to serve static assets and cache public API responses at the edge.

## Configuration
Configuration file: `backend/config/cdn_config.yaml`

### Environment Variables
- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_API_TOKEN`
- `DOMAIN_NAME`

## Caching Rules

### Static Assets
- **Path**: `/static/*`, `/*.js`, `/*.css`
- **Cache Level**: Aggressive
- **Edge TTL**: 1 year
- **Browser TTL**: 1 year
- **Header**: `Cache-Control: public, max-age=31536000, immutable`

### Public API
- **Path**: `/api/v1/public/*`
- **Cache Level**: Standard
- **Edge TTL**: 5 minutes
- **Browser TTL**: 5 minutes
- **Header**: `Cache-Control: public, max-age=300, stale-while-revalidate=60`

## Purge API
We support automated purging via Webhooks or the Admin Dashboard.

### Triggers
1. **Deployment**: Purges static assets cache.
2. **Content Update**: Purges specific API endpoints.

### Manual Purge
Via Admin Dashboard > Cache > Purge.

## Best Practices
1. **Versioning**: Always use content hashes in filenames (e.g., `main.a1b2c3.js`).
2. **Vary Header**: Use `Vary: Accept-Encoding` to serve Gzip/Brotli correctly.
3. **Stale-While-Revalidate**: Allow serving stale content while fetching fresh data in background.
