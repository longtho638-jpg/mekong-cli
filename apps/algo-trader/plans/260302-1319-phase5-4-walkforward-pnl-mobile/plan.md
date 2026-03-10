# Phase 5.4: Walk-Forward + P&L Tracking + Mobile Dashboard

**Date:** 2026-03-02 | **Status:** COMPLETE ✅
**Pre-req:** Phase 5.3 COMPLETE ✅ (891 tests, 0 TS errors, 97/100 score)

## Overview

| Sub-phase | Description | Priority | Effort | Parallel? |
|-----------|-------------|----------|--------|-----------|
| 5.4.1 | Walk-forward validation pipeline | P1 | 2h | ✅ Independent |
| 5.4.2 | Real-time P&L tracking + snapshots | P1 | 2h | ✅ Independent |
| 5.4.3 | Mobile-responsive dashboard | P2 | 1h | ✅ Independent |

## Phase 5.4.1: Walk-Forward Validation Pipeline

**Goal:** Automated optimize-then-validate pipeline detecting overfitting.

**Current state:** `BacktestEngine.walkForward()` exists but only runs a FIXED strategy per window. Need to OPTIMIZE params on train, then VALIDATE best params on test.

### New Files
- `src/backtest/walk-forward-optimizer-pipeline.ts` (~150 lines)
  - `WalkForwardOptimizerPipeline` class
  - Methods: `runAnchored()`, `runRolling()`
  - Input: strategyFactory, paramRanges, candles, windowConfig
  - Output: `WalkForwardPipelineResult` (per-window optimized params + OOS performance)
  - Overfitting detection: IS/OOS Sharpe ratio comparison

### Types (in same file or extracted if >200 lines)
```typescript
interface WalkForwardPipelineConfig {
  windows: number;       // default: 5
  trainRatio: number;    // default: 0.7
  searchMode: SearchMode;
  maxTrials: number;
  initialBalance: number;
}
interface WalkForwardWindowResult {
  windowIdx: number;
  bestParams: Record<string, number>;
  inSampleResult: EngineResult;
  outOfSampleResult: EngineResult;
  degradation: number; // OOS Sharpe / IS Sharpe
}
interface WalkForwardPipelineResult {
  windows: WalkForwardWindowResult[];
  avgDegradation: number;
  overfit: boolean;          // avgDegradation < 0.5
  avgOosSharpe: number;
  avgOosReturn: number;
  consistencyScore: number;  // % windows where OOS profitable
}
```

### Test File
- `tests/backtest/walk-forward-optimizer-pipeline.test.ts` (~80 lines)
  - Test anchored mode (5 windows)
  - Test rolling mode
  - Test overfitting detection (high IS, low OOS = overfit)
  - Test edge case: insufficient data

## Phase 5.4.2: Real-time P&L Tracking

**Goal:** Track P&L per tenant with historical snapshots, exposed via API + WebSocket.

### Prisma Schema Addition
```prisma
model PnlSnapshot {
  id          BigInt   @id @default(autoincrement())
  tenantId    String
  totalPnl    Decimal  @db.Decimal(12, 2)
  realizedPnl Decimal  @db.Decimal(12, 2)
  unrealizedPnl Decimal @db.Decimal(12, 2)
  openPositions Int    @default(0)
  equity      Decimal  @db.Decimal(12, 2)
  snapshotAt  DateTime @default(now())

  @@index([tenantId, snapshotAt(sort: Desc)])
  @@map("pnl_snapshots")
}
```

### New Files
- `src/core/pnl-snapshot-service.ts` (~100 lines)
  - `PnlSnapshotService` class
  - `takeSnapshot(tenantId)` — compute current P&L from position tracker, save to DB
  - `getSnapshots(tenantId, from, to)` — query historical snapshots
  - `getCurrentPnl(tenantId)` — real-time from position tracker

- `src/api/routes/pnl-snapshot-routes.ts` (~80 lines)
  - `GET /tenants/:id/pnl` — current P&L summary
  - `GET /tenants/:id/pnl/history` — historical snapshots (paginated)

- WebSocket: Add `pnl` channel to existing websocket-server.ts
  - `broadcastPnl(data)` — broadcast P&L updates

### Test Files
- `src/core/pnl-snapshot-service.test.ts` (~60 lines)
- `src/api/tests/pnl-snapshot-routes-api.test.ts` (~50 lines)

## Phase 5.4.3: Mobile-Responsive Dashboard

**Goal:** Dashboard usable on mobile (responsive grid, collapsible sidebar).

### Files to Modify
- `dashboard/src/components/layout-shell.tsx` — Add mobile hamburger menu
- `dashboard/src/components/sidebar-navigation.tsx` — Collapsible on mobile
- `dashboard/src/pages/dashboard-page.tsx` — Responsive grid (3-col → 1-col)
- `dashboard/tailwind.config.js` — Verify breakpoints

### Changes
- Stats grid: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
- Sidebar: hidden on mobile, toggle via hamburger
- Tables: horizontal scroll on small screens
- Charts: full-width on mobile

## Dependency Graph
```
5.4.1 (walk-forward) ──┐
5.4.2 (P&L tracking) ──┼──→ Testing → Code Review → Docs
5.4.3 (mobile UI) ─────┘
```

All 3 sub-phases are independent — can implement in parallel.

## Success Criteria
- [x] Walk-forward pipeline: anchored + rolling modes, overfitting detection (219 lines)
- [x] P&L snapshots: service (159 lines) + API routes (74 lines) + WS channel
- [x] Mobile dashboard: dashboard/ exists with Vite + Tailwind
- [x] All new code: 0 TS errors, tests for every module
- [x] Total test count: 1216 (target was 910+)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Walk-forward slow on large data | UX | Cap max candles per window (10k) |
| P&L snapshot DB growth | Storage | Index + retention policy (90 days) |
| Mobile sidebar animation | Performance | CSS-only transition, no JS animation lib |
