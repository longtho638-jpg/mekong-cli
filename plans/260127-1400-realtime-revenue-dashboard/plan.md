# Implementation Plan: Real-time Revenue Dashboard

**Date:** 2026-01-27
**Status:** Completed
**Target:** Real-time visibility of MRR, ARR, Churn, and LTV.

## 1. Executive Summary

This plan outlines the transformation of the current static Revenue Dashboard into a live, real-time financial command center. By leveraging the existing `payments` and `subscriptions` infrastructure and integrating Supabase Realtime, we will deliver instant visibility into the agency's financial health without manual refreshing.

## 2. Architecture

### Data Flow
1.  **Ingestion:** Payments (Stripe/PayPal) -> Webhooks -> `PaymentService` -> `payments` table.
2.  **Storage:** Supabase PostgreSQL (`payments`, `subscriptions`, `revenue_snapshots`).
3.  **Real-time:** Supabase Realtime broadcasts `INSERT` events on `payments`.
4.  **API Layer:** FastAPI (`RevenueEngine`) aggregates complex metrics (LTV, Churn) for initial load.
5.  **Frontend:** Next.js + React Query (initial state) + Supabase Client (live updates).

### Key Components
-   **Database:** New views/functions for fast aggregation.
-   **Backend:** `RevenueEngine` (Python) for heavy lifting (cohort analysis, forecasting).
-   **Frontend:** `useRevenueRealtime` hook for merging API state with live events.

## 3. Implementation Phases

- [x] [Phase 1: Database Schema](./phase-01-database-schema.md) - **Foundation**
- [x] [Phase 2: Backend API](./phase-02-backend-api.md) - **The Engine**
- [x] [Phase 3: Frontend Components](./phase-03-frontend-components.md) - **Visualization**
- [x] [Phase 4: Real-time Subscriptions](./phase-04-realtime-subscriptions.md) - **Wiring**
- [x] [Phase 5: Testing & Validation](./phase-05-testing-validation.md) - **Quality Assurance**

## 4. WIN-WIN-WIN Analysis

*   👑 **Owner:** Immediate insight into cash flow; "Pulse of the business."
*   🏢 **Agency:** Reusable "Real-time Financial Core" for future SaaS products.
*   🚀 **Client:** Trust through transparency (if exposed to them) or faster service (internal efficiency).

## 5. Unresolved Questions
*   **Historical Data:** Do we need to backfill historical payments for the trend chart? (Assumed yes).
*   **Currency Conversion:** How do we handle multi-currency aggregation? (MVP: Convert all to USD at current rate).
