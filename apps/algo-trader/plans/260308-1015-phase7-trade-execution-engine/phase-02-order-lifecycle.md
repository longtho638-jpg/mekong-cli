---
title: "Phase 7.2: Order Lifecycle Management"
description: "Order state machine with cancel/status endpoints and webhook handlers"
status: complete
priority: P1
effort: 2h
---

# Phase 7.2: Order Lifecycle Management

## Context Links
- **Research:** `plans/reports/researcher-260308-1014-trade-execution-engine.md#order-types-lifecycle`
- **Core Files:** `src/execution/ExchangeClient.ts`, `src/interfaces/IExchange.ts`
- **Related:** `src/execution/audit-logger.ts`

## Overview
- **Priority:** P1 (Core trading functionality)
- **Status:** pending
- **Description:** Full order state machine from PENDING to FILLED/CANCELLED

## Key Insights from Research
1. **Current state:** `ExchangeClient.marketOrder()` returns `status: 'closed'` immediately
2. **Missing states:** PARTIALLY_FILLED, REJECTED, EXPIRED not modeled
3. **Async pattern:** Need background fill monitoring for limit orders
4. **Webhook support:** Some brokers support fill webhooks (Alpaca: yes, IBKR: TWS API)

## Requirements

### Functional
- Order states: PENDING, SUBMITTED, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED, EXPIRED
- `cancelOrder(orderId, symbol)` endpoint
- `orderStatus(orderId, symbol)` endpoint
- Webhook handler for fill updates
- Background polling for brokers without webhooks

### Non-Functional
- State transitions logged to audit trail
- WebSocket support for real-time updates
- Polling interval configurable (default: 5s)
- <100ms latency for status lookup

## Related Code Files

### Modify
- `src/execution/ExchangeClient.ts` - Add cancelOrder, fetchOrder methods (already exist, enhance)
- `src/interfaces/IExchange.ts` - Add OrderStatus type, Order interface
- `src/execution/audit-logger.ts` - Add state transition logging

### Create
- `src/execution/order-state-machine.ts` - State transition logic
- `src/execution/order-lifecycle-manager.ts` - Polling + webhook coordination
- `src/api/routes/orders.ts` - REST API endpoints
- `src/webhooks/order-fill-handler.ts` - Webhook handler

## Implementation Steps

### Step 1: Define Order State Machine
```typescript
type OrderStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

interface OrderStateTransition {
  from: OrderStatus;
  to: OrderStatus;
  trigger: 'submit' | 'partial_fill' | 'full_fill' | 'cancel' | 'reject' | 'expire';
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED'],
  PARTIALLY_FILLED: ['FILLED', 'CANCELLED'],
  FILLED: [], // Terminal state
  CANCELLED: [], // Terminal state
  REJECTED: [], // Terminal state
  EXPIRED: [], // Terminal state
};
```

### Step 2: Enhance Order Interface
```typescript
interface Order {
  id: string;
  clientOrderId?: string; // Idempotency key
  tenantId: string;
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: OrderStatus;

  // Timestamps
  createdAt: number;
  submittedAt?: number;
  filledAt?: number;
  cancelledAt?: number;

  // Execution details
  avgFillPrice?: number;
  totalFilled?: number;
  remainingAmount?: number;

  // Audit
  ip?: string;
  userAgent?: string;
  strategyId?: string;
}
```

### Step 3: Implement State Manager
```typescript
class OrderLifecycleManager {
  private orders: Map<string, Order> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

  async submitOrder(order: Order): Promise<void> {
    await this.transitionState(order.id, 'SUBMITTED');
    order.submittedAt = Date.now();
    this.orders.set(order.id, order);

    // Start polling for brokers without webhooks
    this.startPolling(order.id);
  }

  async handleFillUpdate(orderId: string, fillPrice: number, fillAmount: number): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.avgFillPrice = fillPrice;
    order.totalFilled = (order.totalFilled || 0) + fillAmount;
    order.remainingAmount = order.amount - order.totalFilled;

    if (order.remainingAmount <= 0) {
      await this.transitionState(orderId, 'FILLED');
      order.filledAt = Date.now();
    } else {
      await this.transitionState(orderId, 'PARTIALLY_FILLED');
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    await this.transitionState(orderId, 'CANCELLED');
    order.cancelledAt = Date.now();

    // Call exchange cancel
    await this.exchangeClient.cancelOrder(orderId, order.symbol, { reason });

    return order;
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return order.status;
  }

  private async transitionState(orderId: string, toState: OrderStatus): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const validTransitions = VALID_TRANSITIONS[order.status];
    if (!validTransitions.includes(toState)) {
      throw new Error(`Invalid transition from ${order.status} to ${toState}`);
    }

    const fromState = order.status;
    order.status = toState;

    // Log transition to audit
    auditLogger.logOrderStateTransition({
      orderId,
      fromState,
      toState,
      timestamp: Date.now(),
    });
  }

  private startPolling(orderId: string): void {
    // Poll every 5s for order updates
    setInterval(async () => {
      const order = this.orders.get(orderId);
      if (!order || ['FILLED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
        return;
      }

      const exchangeOrder = await this.exchangeClient.fetchOrder(orderId, order.symbol);
      await this.syncOrderState(order, exchangeOrder);
    }, 5000);
  }
}
```

### Step 4: Add REST API Endpoints
```typescript
// src/api/routes/orders.ts
router.post('/api/v1/orders', async (req, res) => {
  const { side, symbol, amount, price, type } = req.body;
  const order = await orderManager.createOrder({ side, symbol, amount, price, type });
  res.status(202).json({ orderId: order.id, status: order.status });
});

router.get('/api/v1/orders/:id', async (req, res) => {
  const status = await orderManager.getOrderStatus(req.params.id);
  res.json(status);
});

router.delete('/api/v1/orders/:id', async (req, res) => {
  const order = await orderManager.cancelOrder(req.params.id, req.body.reason);
  res.json(order);
});
```

### Step 5: Webhook Handler
```typescript
// src/webhooks/order-fill-handler.ts
export async function handleOrderFillWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const { order_id, fill_price, fill_amount, status } = req.body;

  // Verify webhook signature
  const valid = await verifyWebhookSignature(req);
  if (!valid) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  await orderManager.handleFillUpdate(order_id, fill_price, fill_amount);
  res.json({ received: true });
}
```

## Todo List
- [x] Define `OrderStatus` type and `Order` interface
- [x] Implement `OrderLifecycleManager` class
- [x] Add state transition validation
- [x] Implement `cancelOrder()` method
- [x] Implement `getOrderStatus()` method
- [x] Create REST API endpoints for orders
- [x] Implement webhook handler for fill updates
- [x] Add background polling for non-webhook brokers (infrastructure only, disabled by default)
- [x] Add unit tests for state machine
- [x] Add integration tests with mock exchange (via lifecycle manager tests)

## Success Criteria
- [x] Order transitions follow valid state machine
- [x] `cancelOrder()` successfully cancels pending orders
- [x] `getOrderStatus()` returns current state
- [x] Webhook updates order state in real-time
- [x] Polling fallback works for brokers without webhooks (infrastructure ready)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| State machine deadlock | High | Add timeout/expire transitions |
| Webhook signature forgery | High | HMAC verification required |
| Polling rate limit | Medium | Exponential backoff on 429 |
| Order not found | Medium | Return 404 with clear error |

## Security Considerations
- Webhook signature verification (HMAC-SHA256)
- Cancel order requires tenant authentication
- Rate limit status polling per tenant
- Audit all state transitions
