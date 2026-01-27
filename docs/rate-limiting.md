# Rate Limiting & DDoS Protection (IPO-054)

> **Binh Pháp Principle:** "The expert in defense hides in the most secret recesses of the earth." (Ch.4 形)

## Overview

The Rate Limiting system provides a multi-layered defense mechanism to protect the API from abuse, DDoS attacks, and noisy neighbors. It uses Redis for distributed state management and supports multiple algorithms (Sliding Window, Token Bucket, Fixed Window).

## Architecture

The system implements a 3-layer defense strategy:

1.  **Layer 1: Global IP Limit (DDoS Protection)**
    *   **Scope:** All incoming requests.
    *   **Limit:** 100 requests / minute per IP.
    *   **Purpose:** Mitigate basic flooding attacks from single sources.

2.  **Layer 2: User-Based Limit (Fair Usage)**
    *   **Scope:** Authenticated requests only.
    *   **Limit:** 1000 requests / hour per user.
    *   **Purpose:** Ensure fair resource allocation among users.

3.  **Layer 3: Endpoint-Specific Limits (Critical Path)**
    *   **Scope:** Specific sensitive endpoints (e.g., login, payment).
    *   **Limit:** Custom per endpoint (e.g., Login: 5/min).
    *   **Purpose:** Protect sensitive operations from brute force and abuse.

## Configuration

Configuration is managed via `backend/config/rate_limits.yaml`.

```yaml
rate_limits:
  global:
    ip_limit: 100
    ip_window: 60
    user_limit: 1000
    user_window: 3600

  endpoints:
    /api/auth/login:
      enabled: true
      limit: 5
      window_seconds: 60
      algorithm: sliding_window

    /api/payment/*:
      limit: 10
      window_seconds: 60
```

## Algorithms

*   **Sliding Window (Default):** Smooths traffic bursts, preventing "double dipping" at window boundaries. Best for most API endpoints.
*   **Token Bucket:** Allows for bursts of traffic while maintaining a steady average rate. Good for file uploads or heavy processing.
*   **Fixed Window:** Simple counters reset at fixed intervals. Lowest overhead but susceptible to boundary spikes.

## Headers

Responses include standard rate limit headers:

*   `X-RateLimit-Limit`: The limit applied to the request.
*   `X-RateLimit-Remaining`: (Optional) Remaining requests in the window.
*   `X-RateLimit-Reset`: Unix timestamp when the limit resets.
*   `Retry-After`: Seconds to wait before retrying (on 429).
*   `X-RateLimit-Type`: The type of limit that was applied (e.g., `global_ip`, `endpoint`).

## Monitoring & Admin

*   **Admin Endpoint:** `GET /api/admin/rate-limit-status`
    *   Returns Redis connection health and service status.
*   **Metrics:** Rate limit hits are logged as warnings for analysis.

## Emergency & Degradation

*   **Redis Failure:** If Redis is unavailable, the middleware "fails open" (allows requests) to prevent blocking legitimate traffic, while logging the error.
*   **Disabling:** Rate limiting can be globally disabled via `ENABLE_RATE_LIMITING=False` in `settings.py`.

## Developer Guide

To add rate limiting to a new sensitive endpoint:

1.  Open `backend/config/rate_limits.yaml`.
2.  Add a new entry under `endpoints`.
3.  Deploy. No code changes required.

```yaml
    /api/new-sensitive-endpoint:
      limit: 50
      window_seconds: 60
```
