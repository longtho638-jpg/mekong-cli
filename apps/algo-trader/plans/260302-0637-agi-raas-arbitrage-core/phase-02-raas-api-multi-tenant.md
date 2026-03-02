# Phase 2: RaaS API & Multi-Tenant Arbitrage Endpoints

## Context Links
- [plan.md](./plan.md) — Overview
- [Fastify Server] `src/api/fastify-raas-server.ts`
- [Tenant CRUD Routes] `src/api/routes/tenant-crud-routes.ts`
- [TenantStrategyManager] `src/core/tenant-strategy-manager.ts`
- [JWT Token Service] `src/auth/jwt-token-service.ts`
- [API Key Manager] `src/auth/api-key-manager.ts`
- [Tenant Auth Middleware] `src/auth/tenant-auth-middleware.ts`
- [WebSocket Server] `src/core/websocket-server.ts`
- [Shared Schemas] `src/api/schemas/shared-schemas.ts`
- [Research: RaaS Patterns] `plans/reports/researcher-260302-0635-crypto-arb-raas-patterns.md`

## Overview
- **Priority:** P1
- **Effort:** 4h
- **Status:** Completed
- **Description:** Them arbitrage-specific API routes vao Fastify server hien tai. WebSocket endpoint cho real-time spread streaming. Tenant isolation cho exchange keys.

## Key Insights
- Fastify server da co: health, tenant CRUD, strategy marketplace, alert rules, backtest jobs
- JWT auth + API Key manager + rate limiter da co — chi can reuse
- WebSocket server da co (port 3001) voi channels tick/signal/health — them channel `spread`
- TenantStrategyManager da co tier system (free/pro/enterprise) — map vao arb permissions
- Zod schemas da co pattern tai `src/api/schemas/shared-schemas.ts` — extend cho arb

## Requirements

### Functional
1. `POST /api/v1/arb/scan` — trigger spread scan cho tenant (dry-run)
2. `POST /api/v1/arb/execute` — execute arbitrage trade cho tenant
3. `GET /api/v1/arb/positions` — list active arb positions cua tenant
4. `GET /api/v1/arb/history` — trade history voi pagination
5. `GET /api/v1/arb/stats` — P&L summary, win rate, best spread
6. WebSocket channel `spread` — stream real-time spread data to subscribers
7. Tenant exchange key isolation — moi tenant co exchange keys rieng

### Non-Functional
- API response < 50ms cho read endpoints
- JWT auth tren tat ca /arb/* routes
- Rate limit: 100 req/min per tenant (da co sliding window)
- Zod validation tren tat ca request bodies

## Architecture

```
Client (Dashboard/CLI)
     |
     v
[Fastify Server :3000]
  |-- /api/v1/tenants/*     (da co)
  |-- /api/v1/strategies/*  (da co)
  |-- /api/v1/alerts/*      (da co)
  |-- /api/v1/backtest/*    (da co)
  |-- /api/v1/arb/scan      <-- new
  |-- /api/v1/arb/execute   <-- new
  |-- /api/v1/arb/positions <-- new
  |-- /api/v1/arb/history   <-- new
  |-- /api/v1/arb/stats     <-- new
     |
     v
[WebSocket Server :3001]
  |-- channel: tick          (da co)
  |-- channel: signal        (da co)
  |-- channel: health        (da co)
  |-- channel: spread        <-- new
```

## Related Code Files

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/api/routes/arbitrage-scan-execute-routes.ts` | /arb/scan, /arb/execute endpoints |
| `src/api/routes/arbitrage-positions-history-routes.ts` | /arb/positions, /arb/history, /arb/stats |
| `src/api/schemas/arbitrage-request-response-schemas.ts` | Zod schemas cho arb endpoints |
| `src/core/tenant-arbitrage-position-tracker.ts` | Per-tenant position + trade history store |
| `tests/api/arbitrage-scan-execute-routes-api.test.ts` | Integration tests scan/execute |
| `tests/api/arbitrage-positions-history-routes-api.test.ts` | Integration tests positions/history |
| `tests/core/tenant-arbitrage-position-tracker.test.ts` | Unit tests position tracker |

### Files to MODIFY
| File | Change |
|------|--------|
| `src/api/fastify-raas-server.ts` | Register arb routes |
| `src/core/websocket-server.ts` | Them channel `spread` vao VALID_CHANNELS |
| `src/api/schemas/shared-schemas.ts` | Export arb schemas (hoac import tu file moi) |

## Implementation Steps

### Step 1: Zod Schemas cho Arbitrage API (0.5h)

1. Tao `src/api/schemas/arbitrage-request-response-schemas.ts`
2. Schemas:
   ```typescript
   // POST /arb/scan
   const ArbScanRequestSchema = z.object({
     symbols: z.array(z.string()).min(1).default(['BTC/USDT']),
     exchanges: z.array(z.string()).min(2).default(['binance', 'okx', 'bybit']),
     minSpreadPct: z.number().min(0).default(0.05),
   });

   // POST /arb/execute
   const ArbExecuteRequestSchema = z.object({
     symbol: z.string(),
     buyExchange: z.string(),
     sellExchange: z.string(),
     amount: z.number().positive(),
     maxSlippagePct: z.number().min(0).default(0.1),
   });

   // GET /arb/history query params
   const ArbHistoryQuerySchema = z.object({
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
     symbol: z.string().optional(),
     startDate: z.string().datetime().optional(),
     endDate: z.string().datetime().optional(),
   });
   ```

### Step 2: Tenant Arbitrage Position Tracker (1h)

1. Tao `src/core/tenant-arbitrage-position-tracker.ts`
2. In-memory store (per-tenant isolation):
   ```typescript
   interface ArbPosition {
     id: string;
     tenantId: string;
     symbol: string;
     buyExchange: string;
     sellExchange: string;
     buyPrice: number;
     sellPrice: number;
     amount: number;
     netSpreadPct: number;
     pnl: number;
     status: 'open' | 'closed' | 'failed';
     openedAt: number;
     closedAt?: number;
   }
   ```
3. Methods: `openPosition()`, `closePosition()`, `getPositions(tenantId)`, `getHistory(tenantId, pagination)`, `getStats(tenantId)`
4. Max positions per tenant = tier-based (free: 1, pro: 5, enterprise: Infinity)
5. Viet unit tests

### Step 3: Arbitrage API Routes (1.5h)

1. Tao `src/api/routes/arbitrage-scan-execute-routes.ts`
   - `POST /api/v1/arb/scan`:
     - Validate JWT (reuse tenant-auth-middleware)
     - Parse body voi ArbScanRequestSchema
     - Call SpreadDetectorEngine.scanOnce() (khong execute)
     - Return spreads array voi net spread, profitable flag
   - `POST /api/v1/arb/execute`:
     - Validate JWT + check tenant canTrade()
     - Parse body voi ArbExecuteRequestSchema
     - Check tier permissions (free = khong cho execute)
     - Call AtomicCrossExchangeExecutor (tu Phase 1)
     - Record position vao TenantArbPositionTracker
     - Return execution result

2. Tao `src/api/routes/arbitrage-positions-history-routes.ts`
   - `GET /api/v1/arb/positions`: list open positions cua tenant
   - `GET /api/v1/arb/history`: paginated trade history
   - `GET /api/v1/arb/stats`: aggregate P&L, win rate, total trades, best spread

3. Viet integration tests (supertest/inject pattern nhu tests hien tai)

### Step 4: WebSocket Spread Channel (0.5h)

1. Update `src/core/websocket-server.ts`:
   - Them `'spread'` vao `VALID_CHANNELS` array va `Channel` type
   - Them vao ClientMsgSchema: `z.enum(['tick', 'signal', 'health', 'spread'])`
2. Tao helper function `broadcastSpread(data)` goi `broadcastToChannel('spread', data)`
3. Wire: khi spread scanner detect opportunity → `broadcastSpread({ symbol, spread, exchanges, timestamp })`

### Step 5: Register Routes + Integration (0.5h)

1. Update `src/api/fastify-raas-server.ts`:
   ```typescript
   import { buildArbScanExecuteRoutes } from './routes/arbitrage-scan-execute-routes';
   import { buildArbPositionsHistoryRoutes } from './routes/arbitrage-positions-history-routes';
   // ...
   void server.register(buildArbScanExecuteRoutes(manager, positionTracker));
   void server.register(buildArbPositionsHistoryRoutes(positionTracker));
   ```
2. Inject TenantArbPositionTracker vao server builder
3. Chay tat ca tests: existing + new

## Todo List

- [x] Tao Zod schemas cho arb request/response
- [x] Tao TenantArbPositionTracker voi per-tenant isolation
- [x] Tao /arb/scan va /arb/execute routes voi JWT auth
- [x] Tao /arb/positions, /arb/history, /arb/stats routes
- [x] Them WebSocket channel `spread`
- [x] Register routes vao fastify-raas-server.ts
- [x] Viet integration tests cho tat ca endpoints
- [x] Viet unit tests cho position tracker
- [x] `tsc --noEmit` pass, 0 `any` types
- [x] Chay `npm test` — tat ca tests pass

## Success Criteria
- Tat ca 5 arb endpoints tra ve dung response schema
- JWT auth block unauthorized requests (401)
- Tenant tier enforcement: free users bi block /arb/execute (403)
- Pagination hoat dong cho /arb/history
- WebSocket spread channel broadcast data real-time
- 0 regression tren tests hien tai

## Risk Assessment
- **In-memory store mat data khi restart:** Acceptable cho v1. Phase future: persist vao Redis/DB
- **Concurrent execution:** 2 tenants execute cung spread → 1 fail. Mitigation: optimistic lock + retry
- **Exchange key validation:** Keys co the invalid. Mitigation: validate khi tenant add key, khong phai luc execute

## Security
- JWT required tren tat ca /arb/* routes
- Tenant chi thay positions/history cua minh (tenantId tu JWT)
- Exchange API keys encrypt voi CredentialVault (da co)
- Rate limit 100 req/min per tenant (da co)
- Execute endpoint check canTrade() truoc khi thuc thi
