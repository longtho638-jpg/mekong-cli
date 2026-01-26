# Security Guide

Security is critical when handling payments. This kit follows industry best practices to ensure your integration is secure.

## 1. Webhook Signature Verification

**Mandatory Requirement**: All incoming webhooks must be verified to ensure they originated from Stripe.

This kit provides `verifyStripeWebhook` in `backend/lib/webhook-verification.ts`. This function uses the raw request body and the `Stripe-Signature` header to validate the event against your `STRIPE_WEBHOOK_SECRET`.

**Why is this important?**
Without verification, an attacker could send fake "payment succeeded" events to your webhook endpoint, granting them free access to your product.

## 2. Environment Variables

*   **Never commit `.env` files** to version control.
*   Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in secure environment variables on your server (e.g., Vercel Environment Variables, AWS Secrets Manager).
*   The `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose in the browser, but it cannot be used for privileged operations like creating products or listing all customers.

## 3. PCI Compliance

This kit uses **Stripe Elements** (`@stripe/react-stripe-js`).

*   Card details are sent directly from the user's browser to Stripe's servers.
*   Your server **never** touches raw credit card numbers (PANs).
*   This qualifies you for **SAQ A** (the simplest level of PCI compliance).

**Do NOT** attempt to create your own form inputs for credit card numbers. Always use the provided `PaymentElement` or `CardElement` components.

## 4. Rate Limiting

While Stripe sends webhooks reliably, you should ensure your webhook endpoint can handle bursts of traffic.

*   Consider implementing rate limiting on your API routes if you are worried about DoS attacks, but be careful not to block legitimate Stripe IPs.
*   Stripe retries webhooks for up to 3 days if your server returns an error (non-2xx status code). Ensure your handlers are **idempotent** (handling the same event ID twice should not cause side effects like double-shipping).

## 5. HTTPS

Stripe requires webhook endpoints to use HTTPS in production. Ensure your deployment platform enforces SSL/TLS.
