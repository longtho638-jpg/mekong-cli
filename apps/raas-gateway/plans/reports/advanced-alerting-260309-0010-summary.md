# Phase 6: Advanced Usage Enforcement & Alerting - Summary

**Date:** 2026-03-09
**Status:** ✅ Implementation Complete

---

## Overview

Enhanced RaaS Gateway với hệ thống webhook alerts thông minh cho quota enforcement, tích hợp Stripe/Polar billing metadata, retry logic, và dashboard logging.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/quota-alert-webhook.js` | Enhanced with retry, idempotency, logging, 95% threshold |
| `index.js` | Added X-Quota-* headers, billing metadata integration |
| `wrangler.toml` | Added ALERT_LOGS_KV namespace |

---

## Features Implemented

### 1. Multi-Level Threshold Alerts

| Threshold | Alert Type | Action |
|-----------|-----------|--------|
| 80% | `quota_warning` | Webhook notification |
| 95% | `quota_critical` | Urgent webhook notification |
| 100% | `quota_exceeded` | Webhook + 429 block |

### 2. Idempotency & Rate Limiting

- **Alert ID Format:** `alert_{licenseKey}_{threshold}_{timestamp}`
- **Rate Limit:** 1 alert per hour per threshold per license key
- **Headers:** `X-Alert-Id`, `X-Idempotency-Key` sent with webhooks

### 3. Retry Logic with Exponential Backoff

```javascript
Retries: 3 attempts
Delays: 1s → 2s → 4s (capped at 5s)
```

Failed webhooks after all retries are logged to dashboard with `delivered: false`.

### 4. Stripe/Polar Billing Metadata

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

### 5. Quota Response Headers

All `/v1/*` responses include:

```
X-Quota-Limit: 10000
X-Quota-Remaining: 2500
X-Quota-Reset: 172800
X-Quota-Used-Percent: 75
```

### 6. Dashboard Alert Logging

Alerts logged to `ALERT_LOGS_KV` with 30-day TTL:

```json
{
  "alertId": "alert_mk_abc_80_20260309000000",
  "licenseKey": "mk_abc123",
  "eventType": "quota_warning",
  "threshold": 80,
  "timestamp": "2026-03-09T00:00:00Z",
  "status": { ... },
  "metadata": { ... },
  "billing": { ... },
  "delivered": true
}
```

---

## Webhook Payload Structure

```json
{
  "eventType": "quota_warning",
  "alertId": "alert_mk_abc_80_20260309000000",
  "licenseKey": "mk_abc123",
  "threshold": 80,
  "timestamp": "2026-03-09T00:00:00Z",
  "status": {
    "monthlyUsagePercent": 80,
    "dailyUsagePercent": 75,
    "hourlyUsagePercent": 60,
    "isOverQuota": false,
    "exceededLimits": [],
    "remaining": 2000,
    "limit": 10000,
    "resetAt": "2026-04-01T00:00:00Z"
  },
  "metadata": {
    "tier": "pro",
    "monthlyLimit": 10000,
    "monthlyUsed": 8000,
    "overageAllowed": true,
    "overageRate": 0.001
  },
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

## Deployment Instructions

### 1. Create ALERT_LOGS_KV Namespace

```bash
cd /Users/macbookprom1/mekong-cli/apps/raas-gateway
wrangler kv:namespace create "ALERT_LOGS_KV"
```

### 2. Update wrangler.toml

Replace placeholder ID:
```toml
[[kv_namespaces]]
binding = "ALERT_LOGS_KV"
id = "YOUR_ACTUAL_ID_HERE"
preview_id = "YOUR_ACTUAL_ID_HERE"
```

### 3. Deploy

```bash
wrangler deploy
```

---

## API Integration Examples

### Webhook Receiver (AgencyOS)

```javascript
app.post('/webhooks/raas/quota-alert', (req, res) => {
  const { eventType, alertId, licenseKey, threshold, status, billing } = req.body;

  // Check idempotency
  if (seenAlerts.has(alertId)) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Process alert
  if (eventType === 'quota_exceeded') {
    // Block user, send email, etc.
  } else if (eventType === 'quota_critical') {
    // Send urgent notification
  } else if (eventType === 'quota_warning') {
    // Send warning email
  }

  // Log to database
  await db.alerts.create({ alertId, licenseKey, eventType, threshold, ... });

  seenAlerts.add(alertId);
  res.status(200).json({ received: true });
});
```

### Client-Side Quota Monitoring

```javascript
// Check quota headers in response
const response = await fetch('https://raas.agencyos.network/v1/usage');
const quotaLimit = response.headers.get('X-Quota-Limit');
const quotaRemaining = response.headers.get('X-Quota-Remaining');
const quotaReset = response.headers.get('X-Quota-Reset');
const quotaUsedPercent = response.headers.get('X-Quota-Used-Percent');

console.log(`Usage: ${quotaUsedPercent}% - ${quotaRemaining} requests remaining`);
```

---

## Testing Checklist

- [ ] Deploy worker successfully
- [ ] Verify X-Quota-* headers present in responses
- [ ] Test 80% threshold alert fires
- [ ] Test 95% critical alert fires
- [ ] Test 100% block + alert
- [ ] Verify idempotency (no duplicate alerts within hour)
- [ ] Verify retry logic (simulate webhook failure)
- [ ] Check ALERT_LOGS_KV for logged alerts
- [ ] Verify Stripe/Polar metadata in payloads

---

## Security Considerations

1. **Idempotency Keys** - Prevent duplicate webhook processing
2. **Retry Limits** - Prevent infinite retry loops (max 3)
3. **Rate Limiting** - 1 alert per hour per threshold
4. **Auth Headers** - Bearer token required for webhooks

---

## Unresolved Questions

None. Implementation complete and ready for deployment.
