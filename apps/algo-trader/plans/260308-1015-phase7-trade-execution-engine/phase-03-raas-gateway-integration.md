---
title: "Phase 7.3: RaaS Gateway Integration"
description: "JWT auth, rate limiting, usage events to Stripe/Polar"
status: completed
priority: P1
effort: 3h
---

# Phase 7.3: RaaS Gateway Integration

## Context Links
- **Research:** `plans/reports/researcher-260308-1014-trade-execution-engine.md#raas-gateway-integration`
- **Core Files:** `src/lib/raas-gate.ts`, `src/core/raas-api-router.ts`, `src/auth/sliding-window-rate-limiter.ts`
- **Related:** `src/execution/audit-logger.ts`, `src/billing/stripe-usage-sync.ts`

## Overview
- **Priority:** P1 (Revenue enforcement)
- **Status:** pending
- **Description:** Enforce license tiers, rate limits, and send usage events to billing

## Key Insights from Research
1. **Current RaaS:** `LicenseService` validates JWT tokens, but not enforced on every order
2. **Rate limiting:** In-memory `SlidingWindowRateLimiter`, Redis upgrade planned
3. **Usage events:** No events sent to Stripe/Polar currently
4. **Audit logging:** `RaasAuditLogger` exists but not integrated with order flow

## Requirements

### Functional
- JWT validation on every order placement
- License tier check (FREE/PRO/ENTERPRISE)
- Rate limit check per tenant
- Usage events sent to Stripe/Polar
- Audit logging for compliance

### Non-Functional
- <50ms latency added to order flow
- Async usage event dispatch (non-blocking)
- Graceful degradation if billing unavailable
- Idempotent usage event submission

## Related Code Files

### Modify
- `src/lib/raas-gate.ts` - Add order-level validation
- `src/execution/order-execution-engine.ts` - Integrate RaaS checks
- `src/auth/sliding-window-rate-limiter.ts` - Redis upgrade
- `src/billing/stripe-usage-sync.ts` - Add order events

### Create
- `src/middleware/raas-order-middleware.ts` - Order-level RaaS enforcement
- `src/usage/usage-event-emitter.ts` - Usage event dispatch
- `src/usage/usage-event-types.ts` - Usage event schemas

## Implementation Steps

### Step 1: Define Usage Event Types
```typescript
// src/usage/usage-event-types.ts
export interface UsageEvent {
  id: string;
  tenantId: string;
  eventType: UsageEventType;
  quantity: number;
  unitPrice: number;
  timestamp: number;
  metadata: {
    exchangeId: string;
    symbol: string;
    strategyId?: string;
    orderId?: string;
  };
}

export enum UsageEventType {
  ORDER_PLACED = 'order_placed',
  ORDER_FILLED = 'order_filled',
  API_CALL = 'api_call',
  WEBSOCKET_MESSAGE = 'websocket_message',
}

export enum UsageUnit {
  PER_ORDER = 'per_order',
  PER_FILL = 'per_fill',
  PER_MESSAGE = 'per_message',
}
```

### Step 2: Create Usage Event Emitter
```typescript
// src/usage/usage-event-emitter.ts
export class UsageEventEmitter {
  private buffer: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(
    private stripeSync: StripeUsageSync,
    private polarClient: PolarClient
  ) {
    // Flush every 60s or when buffer > 100
    this.flushInterval = setInterval(() => this.flush(), 60000);
  }

  async emit(event: UsageEvent): Promise<void> {
    this.buffer.push(event);

    // Flush immediately if buffer > 100
    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      // Send to Stripe
      await this.stripeSync.recordUsageBatch(events.map(e => ({
        tenantId: e.tenantId,
        quantity: e.quantity,
        timestamp: e.timestamp,
        metadata: e.metadata,
      })));

      // Send to Polar (if configured)
      if (this.polarClient) {
        await this.polarClient.sendUsageEvents(events);
      }
    } catch (error) {
      // Re-queue events on failure
      this.buffer.unshift(...events);
      logger.error('[USAGE-FLUSH]', { error: error.message });
    }
  }
}
```

### Step 3: Add RaaS Middleware to Order Flow
```typescript
// src/middleware/raas-order-middleware.ts
export async function raasOrderMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tenantId = req.headers['x-tenant-id'] as string;
  const jwt = req.headers['authorization']?.replace('Bearer ', '');

  if (!tenantId || !jwt) {
    res.status(401).json({ error: 'Missing tenant or JWT' });
    return;
  }

  const licenseService = LicenseService.getInstance();
  const rateLimiter = SlidingWindowRateLimiter.getInstance();

  try {
    // 1. Validate JWT
    const payload = await licenseService.verifyToken(jwt);
    if (payload.tenantId !== tenantId) {
      res.status(403).json({ error: 'Tenant mismatch' });
      return;
    }

    // 2. Check rate limit
    const allowed = await rateLimiter.checkLimit(tenantId, 'order_placement', 1);
    if (!allowed) {
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', Date.now() + 60000);
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    // 3. Check license tier for order type
    const orderType = req.body.type; // market, limit, etc.
    if (orderType === 'limit' && payload.tier === 'FREE') {
      res.status(403).json({
        error: 'Limit orders require PRO tier',
        requiredTier: 'PRO'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid JWT' });
  }
}
```

### Step 4: Integrate Usage Events into Order Execution
```typescript
// src/execution/order-execution-engine.ts
import { UsageEventEmitter, UsageEventType } from '../usage/usage-event-emitter';

export class OrderExecutionEngine {
  private usageEmitter: UsageEventEmitter;

  constructor(
    private pool: ExchangeConnectionPool,
    private licenseService: LicenseService,
    private stripeSync: StripeUsageSync,
    private polarClient: PolarClient
  ) {
    this.usageEmitter = new UsageEventEmitter(stripeSync, polarClient);
  }

  async executeOrder(order: Order): Promise<OrderResult> {
    // Emit usage event
    await this.usageEmitter.emit({
      id: `usage_${Date.now()}_${uuid()}`,
      tenantId: order.tenantId,
      eventType: UsageEventType.ORDER_PLACED,
      quantity: 1,
      unitPrice: 0.01, // $0.01 per order
      timestamp: Date.now(),
      metadata: {
        exchangeId: order.exchangeId,
        symbol: order.symbol,
        orderId: order.id,
      },
    });

    // Execute order...
    const result = await this.pool.execute(order);

    // Emit fill event
    if (result.success) {
      await this.usageEmitter.emit({
        id: `usage_${Date.now()}_${uuid()}`,
        tenantId: order.tenantId,
        eventType: UsageEventType.ORDER_FILLED,
        quantity: 1,
        unitPrice: 0.005, // $0.005 per fill
        timestamp: Date.now(),
        metadata: {
          exchangeId: order.exchangeId,
          symbol: order.symbol,
          orderId: order.id,
        },
      });
    }

    return result;
  }
}
```

### Step 5: Redis Upgrade for Rate Limiter
```typescript
// src/auth/sliding-window-rate-limiter.ts
import { Redis } from 'ioredis';

export class SlidingWindowRateLimiter {
  private redis: Redis;

  async checkLimit(
    tenantId: string,
    endpoint: string,
    limit: number
  ): Promise<boolean> {
    const key = `ratelimit:${tenantId}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, now - windowMs);

    // Count current requests
    const count = await this.redis.zcard(key);
    if (count >= limit) {
      return false;
    }

    // Add new request
    await this.redis.zadd(key, now, `${now}-${uuid()}`);
    await this.redis.expire(key, Math.ceil(windowMs / 1000));

    return true;
  }
}
```

## Todo List
- [ ] Define `UsageEvent` interface and types
- [ ] Implement `UsageEventEmitter` class
- [ ] Create `raasOrderMiddleware` for order endpoints
- [ ] Integrate usage events into `OrderExecutionEngine`
- [ ] Upgrade `SlidingWindowRateLimiter` to Redis
- [ ] Add JWT validation to every order
- [ ] Add license tier checks for order types
- [ ] Add unit tests for RaaS middleware
- [ ] Add integration tests with Stripe test mode

## Success Criteria
- [ ] Every order validated with JWT
- [ ] Rate limits enforced per tenant
- [ ] Usage events sent to Stripe/Polar
- [ ] Usage events idempotent (no double-counting)
- [ ] <50ms latency added to order flow

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe API unavailable | Medium | Buffer events, retry with backoff |
| Redis rate limit failure | High | Fallback to in-memory with warning |
| JWT validation slow | Medium | Cache decoded JWT payload |
| Usage event loss | Medium | Persistent queue (Redis streams) |

## Security Considerations
- JWT secret rotation support
- HMAC signature for webhook events
- Tenant isolation in rate limiting
- Audit all RaaS decisions (allow/deny)
