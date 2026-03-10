---
name: fintech-hub-sdk
description: Unified fintech SDK — billing, payments, subscriptions, revenue, embedded finance, Stripe. Use for payment processing, subscription management, revenue analytics, metered billing.
license: MIT
version: 1.0.0
---

# Fintech Hub SDK Skill

Build payment systems, subscription platforms, and revenue infrastructure with unified fintech facades.

## When to Use

- Payment processing and routing setup
- Subscription plan management and billing
- Revenue analytics (MRR, ARR, churn, LTV)
- Metered billing and usage tracking
- Multi-provider payment orchestration
- Embedded finance features (lending, banking-as-a-service)
- Stripe/Polar integration patterns

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/fintech-hub-sdk/billing` | BillingFacade | Invoicing, metered billing |
| `@agencyos/fintech-hub-sdk/payments` | PaymentsFacade | Payment intents, routing |
| `@agencyos/fintech-hub-sdk/subscriptions` | SubscriptionsFacade | Plans, trials, dunning |
| `@agencyos/fintech-hub-sdk/revenue` | RevenueFacade | MRR, cohorts, recognition |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-billing` | Core billing engine |
| `@agencyos/vibe-payment` | Payment processing |
| `@agencyos/vibe-payment-router` | Multi-provider routing |
| `@agencyos/vibe-stripe` | Stripe-specific integration |
| `@agencyos/vibe-money` | Currency, formatting |
| `@agencyos/vibe-embedded-finance` | Banking-as-a-service |
| `@agencyos/vibe-subscription` | Subscription lifecycle |
| `@agencyos/vibe-revenue` | Revenue metrics |

## Usage

```typescript
import { BillingFacade, PaymentsFacade, SubscriptionsFacade } from '@agencyos/fintech-hub-sdk';
import { RevenueFacade } from '@agencyos/fintech-hub-sdk/revenue';
```

## Polar.sh Integration (Mandatory)

All AgencyOS projects use Polar.sh as payment provider. See `~/.claude/rules/payment-provider.md`.
