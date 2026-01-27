# Configuration

## Backend Configuration

The backend is configured via environment variables (or a `.env` file in the `backend/` directory).

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Hostname of the Redis server. |
| `REDIS_PORT` | `6379` | Port of the Redis server. |
| `REDIS_DB` | `0` | Redis Database index. |
| `REDIS_PASSWORD` | `None` | Redis Password (optional). |
| `PROJECT_NAME` | `API Rate Limiter` | Name of the project (Swagger UI). |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins for the dashboard. |

### Adding Rules via API

You can configure rate limit rules dynamically via the Dashboard or API.

**Rule Object:**
```json
{
  "path": "/api/v1/resource",
  "method": "GET",
  "limit": 100,
  "window": 60,
  "strategy": "fixed"
}
```

- **path**: The URL path pattern.
- **method**: HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `*`).
- **limit**: Maximum number of requests allowed.
- **window**: Time window in seconds.
- **strategy**:
  - `fixed`: Fixed Window (Standard)
  - `sliding`: Sliding Window (Smoother)
  - `token_bucket`: Token Bucket (Allows bursts)

## Dashboard Configuration

The dashboard is configured via environment variables (or `.env` in `dashboard/`).

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:8000` | URL of the backend API. |

## Strategy Comparison

| Strategy | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Fixed Window** | Low memory, very fast. | "Double burst" at boundary edges. | General API protection, strict quotas. |
| **Sliding Window** | Smooth rate limiting, accurate. | Slightly higher Redis memory (ZSET). | Precise rate limiting, strict SLAs. |
| **Token Bucket** | Allows bursts, replenishes steady. | Complex to reason about for users. | File uploads, "bursty" traffic patterns. |
