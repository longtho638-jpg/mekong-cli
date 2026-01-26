# API Design Guidelines

This starter kit follows industry standard best practices for REST API design.

## 1. Response Format

All responses follow a standard envelope structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## 2. HTTP Status Codes

We use semantic HTTP codes:

- `200 OK`: Successful GET, PATCH, PUT
- `201 Created`: Successful POST
- `400 Bad Request`: Validation failure
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side exception

## 3. Authentication

We use Bearer Token authentication (JWT).

**Header:**
`Authorization: Bearer <access_token>`

**Refresh Flow:**
Access tokens are short-lived (15m). Use the `/refresh-token` endpoint with your long-lived refresh token to get a new access token without re-logging in.

## 4. Caching

We implement HTTP caching headers and server-side Redis caching.

- GET requests are cached based on URL.
- `X-Cache` header indicates `HIT` or `MISS`.
- Cache invalidation strategies should be implemented in services when data updates.

## 5. Rate Limiting

- **Global Limit:** 100 requests per minute per IP/User.
- **Auth Limit:** 10 login attempts per hour.
- Headers returned:
  - `RateLimit-Limit`
  - `RateLimit-Remaining`
  - `RateLimit-Reset`

## 6. Versioning

API is versioned via URL prefix: `/api/v1/`.
Breaking changes require a new version (v2).
