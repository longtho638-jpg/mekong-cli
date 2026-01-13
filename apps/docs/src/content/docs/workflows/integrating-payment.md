---
title: Integrating Payment Processing
description: "Documentation"
section: workflows
category: workflows
order: 8
published: true
---

# Integrating Payment Processing

Learn how to integrate payment processing with AgencyOS - from one-time payments to subscriptions, webhooks, and revenue optimization.

## Overview

**Goal**: Implement secure payment processing with provider integration
**Time**: 25-50 minutes (vs 5-10 hours manually)
**Agents Used**: planner, researcher, tester, code-reviewer
**Commands**: /integrate:polar, /integrate:sepay, /cook, /test

## Prerequisites

- Existing application with user accounts
- Payment provider account (Stripe, Polar, etc.)
- SSL certificate (required for payments)
- Business/tax information configured

## Payment Providers

| Provider | Best For | Features | Setup Time |
|----------|----------|----------|------------|
| Stripe | Global, feature-rich | Cards, wallets, subscriptions | 20-30 min |
| Polar | Creator economy | Subscriptions, products | 15-25 min |
| PayPal | Global recognition | Cards, PayPal balance | 20-30 min |
| SePay | Vietnam market | Bank transfer, e-wallets | 15-20 min |
| Square | In-person + online | POS integration | 25-35 min |

## Step-by-Step Workflow

### Step 1: Choose Payment Provider

Select provider based on your needs:

```bash
# For SaaS subscriptions
/plan [integrate Stripe for subscription billing]

# For creator platforms
/integrate:polar

# For Vietnamese market
/integrate:sepay

# For general e-commerce
/plan [integrate Stripe with PayPal fallback]
```

### Step 2: Integrate Stripe (Most Common)

```bash
/cook [integrate Stripe payment processing with one-time and subscription payments]
```

**Implementation**:
```
[1/8] Setting up Stripe...
  ✓ Installed Stripe SDK
  ✓ Created Stripe configuration
  ✓ Added API keys to environment

[2/8] Database changes...
  ✓ Created Payment model
  ✓ Created Subscription model
  ✓ Added stripeCustomerId to User
  ✓ Migrations generated

[3/8] Payment endpoints...
  ✓ POST /api/payments/create-intent
  ✓ POST /api/payments/confirm
  ✓ GET /api/payments/:id
  ✓ GET /api/payments/history

[4/8] Subscription endpoints...
  ✓ POST /api/subscriptions/create
  ✓ POST /api/subscriptions/cancel
  ✓ POST /api/subscriptions/update
  ✓ GET /api/subscriptions/current

[5/8] Webhook handling...
  ✓ POST /api/webhooks/stripe
  ✓ Signature verification
  ✓ Event processing
  ✓ Idempotency handling

[6/8] Frontend components...
  ✓ Payment form component
  ✓ Stripe Elements integration
  ✓ Subscription management UI
  ✓ Payment history display

[7/8] Testing...
  ✓ Payment flow tests (24 tests)
  ✓ Webhook tests (16 tests)
  ✓ Subscription tests (18 tests)

[8/8] Documentation...
  ✓ Payment integration guide
  ✓ Webhook setup instructions
  ✓ Testing guide

✅ Stripe integration complete

Configuration needed (.env):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Generated files**:
```
src/
├── services/
│   ├── stripe.service.js
│   ├── payment.service.js
│   └── subscription.service.js
├── routes/
│   ├── payment.routes.js
│   ├── subscription.routes.js
│   └── webhook.routes.js
├── models/
│   ├── Payment.js
│   └── Subscription.js
├── middleware/
│   ├── stripe-webhook.middleware.js
│   └── payment-auth.middleware.js
└── utils/
    └── stripe-helpers.js

frontend/
├── components/
│   ├── PaymentForm.tsx
│   ├── SubscriptionCard.tsx
│   └── PaymentHistory.tsx
```

### Step 3: Implement One-Time Payments

```bash
# Already done in Step 2, but can add specific features
/cook [add invoice generation for one-time payments]
```

**Payment flow**:
```javascript
// Frontend
const handlePayment = async (amount, currency) => {
  // 1. Create payment intent
  const { clientSecret } = await fetch('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ amount, currency })
  }).then(r => r.json());

  // 2. Confirm with Stripe Elements
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    { payment_method: { card: cardElement } }
  );

  // 3. Handle result
  if (error) {
    showError(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    showSuccess('Payment successful!');
  }
};
```

### Step 4: Implement Subscriptions

```bash
/cook [implement subscription tiers with monthly and annual billing]
```

**Implementation**:
```
[1/5] Subscription plans...
  ✓ Created plan configuration
  ✓ Synced with Stripe products
  ✓ Price IDs configured

Plans created:
- Starter: $9/month or $90/year
- Pro: $29/month or $290/year
- Enterprise: $99/month or $990/year

[2/5] Subscription flow...
  ✓ Plan selection UI
  ✓ Subscription creation
  ✓ Trial period support (14 days)
  ✓ Proration handling

[3/5] Billing management...
  ✓ Update payment method
  ✓ Change plan (upgrade/downgrade)
  ✓ Cancel subscription
  ✓ Reactivate subscription

[4/5] Usage tracking...
  ✓ Feature access control
  ✓ Usage limits enforcement
  ✓ Overage handling

[5/5] Testing...
  ✓ Subscription tests (22 tests)

✅ Subscriptions implemented
```

### Step 5: Set Up Webhooks

Webhooks are critical for payment processing:

```bash
/cook [implement comprehensive Stripe webhook handling]
```

**Webhook events handled**:
```
✓ payment_intent.succeeded
  - Mark payment as successful
  - Grant access to product/service
  - Send confirmation email

✓ payment_intent.payment_failed
  - Notify user of failure
  - Log for investigation
  - Retry if temporary failure

✓ customer.subscription.created
  - Activate subscription
  - Grant feature access
  - Send welcome email

✓ customer.subscription.updated
  - Update subscription status
  - Adjust feature access
  - Handle plan changes

✓ customer.subscription.deleted
  - Deactivate subscription
  - Remove feature access
  - Send cancellation email

✓ invoice.payment_succeeded
  - Mark invoice as paid
  - Extend subscription period
  - Send receipt

✓ invoice.payment_failed
  - Notify user
  - Attempt retry
  - Suspend after final failure

✓ checkout.session.completed
  - Process successful checkout
  - Create customer record
  - Send confirmation
```

**Webhook security**:
```javascript
// Verify webhook signature
const verifyWebhook = (req) => {
  const signature = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  return event;
};
```

### Step 6: Add Payment Methods

```bash
/cook [add support for multiple payment methods - cards, Apple Pay, Google Pay]
```

**Implementation**:
```
[1/4] Payment methods...
  ✓ Credit/debit cards (Visa, MC, Amex)
  ✓ Apple Pay integration
  ✓ Google Pay integration
  ✓ Link (Stripe's payment method)

[2/4] Payment method management...
  ✓ Save cards for future use
  ✓ Multiple cards per customer
  ✓ Default payment method
  ✓ Remove payment methods

[3/4] Checkout optimization...
  ✓ Auto-detect payment method
  ✓ One-click checkout
  ✓ Remember me option

[4/4] Testing...
  ✓ Payment method tests (14 tests)

✅ Multiple payment methods added
```

### Step 7: Implement Polar (for Creators)

```bash
/integrate:polar
```

**Implementation**:
```
[1/6] Polar setup...
  ✓ Installed Polar SDK
  ✓ Created Polar configuration
  ✓ Connected to Polar API

[2/6] Product management...
  ✓ Digital products
  ✓ Subscriptions
  ✓ One-time purchases
  ✓ Tiered pricing

[3/6] Checkout flow...
  ✓ Polar Checkout integration
  ✓ Embedded checkout option
  ✓ Custom success pages

[4/6] Webhook handling...
  ✓ order.created event
  ✓ subscription.created event
  ✓ subscription.updated event
  ✓ refund.created event

[5/6] Customer portal...
  ✓ Subscription management
  ✓ Invoice history
  ✓ Update payment method

[6/6] Testing...
  ✓ Polar integration tests (18 tests)

✅ Polar integration complete

Configuration (.env):
POLAR_ACCESS_TOKEN=polar_...
POLAR_WEBHOOK_SECRET=whsec_...
```

### Step 8: Add Vietnamese Payment (SePay)

```bash
/integrate:sepay
```

**Implementation**:
```
[1/5] SePay integration...
  ✓ Bank transfer payments
  ✓ E-wallet support (Momo, ZaloPay)
  ✓ QR code generation
  ✓ Transaction verification

[2/5] Payment flow...
  ✓ Create payment request
  ✓ Display QR code
  ✓ Poll for payment status
  ✓ Auto-confirm on payment

[3/5] Webhook handling...
  ✓ Payment confirmed webhook
  ✓ Transaction updates
  ✓ Refund notifications

[4/5] Vietnamese localization...
  ✓ VND currency support
  ✓ Vietnamese language UI
  ✓ Local payment methods

[5/5] Testing...
  ✓ SePay tests (12 tests)

✅ SePay integration complete
```

### Step 9: Add Revenue Optimization

#### Coupon/Discount System

```bash
/cook [implement coupon and discount code system]
```

#### Abandoned Cart Recovery

```bash
/cook [add abandoned checkout email automation]
```

#### Upsell/Cross-sell

```bash
/cook [implement checkout upsells and product recommendations]
```

#### Tax Calculation

```bash
/cook [add automatic tax calculation with TaxJar integration]
```

### Step 10: Analytics and Reporting

```bash
/cook [implement payment analytics dashboard]
```

**Analytics features**:
```
✓ Revenue metrics (MRR, ARR)
✓ Subscription metrics (churn, LTV)
✓ Payment success rates
✓ Failed payment analysis
✓ Revenue forecasting
✓ Customer lifetime value
✓ Cohort analysis
✓ Geographic revenue breakdown
```

### Step 11: Testing Payments

```bash
/test
```

**Test coverage**:
```
✓ Unit Tests (46 tests)
  ✓ Payment intent creation (8 tests)
  ✓ Subscription logic (12 tests)
  ✓ Webhook processing (16 tests)
  ✓ Coupon validation (10 tests)

✓ Integration Tests (38 tests)
  ✓ End-to-end payment flows (14 tests)
  ✓ Subscription lifecycle (12 tests)
  ✓ Refund processing (6 tests)
  ✓ Multiple payment methods (6 tests)

✓ Security Tests (12 tests)
  ✓ Webhook signature verification (4 tests)
  ✓ Payment authorization (4 tests)
  ✓ Idempotency (4 tests)

Tests: 96 passed, 96 total
Coverage: 92.4%

✅ All payment tests passed
```

**Manual testing with test cards**:
```bash
# Stripe test cards
4242 4242 4242 4242  # Success
4000 0000 0000 9995  # Decline
4000 0000 0000 3220  # 3D Secure

# Test in Stripe Dashboard
# Monitor webhook delivery
# Verify payment flow
```

### Step 12: Deploy to Production

```bash
# Switch to production keys
# Update .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Deploy
/cook [deploy payment integration to production with security review]
```

## Complete Example: SaaS Subscription Platform

### Requirements

```
Implement payment system for SaaS platform:
- Three subscription tiers
- Monthly and annual billing
- 14-day free trial
- Usage-based add-ons
- Team billing
- Invoice generation
- Automatic tax calculation
- Multiple payment methods
- Dunning management (failed payments)
```

### Implementation

```bash
# Plan implementation
/plan [design payment system for SaaS with all requirements]

# Integrate Stripe (use /code since plan exists)
/code @plans/payment-system.md

# Subscription tiers
/cook [create three subscription tiers with feature gates]

# Free trial
/cook [implement 14-day free trial without requiring payment method]

# Usage billing
/cook [add usage-based billing for API calls]

# Team billing
/cook [implement team billing with seat management]

# Invoicing
/cook [add automatic invoice generation and email delivery]

# Tax calculation
/cook [integrate TaxJar for automatic tax calculation]

# Payment methods
/cook [add card, Apple Pay, Google Pay, and ACH support]

# Dunning
/cook [implement smart retry logic for failed payments]

# Test everything
/test

# Deploy
/cook [deploy to production with monitoring]
```

### Time Comparison

**Manual implementation**: 8-14 hours
- Stripe integration: 2-3 hours
- Subscription logic: 2-3 hours
- Webhooks: 2-3 hours
- UI components: 1-2 hours
- Testing: 1-2 hours
- Debugging: 1-2 hours

**With AgencyOS**: 48 minutes
- Planning: 6 minutes
- Stripe setup: 15 minutes
- Subscriptions: 12 minutes
- Webhooks: 8 minutes
- Testing: 7 minutes

**Time saved**: 7-13 hours (88% faster)

## Payment Patterns

### Pattern 1: Freemium Model

```bash
/cook [implement freemium model with upgrade prompts]
```

### Pattern 2: Pay-What-You-Want

```bash
/cook [add pay-what-you-want pricing with suggested amounts]
```

### Pattern 3: Tiered Pricing

```bash
/cook [implement dynamic tiered pricing based on usage]
```

### Pattern 4: Marketplace Payments

```bash
/cook [implement marketplace payments with split payouts using Stripe Connect]
```

## Best Practices

### 1. Idempotency

```javascript
// Ensure operations are idempotent
const createPayment = async (idempotencyKey, data) => {
  return stripe.paymentIntents.create(data, {
    idempotencyKey
  });
};
```

### 2. Webhook Retry Logic

```javascript
// Handle webhook retries gracefully
const processWebhook = async (event) => {
  // Check if already processed
  const existing = await Webhook.findOne({
    eventId: event.id
  });

  if (existing) {
    return { status: 'already_processed' };
  }

  // Process and save
  await processEvent(event);
  await Webhook.create({ eventId: event.id });
};
```

### 3. Failed Payment Handling

```bash
/cook [implement dunning management with smart retry and email notifications]
```

### 4. PCI Compliance

```
✓ Never store card details
✓ Use Stripe Elements (PCI-compliant)
✓ Tokenize payment info
✓ HTTPS everywhere
✓ Regular security audits
```

### 5. Transaction Monitoring

```bash
/cook [add fraud detection and transaction monitoring]
```

## Troubleshooting

### Issue: Webhook Not Receiving Events

**Solution**:
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Or fix with AgencyOS
/fix:fast [Stripe webhooks not being received]
```

### Issue: Payment Failing

**Solution**:
```bash
/fix:logs [analyze payment failure logs and fix issues]
```

### Issue: Double Charging

**Solution**:
```bash
/fix:fast [prevent double charging with idempotency keys]
```

### Issue: Tax Calculation Wrong

**Solution**:
```bash
/fix:fast [tax calculation incorrect for Canadian customers]
```

## Security Checklist

Before production:

```bash
✓ Using production API keys
✓ Webhook signatures verified
✓ HTTPS enforced
✓ No card data stored
✓ Stripe Elements used (PCI compliant)
✓ Idempotency keys implemented
✓ Rate limiting on payment endpoints
✓ Transaction logging enabled
✓ Fraud detection configured
✓ 3D Secure enabled for EU
✓ Refund policy documented
✓ Terms of service updated
✓ Privacy policy includes payment info
✓ GDPR compliance for EU customers
✓ Error messages don't leak info
✓ Audit logging enabled
✓ Failed payment retry logic
✓ Customer dispute handling process
```

## Next Steps

### Related Use Cases
- [Implementing Authentication](/docs/workflows/implementing-auth) - User accounts
- [Building a REST API](/docs/workflows/building-api) - API development
- [Adding a New Feature](/docs/workflows/adding-feature) - Feature development

### Related Commands
- [/integrate:polar](/docs/commands/integrate/polar) - Polar integration
- [/integrate:sepay](/docs/commands/integrate/sepay) - SePay integration
- [/cook](/docs/commands/core/cook) - Custom features
- [/test](/docs/commands/core/test) - Test suite

### Further Reading
- [Stripe Documentation](https://stripe.com/docs)
- [Polar Documentation](https://docs.polar.sh)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [SCA Regulations](https://stripe.com/guides/strong-customer-authentication)

---

**Key Takeaway**: AgencyOS enables rapid payment integration with built-in security, webhook handling, and best practices - from simple one-time payments to complex subscription systems in under an hour.

---

## 🏯 Binh Pháp Alignment

> **作戰篇** (Tác Chiến) - Waging war - Resource efficiency

### Zero-Effort Commands

Thay vì làm từng bước, dùng commands tự động:

| Gõ lệnh | Agent tự động làm |
|---------|-------------------|
| `/plan` | Tự tạo implementation plan |
| `/code` | Tự implement theo plan |
| `/ship` | Tự test, review, deploy |

### Related Sync Commands

```bash
# Sync patterns từ Antigravity
/sync-all
```

📖 [Xem tất cả Sync Commands](/docs/commands/sync-commands)
