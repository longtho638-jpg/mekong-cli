# Phase 3: Frontend Components

**Context Links:**
- [Main Plan](./plan.md)
- [Revenue Page](../../apps/dashboard/app/[locale]/dashboard/revenue/page.tsx)

## Overview
**Priority:** High
**Status:** Planned
**Description:** Build the visual components for the dashboard, adhering to MD3 design standards and integrating real-time data hooks.

## Key Insights
- Components should be "dumb" presentation layers where possible, taking data as props.
- Use `Recharts` for the trend graph (Area Chart looks good for revenue).
- Ensure "skeleton" loading states for better UX.

## Requirements
### Functional
- Display 4 key metric cards: Total Revenue, MRR, ARR, Churn.
- Interactive Chart: Revenue over time (Daily/Monthly).
- Live Transaction Feed: List of recent payments with "Just now" updates.

### Non-Functional
- Strict MD3 Compliance (colors, typography, elevation).
- Responsive design (mobile friendly).

## Architecture
- **Page:** `apps/dashboard/app/[locale]/dashboard/revenue/page.tsx`
- **Components:**
    - `RevenueMetricCard.tsx`
    - `RevenueTrendChart.tsx`
    - `RecentTransactions.tsx`
- **Hooks:** `useRevenueStats`, `useRevenueTrend`, `useRealtimePayments`.

## Related Code Files
- `apps/dashboard/app/[locale]/dashboard/revenue/page.tsx`
- `apps/dashboard/components/revenue/*`

## Implementation Steps
1.  **Create Metric Cards:**
    - Use `AgencyCard` as base.
    - Add trend indicator (green up / red down).

2.  **Implement Chart:**
    - Install `recharts` if not present.
    - Create area chart component.

3.  **Implement Transaction List:**
    - Table or List view.
    - Status badges (Success, Pending, Failed).

4.  **Integrate API:**
    - Fetch initial data using server components or React Query.

## Todo List
- [ ] Create component directory `apps/dashboard/components/revenue/`
- [ ] Implement `RevenueMetricCard`
- [ ] Implement `RevenueTrendChart`
- [ ] Implement `RecentTransactions`
- [ ] Update `page.tsx` to assemble components

## Success Criteria
- Dashboard renders correctly on all screen sizes.
- Components match the design system.
- Charts are interactive (tooltip on hover).
