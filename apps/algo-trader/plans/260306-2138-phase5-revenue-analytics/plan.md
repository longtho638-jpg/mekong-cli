---
title: "Phase 5: Revenue Analytics Dashboard"
description: "MRR, DAL, churn rate, utilization trends with real-time Polar/Stripe integration"
status: completed
priority: P2
effort: 6h
branch: master
tags: [analytics, revenue, dashboard, polar, stripe]
created: 2026-03-06
---

# Phase 5: Revenue Analytics Dashboard

## Context Links
- Existing analytics: `src/lib/analytics.ts`, `dashboard/src/hooks/use-license-analytics.ts`
- Polar service: `src/billing/polar-subscription-service.ts`, `src/payment/polar-service.ts`
- Stripe webhook: `src/billing/stripe-webhook-handler.ts`
- UI components: `dashboard/src/components/usage-analytics-dashboard.tsx`
- License routes: `src/api/routes/license-management-routes.ts`

## Overview
- **Priority:** P2 (Revenue visibility for business decisions)
- **Status:** in-progress
- **Effort:** 6 hours (3 phases × 2h each)
- **Description:** Real-time revenue analytics dashboard with MRR, Daily Active Licenses, churn rate, and utilization trends integrated with Polar.sh + Stripe payment data

## Key Insights
- Existing `analytics.ts` has in-memory metrics store — needs persistence layer
- Polar webhook already tracks subscription events (created/active/canceled/refunded)
- Current UI has basic analytics — needs revenue-specific charts
- Must support both Polar (primary) and Stripe (legacy) data sources

## Requirements

### Metrics
| Metric | Formula | Source |
|--------|---------|--------|
| Daily Active Licenses (DAL) | Count licenses with API calls in last 24h | `raas-gate` usage logs |
| MRR | Sum of all active subscription monthly values | Polar/Stripe subscriptions |
| Usage Revenue | API calls × price per call (overage) | `metricsStore` usage data |
| Churn Rate | (Canceled subs / Total subs) × 100 | Webhook events |
| Utilization Trends | % quota used over time (line chart) | `UsageQuotaService` |

### Filters
- Date range picker (7d/30d/90d/custom)
- Tier filter (FREE/PRO/ENTERPRISE)
- Customer segment (Self-hosted/Cloud/Enterprise)

### Real-time Updates
- Polling every 30s for live metrics

### Charts (Recharts library)
| Chart | Type | Data |
|-------|------|------|
| MRR Trend | Line | Daily MRR over selected period |
| Revenue by Tier | Bar | Monthly revenue breakdown |
| Utilization Gauge | Gauge | Current quota usage % |
| Churn Funnel | Funnel | Active → Canceled → Refunded |

## Implementation Phases

| Phase | Name | Files | Status | Dependencies |
|-------|------|-------|--------|--------------|
| 1 | Backend API | `src/analytics/revenue-analytics.ts`, `src/api/routes/analytics.ts`, `src/api/fastify-raas-server.ts` | pending | None |
| 2 | UI Dashboard | `dashboard/src/pages/analytics-page.tsx`, `dashboard/src/hooks/use-revenue-analytics.ts`, `dashboard/src/components/revenue-*.tsx`, `dashboard/src/App.tsx` | pending | Phase 1 |
| 3 | Tests | `src/analytics/revenue-analytics.test.ts`, `src/api/tests/analytics-api.test.ts`, `tests/integration/analytics-dashboard-e2e.test.ts` | pending | Phase 1 + Phase 2 |

## Phase Details

### Phase 1: Backend API (2h)
**Goal:** Analytics service + API endpoints

**Files:**
- `src/analytics/revenue-analytics.ts` — Core service with Polar/Stripe adapters
- `src/api/routes/analytics.ts` — Fastify routes (`/api/v1/analytics/revenue`, `/usage`, `/churn`, `/realtime`)
- `src/api/fastify-raas-server.ts` — Register routes with admin auth

**Endpoints:**
- `GET /api/v1/analytics/revenue` — MRR, ARR, DAL, churn, ARPA with filters
- `GET /api/v1/analytics/usage` — Usage metrics, top tenants, quota utilization
- `GET /api/v1/analytics/churn` — Churn rate by period and reason
- `GET /api/v1/analytics/realtime` — Lightweight snapshot for 30s polling

**Success Criteria:**
- [ ] Service returns all 5 metrics (MRR, ARR, DAL, churn, ARPA)
- [ ] All 4 endpoints respond with correct data
- [ ] Admin API key authentication works
- [ ] Caching reduces API calls by 80%

---

### Phase 2: UI Dashboard (2h)
**Goal:** Dashboard page + chart components

**Files:**
- `dashboard/src/pages/analytics-page.tsx` — Main page with filters and auto-refresh
- `dashboard/src/hooks/use-revenue-analytics.ts` — Custom hook with 30s polling
- `dashboard/src/components/revenue-mrr-chart.tsx` — MRR trend line chart
- `dashboard/src/components/revenue-tier-chart.tsx` — Revenue by tier bar chart
- `dashboard/src/components/revenue-churn-chart.tsx` — Churn trend mini chart
- `dashboard/src/components/revenue-utilization-gauge.tsx` — Circular gauge
- `dashboard/src/components/revenue-activity-feed.tsx` — Recent events feed
- `dashboard/src/App.tsx` — Add `/analytics` route
- `dashboard/src/components/sidebar-navigation.tsx` — Add menu item

**Success Criteria:**
- [ ] Summary cards display MRR, DAL, Churn, ARPA
- [ ] Charts render with real data from API
- [ ] Period filter (7d/30d/90d) works
- [ ] Auto-refresh every 30s updates data
- [ ] Live indicator shows last update time

---

### Phase 3: Tests (2h)
**Goal:** Comprehensive test coverage

**Files:**
- `src/analytics/revenue-analytics.test.ts` — Service unit tests
- `src/api/tests/analytics-api.test.ts` — API integration tests
- `tests/integration/analytics-dashboard-e2e.test.ts` — E2E dashboard flow

**Test Coverage:**
- Unit: MRR calculation, churn rate, DAL counting
- Integration: Auth, query params, response format
- E2E: Full dashboard load, filter changes, auto-refresh

**Success Criteria:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E flow completes successfully
- [ ] Coverage >80% for new files

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Polar API rate limits | High | Cache responses 5min, fallback to local data |
| Stripe/Polar data conflict | Medium | Polar primary, Stripe secondary (legacy) |
| Real-time polling overload | Medium | 30s interval, debounce on filter changes |
| Sensitive revenue data exposure | High | Admin-only route, API key auth required |

## Security Considerations
- Analytics endpoints require `X-API-Key: admin-key` header
- No revenue data in client-side logs
- Rate limit: 100 requests/minute per tenant

## Next Steps
1. Execute Phase 1: Build backend API (service + endpoints)
2. Execute Phase 2: Build UI Dashboard (page + components)
3. Execute Phase 3: Write and run tests

---

## Unresolved Questions
1. Should we store historical snapshots in DB for faster queries?
2. Do we need export to CSV functionality for enterprise customers?
3. Should churn calculation include trial conversions or only paid?
