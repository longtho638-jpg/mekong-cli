---
title: "Phase 6b: Dunning & License Enforcement"
description: "Stripe metered usage sync, dunning workflows, and auto-suspension of mk_ API keys on payment failure"
status: pending
priority: P1
effort: 3h
branch: master
tags: [raas, billing, dunning, enforcement]
created: 2026-03-08
---

# Phase 6b: Dunning & License Enforcement

## Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | Stripe Metered Usage Sync | pending | 2 modify |
| 2 | Dunning Workflow | pending | 2 create, 1 modify |
| 3 | Background Enforcement Task | pending | 1 modify, 1 create |

---

## Phase 1: Stripe Metered Usage Sync

Report overage credits to Stripe for automated invoicing.

**Modify:**
- `src/auth/stripe_integration.py` — Add `report_metered_usage(tenant_id, credits, idempotency_key)` method to StripeService. Uses `stripe.billing.MeterEvent.create()` for usage-based billing.
- `src/api/raas_billing_service.py` — After overage_credits increment in `record_usage()`, call Stripe usage report. Add `sync_overage_to_stripe()` on TenantLedger.

**Steps:**
1. Add `STRIPE_METER_EVENT_NAME` to AuthConfig (env: `STRIPE_METER_EVENT_NAME`)
2. Add `report_metered_usage()` to StripeService — idempotent via `idempotency_key=f"{tenant_id}:{entry_id}"`
3. In `BillingService.record_usage()`, after overage detection, fire Stripe meter event
4. Log analytics event: `billing.overage_reported`

---

## Phase 2: Dunning Workflow

Handle failed payments: notify via Resend, apply grace period, downgrade/suspend.

**Create:**
- `src/services/dunning_service.py` (~150 lines) — DunningService class:
  - `handle_payment_failed(tenant_id, invoice_id, attempt_count)` — entry point from Stripe webhook
  - `send_dunning_email(email, attempt, grace_deadline)` — via Resend API (existing pattern in codebase)
  - `check_grace_period_expired(tenant_id)` — compare `failed_at + 24h` (from OverageConfig grace)
  - `suspend_tenant(tenant_id)` — set license status=suspended in DB, invalidate cache
  - States: `payment_failed` -> `grace_period` (24h) -> `suspended`

- `src/api/dunning_webhook_handler.py` (~80 lines) — FastAPI route `/v1/webhooks/stripe/dunning`
  - Handle `invoice.payment_failed`, `invoice.paid` (recovery)
  - Verify Stripe signature, delegate to DunningService

**Modify:**
- `src/auth/stripe_integration.py` — Add `StripeEventType.INVOICE_PAYMENT_FAILED = "invoice.payment_failed"` and `INVOICE_PAID = "invoice.paid"`. Wire to dunning handler in `handle_stripe_webhook()`.

**Steps:**
1. Add Resend email helper (or reuse existing email util if present)
2. Implement DunningService with 3-attempt escalation: warn -> urgent -> final
3. Register webhook route in gateway
4. Log analytics: `dunning.email_sent`, `dunning.grace_started`, `dunning.suspended`

---

## Phase 3: Background Enforcement Task

Periodic license check + auto-suspend on payment failure or quota exceeded.

**Modify:**
- `src/services/license_enforcement.py` — Add `suspend_license(key_id, reason)` method that:
  1. UPDATE raas_license_keys SET status='suspended' WHERE key_id=$1
  2. Invalidate LRU cache entry
  3. Log `enforcement.license_suspended` event

**Create:**
- `src/services/enforcement_background_task.py` (~120 lines):
  - `EnforcementBackgroundTask` class with `run_check_cycle()`:
    1. Query all licenses with `grace_period_started_at` older than 24h + status != suspended
    2. For each: call `suspend_license(key_id, "payment_overdue")`
    3. Query all licenses exceeding max_overage_credits → suspend
  - `start_enforcement_loop(interval_seconds=300)` — asyncio background task
  - Wire into gateway startup via `on_startup` hook

**Steps:**
1. Add `grace_period_started_at` column to raas_license_keys (migration 008)
2. Implement `suspend_license()` in LicenseEnforcementService
3. Implement background loop with 5-min interval
4. On suspension: invalidate quota_cache, return 403 on next request
5. Log analytics: `enforcement.check_cycle`, `enforcement.suspended_count`

---

## Success Criteria

- [ ] Overage credits reported to Stripe meter events (idempotent)
- [ ] Failed payment triggers dunning email sequence (3 attempts)
- [ ] Grace period (24h) respected before suspension
- [ ] Background task auto-suspends overdue licenses every 5 min
- [ ] Suspended mk_ keys return 403 from existing middleware
- [ ] All billing events logged for analytics
- [ ] Tests pass: `python3 -m pytest tests/ -k "dunning or enforcement"`

## Dependencies

- Stripe Billing meter configured (STRIPE_METER_EVENT_NAME env)
- Resend API key for dunning emails (RESEND_API_KEY env)
- DB migration 008 for grace_period_started_at column
