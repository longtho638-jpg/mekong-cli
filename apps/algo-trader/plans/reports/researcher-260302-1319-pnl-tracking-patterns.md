# P&L Tracking Patterns — Research Report
**Date:** 2026-03-02 | **Project:** algo-trader (TypeScript/Fastify/Prisma/PostgreSQL/Redis)

---

## 1. Current State Analysis

**What exists:**
- `TenantArbPositionTracker` — in-memory, per-tenant, open/closed positions with pnl field
- `pnl = (sellPrice - buyPrice) * amount` on open (static, not mark-to-market)
- `getStats()` — total/avg/winRate computed on closed positions only
- `EquityCurveChart` — cumulative PnL from `positions[]` in Zustand store (synthetic dates, no real timestamps)
- `Strategy.pnl` + `Trade.pnl` in Prisma — written at trade time, no historical snapshots
- WebSocket: `spread` channel only — no `pnl` channel yet

**Gaps:**
- No unrealized P&L mark-to-market (open positions not updated with current price)
- No historical P&L snapshots in DB (no time-series equity curve from real data)
- WebSocket has no `pnl` channel
- Dashboard equity curve uses synthetic/fake dates

---

## 2. Real-Time P&L Calculation Patterns

### 2a. Realized P&L (already works)
```
realizedPnl = sum(closedPosition.pnl)  ← exists in getStats()
```

### 2b. Unrealized P&L (mark-to-market, missing)
For arb positions, unrealized = current spread vs entry spread:
```
unrealizedPnl = (currentBid_sellExch - currentAsk_buyExch) * amount - entrySpread * amount
```
`updatePriceTick()` exists for trailing stop but does NOT update `position.pnl`. Need to add:
```
position.pnl = (currentSellPrice - currentBuyPrice) * position.amount - fees
```

### 2c. Total P&L = realized + unrealized
Broadcast this sum on a new `pnl` WebSocket channel every price tick.

**Pattern (interval throttle):** Recalculate max every 500ms to avoid flooding. Use Redis pub/sub to fan out to multi-instance nodes.

---

## 3. Historical P&L Snapshot Strategies

### Option A: Interval-based (RECOMMENDED — KISS)
- Cron every 1 min: compute totalPnl per tenant, INSERT into `pnl_snapshots`
- Pros: simple, bounded writes (~1440/day/tenant), queryable time-series
- Cons: 1-min resolution only

### Option B: Event-based (on position close)
- INSERT snapshot when `closePosition()` fires
- Pros: exact event correlation, no polling
- Cons: gaps when no trades for hours (flat equity curve missing data)

### Option C: Hybrid (recommended for production)
- Event snapshot on every position close (precise)
- Interval snapshot every 15 min as heartbeat (fill gaps)
- Redis `ZADD pnl:{tenantId}` for in-memory rolling 24h, PostgreSQL for long-term

---

## 4. Database Schema — `pnl_snapshots`

Add to `schema.prisma`:

```prisma
model PnlSnapshot {
  id            BigInt   @id @default(autoincrement())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  strategyId    String?  // null = tenant aggregate
  realizedPnl   Decimal  @db.Decimal(12, 4)
  unrealizedPnl Decimal  @db.Decimal(12, 4)
  totalPnl      Decimal  @db.Decimal(12, 4)
  openPositions Int
  closedToday   Int
  snapshotType  String   @default("interval")  // "interval" | "event"
  createdAt     DateTime @default(now())

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([strategyId, createdAt(sort: Desc)])
  @@map("pnl_snapshots")
}
```

**Query for equity curve (last 7d):**
```sql
SELECT date_trunc('hour', created_at) as hour, avg(total_pnl) as pnl
FROM pnl_snapshots
WHERE tenant_id = $1 AND created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 1;
```

---

## 5. WebSocket Streaming Pattern

**Add `pnl` channel** to `websocket-server.ts`:

```
Channel: 'pnl'
Payload: { tenantId, realizedPnl, unrealizedPnl, totalPnl, openCount, ts }
Broadcast: on price tick (throttled 500ms) + on position close (immediate)
```

**Flow:**
```
PriceFeedManager → updatePriceTick() → recalcTenantPnl() → broadcastToChannel('pnl', ...) → Zustand store
```

**Multi-tenant auth:** Add `tenantId` to WS handshake, server sends only that tenant's `pnl` events.

---

## 6. Dashboard Visualization

**Current:** `EquityCurveChart` — computed from in-memory positions with synthetic dates. Works but lossy on reload.

**Recommended fix:**
- Fetch `GET /api/pnl/snapshots?tenantId=&from=&to=` on mount → seed chart with real DB data
- WebSocket `pnl` channel updates Zustand → chart appends new point in real-time
- Use `lightweight-charts` `AreaSeries` (already installed) — replace synthetic `toDateString()` with real `createdAt` ISO timestamps

**Chart resolution options:**
| Timeframe | Resolution | Source |
|-----------|-----------|--------|
| 1h | raw events | WebSocket |
| 1d | 15-min snapshots | DB query |
| 7d | hourly aggregates | DB group-by |
| 30d | daily aggregates | DB group-by |

---

## 7. Implementation Priority

1. **DB migration** — add `pnl_snapshots` table
2. **Unrealized P&L** — update `position.pnl` on each `updatePriceTick()` call
3. **Snapshot service** — interval job (node-cron or Fastify plugin) writing to DB
4. **WS channel** — add `'pnl'` to `VALID_CHANNELS`, broadcast from position tracker
5. **REST endpoint** — `GET /api/pnl/snapshots` for dashboard history query
6. **Dashboard** — replace synthetic dates in `EquityCurveChart` with real snapshot data

---

## Unresolved Questions

- Should `pnl_snapshots` be per-strategy or tenant-aggregate only? (strategy-level adds schema complexity)
- Redis pub/sub needed now or only at multi-instance scale?
- Target snapshot retention window (7d? 90d? unlimited)?
- Is fee-adjusted P&L tracked at execution layer or recalculated in snapshot?
