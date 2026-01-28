# DDoS Protection Strategy

Agency OS employs a defense-in-depth approach to mitigate Distributed Denial of Service (DDoS) attacks.

## 1. Automated IP Blocking (Auto-Ban)

The system monitors rate limit violations in real-time.

*   **Trigger:** If an IP address exceeds the rate limit violation threshold (default: 50 violations in 5 minutes).
*   **Action:**
    1.  The IP is added to the `IpBlocklist` (Database).
    2.  The IP is cached in Redis with a TTL (default: 1 hour).
    3.  `RateLimitMiddleware` (Layer 0) rejects all subsequent requests from this IP with `403 Forbidden`.
*   **Recovery:** The block automatically expires after the duration (TTL), or can be manually removed via the Admin UI.

## 2. Global Rate Limiting

A strict global rate limit applies to all IPs, regardless of the endpoint being accessed. This acts as a safety net against volumetric attacks that target random or multiple endpoints to bypass specific limits.

*   **Default:** 100 requests per minute per IP.
*   **Configuration:** `backend/config/rate_limits.yaml` -> `global.ip_limit`.

## 3. Challenge-Response (CAPTCHA)

For high-risk endpoints (e.g., Login, Registration, Password Reset), a CAPTCHA challenge can be enforced.

*   **Service:** `backend/services/captcha_service.py`
*   **Provider:** Supports hCaptcha or reCAPTCHA (configurable via environment variables).
*   **Integration:** Endpoints should verify the `X-Captcha-Token` header or body field using `captcha_service.verify_token()`.

## 4. Architecture Resilience

*   **Redis Backend:** Rate limiting logic is offloaded to Redis (using Lua scripts for atomicity), ensuring the application server (FastAPI) isn't bogged down by locking contention.
*   **Fail-Open Design:** If Redis becomes unavailable, the rate limiter defaults to "allow" (fail-open) to prevent a denial of service for legitimate users due to infrastructure faults (unless strict mode is enabled).
*   **Async Processing:** Violation logging and monitoring are non-blocking operations.

## Incident Response Plan

In the event of a detected attack:

1.  **Monitor:** Check the **Rate Limits Dashboard** in the Admin UI for spike in violations.
2.  **Identify:** Look at **Top Violators** to find attacking IPs.
3.  **Block:**
    *   The system should auto-block attackers.
    *   Manually block persistent attackers via the **Blocked IPs** page.
4.  **Escalate:**
    *   If the attack overwhelms the application layer, enable Cloudflare "Under Attack" mode (if applicable).
    *   Scale up API replicas.
    *   Lower the global rate limits in `rate_limits.yaml` and redeploy.

## Future Enhancements

*   **Geographic Blocking:** Block traffic from countries irrelevant to the business.
*   **JA3 Fingerprinting:** Block clients based on TLS fingerprint anomalies (bot detection).
