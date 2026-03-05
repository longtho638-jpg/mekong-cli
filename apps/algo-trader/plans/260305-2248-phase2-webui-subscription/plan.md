# PHASE 2: Web UI Subscription Integration

**Date:** 2026-03-05
**Status:** In Progress
**Priority:** HIGH

---

## Overview

Integrate Web UI subscription payment with existing LicenseService backend gates.

**Goal:** Enable users to purchase/upgrade licenses via Web UI → Webhook → LicenseService

---

## Dependencies

- ✅ PHASE 1: `raas-gate.ts` license validation (complete)
- ✅ Webhook handler: `src/lib/webhook-handler.ts` (exists)
- ⏳ Payment gateway: Polar.sh (to integrate)

---

## Implementation Plan

### Phase 2.1: Payment Gateway Setup
- [ ] Create `src/payment/polar-service.ts` - Polar.sh API integration
- [ ] Add Polar config: `src/config/polar.config.ts`
- [ ] Environment variables: `POLAR_WEBHOOK_SECRET`, `POLAR_API_KEY`

### Phase 2.2: Webhook Handlers
- [ ] Create `src/api/routes/webhooks/polar.ts` - Polar webhook endpoint
- [ ] Implement handlers: `subscription.created`, `subscription.updated`, `subscription.cancelled`
- [ ] Link to LicenseService: `activateLicense()`, `setTier()`, `revokeLicense()`

### Phase 2.3: License Service Extensions
- [ ] Add `activateLicense(key, tier)` method
- [ ] Add `downgradeToFree(key)` method
- [ ] Add webhook event logging to audit trail

### Phase 2.4: Frontend Components (React)
- [ ] Create `src/ui/components/SubscriptionPlan.tsx` - Pricing cards
- [ ] Create `src/ui/components/LicenseStatus.tsx` - Current tier display
- [ ] Create `src/ui/pages/UpgradePage.tsx` - Checkout flow
- [ ] Integrate Polar checkout redirect

### Phase 2.5: API Routes
- [ ] `GET /api/subscription/status` - Current license status
- [ ] `POST /api/subscription/checkout` - Create checkout session
- [ ] `POST /api/subscription/cancel` - Cancel subscription

### Phase 2.6: Testing
- [ ] Unit tests: Polar service mock
- [ ] Integration tests: Webhook → LicenseService
- [ ] E2E tests: Checkout flow simulation

---

## Success Criteria

- ✅ User can upgrade from FREE → PRO via Web UI
- ✅ Webhook updates LicenseService tier in real-time
- ✅ Premium features unlock immediately after payment
- ✅ Cancellation downgrades to FREE tier
- ✅ Audit log records all subscription events

---

## Files to Create

```
src/payment/
  ├── polar-service.ts
  └── polar.config.ts

src/api/routes/webhooks/
  └── polar.ts

src/ui/components/
  ├── SubscriptionPlan.tsx
  ├── LicenseStatus.tsx
  └── UpgradePage.tsx

src/api/routes/
  └── subscription.ts
```

---

**Next Action:** Execute Phase 2.1 - Payment Gateway Setup
