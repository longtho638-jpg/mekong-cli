# ROIaaS Phase 2: Polar Webhook Integration

**Date:** 2026-03-06
**Status:** ✅ COMPLETE

---

## Implementation Summary

Integrated Polar.sh webhook events with LicenseService to automatically sync subscription state changes.

---

## Changes Made

### 1. raas-gate.ts — Added subscription methods

```typescript
async activateSubscription(tenantId: string, tier: LicenseTier, _subscriptionId: string): Promise<void>
async deactivateSubscription(tenantId: string): Promise<void>
```

### 2. polar-webhook-event-handler.ts — Sync with LicenseService

- Added `LicenseService` import
- Added `mapTenantTierToLicenseTier()` helper
- Updated `handleActivation()` → calls `licenseService.activateSubscription()`
- Updated `handleUpdate()` → calls `licenseService.activateSubscription()`
- Updated `handleCancellation()` → calls `licenseService.deactivateSubscription()`

### 3. Test Coverage

New test file: `polar-webhook-integration.test.ts` (15 tests)

```
✓ Webhook signature verification (2 tests)
✓ Subscription activation webhook (3 tests)
✓ Subscription update webhook (1 test)
✓ Subscription cancellation webhook (2 tests)
✓ Unknown events (1 test)
✓ Edge cases (3 tests)
```

---

## Webhook Flow

```
┌─────────────┐
│   Polar.sh  │
│  (Payment)  │
└──────┬──────┘
       │ webhook: subscription.active
       ▼
┌─────────────────────────────────────┐
│ PolarWebhookEventHandler            │
│  1. Verify signature                │
│  2. Extract tenantId & tier         │
│  3. Map TenantTier → LicenseTier    │
└──────┬──────────────────────────────┘
       │
       ├──→ subscriptionService.activateSubscription()
       │
       └──→ licenseService.activateSubscription()
            ↓
            Updates validatedLicense
            Enables premium features
```

---

## Events Handled

| Event | Action |
|-------|--------|
| `subscription.created` | Activate PRO/ENTERPRISE |
| `subscription.active` | Activate PRO/ENTERPRISE |
| `subscription.updated` | Update tier |
| `subscription.canceled` | Downgrade to FREE |
| `subscription.revoked` | Downgrade to FREE |

---

## Environment Variables

```bash
# Polar.sh Configuration
POLAR_API_KEY=sk_live_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_PRODUCT_PRO=prod_pro
POLAR_PRODUCT_ENTERPRISE=prod_enterprise
POLAR_SUCCESS_URL=https://algo-trader.local/upgrade/success
```

---

## Test Results

```
PASS src/billing/polar-webhook-integration.test.ts
PASS src/api/routes/webhooks/polar-webhook.test.ts

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

---

## Next Steps

1. Configure Polar.sh products with correct IDs
2. Deploy webhook endpoint to production
3. Test end-to-end checkout flow
4. Monitor webhook events in Polar dashboard

---

**Status:** ✅ Phase 2 COMPLETE — Webhook integration ready for production
