# Phase 5: Billing Integration

## Overview
Integrate Stripe for subscription management. This is a high-value module for SaaS templates.

## Objectives
- [ ] Design Subscription Plan Cards.
- [ ] Build Payment History Table.
- [ ] Implement "Upgrade Plan" flow (Stripe Checkout mock).
- [ ] Invoice Download mock.

## Architecture
- **Stripe**: Use Stripe Elements or just link to Hosted Checkout for simplicity in template.
- **State**: Track `subscription_status` in user state.

## Implementation Steps

### 1. Billing Page
- `CurrentPlan` card (Plan name, Renewal date, Usage).
- `PaymentMethod` card (Last 4 digits, Expiry).

### 2. Pricing UI
- Create `PricingTable` component.
- Toggle: Monthly/Yearly.

### 3. Invoices
- Create `InvoiceTable` (Date, Amount, Status, Download PDF).

## Verification
- Plan switching updates the UI.
- Invoice list renders correctly.
- "Upgrade" button triggers action.
