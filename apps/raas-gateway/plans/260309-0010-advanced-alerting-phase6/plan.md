# Phase 6: Advanced Usage Enforcement & Alerting

**Created:** 2026-03-09
**Status:** ✅ Complete
**Priority:** High

---

## Overview

Build real-time webhook alert system that triggers external notifications when usage thresholds (80%, 95%) are crossed per license key, integrated with Stripe/Polar billing metadata.

---

## Requirements

1. **Threshold Alerts** - 80% warning, 95% critical, 100% exceeded
2. **Stripe/Polar Integration** - Include billing metadata in alerts
3. **Quota Headers** - X-Quota-Limit, X-Quota-Remaining, X-Quota-Reset
4. **Idempotency** - Prevent duplicate alerts via rate limiting
5. **Retryable** - Retry failed webhooks with exponential backoff (3 retries)
6. **Dashboard Logging** - Log alerts to ALERT_LOGS_KV for analytics

---

## Implementation Plan

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Enhance quota-alert-webhook.js | ✅ Done |
| 2 | Add idempotency key generation | ✅ Done |
| 3 | Implement retry logic with backoff | ✅ Done |
| 4 | Add Stripe/Polar metadata integration | ✅ Done |
| 5 | Update quota headers in responses | ✅ Done |
| 6 | Create alert log storage | ✅ Done |
| 7 | Integration testing | ✅ Done |

---

## Architecture

```
Usage Event → Quota Check → Threshold Crossed?
                           ↓
                    Generate Alert ID (idempotent)
                           ↓
                    Send Webhook (retry 3x)
                           ↓
                    Log to ALERT_LOGS_KV
```

---

## Files Modified

- `src/quota-alert-webhook.js` - Enhanced with retry, idempotency, logging
- `index.js` - Added X-Quota-* headers to all responses
- `wrangler.toml` - Added ALERT_LOGS_KV namespace

---

## Features Implemented

### Thresholds
- **80%** → `quota_warning` webhook
- **95%** → `quota_critical` webhook (NEW)
- **100%** → `quota_exceeded` webhook + 429 block

### Response Headers
```
X-Quota-Limit: 10000
X-Quota-Remaining: 2500
X-Quota-Reset: 172800
X-Quota-Used-Percent: 75
```

### Idempotency
- Unique alert ID: `alert_{licenseKey}_{threshold}_{timestamp}`
- Rate limiting: 1 alert per hour per threshold
- Idempotency headers: `X-Alert-Id`, `X-Idempotency-Key`

### Retry Logic
- 3 retries with exponential backoff
- Delays: 1s, 2s, 4s (capped at 5s)
- Failed alerts logged to dashboard

### Stripe/Polar Integration
```json
{
  "billing": {
    "stripeCustomerId": "cus_abc123",
    "polarProductId": "pol_xyz789",
    "subscriptionId": "sub_123456",
    "planName": "pro",
    "currency": "USD",
    "currentPeriodStart": "2026-03-01T00:00:00Z",
    "currentPeriodEnd": "2026-04-01T00:00:00Z"
  }
}
```

---

## Success Criteria

- [x] Alerts fire at 80%/95%/100% thresholds
- [x] Idempotency prevents duplicates
- [x] Retry logic with exponential backoff
- [x] Stripe/Polar metadata included
- [x] Quota headers in all responses
- [x] Alerts logged to dashboard KV

---

## Report Path

`plans/reports/advanced-alerting-260309-0010-summary.md`
