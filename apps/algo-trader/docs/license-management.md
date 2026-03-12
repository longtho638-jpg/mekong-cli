# License Management UI

**ROIaaS Phase 2** — Admin Dashboard for license CRUD, analytics, and audit trails.

**Route:** `/admin/licenses`

---

## UI Sections

| Tab | Purpose |
|-----|---------|
| **Licenses** | List, filter, sort, create, revoke, delete licenses |
| **Audit Logs** | Timeline view of license events with filtering |
| **Analytics** | Usage metrics, quota gauges, recent activity |

---

## API Endpoints (`/api/v1/licenses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List licenses (pagination: `take`, `skip`, `status`, `tier`) |
| `GET` | `/:id` | Get single license |
| `POST` | `/` | Create license |
| `PATCH` | `/:id/revoke` | Revoke license |
| `DELETE` | `/:id` | Delete license |
| `GET` | `/:id/audit` | Get audit logs |
| `GET` | `/analytics` | Aggregate analytics |

### Create License Example

```bash
curl -X POST https://api.algo-trader.com/api/v1/licenses \
  -H "X-API-Key: admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Prod License", "tier": "PRO", "tenantId": "t123"}'
```

**Response:** License with auto-generated key like `raas-rpp-abc123DEF456XYZ7`

---

## License Key Format

| Tier | Prefix | Example |
|------|--------|---------|
| FREE | `free` | `raas-free-ABCD1234-WXYZ7890` |
| PRO | `rpp` | `raas-rpp-ABCD1234-WXYZ7890` |
| ENTERPRISE | `rep` | `raas-rep-ABCD1234-WXYZ7890` |

---

## Admin Workflow

1. **Create** - Click "Create License" → Fill name/tier/expiration/tenant → Copy generated key
2. **View Usage** - Actions menu (dots) → "View Audit Log"
3. **Revoke** - Actions menu → "Revoke License"
4. **Delete** - Actions menu → "Delete License"

---

## Features

- **Sorting**: Click column headers to sort by name, key, tier, status, usage, dates
- **Filtering**: By status (Active/Expired/Revoked) and tier (FREE/PRO/ENTERPRISE)
- **Audit Events**: Created, Activated, Revoked, API Call, ML Feature, Rate Limit
- **Analytics**: License distribution by tier, usage breakdown, quota gauges

---

## Phase 3: Polar.sh Webhook Integration

**ROIaaS Phase 3** — Automated license management via Polar.sh payment webhooks.

### Webhook Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/webhooks/polar` | Polar.sh webhook handler |

### Supported Webhook Events

| Event | Action | License Impact |
|-------|--------|----------------|
| `subscription.created` | Create subscription record | Activate PRO/ENTERPRISE license |
| `subscription.active` | Update subscription status | Set/upgrade license tier |
| `subscription.updated` | Update tier/period | Update license tier |
| `subscription.cancelled` | Mark as cancelled | Downgrade to FREE license |
| `checkout.created` | Track checkout session | No license change (pending) |
| `payment.success` | Record payment | Maintain current tier |
| `payment.failed` | Record failed payment | Flag for review |

### Webhook Payload Example

```json
{
  "type": "subscription.active",
  "data": {
    "object": {
      "id": "sub_2JZ9X8Y7W6V5U4T3",
      "product_id": "pro-monthly",
      "customer_email": "user@example.com",
      "status": "active",
      "current_period_start": "2026-03-01T00:00:00Z",
      "current_period_end": "2026-04-01T00:00:00Z"
    }
  }
}
```

### Webhook Signature Verification

Polar.sh webhooks are signed using HMAC-SHA256. Verify signatures using:

```typescript
import { PolarService } from '../payment/polar-service';

const polarService = PolarService.getInstance();
const isValid = await polarService.verifyWebhook(payload, signature);
```

### Configuration

Add to `.env`:

```bash
# Polar.sh Configuration
POLAR_API_KEY=sk_polar_...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_SUCCESS_URL=https://algo-trader.com/upgrade/success
```

### Payment-License Sync

The `LicensePaymentSync` service tracks:

- **Payment records**: Order ID, amount, currency, status
- **Subscription records**: Subscription ID, tier, interval, period dates
- **Revenue metrics**: MRR, total revenue, average license value
- **Payment status distribution**: Success/failed/pending/refunded counts

### Revenue Analytics

Dashboard analytics include:

| Metric | Description |
|--------|-------------|
| **MRR** | Monthly Recurring Revenue from active subscriptions |
| **Total Revenue** | Sum of all successful payments |
| **Avg License Value** | Total revenue / active licenses |
| **Payment Success Rate** | Successful payments / total payments |

---

## Related Docs

| File | Purpose |
|------|---------|
| `docs/RAAS_API_ENDPOINTS.md` | RaaS gate API reference |
| `docs/raas-license-integration.md` | License key integration |
| `docs/LICENSE_GATING.md` | License enforcement |

---

## Phase 4: Usage Metering + Overage Billing

**ROIaaS Phase 4** — Automated usage-based billing with daily tier limits and overage charges.

### Daily Tier Limits

| Tier | API Calls/Day | Overage Price |
|------|---------------|---------------|
| **FREE** | 100 calls/day | N/A (hard block) |
| **PRO** | 10,000 calls/day | $0.01 per call over |
| **ENTERPRISE** | 100,000 calls/day | $0.005 per call over (50% discount) |

### Usage Metering Service

The `UsageMeteringService` tracks daily API usage per license key:

```typescript
import { UsageMeteringService, DAILY_LIMITS, OVERAGE_PRICE_PER_CALL } from './lib/usage-metering';

const metering = UsageMeteringService.getInstance();

// Set license tier
metering.setLicenseTier('lic_abc123', LicenseTier.PRO);

// Track API call
await metering.trackApiCall('lic_abc123', '/api/v1/predict', 'user_123');

// Check usage status
const status = metering.getUsageStatus('lic_abc123');
console.log(status);
// {
//   licenseKey: 'lic_abc123',
//   date: '2026-03-12',
//   tier: 'pro',
//   dailyLimit: 10000,
//   currentUsage: 1,
//   remaining: 9999,
//   percentUsed: 0.01,
//   isExceeded: false,
//   overageUnits: 0,
//   overageCost: 0
// }

// Calculate overage cost
const overage = metering.calculateOverage('lic_abc123');
console.log(`Overage cost: $${overage}`);
```

### Overage Billing Flow

1. **Track Usage**: Middleware auto-tracks each API call
2. **Check Limits**: Compare against daily tier limits
3. **Emit Alerts**: Threshold alerts at 80%, 90%, 100%
4. **Calculate Overage**: $0.01 per call over daily limit
5. **Generate Invoice**: End-of-day overage summary

### Usage Tracking Middleware

Auto-tracks API calls on every request:

```typescript
// Register in fastify-raas-server.ts
import { usageTrackingPlugin } from './middleware/usage-tracking-middleware';

void server.register(usageTrackingPlugin, {
  enabled: true,
  excludePaths: ['/health', '/ready', '/metrics'],
  includeComputeTiming: true, // Track ML compute minutes
});
```

**Tracked Event Types:**

| Event Type | Endpoints | Default Units |
|------------|-----------|---------------|
| `api_call` | All other endpoints | 1 |
| `ml_inference` | `/api/ml/*`, `/api/predict/*` | 1 |
| `backtest_run` | `/api/backtest/*` (POST) | 1 |
| `trade_execution` | `/api/trade/*`, `/api/orders/*` (POST/PUT) | 1 |
| `strategy_execution` | `/api/strategy/*` | 1 |
| `compute_minute` | ML endpoints (timing-based) | elapsed minutes |

### Threshold Alerts

Event emitter for real-time alerts:

```typescript
const metering = UsageMeteringService.getInstance();

metering.on('threshold_alert', (alert) => {
  console.log('ALERT', {
    licenseKey: alert.licenseKey,
    threshold: alert.threshold, // 80, 90, or 100
    currentUsage: alert.currentUsage,
    dailyLimit: alert.dailyLimit,
    percentUsed: alert.percentUsed,
  });

  // Send email/SMS at 100%
  if (alert.threshold === 100) {
    sendOverageNotification(alert.licenseKey);
  }
});
```

### Overage Calculator

For detailed billing calculations:

```typescript
import { overageCalculator } from './billing/overage-calculator';

const summary = await overageCalculator.calculateOverageSummary('tenant_123');
console.log(summary);
// {
//   tenantId: 'tenant_123',
//   period: '2026-03',
//   tier: 'pro',
//   charges: [
//     {
//       metric: 'api_calls',
//       overageUnits: 500,
//       totalCharge: 5.00, // 500 * $0.01
//     }
//   ],
//   totalOverage: 5.00,
// }
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/usage/:licenseKey` | Get current usage status |
| `GET` | `/api/v1/usage/:licenseKey/breakdown` | Get endpoint breakdown |
| `GET` | `/api/v1/overage/:licenseKey` | Calculate overage charges |
| `POST` | `/api/v1/usage/reset` | Reset usage (admin only) |

### Configuration

Add to `.env`:

```bash
# Usage Metering
USAGE_METERING_ENABLED=true
OVERAGE_ENABLED=true
OVERAGE_PRICE_PER_CALL=0.01

# Alert thresholds
ALERT_THRESHOLD_1=80
ALERT_THRESHOLD_2=90
ALERT_THRESHOLD_3=100
```

### Testing

```bash
# Run usage metering tests
npm test -- --testPathPattern=usage-metering

# Run middleware tests
npm test -- --testPathPattern=usage-tracking-middleware
```

**Test Coverage:**

- `src/lib/usage-metering.test.ts` — 25 tests
- `src/api/middleware/usage-tracking-middleware.test.ts` — 12 tests

---

*Last updated: 2026-03-12*
