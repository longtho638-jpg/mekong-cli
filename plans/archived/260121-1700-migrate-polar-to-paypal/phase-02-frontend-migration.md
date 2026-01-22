# Phase 2: Frontend Migration

> **Focus**: Implementing the user-facing PayPal checkout.

## Context
Users currently click "Checkout" and get redirected to a Polar URL. We want to replace this with an embedded experience or a direct PayPal flow that feels native.

## Requirements
1.  **PayPal Component**:
    -   Use `@paypal/react-paypal-js` for robust Smart Buttons integration.
    -   Handle `createSubscription` (for recurring) and `createOrder` (for lifetime).
    -   Handle `onApprove` to show success message/redirect.
2.  **Checkout Page**:
    -   Replace `apps/web/app/checkout/page.tsx` content.
    -   Remove Polar toggle/logic.
    -   Show Plan details and PayPal button.
3.  **Dashboard Integration**:
    -   Update `PaymentCheckout.tsx` in the dashboard to use the same PayPal component.

## Implementation Steps

1.  **Install Dependency**:
    -   `npm install @paypal/react-paypal-js` in `apps/web` and `apps/dashboard`.
2.  **Create Component**:
    -   Create `apps/web/components/checkout/PayPalButton.tsx`.
    -   Configure with `clientId` from env.
3.  **Update Checkout Page**:
    -   Import `PayPalButton`.
    -   Pass the correct `plan_id` based on user selection.
4.  **Handle Success**:
    -   On `onApprove`, call backend to verify or simply redirect to `/success` (relying on webhook for actual provisioning).
    -   For better UX, maybe poll for subscription status or show a "Processing..." state.

## Files to Modify
-   `apps/web/app/checkout/page.tsx`
-   `apps/web/components/checkout/PayPalButton.tsx` (New)
-   `apps/dashboard/components/payments/PaymentCheckout.tsx`

## Success Criteria
-   [ ] User sees PayPal Smart Buttons on Checkout page.
-   [ ] Clicking button opens PayPal popup.
-   [ ] Successful payment triggers `onApprove`.
-   [ ] User is redirected to Success page.
