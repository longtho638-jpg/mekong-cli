---
title: "Phase 4.5: Stripe/Polar Billing Adapter"
description: "Format usage data for billing provider integration"
status: completed
priority: P1
effort: 1h
parent: plan.md
---

# Phase 4.5: Stripe/Polar Billing Adapter

## Overview

Adapter layer that converts internal usage data to:
- Stripe Metered Billing format
- Polar.sh usage event format (when available)

## Implementation

File created: `src/billing/usage-billing-adapter.ts`

### Implemented Methods

- `toStripeUsageRecords(usage, subscriptionItemId, meterId?)` — Convert to Stripe format
- `toPolarUsageReport(usage, subscriptionId)` — Convert to Polar format
- `syncUsageToStripe(licenseKey, subscriptionItemId, meterId?)` — Generate Stripe records from tracked usage
- `reportUsageToPolar(tenantId, subscriptionId)` — Generate Polar reports from tracked usage
- `getBillingSummary(licenseKey, tier)` — Get billing summary with cost estimates

### Additional Features

- Pricing configuration with tier discounts (free/pro/enterprise)
- Helper functions: `calculateApiCallCost`, `calculateComputeCost`, `calculateMlInferenceCost`
- Support for 3 metrics: api_calls, compute_minutes, ml_inferences
- Singleton pattern for consistent state

## Tests

File created: `src/billing/usage-billing-adapter.test.ts`

- 29 tests covering all methods
- All tests passing
- Tests include: singleton pattern, pricing calculations, format conversion, integration with UsageTracker

## Verification

- Type check: PASS
- Tests: 29/29 PASS
