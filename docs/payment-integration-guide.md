# Stripe Payment Integration Guide

## Overview

This module provides a production-ready Stripe integration for Agency OS, supporting:
- Subscription Checkout (Solo, Team, Enterprise tiers)
- Customer Portal for self-service billing
- Webhook handling with signature verification
- Invoice management and payment failure recovery
- Automated license generation upon successful payment

## Configuration

Ensure the following environment variables are set in your `.env` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product Price IDs (Create these in Stripe Dashboard)
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

## API Reference

### 1. Create Checkout Session

**Endpoint:** `POST /payments/stripe/checkout`

Initiates a checkout session for a new subscription.

**Request Body:**
```json
{
  "plan_id": "solo",          // "solo", "team", "enterprise" or specific price_id
  "tenant_id": "tenant_123",  // Internal Tenant ID
  "success_url": "https://app.agencyos.network/dashboard?checkout=success",
  "cancel_url": "https://app.agencyos.network/pricing?checkout=cancel",
  "customer_email": "user@example.com", // Optional: Pre-fill email
  "trial_days": 14            // Optional: Free trial period
}
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

### 2. Create Portal Session

**Endpoint:** `POST /payments/stripe/portal`

Creates a session for the Stripe Customer Portal where users can manage payment methods and subscriptions.

**Request Body:**
```json
{
  "customer_id": "cus_...",
  "return_url": "https://app.agencyos.network/settings/billing"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/login/..."
}
```

### 3. Webhook Endpoint

**Endpoint:** `POST /payments/stripe/webhook`

Handles asynchronous events from Stripe. Requires `Stripe-Signature` header.

**Supported Events:**
- `checkout.session.completed`: Provisions tenant and generates license.
- `invoice.payment_succeeded`: Records successful payment.
- `invoice.payment_failed`: Triggers dunning/notification.
- `customer.subscription.created/updated/deleted`: Syncs subscription status.

### 4. Subscription Management

**Endpoint:** `GET /payments/stripe/subscription/{subscription_id}`
**Endpoint:** `POST /payments/stripe/subscription/{subscription_id}/cancel`

Manage existing subscriptions directly via API.

## Database Schema

The integration uses the following tables:

- **payment_events**: Stores raw webhook events for audit and idempotency.
- **licenses**: Stores generated licenses linked to subscriptions.
- **invoices** (Optional): Local cache of invoice data.

See `backend/database/migrations/20260127_001_payment_events.sql` for schema definitions.

## Testing

Run the test suite to verify integration:

```bash
pytest backend/tests/test_stripe_integration.py
```

## Troubleshooting

- **Webhook Signature Error**: Ensure `STRIPE_WEBHOOK_SECRET` matches the secret provided by Stripe CLI or Dashboard for the specific endpoint URL.
- **Price Not Found**: Verify `STRIPE_PRICE_*` variables match the Price IDs (not Product IDs) in Stripe Dashboard.
- **Customer Not Found**: Ensure the `customer_id` passed to the portal endpoint exists in the configured Stripe account (Live vs Test mode).
