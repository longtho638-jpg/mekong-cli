---
title: "Phase 3: Stripe Integration"
description: "Stripe Checkout and Webhook Handling."
status: pending
priority: P1
effort: 2d
branch: feat/money-layer
tags: [stripe, payments, webhooks, api]
created: 2026-02-06
---

# Phase 3: Stripe Integration

## Context
Users purchase "Credit Packs" via Stripe. We use Stripe Checkout to handle the UI and secure processing. We listen to Webhooks to fulfill the order (credit the wallet).

## Architecture
-   **Flow:**
    1.  Client -> `POST /checkout/create` (with `pack_id`) -> Returns Stripe Session URL.
    2.  Client redirects user to Stripe.
    3.  User pays.
    4.  Stripe -> `POST /webhooks/stripe` (`checkout.session.completed`).
    5.  API verifies signature -> Finds User/Wallet -> Records Transaction (DEPOSIT).

## Implementation Steps

1.  **Stripe Client Wrapper**
    -   Create `app/services/stripe_service.py`.
    -   Initialize `stripe.api_key` from settings.
    -   Method: `create_checkout_session(user_email, price_id, metadata)`.
        -   Metadata MUST include `user_id` and `pack_id` for webhook reconciliation.
        -   Set `client_reference_id` to internal user ID if helpful.

2.  **Checkout Endpoint**
    -   `POST /api/v1/checkout/create`
    -   Input: `CheckoutCreateSchema` (pack_slug).
    -   Logic:
        -   Get current user.
        -   Look up `CreditPack` by slug.
        -   Call `stripe_service.create_checkout_session`.
        -   Return `{ "checkout_url": "..." }`.

3.  **Webhook Handler**
    -   `POST /api/v1/webhooks/stripe`
    -   **Critical:** Verify Stripe Signature (`stripe-signature` header) using the Webhook Secret.
    -   Event Filter: Handle `checkout.session.completed`.
    -   **Idempotency Logic:**
        -   Extract `session_id` from event.
        -   Check if `Transaction` exists with `reference_id == session_id`.
        -   If exists: Return 200 OK (Already processed).
        -   If not: Proceed.
    -   **Fulfillment:**
        -   Extract `metadata` (`user_id`, `pack_id`).
        -   Get `CreditPack` credit amount.
        -   Call `LedgerService.record_transaction(user_id, amount, type=DEPOSIT, reference_id=session_id)`.
    -   Return 200 OK.

4.  **Wallet Balance Endpoint**
    -   `GET /api/v1/wallets/me`
    -   Returns: `{ "balance": 500, "currency": "CREDITS" }`.

## Success Criteria
-   [ ] Creating a checkout session returns a valid Stripe URL.
-   [ ] Webhook successfully verifies signature.
-   [ ] Successful payment results in correct DB entries (Transaction + Wallet update).
-   [ ] Sending the same webhook payload twice does NOT result in double credits (Idempotency test).

## Todo List
-   [ ] Implement `StripeService` wrapper
-   [ ] Create Checkout Router & Endpoint
-   [ ] Implement Webhook Signature Verification
-   [ ] Implement Webhook Event Handling Logic
-   [ ] Integrate `LedgerService` into Webhook
-   [ ] Implement `GET /wallets/me`
