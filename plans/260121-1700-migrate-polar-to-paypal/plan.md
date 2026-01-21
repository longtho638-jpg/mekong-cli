---
title: "Migrate Polar to PayPal & Eliminate Technical Debt"
description: "Replace the fragmented Polar payment system with a unified PayPal implementation, consolidating logic into the backend and cleaning up technical debt."
status: in_progress
priority: P1
effort: 16h
branch: feat/migrate-polar-to-paypal
tags: [payment, paypal, polar, refactor, backend, frontend]
created: 2026-01-21
---

# 💸 Migrate Polar to PayPal & Eliminate Technical Debt

> **Goal**: Unify payment processing by removing the fragmented Polar integration and establishing PayPal as the primary payment provider with a clean, centralized backend architecture.

## 🏗️ Architecture Design

### 1. Backend Centralization (Python/FastAPI)
The `backend/services/payment_service.py` will become the Single Source of Truth for all payment interactions.
- **PayPal SDK**: Use existing `core/finance/paypal_sdk` for API interactions.
- **Webhook Handler**: Enhance `backend/api/routers/paypal_webhooks.py` to handle subscription lifecycle events (Activation, Cancellation, Payment Failure).
- **License Generation**: Trigger `core.licensing.logic.engine.LicenseGenerator` upon successful payment webhook.

### 2. Frontend Modernization (Next.js)
Replace the redirection-based Polar flow with a seamless PayPal experience.
- **Smart Buttons**: Implement PayPal Smart Buttons in `apps/web/app/checkout/page.tsx` for better UX.
- **Component Update**: Refactor `apps/dashboard/components/payments/PaymentCheckout.tsx` to support the new PayPal flow.
- **API Removal**: Delete local Next.js API routes (`api/create-checkout`, `api/get-license`) in favor of direct calls to the Python backend or client-side SDK integration.

### 3. Debt Elimination
- **Remove**: `@polar-sh/sdk` dependency.
- **Delete**: `apps/web/POLAR_SETUP.md`.
- **Clean**: Remove duplicate webhook handlers in `apps/dashboard` and `apps/docs`.

## 📋 Execution Plan

### Phase 1: Backend Unification 🐍
**Objective**: Prepare the backend to handle the full PayPal lifecycle.
- [x] **SDK Enhancement**: Create `core/finance/paypal_sdk/subscriptions.py` to handle PayPal Subscriptions API (create, get, cancel, suspend/resume).
- [x] **Service Update**: Update `backend/services/payment_service.py` to use the new SDK module and expose methods for `cancel_subscription`, `refund_payment`, and `get_subscription`.
- [x] **Webhook Consolidation**: Refactor `backend/services/payment_service.py` and `backend/services/webhook_handlers.py` to eliminate logic duplication and ensure `LicenseGenerator` is triggered correctly.
- [x] **Plan Sync Script**: Create `scripts/setup/sync_paypal_plans.py` to verify/create PayPal Plans (P-STARTER, P-PRO) and ensure they match DB configurations.

### Phase 2: Frontend Migration & API Integration ⚛️
**Objective**: Switch the UI to use PayPal and add subscription API support.
- [x] Explore existing frontend checkout components.
- [x] Backend: Add `/payments/paypal/create-subscription` endpoint to `backend/api/routers/payments.py`.
- [x] Backend: Enhance `PaymentService.create_checkout_session` to handle real PayPal subscription creation.
- [x] Frontend: Update `PayPalCheckout` to support `plan_id` and subscription flow.
- [x] Frontend: Refactor `apps/web/app/checkout/page.tsx` to use the unified `PaymentCheckout` or the updated `PayPalCheckout`.
- [x] Frontend: Update `apps/dashboard/components/payments/PaymentCheckout.tsx` with subscription management UI (Cancel/Resume).

### Phase 3: Cleanup & Test 🧹
**Objective**: Remove old code and verify the new system.
- [x] Remove `@polar-sh/sdk` and related files.
- [x] Delete `POLAR_SETUP.md` and old API routes.
- [x] E2E Test the full flow: Checkout -> Payment -> Webhook -> License -> Access.
- [x] Final project status assessment.
