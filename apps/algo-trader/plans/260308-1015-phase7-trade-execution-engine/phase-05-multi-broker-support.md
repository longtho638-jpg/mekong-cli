---
title: "Phase 7.5: Multi-Broker Support"
description: "ExchangeClient refactor for 3+ brokers with unified order schema"
status: paused
priority: P2
effort: 2h
---

# Phase 7.5: Multi-Broker Support

## Context Links
- **Research:** `plans/reports/researcher-260308-1014-trade-execution-engine.md#broker-api-comparison`
- **Core Files:** `src/execution/ExchangeClient.ts`, `src/execution/exchange-connector.ts`
- **Related:** `src/execution/exchange-registry.ts`

## Overview
- **Priority:** P2 (Broker diversity)
- **Status:** pending
- **Description:** Support 3+ brokers (Binance, IBKR, Alpaca) with unified order schema

## Key Insights from Research
1. **Current support:** Binance via CCXT, other CCXT exchanges supported
2. **Missing brokers:** IBKR (socket + REST), Alpaca (REST + WebSocket) not directly integrated
3. **Idempotency:** All brokers support `clientOrderId` for deduplication
4. **Error handling:** Broker-specific error codes need mapping

## Requirements

### Functional
- Unified order interface across all brokers
- Support Binance, IBKR, Alpaca
- Broker-specific error handling
- Market, limit, stop orders
- Order cancellation and status polling

### Non-Functional
- <100ms latency per broker call
- Connection pooling for efficiency
- Graceful degradation if broker unavailable
- Consistent error messages across brokers

## Related Code Files

### Modify
- `src/execution/ExchangeClient.ts` - Refactor to use adapter pattern
- `src/execution/exchange-connector.ts` - Add broker-specific connectors
- `src/execution/exchange-registry.ts` - Multi-broker registry

### Create
- `src/execution/brokers/broker-adapter.ts` - Base adapter interface
- `src/execution/brokers/binance-adapter.ts` - Binance adapter
- `src/execution/brokers/ibkr-adapter.ts` - IBKR adapter
- `src/execution/brokers/alpaca-adapter.ts` - Alpaca adapter
- `src/execution/brokers/error-mapper.ts` - Error code mapping

## Implementation Steps

### Step 1: Define Broker Adapter Interface
```typescript
// src/execution/brokers/broker-adapter.ts
export interface BrokerAdapter {
  // Info
  getBrokerId(): string;
  getExchangeName(): string;
  isConnected(): boolean;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  checkHealth(): Promise<boolean>;

  // Market data
  fetchTicker(symbol: string): Promise<Ticker>;
  fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook>;

  // Orders
  createMarketOrder(params: CreateOrderParams): Promise<IOrder>;
  createLimitOrder(params: CreateLimitOrderParams): Promise<IOrder>;
  cancelOrder(orderId: string, symbol: string): Promise<IOrder>;
  fetchOrder(orderId: string, symbol: string): Promise<IOrder>;
  fetchOpenOrders(symbol?: string): Promise<IOrder[]>;

  // Account
  fetchBalance(): Promise<Record<string, IBalance>>;
  fetchMyTrades(symbol?: string): Promise<ITrade[]>;

  // Webhooks (optional)
  supportsWebhooks(): boolean;
  registerWebhook(url: string, events: string[]): Promise<void>;
}

export interface CreateOrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  clientOrderId?: string; // Idempotency key
  strategyId?: string;
}

export interface CreateLimitOrderParams extends CreateOrderParams {
  price: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}
```

### Step 2: Create Base Adapter Class
```typescript
// src/execution/brokers/base-broker-adapter.ts
export abstract class BaseBrokerAdapter implements BrokerAdapter {
  protected connected = false;
  protected logger: Logger;

  constructor(
    protected config: BrokerConfig,
    protected auditLogger: AuditLogger
  ) {
    this.logger = createLogger(this.getBrokerId());
  }

  abstract getBrokerId(): string;
  abstract getExchangeName(): string;
  abstract isConnected(): boolean;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract checkHealth(): Promise<boolean>;

  abstract fetchTicker(symbol: string): Promise<Ticker>;
  abstract fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  abstract createMarketOrder(params: CreateOrderParams): Promise<IOrder>;
  abstract createLimitOrder(params: CreateLimitOrderParams): Promise<IOrder>;
  abstract cancelOrder(orderId: string, symbol: string): Promise<IOrder>;
  abstract fetchOrder(orderId: string, symbol: string): Promise<IOrder>;
  abstract fetchOpenOrders(symbol?: string): Promise<IOrder[]>;
  abstract fetchBalance(): Promise<Record<string, IBalance>>;
  abstract fetchMyTrades(symbol?: string): Promise<ITrade[]>;

  supportsWebhooks(): boolean {
    return false; // Default: no webhook support
  }

  registerWebhook(url: string, events: string[]): Promise<void> {
    throw new Error('Webhooks not supported');
  }

  protected mapError(error: unknown, operation: string): Error {
    return mapBrokerError(error, this.getBrokerId(), operation);
  }

  protected logOrderExecution(order: IOrder, metadata?: TradeExecutionMetadata): void {
    this.auditLogger.logTradeExecution(order, metadata);
  }

  protected logOrderFailure(symbol: string, side: string, amount: number, error: string): void {
    this.auditLogger.logTradeFailure(symbol, side, amount, error);
  }
}
```

### Step 3: Implement Binance Adapter (CCXT)
```typescript
// src/execution/brokers/binance-adapter.ts
import ccxt from 'ccxt';
import { BaseBrokerAdapter } from './base-broker-adapter';

export class BinanceAdapter extends BaseBrokerAdapter {
  private exchange: ccxt.binance;

  async connect(): Promise<void> {
    this.exchange = new ccxt.binance({
      apiKey: this.config.apiKey,
      secret: this.config.secret,
      enableRateLimit: true,
    });
    await this.exchange.loadMarkets();
    this.connected = true;
  }

  async createMarketOrder(params: CreateOrderParams): Promise<IOrder> {
    try {
      const order = await this.exchange.createMarketOrder(
        params.symbol,
        params.side,
        params.amount,
        undefined,
        params.clientOrderId ? { clientOrderId: params.clientOrderId } : {}
      );

      return {
        id: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        side: order.side as 'buy' | 'sell',
        amount: order.amount,
        price: order.average || 0,
        status: this.mapStatus(order.status),
        timestamp: order.timestamp,
      };
    } catch (error) {
      this.logOrderFailure(params.symbol, params.side, params.amount, error.message);
      throw this.mapError(error, 'createMarketOrder');
    }
  }

  private mapStatus(ccxtStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'open': 'SUBMITTED',
      'closed': 'FILLED',
      'canceled': 'CANCELLED',
      'rejected': 'REJECTED',
      'expired': 'EXPIRED',
    };
    return statusMap[ccxtStatus] || 'SUBMITTED';
  }

  // Implement other methods...
}
```

### Step 4: Implement IBKR Adapter
```typescript
// src/execution/brokers/ibkr-adapter.ts
import { IBKRClient } from '@api/ibkr'; // IBKR TWS API wrapper

export class IBKRAdapter extends BaseBrokerAdapter {
  private client: IBKRClient;
  private accountId: string;

  async connect(): Promise<void> {
    this.client = new IBKRClient({
      host: this.config.ibkrHost || '127.0.0.1',
      port: this.config.ibkrPort || 7496,
      clientId: this.config.ibkrClientId || 1,
    });
    await this.client.connect();
    this.accountId = await this.client.getAccount();
    this.connected = true;
  }

  async createMarketOrder(params: CreateOrderParams): Promise<IOrder> {
    try {
      const order = {
        action: params.side.toUpperCase(),
        totalQuantity: params.amount,
        orderType: 'MKT',
        clientId: params.clientOrderId || Date.now(),
      };

      const result = await this.client.placeOrder(
        this.accountId,
        params.symbol,
        order
      );

      return {
        id: result.orderId.toString(),
        clientOrderId: params.clientOrderId,
        symbol: params.symbol,
        side: params.side,
        amount: params.amount,
        price: 0, // Market order, price unknown until fill
        status: 'SUBMITTED',
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logOrderFailure(params.symbol, params.side, params.amount, error.message);
      throw this.mapError(error, 'createMarketOrder');
    }
  }

  // IBKR doesn't support webhooks - use polling
  async fetchOrder(orderId: string, symbol: string): Promise<IOrder> {
    const result = await this.client.getOrderStatus(parseInt(orderId));
    return {
      id: result.orderId.toString(),
      symbol,
      side: result.action.toLowerCase() as 'buy' | 'sell',
      amount: result.totalQuantity,
      price: result.avgFillPrice || 0,
      status: this.mapIBKRStatus(result.status),
      timestamp: result.timestamp,
    };
  }

  private mapIBKRStatus(ibkrStatus: string): OrderStatus {
    // Map IBKR-specific statuses to our unified OrderStatus
    if (ibkrStatus.includes('Filled')) return 'FILLED';
    if (ibkrStatus.includes('Cancelled')) return 'CANCELLED';
    if (ibkrStatus.includes('Rejected')) return 'REJECTED';
    if (ibkrStatus.includes('Submitted')) return 'SUBMITTED';
    return 'SUBMITTED';
  }
}
```

### Step 5: Implement Alpaca Adapter
```typescript
// src/execution/brokers/alpaca-adapter.ts
import Alpaca from '@alpacahq/alpaca-trade-api';

export class AlpacaAdapter extends BaseBrokerAdapter {
  private client: Alpaca;

  async connect(): Promise<void> {
    this.client = new Alpaca({
      keyId: this.config.apiKey,
      secretKey: this.config.secret,
      paper: this.config.sandbox || true,
    });
    this.connected = true;
  }

  async createMarketOrder(params: CreateOrderParams): Promise<IOrder> {
    try {
      const order = await this.client.submitOrder({
        symbol: params.symbol,
        qty: params.amount.toString(),
        side: params.side,
        type: 'market',
        time_in_force: 'day',
        client_order_id: params.clientOrderId,
      });

      return {
        id: order.id,
        clientOrderId: order.client_order_id,
        symbol: order.symbol,
        side: params.side,
        amount: parseFloat(order.qty),
        price: parseFloat(order.submitted_at), // Submitted timestamp as placeholder
        status: this.mapAlpacaStatus(order.status),
        timestamp: new Date(order.submitted_at).getTime(),
      };
    } catch (error) {
      this.logOrderFailure(params.symbol, params.side, params.amount, error.message);
      throw this.mapError(error, 'createMarketOrder');
    }
  }

  // Alpaca supports webhooks via Events API
  supportsWebhooks(): boolean {
    return true;
  }

  async registerWebhook(url: string, events: string[]): Promise<void> {
    await this.client.createWebhook({
      url,
      events,
    });
  }

  private mapAlpacaStatus(alpacaStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'new': 'SUBMITTED',
      'partially_filled': 'PARTIALLY_FILLED',
      'filled': 'FILLED',
      'canceled': 'CANCELLED',
      'rejected': 'REJECTED',
    };
    return statusMap[alpacaStatus] || 'SUBMITTED';
  }
}
```

### Step 6: Error Mapper
```typescript
// src/execution/brokers/error-mapper.ts
export function mapBrokerError(
  error: unknown,
  brokerId: string,
  operation: string
): BrokerError {
  if (error instanceof BrokerError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';

  // Map common broker errors
  if (message.includes('Insufficient funds')) {
    return new BrokerError('INSUFFICIENT_FUNDS', message, brokerId, operation);
  }
  if (message.includes('Order not found')) {
    return new BrokerError('ORDER_NOT_FOUND', message, brokerId, operation);
  }
  if (message.includes('Rate limit')) {
    return new BrokerError('RATE_LIMITED', message, brokerId, operation);
  }
  if (message.includes('Invalid symbol')) {
    return new BrokerError('INVALID_SYMBOL', message, brokerId, operation);
  }
  if (message.includes('Market closed')) {
    return new BrokerError('MARKET_CLOSED', message, brokerId, operation);
  }

  return new BrokerError('UNKNOWN', message, brokerId, operation);
}

export class BrokerError extends Error {
  constructor(
    public code: string,
    message: string,
    public brokerId: string,
    public operation: string
  ) {
    super(`[${brokerId}] ${operation}: ${message}`);
  }
}
```

## Todo List
- [ ] Define `BrokerAdapter` interface
- [ ] Create `BaseBrokerAdapter` abstract class
- [ ] Implement `BinanceAdapter` (CCXT)
- [ ] Implement `IBKRAdapter`
- [ ] Implement `AlpacaAdapter`
- [ ] Create `mapBrokerError` utility
- [ ] Update `ExchangeClient` to use adapter pattern
- [ ] Add unit tests for each adapter
- [ ] Add integration tests with broker sandboxes

## Success Criteria
- [ ] All 3 brokers implement `BrokerAdapter` interface
- [ ] Unified order schema across brokers
- [ ] Broker-specific errors mapped to common codes
- [ ] Orders placed successfully on each broker sandbox
- [ ] Order cancellation works on all brokers

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| IBKR TWS API complex | High | Use official IBKR SDK wrapper |
| Broker API changes | Medium | Adapter pattern isolates changes |
| Rate limits differ | Medium | Per-broker rate limiter |
| Sandboxes required | Low | Use paper trading accounts |

## Security Considerations
- Broker API keys encrypted at rest
- Separate key per broker
- API key rotation support
- Audit all broker operations
