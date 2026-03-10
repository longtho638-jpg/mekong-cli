---
title: "Phase 3: Webhook Integration — Stripe + Polar Enhancement"
description: "Stripe webhook handler, Polar enhancement, auto-provisioning, idempotency, error alerts"
status: pending
priority: P1
effort: 8h
branch: master
tags: [webhook, stripe, polar, billing, roi]
created: 2026-03-06
---

# Phase 3: Webhook Integration Plan

## Context & Analysis

**Current State:**
- Polar webhook handler exists (`polar-webhook-event-handler.ts`) with signature verification
- Basic idempotency via `PolarAuditLogger.processedEvents` Set
- Single webhook route: `/api/v1/billing/webhook` (Polar only)
- No Stripe integration
- No auto-provisioning on payment success
- No error alerting for failed webhook deliveries

**What's Needed:**
1. Stripe webhook handler with signature verification (new)
2. Enhanced Polar webhook (improve existing)
3. Auto-provision tenant resources on successful payment
4. Robust idempotency handling (shared store)
5. Error alerts for failed webhook deliveries

## Key Insights

**From Codebase Analysis:**
- `PolarWebhookEventHandler` already has solid foundation (signature verification, idempotency, audit logging)
- `IdempotencyStore` exists in middleware — should centralize for all webhooks
- Tenant CRUD exists (`tenant-crud-routes.ts`) — auto-provisioning should create tenant + default strategy
- Fastify server already mounts Polar webhook routes with idempotency middleware

**Architecture Decisions:**
- Reuse existing `PolarAuditLogger` for Stripe events (rename to `WebhookAuditLogger`)
- Shared `IdempotencyStore` for both providers
- Auto-provisioning creates: tenant + API key + default strategy configuration
- Error alerts via console + webhook event store (future: Slack/Email)

## Requirements

### Functional
1. Stripe webhook endpoint at `/api/v1/billing/stripe/webhook`
2. Enhanced Polar webhook with better error handling
3. Auto-provisioning: create tenant + resources on `payment_intent.succeeded` / `checkout.session.completed`
4. Idempotency: same event ID processed only once per provider
5. Error alerts: failed webhook deliveries logged + stored

### Non-Functional
- Signature verification for both providers
- Response time < 200ms for webhook processing
- Zero duplicate provisioning (idempotency guaranteed)
- Audit trail for all webhook events

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Webhook Gateway                             │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/v1/billing/stripe/webhook   → StripeWebhookHandler   │
│  POST /api/v1/billing/webhook          → PolarWebhookHandler    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Idempotency Middleware (shared IdempotencyStore)               │
│  - Check eventId already processed                               │
│  - Return cached response if duplicate                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  WebhookAuditLogger (unified audit trail)                       │
│  - Log all events (success/failure)                              │
│  - Track processed event IDs                                     │
│  - Error alerts for failed deliveries                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AutoProvisioningService (NEW)                                  │
│  - Create tenant (if not exists)                                 │
│  - Generate API key                                              │
│  - Assign default strategy                                       │
│  - Activate license tier                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Related Code Files

**To Create:**
- `src/billing/stripe-webhook-handler.ts`
- `src/billing/webhook-audit-logger.ts` (rename/refactor from `polar-audit-logger.ts`)
- `src/billing/auto-provisioning-service.ts`
- `src/api/routes/webhooks/stripe-webhook.ts`

**To Modify:**
- `src/billing/polar-webhook-event-handler.ts` (enhance error handling)
- `src/billing/polar-audit-logger.ts` (refactor to unified logger)
- `src/api/fastify-raas-server.ts` (mount Stripe routes)

**Tests to Create:**
- `tests/billing/stripe-webhook-handler.test.ts`
- `tests/billing/auto-provisioning-service.test.ts`
- `tests/integration/webhook-integration.test.ts`

## Implementation Steps

### Step 1: WebhookAuditLogger (Unified Audit Trail)
- Extract from `PolarAuditLogger`
- Support both Stripe + Polar events
- Add error alerting (console + stored alerts)
- Methods: `log()`, `logError()`, `isProcessed()`, `markProcessed()`, `getRecentLogs()`

### Step 2: StripeWebhookHandler
- Signature verification (Stripe-Signature header)
- Event routing: `checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.*`
- Idempotency check via `WebhookAuditLogger`
- Return `WebhookResult` interface (consistent with Polar)

### Step 3: AutoProvisioningService
- `provisionTenant(tenantId, tier, paymentProvider)`:
  - Create tenant via `TenantStrategyManager.addTenant()`
  - Generate API key
  - Assign default strategy (RSI+SMA)
  - Activate license tier
- Return provisioned tenant config

### Step 4: StripeWebhookRoute
- Route: `POST /api/v1/billing/stripe/webhook`
- Skip auth (webhook is unauthenticated)
- Apply idempotency middleware
- Handle Stripe-specific headers

### Step 5: Enhance PolarWebhookHandler
- Better error messages
- Use unified `WebhookAuditLogger`
- Add auto-provisioning call on activation events

### Step 6: Tests
- Unit tests for Stripe handler (signature verification, event routing)
- Integration tests (webhook → provisioning → license activation)
- Idempotency tests (duplicate events rejected)
- Error handling tests (invalid signature, malformed payload)

## Success Criteria

- [ ] Stripe webhook signature verification works
- [ ] Polar webhook enhanced with better error handling
- [ ] Auto-provisioning creates tenant + API key + default strategy
- [ ] Idempotency prevents duplicate processing
- [ ] Error alerts stored for failed deliveries
- [ ] All tests pass (unit + integration)
- [ ] No TypeScript errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Duplicate provisioning | Idempotency store with eventId per provider |
| Invalid signatures | Strict signature verification, reject on mismatch |
| Tenant creation fails | Try-catch, log error, return 400 with details |
| API key generation collision | Use crypto.randomUUID() for uniqueness |

## Next Steps

1. Create `WebhookAuditLogger` (Step 1)
2. Implement `StripeWebhookHandler` (Step 2)
3. Build `AutoProvisioningService` (Step 3)
4. Add `StripeWebhookRoute` (Step 4)
5. Enhance `PolarWebhookHandler` (Step 5)
6. Write comprehensive tests (Step 6)

## Unresolved Questions

1. **Stripe product → tier mapping**: Need Stripe product IDs for Free/Pro/Enterprise tiers
2. **Default strategy configuration**: What exact config for auto-provisioned tenants?
3. **Error alert destination**: Console only, or integrate with existing alert system?
4. **Tenant ID from Stripe**: Should we use `client_reference_id` or metadata for tenant ID?

---

**Dependencies:** None (standalone phase)
**Blocks:** Phase 4 (License Management UI)
