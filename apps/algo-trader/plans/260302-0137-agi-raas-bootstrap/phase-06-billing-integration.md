---
phase: 6
title: "Billing Integration"
status: pending
effort: 4h
parallel: false
depends_on: [5]
---

# Phase 6: Billing Integration (Polar.sh)

## Context

- Current: Tier field exists in TenantConfig (free/pro/enterprise) but not enforced
- Current: WebhookNotifier with HMAC exists but not connected to billing
- Goal: Polar.sh webhook integration for subscription lifecycle + tier enforcement
- Rule: Polar.sh is the ONLY payment provider (per payment-provider.md rule)

## Key Insights

- Polar.sh uses Standard Webhooks (svix) for event delivery
- Events: `subscription.created`, `subscription.updated`, `subscription.canceled`
- Existing `@agencyos/vibe-billing-trading` package may have Polar helpers
- Tier enforcement: middleware checks tenant.tier before allowing operations

## Requirements

### Functional
- Webhook endpoint: POST /api/v1/billing/webhook (verify Polar signature)
- On subscription.created: create tenant or upgrade tier
- On subscription.updated: update tier (free→pro, pro→enterprise)
- On subscription.canceled: downgrade to free, pause excess strategies
- Tier enforcement middleware: check max_strategies, max_daily_loss per tier

### Non-Functional
- Webhook verification < 5ms
- Idempotent event processing (dedup by event ID)

## Architecture

```
src/billing/
├── polar-webhook-handler.ts    # Verify + route Polar webhook events
├── tier-enforcement.ts         # Middleware: check tenant tier limits
├── subscription-sync.ts        # Map Polar subscription → tenant tier
└── types.ts                    # PolarEvent, SubscriptionPayload interfaces
```

## Tier Limits

| Tier | Max Strategies | Max Daily Loss | Live Trading | API Rate Limit |
|------|---------------|----------------|--------------|----------------|
| free | 1 | $100 | No (paper only) | 60 req/min |
| pro | 5 | $1,000 | Yes | 300 req/min |
| enterprise | unlimited | $10,000 | Yes + priority | 1000 req/min |

## Files to Create

| File | Purpose |
|------|---------|
| `src/billing/types.ts` | PolarWebhookEvent, SubscriptionPayload |
| `src/billing/polar-webhook-handler.ts` | Verify signature, parse event, route |
| `src/billing/subscription-sync.ts` | Map subscription product → tenant tier |
| `src/billing/tier-enforcement.ts` | Fastify preHandler: check tier limits |

## Files to Modify

| File | Change |
|------|--------|
| `src/api/server.ts` | Register /billing/webhook route (unauthenticated) |
| `src/api/routes/tenant-routes.ts` | Add tier enforcement preHandler |
| `src/api/routes/backtest-routes.ts` | Enforce backtest limits per tier |
| `src/db/queries/tenant-queries.ts` | Add updateTier() query |
| `package.json` | Add svix (Standard Webhooks verification) |

## Polar.sh Webhook Events

```typescript
interface PolarWebhookEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled';
  data: {
    id: string;
    customer: { email: string; metadata: { tenantId: string } };
    product: { id: string; name: string };  // Maps to tier
    status: 'active' | 'canceled' | 'past_due';
  };
}
```

## Product → Tier Mapping

```typescript
const PRODUCT_TIER_MAP: Record<string, TenantConfig['tier']> = {
  [process.env.POLAR_FREE_PRODUCT_ID ?? '']: 'free',
  [process.env.POLAR_PRO_PRODUCT_ID ?? '']: 'pro',
  [process.env.POLAR_ENTERPRISE_PRODUCT_ID ?? '']: 'enterprise',
};
```

## Implementation Steps

1. Install: `svix` (for Standard Webhooks verification)
2. Create `src/billing/types.ts` -- webhook event + subscription types
3. Create `src/billing/polar-webhook-handler.ts`:
   - Verify signature using `Webhook.verify(payload, headers, secret)`
   - Parse event type, extract tenantId from metadata
   - Route to subscription-sync
4. Create `src/billing/subscription-sync.ts`:
   - `handleSubscriptionCreated`: upsert tenant, set tier from product
   - `handleSubscriptionUpdated`: update tier
   - `handleSubscriptionCanceled`: downgrade to free, pause excess strategies
5. Create `src/billing/tier-enforcement.ts`:
   - Fastify preHandler reads tenant.tier
   - Check operation against TIER_LIMITS
   - 403 with upgrade message if exceeded
6. Register webhook route (no auth -- verified by signature)
7. Add tier enforcement to protected routes
8. Write tests

## Todo

- [ ] Install svix
- [ ] Create billing types
- [ ] Create webhook handler with signature verification
- [ ] Create subscription sync (create/update/cancel)
- [ ] Create tier enforcement middleware
- [ ] Register webhook route (unauthenticated)
- [ ] Wire tier enforcement to tenant/backtest routes
- [ ] Add product→tier mapping via env vars
- [ ] Write 8+ tests

## Tests

- `tests/billing/polar-webhook-handler.test.ts` -- valid sig, invalid sig, event routing
- `tests/billing/subscription-sync.test.ts` -- create→pro, cancel→free
- `tests/billing/tier-enforcement.test.ts` -- free blocked, pro allowed, enterprise unlimited

## Success Criteria

- [ ] Webhook verifies Polar signature (reject invalid)
- [ ] subscription.created creates/upgrades tenant tier
- [ ] subscription.canceled downgrades to free + pauses strategies
- [ ] Free tier blocked from live trading
- [ ] Pro tier limited to 5 strategies
- [ ] All existing tests pass

## Security

- Webhook secret from env `POLAR_WEBHOOK_SECRET`
- Signature verification mandatory (reject unsigned)
- Event ID deduplication prevents replay attacks
- Webhook endpoint has no auth (signature replaces auth)

## Risk

- **svix version:** Ensure compatible with Polar's Standard Webhooks implementation
- **Tenant ID in metadata:** Requires Polar checkout to include tenantId in customer metadata
- **Race condition:** Concurrent webhook + API request -- use DB transaction for tier update

## Env Vars Required

```
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_FREE_PRODUCT_ID=prod_...
POLAR_PRO_PRODUCT_ID=prod_...
POLAR_ENTERPRISE_PRODUCT_ID=prod_...
```
