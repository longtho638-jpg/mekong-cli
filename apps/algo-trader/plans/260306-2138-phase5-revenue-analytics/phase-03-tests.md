---
title: "Phase 3: Tests"
description: "Unit tests, integration tests, and E2E validation for analytics dashboard"
status: completed
priority: P2
effort: 2h
branch: master
tags: [analytics, tests, integration, e2e]
created: 2026-03-06
---

# Phase 3: Tests

## Context Links
- Parent plan: `plans/260306-2138-phase5-revenue-analytics/plan.md`
- **Depends on:** Phase 1 (Backend API) + Phase 2 (UI Dashboard)
- Test patterns: `tests/billing/polar-subscription-and-webhook-billing.test.ts`

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2 hours
- **Description:** Comprehensive test coverage for analytics service, API endpoints, and E2E dashboard flow

## Test Plan

### 1. Unit Tests: Analytics Service
**File:** `src/analytics/revenue-analytics.test.ts`

```typescript
describe('RevenueAnalyticsService', () => {
  describe('calculateMRR', () => {
    it('sums active subscription values', () => {});
    it('normalizes yearly plans to monthly (/12)', () => {});
    it('excludes canceled subscriptions', () => {});
    it('excludes refunded subscriptions', () => {});
  });

  describe('calculateChurnRate', () => {
    it('calculates voluntary churn (canceled)', () => {});
    it('calculates involuntary churn (refunded)', () => {});
    it('handles zero subscriptions gracefully', () => {});
  });

  describe('getDailyActiveLicenses', () => {
    it('counts tenants with API calls in last 24h', () => {});
    it('excludes inactive tenants', () => {});
  });

  describe('caching', () => {
    it('returns cached data on second call within TTL', () => {});
    it('invalidates cache after 5min TTL', () => {});
  });
});
```

### 2. Integration Tests: API Endpoints
**File:** `src/api/tests/analytics-api.test.ts`

```typescript
describe('GET /api/v1/analytics/revenue', () => {
  it('returns MRR, DAL, churn metrics', async () => {});
  it('requires admin API key (401 without)', async () => {});
  it('respects period query param (7d/30d/90d)', async () => {});
  it('filters by tier when provided', async () => {});
  it('filters by segment when provided', async () => {});
});

describe('GET /api/v1/analytics/realtime', () => {
  it('returns lightweight snapshot', async () => {});
  it('includes recent activity events', async () => {});
  it('updates lastUpdated timestamp', async () => {});
});

describe('Rate limiting', () => {
  it('returns 429 after 100 requests/minute', async () => {});
});
```

### 3. Component Tests: UI
**File:** `dashboard/src/components/__tests__/revenue-charts.test.tsx`

```typescript
describe('RevenueMrrChart', () => {
  it('renders line chart with data', () => {});
  it('formats Y-axis as currency ($)', () => {});
  it('shows tooltip on hover', () => {});
  it('is responsive to container width', () => {});
});

describe('RevenueSummaryCard', () => {
  it('displays value and change percentage', () => {});
  it('colors change green for positive', () => {});
  it('colors change red for negative', () => {});
});

describe('RevenueUtilizationGauge', () => {
  it('shows circular progress at correct angle', () => {});
  it('colors zones (green/yellow/red) based on value', () => {});
});
```

### 4. E2E Tests: Dashboard Flow
**File:** `tests/integration/analytics-dashboard-e2e.test.ts`

```typescript
describe('Analytics Dashboard E2E', () => {
  it('loads dashboard with metrics', async () => {
    // 1. Navigate to /analytics
    // 2. Verify MRR card displays
    // 3. Verify chart renders
    // 4. Verify polling updates data
  });

  it('filters by period', async () => {
    // 1. Click 7d button
    // 2. Verify chart data updates
    // 3. Verify metrics recalculate
  });

  it('auto-refreshes every 30s', async () => {
    // 1. Note initial lastUpdated time
    // 2. Wait 30s
    // 3. Verify lastUpdated changed
    // 4. Verify data refreshed
  });

  it('handles API errors gracefully', async () => {
    // 1. Mock API failure
    // 2. Verify error message displays
    // 3. Verify retry button works
  });
});
```

## Test Data Setup

```typescript
// Mock data factory
function createMockSubscription(overrides?: Partial<Subscription>): Subscription {
  return {
    id: 'sub_123',
    tenantId: 't_456',
    tier: 'pro',
    amount: 99,
    status: 'active',
    createdAt: new Date(),
    ...overrides,
  };
}

// Mock API response
const mockRevenueMetrics: RevenueMetrics = {
  mrr: 12450,
  arr: 149400,
  dal: 47,
  churnRate: 2.3,
  arpa: 249,
  trend: [{ date: '2026-03-01', mrr: 11200 }],
  byTier: [{ tier: 'pro', revenue: 8450, count: 85 }],
};
```

## Implementation Steps

1. **Service unit tests**
   - File: `src/analytics/revenue-analytics.test.ts`
   - Mock Polar/Stripe API responses
   - Test all metric calculations
   - Test edge cases (empty data, null values)

2. **API integration tests**
   - File: `src/api/tests/analytics-api.test.ts`
   - Spin up test Fastify server
   - Test auth requirements
   - Test query param parsing
   - Test rate limiting

3. **Component tests**
   - File: `dashboard/src/components/__tests__/revenue-charts.test.tsx`
   - Render with mock data
   - Test interactions (filters)
   - Verify theme colors

4. **E2E tests**
   - File: `tests/integration/analytics-dashboard-e2e.test.ts`
   - Full dashboard flow
   - Polling behavior
   - Filter combinations
   - Error handling

5. **Fix failing tests**
   - Iterate until all pass
   - Target: >80% coverage for new files

## Related Code Files
- **Create:** `src/analytics/revenue-analytics.test.ts`
- **Create:** `src/api/tests/analytics-api.test.ts`
- **Create:** `dashboard/src/components/__tests__/revenue-charts.test.tsx`
- **Create:** `tests/integration/analytics-dashboard-e2e.test.ts`

## Success Criteria
- [ ] All unit tests pass (service calculations)
- [ ] All integration tests pass (API endpoints)
- [ ] All component tests pass (UI rendering)
- [ ] E2E flow completes successfully
- [ ] Code coverage >80% for new files
- [ ] Tests run in <2 minutes total

---

## Unresolved Questions
1. Should we add performance tests for large datasets (1000+ subscriptions)?
2. Do we need visual regression tests for charts (e.g., Percy)?
