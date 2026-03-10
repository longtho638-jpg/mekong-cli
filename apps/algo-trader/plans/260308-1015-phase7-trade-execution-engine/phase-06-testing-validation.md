---
title: "Phase 7.6: Testing & Validation"
description: "Comprehensive tests for idempotency, order lifecycle, RaaS, audit, and multi-broker"
status: completed
priority: P1
effort: 1h
---

# Phase 7.6: Testing & Validation

## Context Links
- **Core Files:** All Phase 7 components
- **Test Pattern:** `tests/unit/execution/`, `tests/integration/`

## Overview
- **Priority:** P1 (Quality assurance)
- **Status:** pending
- **Description:** Unit, integration, and E2E tests for all Phase 7 components

## Test Coverage Areas

### 1. Idempotency Layer Tests
- Duplicate order prevention
- TTL expiration
- Redis store operations
- Middleware integration

### 2. Order Lifecycle Tests
- State machine transitions
- Order cancellation
- Status polling
- Webhook handling

### 3. RaaS Gateway Tests
- JWT validation
- Rate limiting
- Usage event emission
- License tier enforcement

### 4. Audit Logging Tests
- PostgreSQL persistence
- SEC/FINRA field capture
- Query interface
- S3 export

### 5. Multi-Broker Tests
- Adapter pattern
- Order placement per broker
- Error mapping
- Health checks

## Implementation Steps

### Step 1: Idempotency Tests
```typescript
// tests/unit/execution/idempotency-store.test.ts
describe('RedisIdempotencyStore', () => {
  let store: RedisIdempotencyStore;

  beforeEach(async () => {
    await redis.flushdb();
    store = new RedisIdempotencyStore();
  });

  it('should return null for non-existent key', async () => {
    const result = await store.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should store and retrieve record', async () => {
    const record: IdempotencyRecord = {
      idempotencyKey: 'test-key',
      orderId: 'order-123',
      status: 'FILLED',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };

    await store.set('test-key', record);
    const retrieved = await store.get('test-key');

    expect(retrieved?.orderId).toBe('order-123');
    expect(retrieved?.status).toBe('FILLED');
  });

  it('should expire record after TTL', async () => {
    const record: IdempotencyRecord = {
      idempotencyKey: 'short-ttl-key',
      orderId: 'order-456',
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000, // 1 second
    };

    await store.set('short-ttl-key', record);
    await sleep(1500);

    const retrieved = await store.get('short-ttl-key');
    expect(retrieved).toBeNull();
  });
});
```

### Step 2: Order Lifecycle Tests
```typescript
// tests/unit/execution/order-state-machine.test.ts
describe('OrderStateMachine', () => {
  let stateMachine: OrderStateMachine;

  beforeEach(() => {
    stateMachine = new OrderStateMachine();
  });

  it('should transition from PENDING to SUBMITTED', async () => {
    await stateMachine.transition('PENDING', 'SUBMIT');
    expect(stateMachine.currentState).toBe('SUBMITTED');
  });

  it('should reject invalid transition', async () => {
    await stateMachine.transition('PENDING', 'SUBMIT');
    await expect(
      stateMachine.transition('SUBMITTED', 'SUBMIT') // Invalid
    ).rejects.toThrow('Invalid transition');
  });

  it('should allow partial fill then full fill', async () => {
    await stateMachine.transition('PENDING', 'SUBMIT');
    await stateMachine.transition('SUBMITTED', 'PARTIAL_FILL');
    await stateMachine.transition('PARTIALLY_FILLED', 'FULL_FILL');
    expect(stateMachine.currentState).toBe('FILLED');
  });
});
```

### Step 3: RaaS Middleware Tests
```typescript
// tests/unit/middleware/raas-order-middleware.test.ts
describe('raasOrderMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-jwt-token',
      },
      body: { type: 'market' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should call next() with valid JWT and tenant', async () => {
    await raasOrderMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject missing JWT', async () => {
    mockReq.headers!.authorization = undefined;
    await raasOrderMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should reject FREE tier for limit orders', async () => {
    mockReq.body.type = 'limit';
    // Mock JWT payload as FREE tier
    jest.spyOn(LicenseService.prototype, 'verifyToken').mockResolvedValue({
      tenantId: 'tenant-123',
      tier: 'FREE',
    });

    await raasOrderMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});
```

### Step 4: Audit Log Tests
```typescript
// tests/unit/compliance/audit-log-repository.test.ts
describe('AuditLogRepository', () => {
  let repository: AuditLogRepository;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    repository = new AuditLogRepository();
  });

  it('should append audit log', async () => {
    const log: AuditLogInput = {
      tenantId: 'tenant-123',
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      orderId: 'order-789',
      eventType: 'TRADE_EXECUTED',
      severity: 'INFO',
      amount: 0.5,
      price: 50000,
    };

    const id = await repository.append(log);
    expect(id).toBeDefined();
  });

  it('should find logs by tenant and date range', async () => {
    // Seed logs
    await repository.append({ /* log 1 */ });
    await repository.append({ /* log 2 */ });

    const logs = await repository.findByTenant(
      'tenant-123',
      new Date('2026-03-08'),
      new Date('2026-03-09')
    );

    expect(logs.length).toBeGreaterThan(0);
  });

  it('should find logs by order ID', async () => {
    const orderId = 'order-unique-123';
    await repository.append({ orderId, eventType: 'TRADE_EXECUTED', /* ... */ });
    await repository.append({ orderId, eventType: 'ORDER_STATE_TRANSITION', /* ... */ });

    const logs = await repository.findByOrderId(orderId);
    expect(logs.length).toBe(2);
  });
});
```

### Step 5: Multi-Broker Tests
```typescript
// tests/unit/execution/brokers/binance-adapter.test.ts
describe('BinanceAdapter', () => {
  let adapter: BinanceAdapter;
  let mockExchange: jest.Mocked<ccxt.binance>;

  beforeEach(() => {
    mockExchange = {
      createMarketOrder: jest.fn(),
      cancelOrder: jest.fn(),
      fetchOrder: jest.fn(),
      // ... mock other methods
    } as any;

    adapter = new BinanceAdapter(config, auditLogger);
    (adapter as any).exchange = mockExchange;
  });

  it('should create market order', async () => {
    mockExchange.createMarketOrder.mockResolvedValue({
      id: 'binance-order-123',
      symbol: 'BTC/USDT',
      side: 'buy',
      amount: 0.5,
      status: 'closed',
    });

    const order = await adapter.createMarketOrder({
      symbol: 'BTC/USDT',
      side: 'buy',
      amount: 0.5,
    });

    expect(order.id).toBe('binance-order-123');
    expect(order.status).toBe('FILLED');
  });

  it('should handle broker error', async () => {
    mockExchange.createMarketOrder.mockRejectedValue(
      new Error('Insufficient funds')
    );

    await expect(
      adapter.createMarketOrder({ symbol: 'BTC/USDT', side: 'buy', amount: 1000 })
    ).rejects.toThrow('INSUFFICIENT_FUNDS');
  });
});
```

## Todo List
- [ ] Write idempotency store tests
- [ ] Write order state machine tests
- [ ] Write RaaS middleware tests
- [ ] Write audit log repository tests
- [ ] Write broker adapter tests (Binance, IBKR, Alpaca)
- [ ] Run all tests and fix failures
- [ ] Add integration tests with sandbox brokers
- [ ] Generate coverage report

## Success Criteria
- [ ] 90%+ code coverage for Phase 7 components
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No TypeScript errors
- [ ] E2E test for complete order flow

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Broker sandbox unavailable | Medium | Mock brokers in unit tests |
| Redis test flakiness | Low | Use in-memory Redis for tests |
| PostgreSQL test isolation | Medium | Transaction per test |
| JWT test complexity | Low | Use test JWT utility |
