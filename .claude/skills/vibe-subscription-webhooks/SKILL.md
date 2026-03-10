---
name: vibe-subscription-webhooks
description: Subscription lifecycle webhook SDK — event routing, status transitions, grace period, dunning. Use for subscription webhook processing, lifecycle management, churn prevention.
license: MIT
version: 1.0.0
---

# Vibe Subscription Webhooks Skill

Process subscription lifecycle webhooks with event routing, status transition validation, and dunning management.

## When to Use

- Subscription webhook handler setup
- Lifecycle event routing (created, renewed, cancelled, expired)
- Status transition validation (state machine)
- Grace period management for past-due subscriptions
- Trial ending warnings and dunning flows
- Multi-provider subscription events (PayOS, Stripe, Polar)

## SDK Architecture

| Sub-path | Module | Purpose |
|----------|--------|---------|
| `@agencyos/vibe-subscription-webhooks/handler` | SubscriptionWebhookHandler | Main handler with callbacks |
| `@agencyos/vibe-subscription-webhooks/router` | SubscriptionEventRouter | Event parsing + transition validation |
| `@agencyos/vibe-subscription-webhooks/types` | Types | Event, config, result types |

## Supported Events

| Event | Callback | Description |
|-------|----------|-------------|
| `subscription.created` | `onCreated` | New subscription activated |
| `subscription.updated` | `onUpdated` | Plan/quantity changed |
| `subscription.cancelled` | `onCancelled` | User cancelled |
| `subscription.renewed` | `onRenewed` | Recurring payment succeeded |
| `subscription.past_due` | `onPastDue` | Payment failed, grace period started |
| `subscription.paused` | `onPaused` | Subscription paused |
| `subscription.resumed` | `onResumed` | Subscription resumed from pause |
| `subscription.trial_ending` | `onTrialEnding` | Trial ending soon |
| `subscription.expired` | `onExpired` | Grace period exceeded |

## Usage

```typescript
import { createSubscriptionWebhookHandler } from '@agencyos/vibe-subscription-webhooks/handler';

const handler = createSubscriptionWebhookHandler({
  gracePeriodDays: 3,
  trialWarningDays: 3,
  strictTransitions: true,
  callbacks: {
    onCreated: async (e) => { await db.activateSubscription(e.subscriptionId) },
    onCancelled: async (e) => { await db.revokeAccess(e.userId) },
    onPastDue: async (e) => { await notify.sendDunningEmail(e.userId) },
    onExpired: async (e) => { await db.deactivateSubscription(e.subscriptionId) },
  },
});

const result = await handler.handle(rawPayload, 'payos');
```

## State Machine

```
trial → active → past_due → expired
                ↓           ↑
              paused ─────→ active
                ↓
              cancelled
```

## Related Skills

- `billing-orchestration` — Full webhook pipeline
- `webhook-billing-sdk` — Unified billing webhook facade
- `billing-sdk` — Core billing patterns
- `subscription-saas-ops` — SaaS subscription operations
