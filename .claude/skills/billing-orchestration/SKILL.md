# Billing Orchestration

End-to-end billing webhook processing pipeline — from signature verification to subscription activation, tenant binding, and analytics tracking.

## When to Use
- Building payment webhook handlers for PayOS, Stripe, or Polar
- Implementing subscription activation after payment confirmation
- Creating multi-tenant billing with org-scoped subscriptions
- Adding payment analytics dashboards with revenue metrics

## Key Concepts
- **Autonomous Webhook Pipeline**: Signature verify → idempotency check → state machine → event routing → side effects
- **Status State Machine**: `PENDING → PAID | CANCELLED`, terminal states block re-processing
- **Idempotency Guards**: Event log table (INSERT OR IGNORE) or optimistic locking (WHERE status = 'pending')
- **Provider-Agnostic Core**: `VibePaymentProvider` interface — implement per gateway (PayOS, Stripe, Polar)
- **Tenant Resolution**: Subscription intent → org binding → tenant context for multi-org SaaS
- **Fire-and-Forget Side Effects**: Non-blocking notifications wrapped in `.catch()`

## AgencyOS SDK Packages
| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-payment` | Provider-agnostic payment SDK (PayOS + Stripe factory) |
| `@agencyos/vibe-payos-billing-types` | Pure types for PayOS webhook data, orchestration, analytics |
| `@agencyos/vibe-subscription-webhooks` | Subscription lifecycle event handler + status transitions |
| `@agencyos/webhook-billing-sdk` | Unified facade: webhook + billing hooks + subscription engine |
| `@agencyos/vibe-stripe` | Stripe adapter + webhook handler |
| `@agencyos/vibe-subscription` | Plan management, trial logic, proration, churn prevention |
| `@agencyos/fintech-hub-sdk` | Hub aggregator: Billing + Payments + Subscriptions + Revenue |

## Implementation Patterns

### Webhook Handler (Edge Function)
```typescript
import { createPaymentProvider } from '@agencyos/vibe-payment';
import { orchestrateBillingWebhook, createBillingWebhookConfig } from '@agencyos/vibe-payment';

const provider = createPaymentProvider('payos', { supabase });
const config = createBillingWebhookConfig({ webhookSecret, checksumKey });
const result = await orchestrateBillingWebhook(provider, payload, signature, config, deps);
```

### Subscription Webhook Handler
```typescript
import { createSubscriptionWebhookHandler } from '@agencyos/vibe-subscription-webhooks';

const handler = createSubscriptionWebhookHandler({
  callbacks: {
    onCreated: async (e) => activateAccess(e.subscriptionId),
    onCancelled: async (e) => revokeAccess(e.userId),
    onPastDue: async (e) => sendDunningEmail(e.userId),
  },
  gracePeriodDays: 3,
});
```

### Unified Multi-Provider
```typescript
import { createWebhookBillingHandler } from '@agencyos/webhook-billing-sdk';

const handler = createWebhookBillingHandler({
  providers: { stripe: stripeHandler, polar: polarHandler },
  idempotency: redisStore,
  audit: sentryLogger,
});
const result = await handler.autoHandle(rawBody, headers); // auto-detects provider
```

## References
- PayOS API: https://payos.vn/docs
- Polar.sh Webhooks: https://docs.polar.sh/api/webhooks
- Stripe Webhooks: https://stripe.com/docs/webhooks
