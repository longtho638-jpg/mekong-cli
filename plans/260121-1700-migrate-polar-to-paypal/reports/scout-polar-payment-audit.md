# 🧊 Polar & Payment Implementation Scout Report

## 1. Polar SDK Usage & Configuration
The codebase uses the `@polar-sh/sdk` for Node.js/Next.js. Configuration is primarily driven by environment variables defined in `apps/web/POLAR_SETUP.md`.

*   **SDK Initialization**: `new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN })`
*   **Checkout Creation**: Uses `polar.checkouts.create` with product IDs and metadata for tier selection.
*   **Webhook Verification**: Uses `polar.webhooks.verify` or `validateEvent` from `@polar-sh/sdk/webhooks`.

**Key Configuration Files:**
*   `/Users/macbookprom1/mekong-cli/apps/web/POLAR_SETUP.md`: The "Source of Truth" for setting up Polar products and environment variables.
*   `/Users/macbookprom1/mekong-cli/backend/api/config/settings.py`: Contains `polar_webhook_secret` definition for the Python backend.

## 2. Payment Endpoints & Webhooks
The implementation is currently fragmented across multiple applications, indicating some technical debt in how webhooks are handled.

### API Endpoints
*   `POST /api/create-checkout`: Found in `apps/web/app/api/create-checkout/route.ts`. Handles the initial redirect to Polar.
*   `POST /api/get-license`: Found in `apps/web/app/api/get-license/route.ts`. Fetches or generates a license after a successful checkout.

### Webhooks (Fragmented Implementation)
*   **Dashboard Webhook**: `apps/dashboard/app/api/polar/webhook/route.ts`
    *   Handles `subscription.created`, `subscription.updated`, and `subscription.canceled`.
    *   Updates the `agencies` and `subscriptions` tables in Supabase.
*   **Docs Webhook**: `apps/docs/api/webhook/polar.ts`
    *   Handles `order.created` (one-time purchases).
    *   Generates license keys and grants "AG Credits" (TÍCH SẢN) to affiliates.
    *   Sends welcome emails.
*   **Mekong Docs Webhook**: `mekong-docs/api/webhook/polar.ts` (Duplicate of the above).

## 3. Frontend Checkout Components
The frontend uses a mix of unified components and specific implementations.

*   `/Users/macbookprom1/mekong-cli/apps/dashboard/components/payments/PaymentCheckout.tsx`: A unified component that switches between Braintree, PayPal, and Stripe. **Note: It currently lacks a specific case for Polar**, often mapping other gateways to a Stripe-like flow.
*   `/Users/macbookprom1/mekong-cli/apps/web/app/checkout/page.tsx`: A direct implementation of a Polar vs. Braintree toggle.
*   `/Users/macbookprom1/mekong-cli/apps/web/app/success/page.tsx`: Success page that displays the generated license key.

## 4. Database Models (Supabase)
The schema has been updated to support Polar alongside Stripe and PayPal.

*   **`public.subscriptions`**: Contains `polar_subscription_id` and `polar_customer_id`.
*   **`public.licenses`**: Contains `polar_order_id` and `polar_customer_id`.
*   **`public.tier_limits`**: A view defining quotas for `starter`, `pro`, `franchise`, and `enterprise` tiers.

**Schema File**: `/Users/macbookprom1/mekong-cli/apps/docs/supabase/migrations/20251233_subscriptions_schema.sql`

## 5. Technical Debt & TODOs
The most significant debt is the lack of a unified backend service for Polar.

*   **Backend Gap**: `backend/services/payment_service.py` abstracts Stripe, PayPal, and Gumroad but **does not include Polar**.
*   **Webhook Fragmentation**: Logic for processing successful orders (license generation, email sending) is duplicated or split between `apps/docs` and `apps/dashboard`.
*   **Licensing Divergence**:
    *   `core/licensing/logic/engine.py` can generate `mekong` and `agencyos` format keys.
    *   Webhooks in `apps/docs` use a manual `generateLicenseKey()` function instead of the core engine.
*   **TODOs Found**:
    *   `apps/dashboard/app/api/polar/webhook/route.ts`: Uses `stripe_customer_id` field to store Polar IDs as a workaround.
    *   `apps/web/app/api/get-license/route.ts`: Contains TODOs for querying Supabase for existing licenses instead of always regenerating.

## 6. Key Files to Modify/Replace
If consolidating the payment flow, focus on these:
1.  **Consolidate**: `backend/services/payment_service.py` (Add Polar support).
2.  **Unify**: `apps/dashboard/app/api/polar/webhook/route.ts` and `apps/docs/api/webhook/polar.ts` (Merge into a single robust handler).
3.  **Refactor**: `apps/dashboard/components/payments/PaymentCheckout.tsx` (Add explicit Polar support).
4.  **Standardize**: Ensure all license generation uses `core.licensing.logic.engine.LicenseGenerator`.
