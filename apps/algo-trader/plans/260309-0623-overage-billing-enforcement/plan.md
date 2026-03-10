# Overage Billing & Enforcement Implementation Plan

**Created:** 2026-03-09
**Status:** ✅ COMPLETE
**Complexity:** COMPLEX
**ETA:** 2-3 hours
**Actual:** ~2 hours
**Tests:** 62 passed

---

## Overview

Implement overage billing for algo-trader usage beyond licensed quota:
1. **Overage metering** - Track usage beyond quota limits (not just blocking)
2. **Hard limits with overage option** - Allow overage instead of hard block
3. **Stripe Billing integration** - Emit overage events for invoicing
4. **AgencyOS dashboard** - Admin visibility for overage usage
5. **JWT/mk_ auth alignment** - RaaS Gateway v2.0.0 compatible

---

## Implementation Status

### Phase 1: Core Overage Services ✅
- [x] `overage-metering-service.ts` - Singleton, tracks overage units
- [x] `stripe-billing-client.ts` - Stripe API wrapper
- [x] `raas-gateway-kv-client.ts` - KV counter sync
- [x] `overage-billing-emitter.ts` - Periodic Stripe sync

### Phase 2: Middleware Integration ✅
- [x] `overage-middleware.ts` - Check + allow overage
- [x] Update `hard-limits-middleware.ts` - Add overage mode

### Phase 3: Billing Integration ✅
- [x] `overage-billing-emitter.ts` - Periodic Stripe sync
- [x] Update `usage-billing-adapter.ts` - Overage record format

### Phase 4: Testing & Validation ✅
- [x] Unit tests for overage services (10 tests)
- [x] Unit tests for Stripe client (6 tests)
- [x] Unit tests for KV client (14 tests)
- [x] Unit tests for middleware (4 tests)
- [x] Emitter tests (7 tests)
- [x] Existing overage calculator tests (21 tests)
- **Total: 62 tests passed**

---

## Key Insights

**Existing Components (reuse):**
- `UsageTrackerService` - In-memory buffer, auto-flush every 30s/100 events
- `HardLimitsMiddleware` - Currently blocks at quota, needs overage mode
- `UsageBillingAdapter` - Stripe/Polar format conversion (not wired to real API)
- `LicenseService` - Tier validation (FREE/PRO/ENTERPRISE)

**Gaps to Fill:**
1. No overage tracking - current system just blocks at quota
2. No Stripe API integration - adapter only formats, doesn't send
3. No overage events/webhooks for billing sync
4. No dashboard visibility for overage state
5. Suspension store is in-memory (needs KV persistence)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request Flow                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. RaaS Middleware (License Validation)                         │
│     - JWT/mk_ token verification                                 │
│     - Tier extraction (FREE/PRO/ENTERPRISE)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Overage Metering Middleware (NEW)                            │
│     - Check current usage vs quota                               │
│     - If overage enabled: allow + track overage units            │
│     - If overage disabled: block at quota (existing behavior)    │
│     - Emit overage events when threshold crossed                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Usage Tracking Middleware (existing)                         │
│     - Track api_call, compute_minute events                      │
│     - Buffer writes for performance                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. RaaS Gateway KV Sync (NEW)                                   │
│     - Async sync to Cloudflare KV                                │
│     - Real-time counter updates                                  │
│     - Suspension state persistence                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Stripe Billing Emitter (NEW)                                 │
│     - End-of-period overage aggregation                          │
│     - Stripe Usage Records API calls                             │
│     - Webhook acknowledgments                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/billing/overage-metering-service.ts` | Core overage tracking logic |
| `src/billing/overage-billing-emitter.ts` | Stripe overage event emission |
| `src/api/middleware/overage-middleware.ts` | Overage enforcement middleware |
| `src/lib/raas-gateway-kv-client.ts` | Cloudflare KV client for real-time counters |
| `src/billing/stripe-billing-client.ts` | Stripe Usage Records API wrapper |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/raas-gate.ts` | Add overage_enabled flag to license schema |
| `src/metering/usage-tracker-service.ts` | Add overage event types |
| `src/api/middleware/hard-limits-middleware.ts` | Add overage mode option |
| `src/billing/usage-billing-adapter.ts` | Add overage record formatting |

---

## Implementation Phases

### Phase 1: Core Overage Services
- [ ] `overage-metering-service.ts` - Singleton, tracks overage units
- [ ] `stripe-billing-client.ts` - Stripe API wrapper
- [ ] `raas-gateway-kv-client.ts` - KV counter sync

### Phase 2: Middleware Integration
- [ ] `overage-middleware.ts` - Check + allow overage
- [ ] Update `hard-limits-middleware.ts` - Add overage mode

### Phase 3: Billing Integration
- [ ] `overage-billing-emitter.ts` - Periodic Stripe sync
- [ ] Update `usage-billing-adapter.ts` - Overage record format

### Phase 4: Testing & Validation
- [ ] Unit tests for overage services
- [ ] Integration tests for middleware flow
- [ ] E2E test: quota → overage → Stripe event

---

## Success Criteria

1. **Functional:**
   - [ ] Requests allowed when overage_enabled=true and quota exceeded
   - [ ] Overage units tracked separately from base quota
   - [ ] Stripe usage records generated for overage
   - [ ] Webhook sync restores access on payment

2. **Performance:**
   - [ ] KV sync non-blocking (async, batched)
   - [ ] <10ms latency added per request
   - [ ] Buffer flush every 30s or 100 events

3. **Security:**
   - [ ] JWT/mk_ tokens validated before overage check
   - [ ] KV access authenticated
   - [ ] Stripe API keys secured

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| KV rate limits | Batch updates, exponential backoff |
| Stripe API failures | Retry queue, dead-letter queue |
| Overages not synced on crash | Graceful shutdown flush, WAL |
| Dashboard stale data | Real-time WebSocket updates |

---

## Stripe Billing Reference

**Usage Records API:**
```bash
POST /v1/subscription_items/{SUB_ITEM_ID}/usage_records
{
  "quantity": 150,  // overage units
  "timestamp": 1709942400,
  "action": "increment"
}
```

**Metered Billing:**
- Price must have `usage_type: "metered"`
- Aggregate: `sum` for cumulative usage
- Billing period: monthly (default)

---

## RaaS Gateway KV Schema

```kv
# Counter key format
counter:{licenseKey}:{month}:{metric} → {value, updated_at}

# Suspension state
suspension:{licenseKey} → {suspended, reason, overage_allowed, overage_units}

# Overage config
overage_config:{licenseKey} → {enabled, max_overage_percent, price_per_unit}
```

---

## Unresolved Questions

1. **Overage pricing:** Flat rate or tier-based?
2. **Max overage:** Hard cap (e.g., 2x quota) or unlimited?
3. **Billing period:** End-of-month invoice or real-time charges?
4. **Dashboard:** Build new page or extend existing subscription page?

---

## Next Steps

1. Review and approve plan
2. Implement Phase 1 (Core Services)
3. Implement Phase 2 (Middleware)
4. Implement Phase 3 (Billing)
5. Test & deploy
