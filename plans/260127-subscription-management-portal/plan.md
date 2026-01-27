# Plan: Subscription Management Portal

## Context
Build a complete subscription management portal with upgrade/downgrade capabilities and billing history.
Target: `products/paid/subscription-management-portal`

## Requirements
- **Frontend**: Next.js 14+, Tailwind, MD3
- **Backend**: FastAPI, Stripe, Python 3.11+
- **Database**: Supabase (Postgres)
- **Compliance**: VIBE Standards, MD3 Strict Mode

## Phase 1: Project Setup & Database
- [ ] Initialize Frontend (Next.js)
- [ ] Initialize Backend (FastAPI)
- [ ] Create Database Migrations (Supabase)
    - `subscriptions`
    - `invoices`
    - `payment_methods`

## Phase 2: Backend Implementation
- [ ] Setup Stripe Wrapper & Config
- [ ] Implement `GET /api/subscriptions/current`
- [ ] Implement `POST /api/subscriptions/upgrade` & `downgrade` (Proration)
- [ ] Implement `GET /api/billing/history`
- [ ] Implement `POST /api/billing/payment-method`
- [ ] Implement `POST /api/webhooks/stripe` (Signature verification)
- [ ] Implement Error Handling & Retry Logic

## Phase 3: Frontend Implementation
- [ ] Setup MD3 Components (Card, Button, Badge)
- [ ] Create Subscription Dashboard
- [ ] Create Plan Selection UI
- [ ] Create Upgrade/Downgrade Modal
- [ ] Create Billing History Table
- [ ] Create Payment Method Management UI
- [ ] Integrate with Backend API

## Phase 4: Testing & Quality
- [ ] Backend Tests (pytest): API endpoints, Webhook verification
- [ ] Frontend Tests (Vitest): Component rendering, User interactions
- [ ] Verify MD3 Compliance
- [ ] Verify Stripe Test Mode Integration

## Phase 5: Documentation & Packaging
- [ ] Create README.md (Installation, Stripe Setup)
- [ ] Create .env.example
- [ ] Package into `subscription-management-portal-v1.0.0.zip`

## Questions / Risks
- Stripe Webhook local testing requires Stripe CLI.
- Supabase local development requires Docker or connection to remote. (Will use remote connection string logic or mock for pure local tests if needed, but requirements say "Real Stripe test mode required", implying we connect to real Stripe Test Mode).
