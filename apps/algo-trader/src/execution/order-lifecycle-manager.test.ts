/**
 * Order Lifecycle Manager Tests
 *
 * Tests for order lifecycle management including submit, cancel, status, and webhook handling.
 */

import { OrderLifecycleManager, getOrderLifecycleManager } from './order-lifecycle-manager';
import { OrderState } from './order-state-machine';

describe('Order Lifecycle Manager', () => {
  let lifecycleManager: OrderLifecycleManager;

  beforeEach(() => {
    // Create fresh instance for each test
    lifecycleManager = new OrderLifecycleManager({
      pollingIntervalMs: 100,
      maxPollAttempts: 10,
      enablePolling: false, // Disable polling for unit tests
    });
  });

  describe('submitOrder', () => {
    it('should create order with PENDING state then transition to SUBMITTED', async () => {
      const order = await lifecycleManager.submitOrder({
        id: 'order_001',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      expect(order.id).toBe('order_001');
      expect(order.status).toBe(OrderState.SUBMITTED);
      expect(order.submittedAt).toBeDefined();
    });

    it('should set initial order properties', async () => {
      const now = Date.now();
      const order = await lifecycleManager.submitOrder({
        id: 'order_002',
        clientOrderId: 'client_ref_123',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'ETH/USDT',
        side: 'sell',
        type: 'limit',
        amount: 1.0,
        price: 3000,
        status: OrderState.PENDING,
        createdAt: now,
        strategyId: 'strategy_xyz',
      });

      expect(order.clientOrderId).toBe('client_ref_123');
      expect(order.symbol).toBe('ETH/USDT');
      expect(order.side).toBe('sell');
      expect(order.type).toBe('limit');
      expect(order.amount).toBe(1.0);
      expect(order.price).toBe(3000);
      expect(order.remainingAmount).toBe(1.0);
      expect(order.totalFilled).toBe(0);
    });
  });

  describe('getOrderStatus', () => {
    it('should return order status', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_003',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      const status = await lifecycleManager.getOrderStatus('order_003');

      expect(status.orderId).toBe('order_003');
      expect(status.status).toBe(OrderState.SUBMITTED);
      expect(status.symbol).toBe('BTC/USDT');
    });

    it('should throw error for non-existent order', async () => {
      await expect(lifecycleManager.getOrderStatus('nonexistent'))
        .rejects.toThrow('Order nonexistent not found');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a SUBMITTED order', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_004',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      const cancelledOrder = await lifecycleManager.cancelOrder('order_004', 'User requested');

      expect(cancelledOrder.status).toBe(OrderState.CANCELLED);
      expect(cancelledOrder.cancelledAt).toBeDefined();
    });

    it('should throw error when cancelling FILLED order', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_005',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      // Simulate fill
      await lifecycleManager.handleFillWebhook('order_005', 50000, 0.1);

      // Try to cancel
      await expect(lifecycleManager.cancelOrder('order_005'))
        .rejects.toThrow('Cannot cancel order in state filled');
    });

    it('should throw error for non-existent order', async () => {
      await expect(lifecycleManager.cancelOrder('nonexistent'))
        .rejects.toThrow('Order nonexistent not found');
    });
  });

  describe('handleFillWebhook', () => {
    it('should handle full fill', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_006',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.5,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      await lifecycleManager.handleFillWebhook('order_006', 50000, 0.5);

      const status = await lifecycleManager.getOrderStatus('order_006');
      expect(status.status).toBe(OrderState.FILLED);
      expect(status.totalFilled).toBe(0.5);
      expect(status.remainingAmount).toBe(0);
      expect(status.avgFillPrice).toBe(50000);
    });

    it('should handle partial fills', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_007',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 1.0,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      // First partial fill
      await lifecycleManager.handleFillWebhook('order_007', 49000, 0.4);
      let status = await lifecycleManager.getOrderStatus('order_007');
      expect(status.status).toBe(OrderState.PARTIALLY_FILLED);
      expect(status.totalFilled).toBe(0.4);
      expect(status.remainingAmount).toBe(0.6);

      // Second partial fill
      await lifecycleManager.handleFillWebhook('order_007', 51000, 0.3);
      status = await lifecycleManager.getOrderStatus('order_007');
      expect(status.status).toBe(OrderState.PARTIALLY_FILLED);
      expect(status.totalFilled).toBe(0.7);
      expect(status.remainingAmount).toBeCloseTo(0.3, 5);

      // Average fill price should be weighted average
      // (49000 * 0.4 + 51000 * 0.3) / 0.7 = 49857.14
      expect(status.avgFillPrice).toBeCloseTo(49857.14, 0);
    });

    it('should handle multiple fills until fully filled', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_008',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 1.0,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      await lifecycleManager.handleFillWebhook('order_008', 50000, 0.3);
      await lifecycleManager.handleFillWebhook('order_008', 50500, 0.5);
      await lifecycleManager.handleFillWebhook('order_008', 51000, 0.2);

      const status = await lifecycleManager.getOrderStatus('order_008');
      expect(status.status).toBe(OrderState.FILLED);
      expect(status.totalFilled).toBe(1.0);
      expect(status.remainingAmount).toBe(0);
    });

    it('should be idempotent with webhook_id', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_009',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.5,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      // First webhook
      await lifecycleManager.handleFillWebhook('order_009', 50000, 0.25, 'webhook_001');
      let status = await lifecycleManager.getOrderStatus('order_009');
      expect(status.totalFilled).toBe(0.25);

      // Duplicate webhook with same ID should be ignored
      await lifecycleManager.handleFillWebhook('order_009', 50000, 0.25, 'webhook_001');
      status = await lifecycleManager.getOrderStatus('order_009');
      expect(status.totalFilled).toBe(0.25); // Should not double-count
    });

    it('should throw error for non-existent order', async () => {
      await expect(lifecycleManager.handleFillWebhook('nonexistent', 50000, 0.1))
        .rejects.toThrow('Order nonexistent not found');
    });
  });

  describe('getOrdersByTenant', () => {
    it('should return orders filtered by tenant', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_010',
        tenantId: 'tenant_A',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      await lifecycleManager.submitOrder({
        id: 'order_011',
        tenantId: 'tenant_B',
        exchangeId: 'binance',
        symbol: 'ETH/USDT',
        side: 'sell',
        type: 'market',
        amount: 1.0,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      const tenantAOrders = lifecycleManager.getOrdersByTenant('tenant_A');
      expect(tenantAOrders.length).toBe(1);
      expect(tenantAOrders[0].id).toBe('order_010');

      const tenantBOrders = lifecycleManager.getOrdersByTenant('tenant_B');
      expect(tenantBOrders.length).toBe(1);
      expect(tenantBOrders[0].id).toBe('order_011');
    });
  });

  describe('getOrdersBySymbol', () => {
    it('should return orders filtered by symbol', async () => {
      await lifecycleManager.submitOrder({
        id: 'order_012',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        amount: 0.1,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      await lifecycleManager.submitOrder({
        id: 'order_013',
        tenantId: 'tenant_abc',
        exchangeId: 'binance',
        symbol: 'ETH/USDT',
        side: 'buy',
        type: 'market',
        amount: 1.0,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      });

      const btcOrders = lifecycleManager.getOrdersBySymbol('BTC/USDT');
      expect(btcOrders.length).toBe(1);
      expect(btcOrders[0].symbol).toBe('BTC/USDT');

      const ethOrders = lifecycleManager.getOrdersBySymbol('ETH/USDT');
      expect(ethOrders.length).toBe(1);
      expect(ethOrders[0].symbol).toBe('ETH/USDT');
    });
  });

  describe('getOrderLifecycleManager singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getOrderLifecycleManager();
      const instance2 = getOrderLifecycleManager();
      expect(instance1).toBe(instance2);
    });
  });
});
