# Phase 6: Overage Billing & Dunning Workflows - Implementation Plan

**Date:** 2026-03-10
**Status:** In Progress
**Priority:** Critical (Revenue Protection)

---

## Executive Summary

Phase 6 hoàn thiện hệ thống billing với:
1. **Overage Billing** - Charge customers for usage exceeding plan limits
2. **Dunning Workflows** - Automated payment failure handling with retry schedules
3. **KV Sync** - Real-time access control enforcement in RaaS Gateway
4. **Email Notifications** - Resend integration for billing alerts

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Phase 6 Billing Architecture                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     Usage Events     ┌────────────────────────────────┐
│  RaaS Gateway │ ───────────────────> │  Usage Tracker Service         │
│  (API Layer)  │                      │  - Tracks compute_minutes      │
└──────────────┘                      │  - Tracks api_calls            │
                                      └────────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Overage Metering Service                            │
│  - Calculates usage vs quota                                          │
│  - Detects overage (>100% usage)                                      │
│  - Stores state in KV (raas:overage_state:{licenseKey})              │
└──────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Overage Billing Emitter                             │
│  - Runs every 6 hours (cron)                                          │
│  - Syncs overage units to Stripe Usage Records API                   │
│  - Retry queue for failed emissions                                   │
└──────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │   Stripe Billing API   │
                                      │   - Usage Records      │
                                      │   - Metered Billing    │
                                      └────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Dunning State Machine                               │
│                                                                       │
│  ACTIVE ──payment_failed──> GRACE_PERIOD (7 days)                    │
│           ▲                       │                                   │
│           │ payment_recovered     │ timeout                           │
│           │                       ▼                                   │
│           │                 SUSPENDED ──> KV Flag Set ──> API Blocked │
│           │                       │                                   │
│           │ payment_recovered     │ timeout (14 days)                 │
│           │                       ▼                                   │
│           └────────────────── REVOKED ──> Data scheduled for deletion │
└──────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Billing Notification Service                        │
│  - Email via Resend                                                   │
│  - SMS via Twilio                                                     │
│  - Telegram Bot                                                       │
│                                                                       │
│  Templates: payment_failed, grace_period_started,                    │
│             account_suspended, account_revoked,                       │
│             payment_recovered, overage_charged                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 6.1: Stripe Billing Overage Configuration

**Goal:** Configure Stripe/Polar for metered billing with overage pricing

**Tasks:**
- [ ] Define usage metrics: `compute_minutes`, `api_calls`
- [ ] Configure Polar/Paddle products with metered pricing
- [ ] Map subscription items to license keys in database
- [ ] Update `UsageBillingAdapter` to fetch subscription item IDs

**Files:**
- `src/billing/usage-billing-adapter.ts`
- `src/billing/polar-subscription-service.ts`

---

### Phase 6.2: Overage Billing Emitter Enhancement

**Goal:** Complete `OverageBillingEmitter` with full Stripe integration

**Tasks:**
- [ ] Add subscription item mapping (licenseKey → stripe_subscription_item_id)
- [ ] Implement batch Stripe API calls for efficiency
- [ ] Add retry queue processing with exponential backoff
- [ ] Schedule periodic sync (every 6 hours via cron)

**Files:**
- `src/billing/overage-billing-emitter.ts` (enhance existing)
- `src/jobs/overage-billing-sync.ts` (new cron job)

---

### Phase 6.3: Usage Threshold Notifications

**Goal:** Proactive alerts when users approach/exceed usage limits

**Tasks:**
- [ ] Add 80% threshold warning notification
- [ ] Add 100% limit reached alert
- [ ] Add overage started notification with estimated charge
- [ ] Configure email via Resend + SMS via Twilio

**Files:**
- `src/notifications/billing-notification-service.ts` (enhance)
- `src/metering/usage-threshold-monitor.ts` (new)

---

### Phase 6.4: Dunning Cron Jobs

**Goal:** Automated dunning state transitions

**Tasks:**
- [ ] Create daily cron: `processGracePeriodTimeouts()`
- [ ] Create weekly cron: `processSuspensionTimeouts()`
- [ ] Create hourly cron: `processRetryQueue()` for overage sync
- [ ] Add GitHub Actions workflows for scheduling

**Files:**
- `src/jobs/dunning-grace-period-processor.ts` (new)
- `src/jobs/dunning-suspension-processor.ts` (new)
- `.github/workflows/dunning-daily.yml` (new)
- `.github/workflows/dunning-weekly.yml` (new)

---

### Phase 6.5: KV Sync Enhancement

**Goal:** Real-time billing state sync to RaaS Gateway KV

**Current State:** Already implemented in `dunning-state-machine.ts` and `raas-gateway-kv-client.ts`

**Enhancement Tasks:**
- [ ] Add overage state sync (raas:overage_state:{licenseKey})
- [ ] Add billing health score to KV
- [ ] Implement streaming usage events to KV for audit

**Files:**
- `src/lib/raas-gateway-kv-client.ts` (enhance)
- `src/jobs/dunning-kv-sync.ts` (enhance existing)

---

### Phase 6.6: Integration Tests

**Goal:** Comprehensive test coverage for billing flows

**Tasks:**
- [ ] Test overage billing emission to Stripe
- [ ] Test dunning state machine transitions
- [ ] Test KV sync on suspension/recovery
- [ ] Test webhook event handling (payment_failed, payment_succeeded)
- [ ] Test notification delivery (email, SMS, Telegram)

**Files:**
- `tests/billing/overage-billing-emitter.test.ts` (new)
- `tests/billing/dunning-state-machine.test.ts` (enhance)
- `tests/billing/threshold-notifications.test.ts` (new)

---

## Database Schema

### DunningState (Already exists)
```prisma
model DunningState {
  tenantId             String   @id
  status               DunningStatus
  failedPayments       Int      @default(0)
  lastPaymentFailedAt  DateTime?
  lastPaymentRecoveredAt DateTime?
  suspendedAt          DateTime?
  revokedAt            DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  events               DunningEvent[]
}

enum DunningStatus {
  ACTIVE
  GRACE_PERIOD
  SUSPENDED
  REVOKED
}
```

### DunningEvent (Already exists)
```prisma
model DunningEvent {
  id        String   @id @default(uuid())
  tenantId  String
  eventType String
  severity  String
  metadata  Json
  createdAt DateTime @default(now())

  tenant    DunningState @relation(fields: [tenantId], references: [tenantId])
}
```

---

## Environment Variables

```bash
# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Dunning Configuration
DUNNING_GRACE_PERIOD_DAYS=7
DUNNING_SUSPENSION_DAYS=14
DUNNING_REVOCATION_DAYS=30

# Notification Services
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG....
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...

# Cloudflare KV (for RaaS Gateway sync)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
RAAS_KV_NAMESPACE_ID=...

# RaaS Gateway
RAAS_GATEWAY_URL=https://raas.agencyos.network
RAAS_SERVICE_TOKEN=...
```

---

## API Endpoints

### Usage Events (Already exists)
```
POST /api/usage/events
Body: { licenseKey, eventType, units, timestamp }
```

### Billing Webhook (Already exists)
```
POST /api/billing/webhook
Headers: Stripe-Signature
Body: Stripe webhook payload
```

### Usage Threshold Check (New)
```
GET /api/billing/usage/:licenseKey/threshold
Response: {
  currentUsage,
  limit,
  percentUsed,
  thresholdBreached,
  overageUnits
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Overage billing accuracy | >99% |
| Dunning email delivery rate | >95% |
| Payment recovery rate | >60% |
| False positive suspensions | <1% |
| KV sync latency | <5 minutes |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Stripe API rate limits | Batch requests, exponential backoff |
| KV write failures | Fail-open design, DB is source of truth |
| Email delivery failures | Multi-channel (email + SMS + Telegram) |
| Dunning false positives | Grace period (7 days) before suspension |
| Overage calculation errors | Audit logging, manual override endpoint |

---

## Unresolved Questions

1. **Polar vs Stripe**: Should we use Polar.sh webhooks or direct Stripe integration for metered billing?
2. **Overage pricing**: What is the price per overage unit for compute_minutes and api_calls?
3. **Hard vs Soft limit**: Should we block API at 100% or allow overage with charges?
4. **Refund policy**: How to handle refunds for disputed overage charges?

---

## Next Steps

1. **Immediate**: Implement Phase 6.1-6.6 as outlined
2. **Week 1**: Complete OverageBillingEmitter + Dunning cron jobs
3. **Week 2**: Integration testing + QA
4. **Week 3**: Production deployment + monitoring

---

## Related Files

- **Plan:** `plans/260308-2345-overage-billing-dunning-plan.md`
- **Dunning State Machine:** `src/billing/dunning-state-machine.ts`
- **Overage Emitter:** `src/billing/overage-billing-emitter.ts`
- **KV Client:** `src/lib/raas-gateway-kv-client.ts`
- **Stripe Client:** `src/billing/stripe-billing-client.ts`
- **Notifications:** `src/notifications/billing-notification-service.ts`
- **Webhook Handler:** `src/billing/stripe-webhook-handler.ts`

---

## References

- Stripe Metered Billing: https://stripe.com/docs/billing/metered
- Stripe Dunning Guide: https://stripe.com/docs/billing/dunning
- Polar.sh Webhooks: https://docs.polar.sh/webhooks
- Cloudflare KV API: https://developers.cloudflare.com/kv/api/
