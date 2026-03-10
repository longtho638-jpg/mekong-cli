# RaaS Quota Enforcement System

**Version:** 1.0.0
**Module:** `apps/raas-gateway/`

---

## Quick Start

### 1. Create KV Namespace

```bash
wrangler kv:namespace create "QUOTA_KV"
# Output: namespace id = "abc123..."
```

### 2. Update wrangler.toml

```toml
[[kv_namespaces]]
binding = "QUOTA_KV"
id = "abc123..."  # Replace with actual ID
preview_id = "abc123..."
```

### 3. Deploy

```bash
wrangler deploy
```

---

## System Overview

The Quota Enforcement System provides:

- **Real-time usage tracking** per mk_ API key
- **Configurable quotas** by tier (free/pro/enterprise)
- **Automated alerts** at 80%/100% thresholds
- **Hard enforcement** (429) when quota exceeded

### Request Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Auth      │ ← JWT / mk_ API Key
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Suspension  │ ← Check suspended status
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  QUOTA      │ ← NEW: Check quota (Phase 6)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Rate Limit  │ ← Per-minute limiting
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │
└─────────────┘
```

---

## Configuration

### Default Tier Limits

| Tier | Monthly Requests | Monthly Payload | Daily | Hourly | Overage |
|------|-----------------|-----------------|-------|--------|---------|
| free | 1,000 | 10MB | 100 | 20 | No |
| trial | 500 | 5MB | 50 | 10 | No |
| pro | 10,000 | 100MB | 1,000 | 100 | Yes ($0.001) |
| enterprise | 100,000 | 1GB | 10,000 | 1,000 | Yes ($0.0005) |
| service | ∞ | ∞ | ∞ | ∞ | N/A |

### Custom Quota Limits

Store custom limits via KV or webhook:

```javascript
import { storeQuotaLimits } from './src/kv-quota-enforcer.js';

const limits = {
  licenseKey: 'mk_abc123',
  tier: 'pro',
  monthlyRequests: 50000,  // Custom limit
  monthlyPayloadBytes: 524288000,  // 500MB
  overageAllowed: true,
  overageRate: 0.0005
};

await storeQuotaLimits(env, 'mk_abc123', limits);
```

---

## API Reference

### Response Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-Quota-Remaining` | Requests remaining | `2500` |
| `X-Quota-Reset` | Seconds until reset | `172800` |

### 429 Quota Exceeded Response

```json
{
  "error": "quota_exceeded",
  "reason": "Quota exceeded: monthly_requests",
  "resetIn": 172800
}
```

### /v1/auth/validate Response

```json
{
  "valid": true,
  "tenant_id": "tenant_123",
  "role": "pro",
  "quota": {
    "remaining": 2500,
    "monthlyUsagePercent": 75,
    "isNearQuota": false,
    "isOverQuota": false,
    "resetIn": 172800
  }
}
```

---

## Webhook Integration

### Alert Webhooks

System sends webhooks to `AGENCYOS_WEBHOOK_URL` when thresholds crossed.

#### 80% Warning

```json
{
  "eventType": "quota_warning",
  "licenseKey": "mk_abc123",
  "threshold": 80,
  "timestamp": "2026-03-09T00:00:00Z",
  "status": {
    "monthlyUsagePercent": 80,
    "dailyUsagePercent": 75,
    "hourlyUsagePercent": 60,
    "isOverQuota": false,
    "exceededLimits": [],
    "remaining": 2000
  },
  "metadata": {
    "tier": "pro",
    "monthlyLimit": 10000,
    "monthlyUsed": 8000,
    "overageAllowed": true,
    "overageRate": 0.001
  }
}
```

#### 100% Exceeded

```json
{
  "eventType": "quota_exceeded",
  "licenseKey": "mk_abc123",
  "threshold": 100,
  "timestamp": "2026-03-09T00:00:00Z",
  "status": {
    "monthlyUsagePercent": 100,
    "dailyUsagePercent": 100,
    "hourlyUsagePercent": 95,
    "isOverQuota": true,
    "exceededLimits": ["monthly_requests", "daily_requests"],
    "remaining": 0
  },
  "metadata": {
    "tier": "pro",
    "monthlyLimit": 10000,
    "monthlyUsed": 10000,
    "overageAllowed": true,
    "overageRate": 0.001
  }
}
```

### Alert Rate Limiting

- Max **1 alert per hour** per threshold per license key
- Prevents webhook spam during high traffic

---

## KV Storage

### Key Patterns

| Pattern | Value | TTL |
|---------|-------|-----|
| `quota:limits:{licenseKey}` | JSON QuotaLimit | None |
| `quota:daily:{key}:{YYYY-MM-DD}` | Integer count | 48h |
| `quota:hourly:{key}:{YYYY-MM-DD-HH}` | Integer count | 2h |
| `quota:alerts:{key}:{80\|100}:{YYYY-MM-DD-HH}` | Timestamp | 2h |

### Example KV Operations

```javascript
// Get current usage
const usage = await getUsageCounters(env, 'mk_abc123', 'pro');

// Check quota
const result = await checkQuota(env, 'mk_abc123', 'pro');
console.log(result.allowed);  // true/false
console.log(result.remaining);  // 2500

// Increment counters
await incrementUsage(env, 'mk_abc123', 1024);  // 1KB payload
```

---

## Troubleshooting

### Missing QUOTA_KV Binding

**Error:** `QUOTA_KV binding missing, skipping usage tracking`

**Fix:** Add namespace to `wrangler.toml` and redeploy.

### Quota Not Enforcing

**Check:**
1. License key format: Must start with `mk_`
2. KV namespace has correct ID
3. Usage tracking is called before quota check

### Webhooks Not Firing

**Check:**
1. `AGENCYOS_WEBHOOK_URL` set in wrangler.toml
2. `AGENCYOS_WEBHOOK_AUTH_TOKEN` configured
3. Alert rate limiting (1/hour) not blocking

### Incorrect Usage Counts

**Note:** Monthly usage aggregated from `RAAS_USAGE_KV`
Daily/hourly from `QUOTA_KV` - may have slight delay

---

## Stripe/Polar Integration

### Receiving Billing Updates

Create endpoint to receive webhook from Stripe/Polar:

```javascript
// Example: POST /webhooks/billing
app.post('/webhooks/billing', async (req, res) => {
  const { licenseKey, tier, limits } = req.body;

  await storeQuotaLimits(env, licenseKey, {
    licenseKey,
    tier,
    ...limits,
    billingPeriodStart: new Date().toISOString(),
    billingPeriodEnd: getPeriodEnd()
  });

  res.json({ success: true });
});
```

### Overage Billing

When `overageAllowed: true`, requests continue past 100% but are tracked for billing:

```javascript
// Track overage in RAAS_USAGE_KV
trackUsage(env, licenseKey, tenantId, role, endpoint, method, payloadSize);
```

Calculate overage charges at end of billing period:

```bash
GET /v1/overage/calculate?start_hour=2026-03-01-00&end_hour=2026-03-31-23
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AGENCYOS_WEBHOOK_URL` | Webhook destination URL | Yes |
| `AGENCYOS_WEBHOOK_AUTH_TOKEN` | Bearer token for auth | Yes |
| `QUOTA_KV` | KV namespace binding | Yes |
| `RAAS_USAGE_KV` | Usage metering namespace | Yes |

---

## Security

### Authentication

- All quota checks require valid mk_ API key
- JWT validation supported but optional
- Service accounts bypass quota (tier: service)

### Rate Limiting

- Separate from quota (per-minute vs per-period)
- Both must pass for request to proceed

### Fail-Open Policy

Quota system fails open on errors:
- KV errors → Allow request, log error
- Webhook errors → Continue, don't block
- Prevents accidental DoS

---

## Monitoring

### Metrics to Track

- `quota.remaining` - Remaining requests
- `quota.usage_percent` - Usage percentage
- `quota.alerts_sent` - Number of alerts triggered
- `quota.blocks` - Number of 429 responses

### Logging

```javascript
// Quota check
console.log(`Quota check: ${licenseKey} - ${remaining} remaining`);

// Alert sent
console.log(`Quota alert sent: ${licenseKey} at ${threshold}%`);

// Block
console.warn(`Quota exceeded: ${licenseKey} blocked`);
```

---

## Performance

### KV Operations

- Read latency: ~10-50ms
- Write latency: ~10-50ms
- Quota check: 2 KV reads (limits + usage)

### Optimization

- Daily/hourly counters cached in-memory (per-request)
- Monthly aggregated from existing usage metering
- Alert rate limiting prevents webhook overload

---

## Changelog

### v1.0.0 (2026-03-09)

- Initial implementation
- Default tier limits
- 80%/100% thresholds
- Webhook alerts
- KV-based storage
