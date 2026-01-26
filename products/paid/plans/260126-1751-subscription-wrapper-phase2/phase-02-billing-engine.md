# Phase 02: Billing Engine

## Overview
Implement the payment processing logic using Adapter pattern to support both Stripe and Paddle.

## Objectives
- Implement `StripeBillingAdapter`.
- Implement `PaddleBillingAdapter`.
- Create a unified `BillingService` facade.

## Implementation Steps
1.  **Stripe Adapter** (`billing/stripe-subscription.ts`):
    - Initialize Stripe client.
    - Map internal Tiers (Starter, Pro, Agency) to Stripe Price IDs.
    - Implement webhook handler for `invoice.payment_succeeded`.
2.  **Paddle Adapter** (`billing/paddle-subscription.ts`):
    - Implement equivalent logic for Paddle (as fallback/alternative).
3.  **Billing Facade**:
    - `switchProvider(provider: 'stripe' | 'paddle')`.
    - `getSubscriptionStatus(customerId)`.
4.  **Tests**:
    - Mock API responses.
    - Verify correct Price ID mapping.

## Code Structure
```typescript
interface IBillingAdapter {
  createCheckoutSession(tier: Tier, customerEmail: string): Promise<string>;
  verifyWebhook(signature: string, payload: any): Promise<PaymentEvent>;
}
```

## Deliverables
- [ ] `stripe-subscription.ts` implemented.
- [ ] `paddle-subscription.ts` implemented.
- [ ] `billing-factory.ts` (Factory pattern).
- [ ] Unit tests for adapters.
