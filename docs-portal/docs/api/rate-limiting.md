---
sidebar_position: 2
---

# Rate Limiting

To ensure stability, the AgencyOS API implements rate limiting.

## Limits

| Tier | Requests / Hour | Burst |
|------|----------------|-------|
| Free | 1,000 | 50 |
| Pro | 10,000 | 500 |
| Enterprise | Custom | Custom |

## Headers

Check these headers in the response to monitor your usage:

- `X-RateLimit-Limit`: The maximum number of requests you're permitted to make per hour.
- `X-RateLimit-Remaining`: The number of requests remaining in the current rate limit window.
- `X-RateLimit-Reset`: The time at which the current rate limit window resets in UTC epoch seconds.

## Exceeding Limits

If you exceed the limit, you will receive a `429 Too Many Requests` response.

```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded your rate limit. Please try again in 58 seconds."
}
```
