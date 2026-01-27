# API Reference

The Rate Limiter Kit provides a management API to configure rules programmatically.

## Base URL
`http://localhost:8000`

## Rules Management

### List all Rules
`GET /api/v1/admin/rules/`

**Response:**
```json
[
  {
    "path": "/api/v1/users",
    "method": "GET",
    "limit": 100,
    "window": 60,
    "strategy": "fixed"
  }
]
```

### Create/Update Rule
`POST /api/v1/admin/rules/`

**Body:**
```json
{
  "path": "/api/v1/users",
  "method": "GET",
  "limit": 100,
  "window": 60,
  "strategy": "fixed"
}
```

### Get Specific Rule
`GET /api/v1/admin/rules/{method}/{path}`

**Example:** `GET /api/v1/admin/rules/GET/api/v1/users`

### Delete Rule
`DELETE /api/v1/admin/rules/{method}/{path}`

## Rate Limit Headers

When a request is processed by the middleware, the following headers are added to the response:

- `X-RateLimit-Limit`: The limit applied to the request.
- `X-RateLimit-Remaining`: The number of requests remaining in the current window.
- `X-RateLimit-Reset`: The Unix timestamp when the limit resets.

**If the limit is exceeded (HTTP 429):**
- `Retry-After`: Seconds to wait before retrying.
