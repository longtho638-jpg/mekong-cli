# Phase 2: Analytics Dashboard

## Overview
Build the visual heart of the admin panel. Provide actionable insights via interactive charts and metrics.

## Objectives
- [ ] Implement Dashboard Overview Cards.
- [ ] Integrate Charting Library (Recharts).
- [ ] Build Analytics Charts (Line, Bar, Pie).
- [ ] Implement Date Range Picker.
- [ ] Real-time updates (Mocked via polling).

## Architecture
- **Charts**: Recharts (Standard for React).
- **Layout**: CSS Grid / MUI Grid for responsive widgets.
- **Performance**: Lazy load charts.

## Implementation Steps

### 1. Metric Cards
- Create `StatCard` component (Icon, Value, Trend).
- Implement metrics: Total Users, Revenue, Active Sessions, Conversion.

### 2. Chart Integration
- Install `recharts`.
- Create `RevenueChart.tsx` (Line/Area).
- Create `UserGrowthChart.tsx` (Bar).
- Create `DeviceDistributionChart.tsx` (Pie).

### 3. Dashboard Page
- Assemble components in `src/app/(dashboard)/page.tsx`.
- Add "Time Range" filter (Today, 7D, 30D, 1Y).

## Verification
- Charts render correctly.
- Responsive layout (charts resize).
- No hydration errors.
