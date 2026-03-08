# Real-Time Trade Execution Engine Research

**Date:** 2026-03-08
**Work Context:** /Users/macbookprom1/mekong-cli/apps/algo-trader
**Reports Path:** /Users/macbookprom1/mekong-cli/apps/algo-trader/plans/reports/

---

## Executive Summary

This report analyzes the current trade execution engine implementation in the algo-trader project and provides recommendations for real-time execution patterns, broker integration, idempotency, audit logging, and RaaS Gateway integration.

**Key Findings:**

1. **Order Execution:** Market orders supported via CCXT; limit orders implemented but async behavior needs enhancement
2. **Broker Integration:** Binance via CCXT; abstracted via ExchangeClient pattern; other exchanges supported by CCXT
3. **Idempotency:**.No dedicated idempotency layer exists - needs UUID-based deduplication with Redis backing
4. **Audit Logging:** Comprehensive audit system exists (AuditLogger, TradeAuditLogger) with webhook support
5. **RaaS Gateway:** \_RAAS\_GATE (LicenseService) provides license-based feature gating; rate limiting via SlidingWindowRateLimiter (Phase 3: Redis upgrade planned)

**Current State Assessment:**
- ✅ Basic execution: Market orders working
- ✅ Audit trail: Full event logging
- ✅ Rate limiting: In-memory implementation
- ✅ Circuit breaker: Legacy CircuitBreakerLegacy in place
- ❌ Idempotency: No cross-request deduplication
- ❌ Broker mapping: Only Binance direct; IBKR/Alpaca need integration
- ⚠️ Order lifecycle: PENDING→SUBMITTED→FILLED states not fully modeled

---

## Broker API Comparison

| Feature | Interactive Brokers (IBKR) | Alpaca Markets | Binance |
|---------|---------------------------|----------------|---------|
| **Protocol** | Socket + REST | REST + WebSocket | WebSocket + REST |
| **Auth** | API Key + Secret | API Key + Secret | API Key + Secret |
| **Order Types** | Market, Limit, Stop, OCO,Bracket | Market, Limit, Stop, StopLimit | Market, Limit, IOC, FOK, Stop, OCO |
| **Rate Limits** | ~50 req/s | 200 req/min | 1200 req/min |
| **Webhook** | TWS API events | Events API | WebSocket events |
| **Idempotency** | ClientOrderId | ClientOrderID | ClientOrderId |
| **Latency** | ~100-500ms | ~20-100ms | ~10-50ms |

**Code Patterns from Existing Implementation:**

```typescript
// ExchangeClient.ts (current)
async marketOrder(side: 'buy' | 'sell', symbol: string, amount: number): Promise<IOrder>
async limitOrder(side: 'buy' | 'sell', symbol: string, amount: number, price: number): Promise<IOrder>
```

**Recommendation:** Extend ExchangeClient to support:
1. `orderCancel(orderId: string)` - order cancellation
2. `orderStatus(orderId: string)` - order status polling
3. `createOrderWithIdempotency(orderParams, idempotencyKey)` - idempotent placement

---

## Order Types & Lifecycle

### Current Order Types (Inferred)

| Type | Sync/Async | Fill Behavior | Status Transition |
|------|-----------|---------------|-------------------|
| Market | Synchronous | Immediate | PENDING→SUBMITTED→FILLED |
| Limit | Pending | Conditional | PENDING→SUBMITTED→PARTIALLY_FILLED→FILLED/CANCELLED |

### Proposed Order State Machine

```
Order States:
  PENDING       → Order queued, not yet submitted
  SUBMITTED     → Order sent to exchange, awaiting confirmation
  PARTIALLY_FILLED → Partial fill received
  FILLED        → Full execution complete
  CANCELLED     → Order cancelled by user
  REJECTED      → Exchange rejected order

Transitions:
  PENDING --submit--> SUBMITTED
  SUBMITTED --partial_fill--> PARTIALLY_FILLED
  PARTIALLY_FILLED --full_fill--> FILLED
  SUBMITTED --cancel--> CANCELLED
  SUBMITTED --reject--> REJECTED
```

**Implementation Note:** Current `ExchangeClient.marketOrder()` returns immediately with `status: 'closed'`. For truly async behavior, return `status: 'open'` with background fill monitoring.

---

## Idempotency Pattern Recommendations

### Problem Statement
Currently, no deduplication exists for repeated order submissions. Network retries or UI double-clicks can result in duplicate orders.

### Solution Architecture

```typescript
// Idempotency Store Interface
interface IdempotencyStore {
  get(idempotencyKey: string): Promise<IdempotencyRecord | null>
  set(idempotencyKey: string, record: IdempotencyRecord, ttlSeconds: number): Promise<void>
  delete(idempotencyKey: string): Promise<void>
}

interface IdempotencyRecord {
  orderId: string
  status: OrderStatus
  createdAt: number
  expiresAt: number
}
```

### Implementation Options

**Option A: Redis (Recommended for Production)**
```bash
# TTL: 24h for typical order lifetime
SETNX idem:<key> <orderId>
EXPIRE idem:<key> 86400
```

**Option B: DynamoDB (AWS)**
```typescript
// Provisioned: 1 WCU, 1 RCU
// TTL attribute: expiresAt (unix timestamp)
```

**Option C: PostgreSQL (Simple Setup)**
```sql
CREATE TABLE idempotency_keys (
  key_hash TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_idem_expires ON idempotency_keys(expires_at);
```

### Atomic Pattern with Rollback

```typescript
// AtomicCrossExchangeOrderExecutor.ts (already exists)
// Pattern: Promise.allSettled() + partial failure rollback
```

**Recommendation:** Keep existing `AtomicCrossExchangeOrderExecutor` for multi-exchange trades.

---

## Audit Logging Schema

### Current Audit Implementation

**AuditLogger** (`src/execution/audit-logger.ts`):
- In-memory buffer (1000 events max)
- Webhook notification support
- Event types: TRADE_EXECUTED, TRADE_CANCELLED, TRADE_FAILED, API_KEY_USED, etc.
- Severity levels: INFO, WARNING, CRITICAL

**TradeAuditLogger** (`src/a2ui/trade-audit-logger.ts`):
- Undoable entries for compliance
- Event bus integration (AgentEventBus)
- Entry IDs: `audit-{counter}-{timestamp}`

### SEC/FINRA Compliance Requirements

| Requirement | Implementation Status |
|-------------|----------------------|
| Who (tenantId) | ✅ |
| What (order details) | ✅ |
| When (timestamp) | ✅ |
| Price | ✅ |
| Quantity | ✅ |
| Order IDs | ✅ |
| Immutable storage | ⚠️ Buffer-only (in-memory) |

### Recommended Audit Schema Extension

```typescript
interface AuditEvent {
  id: string;
  tenantId: string;
  exchangeId: string;
  symbol: string;
  orderId?: string;
  clientOrderId?: string;  // Idempotency key
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  fee: number;
  strategyId?: string;
  signalId?: string;
  eventType: AuditEventType;
  severity: SeverityLevel;
  ip?: string;  // For regulatory tracking
  userAgent?: string;
  metadata: {
    latencyMs?: number;
    retryCount?: number;
    circuitBreakerState?: string;
    rateLimitRemaining?: number;
  };
}
```

### Immutable Storage Pattern

**Write-Once, Append-Only Log:**
```
audit-logs/
  tenant-<tenantId>/
    <year>_<month>/audit-<date>-<seq>.jsonl
```

**Implementation Steps:**
1. Keep in-memory buffer for near-real-time monitoring
2. Write to disk buffer each event
3. Batch upload to S3每日
4. Keep 90 days local, archive to S3 Glacier

---

## RaaS Gateway Integration

### Current Integration Points

**LicenseService** (`src/lib/raas-gate.ts`):
- Tier validation: FREE, PRO, ENTERPRISE
- JWT-based license validation
- Rate limiting on validation failures (5 attempts/minute)
- Audit logging for compliance

**Rate Limiting** (`src/auth/sliding-window-rate-limiter.ts`):
- In-memory store (Phase 2)
- Redis upgrade planned (Phase 3)
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**API Key Manager** (`src/auth/api-key-manager.ts`):
- Keys: `algo_` prefix + 32 hex chars
- SHA-256 hashing (raw keys never persisted)
- Timing-safe comparisons

### RaaS Gateway Order Flow

```
Client Request
    ↓
[1] API Key Validation (RaasApiRouter)
    ↓
[2] Tenant Auth (JwtTokenService)
    ↓
[3] Rate Limit Check (SlidingWindowRateLimiter)
    ↓
[4] License Tier Check (LicenseService)
    ↓
[5] Order Execution (ExchangeClient)
    ↓
[6] Audit Log (AuditLogger)
    ↓
[7] Usage Event → Stripe/Polar (TODO)
```

### Usage Metering Events

**Current:** No usage events sent to billing system.

**Required Events for Stripe/Polar:**
```typescript
interface UsageEvent {
  tenantId: string;
  event: string;  // 'order_placed', 'order_filled', 'api_call'
  quantity: number;
  unitPrice: number;
  metadata: {
    exchangeId: string;
    symbol: string;
    strategyId?: string;
  };
}
```

### Implementation Recommendations

**Phase 1 (Immediate):**
1. Send usage events from `ExchangeClient` → `webhook-notifier.ts`
2. Webhook target: `https://raas-gateway/api/v1/usage/events`

**Phase 2 (Billing):**
1. Create `/api/v1/billing/usage` endpoint
2. Store events in PostgreSQL (`usage_events` table)
3. Daily aggregation → Stripe metered billing

**Phase 3 (Audit):**
1. Enable RAAS_AUDIT environment variable
2. Forward audit events to SIEM/CloudWatch

---

## Async Order Execution Architecture

### Proposed Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Client Request (POST /api/v1/orders)                                 │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Generate idempotencyKey = "order:<tenantId>:<uuid>"              │
│ 2. Upsert idempotency: SETNX idem:<key> PENDING TTL 24h             │
│ 3. Queue order: redis.lpush("orders:<tenantId>", orderJson)         │
│ 4. Return 202 Accepted + {idempotencyKey, status: PENDING}          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Order Worker    │
                    │ - Poll queue    │
                    │ - Check idem    │
                    │ - Execute       │
                    │ - Update state  │
                    └─────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Webhook Handler │
                    │ - Fill events   │
                    │ - Update status │
                    │ - Notify client │
                    └─────────────────┘
```

### Type Definitions

```typescript
// Order state machine
interface Order {
  id: string;              // DB ID
  clientOrderId: string;   // Idempotency key
  tenantId: string;
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: OrderStatus;

  // Idempotency
  idempotencyKey: string;

  // Metadata
  createdAt: number;
  submittedAt?: number;
  filledAt?: number;
  cancelledAt?: number;

  // Execution details
  avgFillPrice?: number;
  totalFilled?: number;

  // Audit
  ip?: string;
  userAgent?: string;
  strategyId?: string;
}

type OrderStatus =
  | 'PENDING'       // Queued, not submitted
  | 'SUBMITTED'     // Sent to exchange
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';
```

---

## Concrete Recommendations

### Priority 1 (Week 1)

| Task | Impact |
|------|--------|
| Add idempotencyKey to order creation | Prevent duplicate orders |
| Expose order cancel endpoint | User control |
| Add order status polling `/api/v1/orders/:id` | Visibility |

### Priority 2 (Week 2)

| Task | Impact |
|------|--------|
| WebSocket fill monitoring | Real-time updates |
| Redis-backed idempotency store | Production scale |
| usage events → RaaS Gateway | Billing support |

### Priority 3 (Week 3)

| Task | Impact |
|------|--------|
| IBKR API integration | Broker diversity |
| Alpaca API integration | US market access |
| Immutable audit log storage | Compliance |

---

## Unresolved Questions

1. **Idempotency Key Duration:** 24h recommended, but should FOK/IOC orders expire faster?

2. **Submit/Report Pattern:** Should `ExchangeClient` use CCXT's `clientOrderId` parameter for broker-level idempotency?

3. **Order Fill Webhooks:** Which brokers support webhook fills? (Alpaca: ✅, Binance: WebSocket, IBKR: TWS API)

4. **Multi-tenant Audit:** Should audit logs be partitioned by tenant ID at storage level or via query filter?

5. **Rate Limiting Scope:** Current `SlidingWindowRateLimiter` tracks per `keyId`. Should it also track per `tenantId` + `endpoint` combination?

6. **Europe/BINANCE-EU:** Need separate exchange instances for regional compliance?

---

## Appendix: Code References

| Component | File Path | Description |
|-----------|-----------|-------------|
| ExchangeClient | `src/execution/ExchangeClient.ts` | CCXT abstraction |
| OrderExecutionEngine | `src/execution/order-execution-engine.ts` | License-gated execution |
| AtomicExecutor | `src/execution/atomic-cross-exchange-order-executor.ts` | Multi-exchange atomic orders |
| AuditLogger | `src/execution/audit-logger.ts` | Trade event logging |
| TradeAuditLogger | `src/a2ui/trade-audit-logger.ts` | A2UI audit with undo |
| LicenseService | `src/lib/raas-gate.ts` | Feature gating |
| RateLimiter | `src/auth/sliding-window-rate-limiter.ts` | In-memory limits |
| RaasAuditLogger | `src/lib/raas-audit-logger.ts` | License audit |

---

*Report generated by researcher agent on 2026-03-08 10:14 UTC*
