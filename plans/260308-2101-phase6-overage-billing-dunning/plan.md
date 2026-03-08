---
title: "Phase 6: Overage Billing & Dunning Workflows"
description: "Stripe Billing Cycle integration, dunning email enhancement, webhook expansion, usage automation, and testing"
status: pending
priority: P1
effort: 12h
branch: master
tags: [billing, dunning, stripe, overage, webhook, roi]
created: 2026-03-08
---

# Phase 6: Overage Billing & Dunning Workflows

**ROI:** Engineering ROI (Dev Key gate) + Operational ROI (Usage metering + overage charges)

---

## Tổng quan

Triển khai complete billing cycle với overage auto-charging, dunning workflows, và Stripe Billing integration cho RaaS AgencyOS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 6 Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│  UsageTracker → KV Buffer → StripeUsageSync → Stripe Metered   │
│       │              │              │                           │
│       ▼              ▼              ▼                           │
│  OverageCalculator → DunningStateMachine → BillingNotification │
│       │                                      │                  │
│       ▼                                      ▼                  │
│  Stripe Invoice ← WebhookHandler ← Stripe Events              │
│       │                                                         │
│       ▼                                                         │
│  Customer Portal (Payment Method Updates)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Current State (Phase 4-5)

| Component | File | Status |
|-----------|------|--------|
| UsageTrackerService | `src/billing/usage_tracker.py` | ✅ Implemented |
| StripeUsageSyncService | `src/billing/stripe_usage_sync.py` | ✅ Implemented |
| OverageCalculator | `src/billing/overage_calculator.py` | ⚠️ Partial |
| DunningStateMachine | `src/billing/dunning_state_machine.py` | ⚠️ Partial |
| BillingNotificationService | `src/billing/notification_service.py` | ⚠️ Partial |
| StripeWebhookHandler | `src/api/polar_webhook.py` | ⚠️ Partial (Polar only) |

## Gaps Identified

1. Overage auto-charging NOT integrated với Stripe Billing cycles
2. Dunning email templates cần customization cho RaaS
3. Webhook handler missing: `invoice.created`, `customer.subscription.trial_will_end`
4. Usage sync not triggered automatically at billing period end
5. No customer portal integration cho payment method updates

---

## Implementation Phases

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| [6.1](#phase-61-stripe-billing-cycle-integration) | Stripe Billing Cycle Integration | 3h | pending |
| [6.2](#phase-62-dunning-email-enhancement) | Dunning Email Enhancement | 3h | pending |
| [6.3](#phase-63-webhook-handler-expansion) | Webhook Handler Expansion | 2h | pending |
| [6.4](#phase-64-usage-billing-automation) | Usage Billing Automation | 2h | pending |
| [6.5](#phase-65-testing-verification) | Testing & Verification | 2h | pending |

---

## Success Criteria

1. ✅ Auto-sync usage at period end (cron job)
2. ✅ Generate invoices với overage charges
3. ✅ Configure tiered pricing trong Stripe
4. ✅ Custom email templates cho RaaS (4 templates)
5. ✅ Dunning retry: 1d → 3d → 5d
6. ✅ Webhook handlers: invoice.created, trial_will_end
7. ✅ Idempotency enforcement via WebhookAuditLogger
8. ✅ Real-time overage threshold alerts (80%, 90%, 100%)
9. ✅ Unit tests cho OverageCalculator
10. ✅ Integration tests cho webhook handlers
11. ✅ E2E test: full billing cycle với overage

---

## Dependencies

- Stripe API (Usage Records API, Metered Billing)
- Resend/SendGrid cho email notifications
- Cloudflare KV cho usage buffer
- PostgreSQL cho usage ledger

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe API rate limits | High | Batch sync + exponential backoff |
| Email delivery failures | Medium | Retry logic + fallback provider |
| Webhook signature failures | High | Logging + manual replay capability |
| Usage sync data loss | High | SQLite buffer + batch flush |
| Dunning false positives | Medium | Grace period + manual override |

---

## Next Steps

1. Implement Phase 6.1: Stripe Billing Cycle Integration
2. Test usage sync at period boundaries
3. Implement Phase 6.2: Dunning Email Enhancement
4. Implement Phase 6.3: Webhook Handler Expansion
5. Implement Phase 6.4: Usage Billing Automation
6. Implement Phase 6.5: Testing & Verification
7. Deploy + verify production GREEN
