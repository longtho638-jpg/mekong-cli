# ROIaaS PHASE 2 — POLAR.SH WEBHOOK INTEGRATION

**Date:** 2026-03-06 | **Status:** READY TO IMPLEMENT

---

## CONTEXT

Existing implementation đã có sẵn:
- ✅ `src/api/routes/webhooks/polar-webhook.ts` — Webhook endpoint
- ✅ `src/billing/polar-webhook-event-handler.ts` — Event routing
- ✅ `src/payment/polar-service.ts` — Polar API client
- ✅ `src/billing/polar-subscription-service.ts` — Subscription state
- ✅ `src/lib/raas-gate.ts` — License gating (PHASE 1)

Gaps cần fill cho PHASE 2:
1. ❌ Thiếu event reconciliation (missing events: `refund.created`, `order.created`)
2. ❌ Chưa có dashboard UI cho subscription management
3. ❌ Chưa integrate với Polar Standard Webhooks (chỉ có custom schema)
4. ❌ Thiếu audit logging cho webhook events

---

## IMPLEMENTATION PLAN

### Phase 1: Webhook Events Reconciliation (2 hours)

**Goal:** Full event coverage per Polar.sh docs

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.created` | ✅ Existing | Log tracking |
| `order.created` | ❌ NEW | Activate license (one-time purchase) |
| `subscription.created` | ✅ Existing | Activate license |
| `subscription.active` | ✅ Existing | Set tier active |
| `subscription.updated` | ✅ Existing | Update tier |
| `subscription.canceled` | ✅ Existing | Downgrade to FREE |
| `subscription.revoked` | ✅ Existing | Deactivate |
| `refund.created` | ❌ NEW | Downgrade + audit alert |

**Files to create/modify:**
- `src/billing/polar-webhook-event-handler.ts` — Add `handleOrderCreated`, `handleRefundCreated`
- `src/billing/polar-audit-logger.ts` — NEW: Audit trail for compliance

### Phase 2: Subscription Dashboard API (3 hours)

**Goal:** REST API cho frontend dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/billing/subscription` | GET | Current subscription status |
| `/api/v1/billing/subscription` | POST | Upgrade/cancel subscription |
| `/api/v1/billing/invoices` | GET | Invoice history |
| `/api/v1/billing/usage` | GET | Usage stats (commands, features) |

**Files to create:**
- `src/api/routes/billing-dashboard-routes.ts`
- `src/billing/usage-tracker.ts` — Track per-tenant usage

### Phase 3: Polar Standard Webhooks Compliance (2 hours)

**Goal:** Align với Polar.sh Standard Webhooks spec

**Actions:**
1. Update `PolarWebhookPayloadSchema` để match Polar spec exactly
2. Add `x-polar-webhook-id` header tracking (idempotency)
3. Add retry logic cho failed events (exponential backoff)
4. Add dead letter queue cho unprocessable events

**Files to modify:**
- `src/billing/polar-webhook-event-handler.ts`
- `src/config/polar.config.ts`

### Phase 4: Subscription Dashboard UI (4 hours)

**Goal:** Conversion-first UI (HIẾN PHÁP ROIaaS Ch.4)

**Components:**
- `/billing` — Dashboard trang chính
- `<SubscriptionStatus>` — Hiển thị tier, renewal date
- `<UpgradeModal>` — Checkout modal với Polar Elements
- `<UsageMeter>` — Progress bars cho API limits
- `<InvoiceHistory>` — Table với download links

**Files to create:**
- `apps/dashboard/src/pages/billing.tsx`
- `apps/dashboard/src/components/billing/`

---

## RECONCILIATION MATRIX

### Current State → Phase 2 Target

| Component | Current | Phase 2 Target |
|-----------|---------|----------------|
| Webhook Events | 5/8 | 8/8 ✅ |
| API Endpoints | 3 | 7 ✅ |
| UI Pages | 0 | 4 ✅ |
| Audit Logging | ❌ | ✅ |
| Idempotency | ❌ | ✅ |
| Retry Logic | ❌ | ✅ |

---

## TESTING STRATEGY

### Unit Tests
- `polar-webhook-event-handler.test.ts` — Test từng event handler
- `polar-audit-logger.test.ts` — Audit trail verification
- `billing-dashboard-routes.test.ts` — API contract tests

### Integration Tests
- `polar-webhook-integration.test.ts` — End-to-end webhook flow
- Mock Polar API responses
- Test idempotency (same event delivered multiple times)

### E2E Tests
- Checkout flow: Click upgrade → Polar redirect → Webhook → Dashboard update
- Cancellation flow: Click cancel → Webhook → Downgrade

---

## SUCCESS CRITERIA

- [ ] 8/8 webhook events handled
- [ ] 7 API endpoints operational
- [ ] Dashboard UI deployed
- [ ] 100% unit test coverage
- [ ] E2E checkout flow verified
- [ ] Audit logs written for all events

---

## UNRESOLVED QUESTIONS

1. Polar product IDs cần configure cho env production?
2. Cần thêm email notifications khi subscription thay đổi?
3. Usage tracking granularity (per-hour vs per-day)?
