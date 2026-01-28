# Rate Limiting Guide

This guide details the rate limiting architecture implemented in the Agency OS backend to protect against abuse, ensure fair usage, and mitigate DDoS attacks.

## Architecture

The rate limiting system is designed with a multi-layer defense strategy (Ch.4 形 - Tactical Dispositions):

1.  **Layer 0: IP Blocklist (Global Defense)**
    *   **Mechanism:** Checks every request IP against a Redis-cached blocklist.
    *   **Action:** Immediate 403 Forbidden if blocked.
    *   **Management:** IPs can be blocked manually via Admin UI or automatically by the DDoS protection system.

2.  **Layer 1: Global IP Rate Limit (DDoS Protection)**
    *   **Mechanism:** Limits the total number of requests from a single IP address across all endpoints.
    *   **Limit:** Configurable (default: 100 requests/minute).
    *   **Goal:** Prevent simple volumetric attacks.

3.  **Layer 2: User Rate Limit (Fair Usage)**
    *   **Mechanism:** Limits requests per authenticated user, regardless of IP.
    *   **Limit:** Configurable (default: 1000 requests/hour).
    *   **Goal:** Prevent account takeover attempts and API abuse by valid users.

4.  **Layer 3: Endpoint-Specific Limits (Granular Control)**
    *   **Mechanism:** Specific limits for high-risk or resource-intensive endpoints.
    *   **Algorithms:**
        *   **Sliding Window (Default):** Smooth rate limiting, prevents boundary bursts.
        *   **Token Bucket:** Allows short bursts but enforces long-term rate.
        *   **Fixed Window:** Simple counter (efficient but allows boundary bursts).

## Configuration

Rate limits are configured in `backend/config/rate_limits.yaml`.

```yaml
rate_limits:
  global:
    ip_limit: 100
    ip_window: 60      # 1 minute
    user_limit: 1000
    user_window: 3600  # 1 hour

  endpoints:
    /api/auth/login:
      limit: 5
      window_seconds: 60
      algorithm: sliding_window

    /api/v1/public/*:
      limit: 20
      window_seconds: 60
```

## Headers

The API responds with standard rate limit headers:

*   `X-RateLimit-Limit`: The limit applied to the request.
*   `X-RateLimit-Remaining`: The number of requests left in the current window.
*   `X-RateLimit-Reset`: Unix timestamp when the limit resets.
*   `Retry-After`: Seconds to wait before retrying (sent on 429 responses).
*   `X-RateLimit-Type`: The type of limit that was hit (e.g., `global_ip`, `endpoint`).

## Implementation Details

### Algorithms

*   **Sliding Window (Redis ZSET):** Most accurate. Uses a sorted set to store timestamps of requests. Counts elements within the window `[now - window, now]`.
*   **Token Bucket (Redis Hash):** Good for burst tolerance. Maintains a bucket of tokens that refills at a constant rate.
*   **Fixed Window (Redis String):** Most efficient. Simple `INCR` on a key like `ip:timestamp_bucket`.

### Services

*   `RateLimiterService`: Facade for checking limits against Redis.
*   `IpBlocker`: Manages blocked IPs (Redis + DB persistence).
*   `RateLimitMonitor`: Logs violations and triggers auto-blocking.
*   `RateLimitMiddleware`: Intercepts HTTP requests and applies the logic.

## Admin Management

Admins can manage rate limits via the dashboard:

*   **View Status:** Check current usage for a key.
*   **Reset Limits:** Clear limits for a user/IP.
*   **Block/Unblock IPs:** Manually manage access.
*   **View Violations:** Monitor recent 429 errors.
