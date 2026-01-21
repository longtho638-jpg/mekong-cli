# Scout Report: PayPal Implementation

**Date**: 2026-01-21
**Agent**: Antigravity Scout (a436f3f)

## Executive Summary
PayPal implementation is present across both the frontend (Next.js) and backend (FastAPI/Python). It follows a unified pattern where PayPal, Stripe, and Gumroad are abstracted. The system uses raw REST API v2 calls rather than official SDK packages in the frontend.

## 1. Backend Implementation (Python)
- **Custom SDK**: Located in `core/finance/paypal_sdk/`. Implements `orders.py` and `webhooks.py` using `requests`.
- **Gateway**: `core/finance/gateways/paypal.py` provides a `PayPalClient` for higher-level operations.
- **Unified Service**: `backend/services/payment_service.py` wraps the SDK. It handles:
  - `create_checkout_session`: Routes to PayPal order creation.
  - `verify_webhook`: Verifies signatures using the custom SDK.
  - `handle_webhook_event`: Processes `BILLING.SUBSCRIPTION.ACTIVATED` and `CANCELLED`.
- **API Router**: `backend/api/routers/paypal_webhooks.py` exposes the webhook endpoint.

## 2. Frontend Implementation (Next.js)
- **Client Library**: `newsletter-saas/src/lib/paypal/client.ts` contains raw `fetch` wrappers for:
  - `getAccessToken`
  - `createOrder`
  - `captureOrder`
  - `getClientToken` (SDK v6 support)
- **API Routes**:
  - `app/api/billing/checkout/route.ts`: Initiates PayPal orders.
  - `app/api/billing/capture/route.ts`: Finalizes transactions.
  - `app/api/billing/webhook/route.ts`: Handles async notifications.
- **UI Components**:
  - `app/pricing/page.tsx`: Triggers checkout via redirect flow.
  - **Note**: No evidence of `@paypal/react-paypal-js` or Smart Buttons found in `package.json` or components; currently uses a redirect-based flow.

## 3. Database Schema
- **Migration**: `supabase/migrations/20260121_add_paypal_fields.sql`
- **Tables affected**:
  - `subscriptions`: Added `paypal_subscription_id`, `paypal_order_id`, `paypal_payer_email`.
  - `payments`: Added `paypal_capture_id`.

## 4. Webhooks & Security
- **Verifier**: `newsletter-saas/src/app/api/billing/webhook/paypal-webhook-verifier.ts` implements signature verification for the Next.js side.
- **Tests**: `newsletter-saas/src/__tests__/payment-security.test.ts` covers webhook verification logic.

## Unresolved Questions
1. Is there a plan to move to the official PayPal JS SDK for a better UI experience (Smart Buttons)?
2. The `PaymentService` currently defaults to "PRO" plan in webhooks; does this need a dynamic mapping from PayPal Plan IDs?
3. Are there any legacy PayPal implementations (found in `scripts/legacy/`) that need to be fully deprecated?
