# Phase 05: Customer Portal

## Overview
Self-service React dashboard for customers to manage their subscriptions and licenses.

## Objectives
- Build MD3-compliant UI components.
- Implement Subscription Manager.
- Implement Support Ticket interface.

## Implementation Steps
1.  **Dashboard Shell** (`portal/customer-dashboard.tsx`):
    - Sidebar navigation.
    - Authentication state.
2.  **Subscription Manager** (`portal/subscription-manager.tsx`):
    - View Plan details.
    - Upgrade/Downgrade buttons (linked to Billing).
    - View Invoices.
3.  **License Management**:
    - List active seats.
    - "Revoke" button to free up seats.
4.  **Support Tickets** (`portal/support-tickets.tsx`):
    - Form to submit tickets.
    - List of past tickets status.

## Tech Stack
- React, Tailwind CSS (MD3 preset).
- Lucide React (Icons).

## Deliverables
- [ ] Dashboard UI components.
- [ ] Subscription management flow.
- [ ] License seat management UI.
- [ ] Support form.
