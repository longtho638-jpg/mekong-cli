# Phase 1: Backend Unification

> **Focus**: Centralizing payment logic in the FastAPI backend.

## Context
Currently, payment logic is split between Next.js API routes (Polar) and Python backend (PayPal/Stripe). We need to consolidate everything into `backend/services/payment_service.py` using the `core/finance/paypal_sdk`.

## Requirements
1.  **Payment Service**:
    -   Method to create a PayPal Order/Subscription.
    -   Method to cancel a subscription.
    -   Method to verify a transaction.
2.  **Webhook Handler**:
    -   Listen for `PAYMENT.CAPTURE.COMPLETED` (One-time).
    -   Listen for `BILLING.SUBSCRIPTION.ACTIVATED` (Recurring).
    -   Listen for `BILLING.SUBSCRIPTION.CANCELLED`.
3.  **Licensing**:
    -   Upon successful payment, generate a license key using `core.licensing`.
    -   Update Supabase `subscriptions` and `licenses` tables.

## Implementation Steps

1.  **Review PayPal SDK**:
    -   Check `core/finance/paypal_sdk` capabilities. Ensure it supports Subscriptions API (v1) and Orders API (v2).
2.  **Update `payment_service.py`**:
    -   Add `create_paypal_subscription(plan_id: str, user_id: str)`
    -   Add `handle_paypal_webhook_event(event: dict)`
3.  **Update `paypal_webhooks.py`**:
    -   Ensure the route `/api/webhooks/paypal` is active.
    -   Verify webhook signature (security).
    -   Delegate event processing to `payment_service.py`.
4.  **Database Integration**:
    -   Ensure `subscriptions` table is updated with `paypal_subscription_id`, `status`, `current_period_end`.

## Files to Modify
-   `backend/services/payment_service.py`
-   `backend/api/routers/paypal_webhooks.py`
-   `core/finance/paypal_sdk/client.py` (if updates needed)

## Success Criteria
-   [ ] Backend can create a valid PayPal subscription payload.
-   [ ] Webhook endpoint correctly validates and processes a mock PayPal event.
-   [ ] Database reflects the new subscription status after a webhook call.
