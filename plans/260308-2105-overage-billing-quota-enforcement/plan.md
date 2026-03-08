---
title: "Overage Billing and Quota Enforcement"
description: "Hard quota enforcement at gateway + Stripe overage billing + dashboard status API"
status: pending
priority: P1
effort: 6h
branch: master
tags: [raas, billing, quota, stripe, phase6]
created: 2026-03-08
---

# Overage Billing and Quota Enforcement

RaaS Gateway Phase 6 — Hard quota enforcement with overage billing via Stripe.

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | Overage pricing config + tier enhancement | pending | 1h | 2 modify |
| 2 | Quota enforcement middleware with rate-limit headers | pending | 1.5h | 2 modify |
| 3 | Stripe overage billing integration | pending | 1.5h | 1 create, 1 modify |
| 4 | Dashboard status API endpoints | pending | 1h | 1 create, 1 modify |
| 5 | Tests | pending | 1h | 2 create |

## Key Dependencies

- Existing `CreditRateLimiter` (src/raas/credit_rate_limiter.py) — extend, not replace
- Existing `BillingService` (src/api/raas_billing_service.py) — add overage tracking
- Existing `StripeService` (src/auth/stripe_integration.py) — add usage record reporting
- Existing billing middleware (src/api/raas_billing_middleware.py) — add headers + overage logic
- Gateway (src/core/gateway/gateway_main.py) — mount new endpoints

## Architecture Decision

- Overage config as Python dataclass in `credit_rate_limiter.py` (extends existing TIER_LIMITS)
- No new DB tables — overage tracking via existing SQLite `rate_limit_events`
- Stripe Meter API for usage-based overage charges (Stripe's built-in metering)
- Single new file for overage billing logic, single new file for dashboard endpoints
