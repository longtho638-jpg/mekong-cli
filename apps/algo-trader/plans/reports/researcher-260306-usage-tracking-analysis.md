# Usage Tracking in Algo-Trader — Research Report

## Existing Usage Tracking Code

### 1. LicenseUsageAnalytics (`src/lib/license-usage-analytics.ts`)
- **Tracker class** with singleton pattern
- **Tracks:** API calls, ML predictions, data points per tenant
- **In-memory storage** only (no persistence)
- **Methods:** `trackApiCall()`, `trackMLPrediction()`, `trackDataPoints()`
- **Limitations:** No database persistence, events stored in memory only (max 10,000)

### 2. UsageQuotaService (`src/lib/usage-quota.ts`)
- **Redis-backed** usage tracking with memory fallback
- **Quota limits by tier:**
  - FREE: 1,000 calls/month
  - PRO: 10,000 calls/month
  - ENTERPRISE: 100,000 calls/month
- **Features:**
  - Monthly period tracking (YYYY-MM)
  - Redis `INCR` with TTL expiry
  - Alert thresholds at 80%, 90%, 100%
  - `requireQuotaMiddleware()` for rate limiting
- **Headers exposed:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Percent-Used`

## Database Schema

### CurrentUsage Tables (Prisma Schema)

```
licenses
├── id (cuid)
├── key (unique)
├── tier (FREE | PRO | ENTERPRISE)
├── tenantId (optional)
├── status (active, revoked, expired)
├── expiresAt (datetime)
├── metadata (json)
├── revokedAt, revokedBy
└── createdAt, updatedAt

license_audit_logs
├── id (auto-increment)
├── licenseId (FK)
├── event (created, activated, revoked, validated, expired)
├── tier (optional)
├── ip (optional)
├── metadata (json)
└── createdAt

tenants (existing)
├── tier (FREE | PRO | ENTERPRISE)
├── maxStrategies, maxDailyLossUsd, maxPositionUsd
└── allowedExchanges
```

**Missing:** No dedicated `usage_records` table for API call tracking in database.

## Stripe Billing Integration

### Stripe Webhook Handler (`src/billing/stripe-webhook-handler.ts`)
- **Events handled:**
  - `checkout.session.completed` → provisions subscription
  - `customer.subscription.created/active` → activates tier
  - `customer.subscription.updated` → updates tier
  - `customer.subscription.deleted` → deactivates
  - `invoice.payment_succeeded/failed` → logs payments

- **No metered billing integration** — uses fixed tier products only
- **No Stripe-metered billing API** calls (`usage_record`/`usage_record_summary`)

### PolarSubscriptionService (`src/billing/polar-subscription-service.ts`)
- Maps Polar products → internal tiers
- **Memory-only subscription tracking** (no DB persistence)
- `activateSubscription()`, `deactivateSubscription()` — no audit logging

## Gaps for Phase 4: Usage Metering & Billing

### Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **No database persistence** for usage records | Data lost on restart | P0 |
| **No Stripe metered billing** integration | Can't track per-use pricing | P0 |
| **No `license_usage_records` table** | No historical tracking | P0 |
| **Polar no usage reporting** | Cannot show usage to users | P1 |
| **UsageQuota uses Redis only** | Single point of failure | P2 |

### Required for Phase 4

1. **Database Schema:**
   ```
   license_usage_records (
     id, licenseId, eventType, count, timestamp
   )
   subscription_usage (
     id, subscriptionId, meteredMetric, usage, period
   )
   ```

2. **Stripe Metered Billing:**
   - Create usage records via `stripe.usageRecords.create()`
   - Query usage summaries for billing

3. **Usage Sync:**
   - Daily usage export to Polar/Stripe
   -lew quota reset handling
   - Alert notifications at threshold levels

### Existing Infrastructure to Reuse

- `UsageQuotaService.increment()` — can add DB persistence
- `LicenseUsageAnalytics.logEvent()` — event structure ready
- Webhook audit logger — idempotency pattern works

### No Existing Code For

- Stripe metered billing usage records
- Usage data persistence to PostgreSQL
- Usage reporting dashboard endpoints
- Per-license usage history queries

Unresolved Questions:
- Should usage tracking be sync (during API calls) or async (via queue)?
- Which metered metrics need tracking? (API calls, ML predictions, data points, trades?)
- Polar.sh supports metered billing — should we use their API or Stripe's?
