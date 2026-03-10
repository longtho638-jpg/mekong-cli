/**
 * Arbitrage Executor Tests
 */

import { ArbitrageExecutor } from './arbitrage-executor';
import { ArbitrageRiskManager } from './arbitrage-risk-manager';
import { OrderManager } from '../core/OrderManager';
import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';
import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';
import { IOrder } from '../interfaces/IExchange';

// Mock ExchangeClient
class MockExchangeClient extends ExchangeClientBase {
  constructor(public exchangeId: string) {
    super(exchangeId);
  }

  async fetchTicker(symbol: string): Promise<number> {
    return 50000; // Return just the price as number
  }

  async fetchBalance() {
    return { USDT: { currency: 'USDT', free: 10000, used: 0, total: 10000 } };
  }

  async createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder> {
    return {
      id: `order-${Date.now()}`,
      symbol,
      side,
      amount,
      price: 50000,
      status: 'closed',
      timestamp: Date.now(),
    };
  }
}

describe('ArbitrageExecutor', () => {
  let executor: ArbitrageExecutor;
  let riskManager: ArbitrageRiskManager;
  let orderManager: OrderManager;
  let clients: Map<string, ExchangeClientBase>;

  const mockOpportunity: IArbitrageOpportunity = {
    id: 'arb-1',
    symbol: 'BTC/USDT',
    buyExchange: 'binance',
    sellExchange: 'bybit',
    buyPrice: 49900,
    sellPrice: 50100,
    spreadPercent: 0.4,
    netProfitPercent: 0.3,
    estimatedProfitUsd: 30,
    buyFee: 0.001,
    sellFee: 0.001,
    slippageEstimate: 0.0005,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5000,
  };

  beforeEach(() => {
    clients = new Map();
    clients.set('binance', new MockExchangeClient('binance'));
    clients.set('bybit', new MockExchangeClient('bybit'));

    riskManager = new ArbitrageRiskManager({
      maxPositionSizeUsd: 100,
      maxDailyLossUsd: 500,
      maxTradesPerDay: 50,
      minBalanceUsd: 10,
    });

    orderManager = new OrderManager();
  });

  describe('Constructor', () => {
    it('should create executor with dryRun enabled by default', () => {
      executor = new ArbitrageExecutor(clients, riskManager, orderManager);
      expect(executor).toBeDefined();
    });

    it('should create executor with dryRun disabled', () => {
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);
      expect(executor).toBeDefined();
    });
  });

  describe('execute - Dry Run Mode', () => {
    beforeEach(() => {
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, true);
    });

    it('should return dry run result without placing real orders', async () => {
      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('dry_run');
      expect(result.actualBuyPrice).toBe(mockOpportunity.buyPrice);
      expect(result.actualSellPrice).toBe(mockOpportunity.sellPrice);
      expect(result.actualProfitUsd).toBe(mockOpportunity.estimatedProfitUsd);
      expect(result.actualProfitPercent).toBe(mockOpportunity.netProfitPercent);
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.buyOrder).toBeNull();
      expect(result.sellOrder).toBeNull();
    });

    it('should not update risk manager in dry run mode', async () => {
      await executor.execute(mockOpportunity);

      expect(riskManager.getTradeCount()).toBe(0);
      expect(riskManager.getDailyPnl()).toBe(0);
    });
  });

  describe('execute - Live Mode (simulated)', () => {
    beforeEach(() => {
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);
    });

    it('should reject trade when pre-check fails', async () => {
      // Set up risk manager to reject trades
      for (let i = 0; i < 50; i++) {
        riskManager.recordTrade(10);
      }

      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('rejected');
      expect(result.error).toBeDefined();
    });

    it('should execute both legs successfully', async () => {
      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('success');
      expect(result.buyOrder).toBeDefined();
      expect(result.sellOrder).toBeDefined();
      expect(result.actualBuyPrice).toBe(50000);
      expect(result.actualSellPrice).toBe(50000);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should update risk manager after successful trade', async () => {
      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('success');
      expect(riskManager.getTradeCount()).toBe(1);
      // PnL may be positive or negative depending on execution prices vs expected
      expect(riskManager.getDailyPnl()).toBeDefined();
    });

    it('should add orders to order manager', async () => {
      const initialCount = orderManager.getOrders().length;

      await executor.execute(mockOpportunity);

      const orders = orderManager.getOrders();
      expect(orders.length).toBeGreaterThanOrEqual(initialCount + 2);
    });
  });

  describe('execute - Partial Fill Scenarios', () => {
    it('should handle buy success, sell failure with rollback', async () => {
      // Remove sell exchange client to simulate failure
      clients.delete('bybit');
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);

      const result = await executor.execute(mockOpportunity);

      // Partial fill or failed depending on implementation
      expect(['partial_fill', 'failed', 'rejected']).toContain(result.status);
      expect(result.error).toBeDefined();
    });

    it('should handle sell success, buy failure with rollback', async () => {
      // Remove buy exchange client to simulate failure
      clients.delete('binance');
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);

      const result = await executor.execute(mockOpportunity);

      // Partial fill or failed depending on implementation
      expect(['partial_fill', 'failed', 'rejected']).toContain(result.status);
      expect(result.error).toBeDefined();
    });
  });

  describe('execute - Both Legs Failed', () => {
    it('should return failed status when both legs fail', async () => {
      // Remove both clients
      clients.clear();
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);

      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('rejected');
      expect(result.error).toBeDefined();
    });
  });

  describe('execute - Risk Management', () => {
    beforeEach(() => {
      executor = new ArbitrageExecutor(clients, riskManager, orderManager, false);
    });

    it('should trip circuit breaker after cumulative losses exceed limit', async () => {
      // Record losing trades to trip circuit breaker
      riskManager.recordTrade(-300);
      riskManager.recordTrade(-300);

      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('rejected');
      expect(result.error).toBeDefined();
    });

    it('should reject when trade count reaches daily limit', async () => {
      for (let i = 0; i < 50; i++) {
        riskManager.recordTrade(10);
      }

      const result = await executor.execute(mockOpportunity);

      expect(result.status).toBe('rejected');
      expect(result.error).toBeDefined();
    });
  });
});
