# Advanced Webhook Infrastructure Guide

This document details the advanced webhook capabilities of Mekong CLI, including retries, security, and observability.

## 1. Retry Logic & Reliability

We employ a robust retry mechanism to ensure event delivery.

- **Policy**: Exponential Backoff with Jitter
- **Schedule**: ~1s, ~2s, ~4s, ~8s, ~16s (Default 5 attempts)
- **Circuit Breaker**: Stops delivery to an endpoint after 5 consecutive failures. Resets after 60s cooldown.
- **Dead Letter Queue (DLQ)**: Events failed after max retries are moved to DLQ for manual inspection and replay.

## 2. Security & Signatures

All webhooks are signed to verify authenticity.

### Verification Example (Python)

```python
import hmac
import hashlib

def verify_signature(payload_body, secret, signature_header):
    # Header format: t=123456,v1=abcdef...
    parts = dict(x.split('=') for x in signature_header.split(','))
    timestamp = parts['t']
    signature = parts['v1']

    # Verify timestamp (prevent replay)
    if time.time() - int(timestamp) > 300:
        return False

    # Re-compute HMAC
    expected = hmac.new(
        key=secret.encode(),
        msg=payload_body.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)
```

## 3. Idempotency

To achieve exactly-once processing, use the `Idempotency-Key` header.
- **Header**: `Idempotency-Key: <UUID>`
- **Behavior**: If you receive the same key within 24 hours, treat it as a duplicate.

## 4. Transformations

You can customize the payload using Jinja2 templates in the webhook configuration.

**Example Template:**
```json
{
  "action": "{{ event.type }}",
  "customer_id": {{ event.data.user_id }},
  "timestamp": "{{ event.created_at }}"
}
```

## 5. Admin Dashboard

- **DLQ**: View failed events at `/dashboard/webhooks/dlq`. You can replay or discard them.
- **Health**: Monitor uptime and latency at `/dashboard/webhooks/health`.

## 6. Rate Limiting

Each endpoint has a token bucket rate limiter.
- Default: 10 requests/second
- Burst: 50 requests
