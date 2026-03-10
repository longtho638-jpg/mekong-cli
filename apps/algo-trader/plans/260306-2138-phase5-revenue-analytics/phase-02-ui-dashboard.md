---
title: "Phase 2: UI Dashboard"
description: "Analytics dashboard page with charts, filters, and auto-refresh"
status: completed
priority: P2
effort: 2h
branch: master
tags: [analytics, frontend, dashboard, ui, charts]
created: 2026-03-06
---

# Phase 2: UI Dashboard

## Context Links
- Parent plan: `plans/260306-2138-phase5-revenue-analytics/plan.md`
- **Depends on:** Phase 1 (Backend API)
- Phase 1 output: `src/analytics/revenue-analytics.ts`, `src/api/routes/analytics.ts`
- Existing UI: `dashboard/src/pages/dashboard-page.tsx`
- Recharts docs: https://recharts.org

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2 hours
- **Description:** Main analytics page with summary cards, filters, charts, and 30s auto-refresh

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                          [7d] [30d] [90d] [Custom]   │
│  Real-time revenue metrics            🔴 Live · Updated 2s ago  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ MRR      │ │ DAL      │ │ Churn    │ │ ARPA     │          │
│  │ $12,450  │ │ 47       │ │ 2.3%     │ │ $249     │          │
│  │ ↑ 3.2%   │ │ ↑ 12     │ │ ↓ 0.5%   │ │ ↑ 8%     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├───────────────────────────────────┬─────────────────────────────┤
│  MRR Trend (Line Chart)           │  Revenue by Tier (Bar)     │
├───────────────────────────────────┴─────────────────────────────┤
│  Utilization Gauge           │  Recent Activity                 │
│  (Circular 73%)              │  · t123 upgraded to PRO          │
└───────────────────────────────┴─────────────────────────────────┘
```

## Components to Create

### Summary Cards (4x)
- **File:** `dashboard/src/components/revenue-summary-card.tsx`
- Props: `label`, `value`, `change` (percentage + direction), `icon`

### Charts (5x)
| Component | File | Type |
|-----------|------|------|
| MRR Trend | `dashboard/src/components/revenue-mrr-chart.tsx` | Line chart |
| Revenue by Tier | `dashboard/src/components/revenue-tier-chart.tsx` | Bar chart |
| Churn Trend | `dashboard/src/components/revenue-churn-chart.tsx` | Sparkline |
| Utilization Gauge | `dashboard/src/components/revenue-utilization-gauge.tsx` | Circular gauge |
| Activity Feed | `dashboard/src/components/revenue-activity-feed.tsx` | List |

### Custom Hook
- **File:** `dashboard/src/hooks/use-revenue-analytics.ts`
- Handles 30s polling, filter state, data fetching

### Main Page
- **File:** `dashboard/src/pages/analytics-page.tsx`
- Combines all components, handles layout

## State Management

```typescript
// dashboard/src/hooks/use-revenue-analytics.ts
export function useRevenueAnalytics() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [isPolling, setIsPolling] = useState(false);

  // Poll every 30s
  useEffect(() => {
    const poll = () => fetchMetrics().then(setMetrics);
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [period]);

  return { metrics, period, setPeriod, lastUpdated, isPolling };
}
```

## Implementation Steps

1. **Create custom hook**
   - File: `dashboard/src/hooks/use-revenue-analytics.ts`
   - Implement 30s polling logic
   - Handle filter state management

2. **Create chart components** (5 files)
   - Use Recharts library
   - Responsive width, theme colors
   - Tooltips with formatted values

3. **Create summary card component**
   - File: `dashboard/src/components/revenue-summary-card.tsx`
   - Display value + change percentage with color

4. **Create main page**
   - File: `dashboard/src/pages/analytics-page.tsx`
   - Layout with filters, cards, charts

5. **Update routing**
   - Update: `dashboard/src/App.tsx` — Add `/analytics` route
   - Update: `dashboard/src/components/sidebar-navigation.tsx` — Add menu item

## Related Code Files
- **Create:** `dashboard/src/pages/analytics-page.tsx`
- **Create:** `dashboard/src/hooks/use-revenue-analytics.ts`
- **Create:** `dashboard/src/components/revenue-summary-card.tsx`
- **Create:** `dashboard/src/components/revenue-mrr-chart.tsx`
- **Create:** `dashboard/src/components/revenue-tier-chart.tsx`
- **Create:** `dashboard/src/components/revenue-churn-chart.tsx`
- **Create:** `dashboard/src/components/revenue-utilization-gauge.tsx`
- **Create:** `dashboard/src/components/revenue-activity-feed.tsx`
- **Update:** `dashboard/src/App.tsx`
- **Update:** `dashboard/src/components/sidebar-navigation.tsx`

## Success Criteria
- [ ] Summary cards display MRR, DAL, Churn, ARPA with change indicators
- [ ] MRR trend line chart renders with data
- [ ] Revenue by tier bar chart renders with color-coded bars
- [ ] Utilization gauge shows circular progress
- [ ] Period filter (7d/30d/90d) updates all charts
- [ ] Auto-refresh every 30s updates data
- [ ] Live indicator shows last update time
- [ ] Route `/analytics` is accessible (admin-only)

## Theme Integration
```typescript
const chartColors = {
  mrr: 'var(--color-accent)',      // Blue/purple
  profit: 'var(--color-profit)',    // Green (positive change)
  loss: 'var(--color-loss)',        // Red (negative change)
  warning: 'var(--color-warning)',  // Yellow (high utilization)
  muted: 'var(--color-muted)',      // Gray (FREE tier)
};
```

---

## Unresolved Questions
1. Should we add loading skeleton or spinner during fetch?
2. Do we need a "pause polling" button for users?
3. Should charts export to PNG?
