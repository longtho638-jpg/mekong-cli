---
title: "Phase 1: Backend API"
description: "Revenue analytics service with Polar/Stripe adapters and REST API endpoints"
status: completed
priority: P2
effort: 2h
branch: master
tags: [analytics, backend, api, polar, stripe]
created: 2026-03-06
---

# Phase 1: Backend API

## Context Links
- Parent plan: `plans/260306-2138-phase5-revenue-analytics/plan.md`
- Polar service: `src/billing/polar-subscription-service.ts`
- Stripe webhook: `src/billing/stripe-webhook-handler.ts`
- Existing analytics: `src/lib/analytics.ts`
- **Blocks:** Phase 2 (UI Dashboard)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2 hours
- **Description:** Core analytics service + Fastify API endpoints for revenue metrics

## Requirements

### Metrics to Calculate
1. **MRR (Monthly Recurring Revenue)** — Sum of active subscription monthly values
2. **ARR (Annual Recurring Revenue)** — MRR × 12
3. **DAL (Daily Active Licenses)** — Unique tenants with API calls in last 24h
4. **Churn Rate** — (Canceled this period / Total at period start) × 100
5. **ARPA (Average Revenue Per Account)** — MRR / Total active paid subscriptions

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/analytics/revenue` | GET | MRR, ARR, DAL, churn, ARPA with filters |
| `/api/v1/analytics/usage` | GET | Usage metrics, top tenants, quota utilization |
| `/api/v1/analytics/churn` | GET | Churn rate by period and reason |
| `/api/v1/analytics/realtime` | GET | Lightweight snapshot for 30s polling |

### Query Parameters
- `period` (7d|30d|90d|custom) — Default: 30d
- `tier` (free|pro|enterprise) — Filter by tier
- `segment` (self-hosted|cloud|enterprise) — Filter by segment

## Architecture

```typescript
// src/analytics/revenue-analytics.ts
export interface RevenueMetrics {
  mrr: number;
  arr: number;
  dal: number;
  churnRate: number;
  arpa: number;
  trend: { date: string; mrr: number }[];
  byTier: { tier: string; revenue: number; count: number }[];
}

export class RevenueAnalyticsService {
  private fetchPolarSubscriptions(): Promise<PolarSubscription[]>
  private fetchStripeSubscriptions(): Promise<StripeSubscription[]>
  private calculateMRR(subscriptions): number
  private calculateChurnRate(period: DateRange): number
  private getDailyActiveLicenses(): number
}
```

## Implementation Steps

1. **Create revenue analytics service**
   - File: `src/analytics/revenue-analytics.ts`
   - Implement Polar adapter (fetch subscriptions)
   - Implement Stripe adapter (legacy fallback)
   - Add metric calculations (MRR, ARR, DAL, churn, ARPA)
   - Add in-memory caching with 5min TTL

2. **Create API routes**
   - File: `src/api/routes/analytics.ts`
   - Implement 4 endpoints with Zod validation
   - Add admin API key authentication
   - Add rate limiting (100/min)

3. **Register routes**
   - Update: `src/api/fastify-raas-server.ts`
   - Import and register analytics routes

## Related Code Files
- **Create:** `src/analytics/revenue-analytics.ts`
- **Create:** `src/api/routes/analytics.ts`
- **Update:** `src/api/fastify-raas-server.ts`

## Success Criteria
- [ ] Service returns all 5 metrics (MRR, ARR, DAL, churn, ARPA)
- [ ] All 4 endpoints respond with correct JSON format
- [ ] Admin API key authentication works (401 without key)
- [ ] Caching reduces external API calls by 80%
- [ ] Query params (period, tier, segment) filter correctly

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Polar API rate limits | High | Cache responses 5min, fallback to local data |
| Stripe API key missing | Medium | Mark as "legacy" - skip if not configured |
| Memory cache grows unbounded | Low | Add max size limit (1000 entries) |

---

## Unresolved Questions
1. What's the Polar API endpoint for listing all subscriptions?
2. Do we have Stripe API key configured for legacy data?
