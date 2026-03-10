---
title: "Phase 7.1: Idempotency Layer"
description: "UUID-based order deduplication with Redis-backed store"
status: completed
priority: P1
effort: 2h
---

# Phase 7.1: Idempotency Layer

## Context Links
- **Research:** `plans/reports/researcher-260308-1014-trade-execution-engine.md#idempotency-pattern-recommendations`
- **Core Files:** `src/execution/ExchangeClient.ts`, `src/execution/order-execution-engine.ts`
- **New Files:** `src/execution/idempotency-store.ts`, `src/middleware/idempotency-middleware.ts`

## Overview
- **Priority:** P1 (Critical for production)
- **Status:** pending
- **Description:** Prevent duplicate orders from network retries or UI double-clicks

## Key Insights from Research
1. **No current deduplication:** Network retries can result in duplicate orders
2. **CCXT supports `clientOrderId`:** Can pass idempotency key to brokers
3. **Three storage options:** Redis (recommended), DynamoDB, PostgreSQL
4. **TTL recommendation:** 24h for typical orders, shorter for FOK/IOC

## Requirements

### Functional
- Generate UUID-based idempotency key per order
- Store idempotency records with TTL
- Return existing order result if key already processed
- Middleware for order placement endpoints

### Non-Functional
- Atomic operations (SETNX pattern)
- TTL: 24h default, configurable per order type
- <10ms lookup latency
- Graceful degradation if Redis unavailable

## Related Code Files

### Modify
- `src/execution/ExchangeClient.ts` - Add idempotency key to order params
- `src/execution/order-execution-engine.ts` - Add idempotency check before execution

### Create
- `src/execution/idempotency-store.ts` - Redis-backed store interface
- `src/middleware/idempotency-middleware.ts` - Express/FastAPI middleware
- `src/interfaces/IdempotencyRecord.ts` - Type definitions

## Implementation Steps

### Step 1: Define Idempotency Types
```typescript
interface IdempotencyRecord {
  idempotencyKey: string;
  orderId: string;
  status: OrderStatus;
  result?: IOrder;
  createdAt: number;
  expiresAt: number;
}

interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(key: string, record: IdempotencyRecord): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### Step 2: Implement Redis Store
```typescript
class RedisIdempotencyStore implements IdempotencyStore {
  async get(key: string): Promise<IdempotencyRecord | null> {
    const data = await redis.get(`idem:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    const ttl = Math.floor((record.expiresAt - Date.now()) / 1000);
    await redis.setex(`idem:${key}`, ttl, JSON.stringify(record));
  }
}
```

### Step 3: Add Middleware to ExchangeClient
```typescript
async marketOrder(side, symbol, amount, params = {}) {
  const idempotencyKey = params.idempotencyKey || `order:${this.tenantId}:${uuid()}`;

  // Check idempotency store
  const existing = await this.idempotencyStore.get(idempotencyKey);
  if (existing) {
    return existing.result; // Return cached result
  }

  // Execute order
  const result = await super.marketOrder(side, symbol, amount, {
    ...params,
    clientOrderId: idempotencyKey, // Pass to broker
  });

  // Store result
  await this.idempotencyStore.set(idempotencyKey, {
    idempotencyKey,
    orderId: result.id,
    status: result.status,
    result,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000, // 24h
  });

  return result;
}
```

### Step 4: Create Middleware for API Endpoints
```typescript
// src/middleware/idempotency-middleware.ts
export function idempotencyMiddleware(tenantId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Missing X-Idempotency-Key header' });
    }

    const store = getRedisIdempotencyStore();
    const existing = await store.get(idempotencyKey);

    if (existing) {
      return res.json(existing.result); // Return cached response
    }

    // Store pending state
    await store.set(idempotencyKey, {
      idempotencyKey,
      orderId: 'pending',
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });

    next();
  };
}
```

## Todo List
- [ ] Define `IdempotencyRecord` interface
- [ ] Implement `RedisIdempotencyStore` class
- [ ] Add `idempotencyKey` parameter to `ExchangeClient.marketOrder()`
- [ ] Add `idempotencyKey` parameter to `ExchangeClient.limitOrder()`
- [ ] Create `idempotencyMiddleware` for API endpoints
- [ ] Add unit tests for idempotency store
- [ ] Add integration tests for duplicate order prevention

## Success Criteria
- [ ] Duplicate order with same idempotency key returns cached result
- [ ] Idempotency records expire after TTL
- [ ] `clientOrderId` passed to CCXT brokers
- [ ] Tests verify no duplicate orders under network retry simulation

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis unavailable | High | Fallback to in-memory store with warning |
| TTL too short | Medium | Configurable TTL per order type |
| TTL too long | Low | Memory pressure, monitor Redis usage |
| Key collision | Low | Use UUID v4 for uniqueness |

## Security Considerations
- Idempotency keys scoped to tenant ID
- Validate idempotency key format (prevent injection)
- Rate limit idempotency lookups to prevent DoS
