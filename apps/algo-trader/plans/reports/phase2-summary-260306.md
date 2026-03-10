# ROIaaS PHASE 2 — POLAR.SH INTEGRATION PLAN

**Date:** 2026-03-06
**Status:** PLAN READY
**Author:** Antigravity Planner Agent

---

## EXECUTIVE SUMMARY

Phase 2 plan đã hoàn thành cho Polar.sh webhook integration. Existing implementation đã có nền tảng vững chắc:

### ✅ Existing (PHASE 1 Done)
- Webhook endpoint (`/api/v1/billing/webhook`)
- Signature verification (HMAC-SHA256)
- Subscription service (in-memory state)
- License gating integration (raas-gate.ts)
- 5/8 webhook events handled

### ❌ Gaps (PHASE 2 To-Do)
- 3 missing webhook events (`order.created`, `refund.created`, + reconciliation)
- Subscription dashboard API (4 endpoints)
- Audit logging system
- Idempotency & retry logic

---

## PHASES OVERVIEW

| Phase | Name | Estimate | Complexity |
|-------|------|----------|------------|
| 1 | Webhook Events Reconciliation | 2 hours | SIMPLE |
| 2 | Subscription Dashboard API | 3 hours | MODERATE |
| 3 | Polar Standard Webhooks Compliance | 2 hours | SIMPLE |
| 4 | Subscription Dashboard UI | 4 hours | MODERATE |

**Total:** 11 hours (~1 working day)

---

## FILES CREATED

```
plans/260306-0205-polar-phase2-integration/
├── plan.md                              # Master plan
├── phase-01-webhook-reconciliation.md   # Phase 1 details
├── phase-02-dashboard-api.md            # Phase 2 details
└── phase2-summary-260306.md             # This file
```

---

## RECONCILIATION MATRIX

### Webhook Events

| Event | Status | Handler Location |
|-------|--------|------------------|
| `checkout.created` | ✅ | polar-webhook-event-handler.ts:78 |
| `order.created` | ❌ | TODO: phase-01-webhook-reconciliation.md |
| `subscription.created` | ✅ | polar-webhook-event-handler.ts:65 |
| `subscription.active` | ✅ | polar-webhook-event-handler.ts:84 |
| `subscription.updated` | ✅ | polar-webhook-event-handler.ts:87 |
| `subscription.canceled` | ✅ | polar-webhook-event-handler.ts:91 |
| `subscription.revoked` | ✅ | polar-webhook-event-handler.ts:91 |
| `refund.created` | ❌ | TODO: phase-01-webhook-reconciliation.md |

### API Endpoints

| Endpoint | Status | Location |
|----------|--------|----------|
| GET `/api/v1/billing/products` | ✅ | polar-webhook.ts:26 |
| POST `/api/v1/billing/checkout` | ✅ | polar-webhook.ts:32 |
| POST `/api/v1/billing/webhook` | ✅ | polar-webhook.ts:51 |
| GET `/api/v1/billing/subscription/:id` | ✅ | polar-webhook.ts:98 |
| GET `/api/v1/billing/invoices/:id` | ❌ | TODO: phase-02-dashboard-api.md |
| POST `/api/v1/billing/subscription/:id` | ❌ | TODO: phase-02-dashboard-api.md |
| GET `/api/v1/billing/usage/:id` | ❌ | TODO: phase-02-dashboard-api.md |

---

## NEXT STEPS

1. **User Approval:** Review plan.md và phase files
2. **Start Phase 1:** `/cook "Phase 1: Webhook Reconciliation"`
3. **Run Tests:** `npm test -- --testPathPattern="polar"`
4. **Deploy:** Verify webhook endpoints trong production

---

## UNRESOLVED QUESTIONS

1. Polar product IDs cho production environment?
2. Email notifications cho subscription events?
3. Usage tracking granularity (hourly/daily)?

---

## RELATED FILES

- `src/lib/raas-gate.ts` — License gating (PHASE 1)
- `src/billing/polar-webhook-event-handler.ts` — Event routing
- `src/payment/polar-service.ts` — Polar API client
- `docs/HIEN_PHAP_ROIAAS.md` — ROIaaS constitution
