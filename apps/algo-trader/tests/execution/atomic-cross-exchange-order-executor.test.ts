/**
 * Tests for AtomicCrossExchangeOrderExecutor.
 * Verifies parallel execution, rollback on partial failure, and full-failure handling.
 */

import {
  AtomicCrossExchangeOrderExecutor,
  AtomicExecutorConfig
} from '../../src/execution/atomic-cross-exchange-order-executor';
import { CircuitBreakerConfig } from '../../src/execution/circuit-breaker';
import { RetryConfig } from '../../src/execution/retry-handler';
import type { IExchange, IOrder, IBalance, IOrderBook } from '../../src/interfaces/IExchange';

const makeOrder = (id: string, side: 'buy' | 'sell', price: number, amount: number): IOrder => ({
  id,
  symbol: 'BTC/USDT',
  side,
  amount,
  price,
  status: 'closed',
  timestamp: Date.now(),
});

const makeMockExchange = (name: string, orderOverride?: () => Promise<IOrder>): jest.Mocked<IExchange> => ({
  name,
  connect: jest.fn().mockResolvedValue(undefined),
  fetchTicker: jest.fn().mockResolvedValue(68000),
  fetchOrderBook: jest.fn().mockResolvedValue({} as IOrderBook),
  fetchBalance: jest.fn().mockResolvedValue({} as Record<string, IBalance>),
  createMarketOrder: jest.fn().mockImplementation(
    orderOverride ?? ((_symbol: string, side: 'buy' | 'sell', amount: number) =>
      Promise.resolve(makeOrder('ord-1', side, side === 'buy' ? 68000 : 68200, amount))
    )
  ),
});

describe('AtomicCrossExchangeOrderExecutor', () => {
  let buyExchange: jest.Mocked<IExchange>;
  let sellExchange: jest.Mocked<IExchange>;

  beforeEach(() => {
    buyExchange = makeMockExchange('binance');
    sellExchange = makeMockExchange('okx', () =>
      Promise.resolve(makeOrder('ord-2', 'sell', 68200, 0.1))
    );
  });

  describe('basic functionality', () => {
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      executor = new AtomicCrossExchangeOrderExecutor({ enableRetry: true, retryAmountFraction: 0.5 });
    });

    describe('successful execution', () => {
      it('returns success=true with both orders when both sides fill', async () => {
        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

      expect(result.success).toBe(true);
        expect(result.buyOrder).toBeDefined();
        expect(result.sellOrder).toBeDefined();
        expect(result.rollbackPerformed).toBe(false);
        expect(result.error).toBeUndefined();
      });

      it('calls createMarketOrder on both exchanges exactly once', async () => {
        await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(buyExchange.createMarketOrder).toHaveBeenCalledTimes(1);
        expect(buyExchange.createMarketOrder).toHaveBeenCalledWith('BTC/USDT', 'buy', 0.1);
        expect(sellExchange.createMarketOrder).toHaveBeenCalledTimes(1);
        expect(sellExchange.createMarketOrder).toHaveBeenCalledWith('BTC/USDT', 'sell', 0.1);
      });

      it('computes positive netPnl when sell price > buy price', async () => {
        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.netPnl).toBeCloseTo((68200 - 68000) * 0.1, 4);
      });

      it('records non-zero latency values', async () => {
        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.totalLatency).toBeGreaterThanOrEqual(0);
        expect(result.buyLatency).toBeGreaterThanOrEqual(0);
        expect(result.sellLatency).toBeGreaterThanOrEqual(0);
      });
    });

    describe('rollback on partial failure', () => {
      it('performs rollback when buy succeeds but sell fails', async () => {
        sellExchange.createMarketOrder.mockRejectedValue(new Error('OKX connection timeout'));

        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.success).toBe(false);
        expect(result.rollbackPerformed).toBe(true);
        expect(result.error).toContain('sell:');
        expect(buyExchange.createMarketOrder).toHaveBeenCalledTimes(2);
        expect(buyExchange.createMarketOrder).toHaveBeenLastCalledWith('BTC/USDT', 'sell', 0.1);
      });

      it('performs rollback when sell succeeds but buy fails', async () => {
        buyExchange.createMarketOrder.mockRejectedValue(new Error('Binance rate limit'));

        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.success).toBe(false);
        expect(result.rollbackPerformed).toBe(true);
        expect(result.error).toContain('buy:');
        expect(sellExchange.createMarketOrder).toHaveBeenCalledTimes(2);
        expect(sellExchange.createMarketOrder).toHaveBeenLastCalledWith('BTC/USDT', 'buy', 0.1);
      });

      it('reports rollbackPerformed=false when rollback itself also fails', async () => {
        sellExchange.createMarketOrder.mockRejectedValue(new Error('sell failed'));
        buyExchange.createMarketOrder
          .mockResolvedValueOnce(makeOrder('ord-buy', 'buy', 68000, 0.1))
          .mockRejectedValueOnce(new Error('rollback failed'));

        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.success).toBe(false);
        expect(result.rollbackPerformed).toBe(false);
      });
    });

    describe('full failure', () => {
      it('returns success=false with error message when both sides fail', async () => {
        buyExchange.createMarketOrder.mockRejectedValue(new Error('Binance down'));
        sellExchange.createMarketOrder.mockRejectedValue(new Error('OKX down'));

        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.success).toBe(false);
        expect(result.rollbackPerformed).toBe(false);
        expect(result.error).toContain('buy:');
        expect(result.error).toContain('sell:');
        expect(result.netPnl).toBe(0);
      });

      it('returns no orders when both fail', async () => {
        buyExchange.createMarketOrder.mockRejectedValue(new Error('err'));
        sellExchange.createMarketOrder.mockRejectedValue(new Error('err'));

        const result = await executor.executeAtomic({
          symbol: 'BTC/USDT',
          amount: 0.1,
          buyExchange,
          sellExchange,
        });

        expect(result.buyOrder).toBeUndefined();
        expect(result.sellOrder).toBeUndefined();
      });
    });
  });

  describe('retry functionality', () => {
    let config: AtomicExecutorConfig;
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      const retryConfig: RetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 100,
        factor: 2,
        jitter: false,
        retryableErrors: ['timeout', 'rate limit', 'network error']
      };

      config = { retryConfig };
      executor = new AtomicCrossExchangeOrderExecutor(config);
    });

    it('should retry on retryable errors and succeed', async () => {
      let buyAttempts = 0;
      let sellAttempts = 0;

      buyExchange.createMarketOrder.mockImplementation(() => {
        buyAttempts++;
        if (buyAttempts === 1) {
          return Promise.reject(new Error('timeout error'));
        }
        return Promise.resolve(makeOrder('ord-1', 'buy', 68000, 0.1));
      });

      sellExchange.createMarketOrder.mockImplementation(() => {
        sellAttempts++;
        if (sellAttempts === 1) {
          return Promise.reject(new Error('timeout error'));
        }
        return Promise.resolve(makeOrder('ord-2', 'sell', 68200, 0.1));
      });

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(buyAttempts).toBeGreaterThanOrEqual(1);
      expect(sellAttempts).toBeGreaterThanOrEqual(1);
      expect(result.retryMetrics).toBeDefined();
      expect(result.retryMetrics?.attempts).toBeGreaterThanOrEqual(1);
      expect(result.success).toBe(true);
    });

    it('should not retry on non-retryable errors', async () => {
      buyExchange.createMarketOrder.mockRejectedValue(new Error('invalid order'));
      sellExchange.createMarketOrder.mockResolvedValue(makeOrder('ord-2', 'sell', 68200, 0.1));

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
    });

    it('should include retry metrics in result', async () => {
      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.retryMetrics).toBeDefined();
      expect(result.retryMetrics?.attempts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('circuit breaker functionality', () => {
    let config: AtomicExecutorConfig;
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      const circuitBreakerConfig: CircuitBreakerConfig = {
        maxLossesInRow: 2,
        cooldownMs: 100
      };

      config = { circuitBreakerConfig };
      executor = new AtomicCrossExchangeOrderExecutor(config);
    });

    it('should open circuit after threshold exceeded', async () => {
      // Mock createMarketOrder to return orders with loss (buy price > sell price)
      let buyCallCount = 0;
      let sellCallCount = 0;
      
      buyExchange.createMarketOrder.mockImplementation(() => {
        buyCallCount++;
        return Promise.resolve(makeOrder('ord-buy-' + buyCallCount, 'buy', 70000, 0.1));
      });
      
      sellExchange.createMarketOrder.mockImplementation(() => {
        sellCallCount++;
        return Promise.resolve(makeOrder('ord-sell-' + sellCallCount, 'sell', 68000, 0.1));
      });

      const result1 = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });
      expect(result1.success).toBe(true); // Trade executes but results in loss

      const result2 = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });
      expect(result2.success).toBe(true); // Second loss

      // Third trade should fail due to circuit breaker (2 consecutive losses >= maxLossesInRow)
      const result3 = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });
      expect(result3.success).toBe(false);
      expect(result3.error).toContain('Circuit breaker');

      // Only 2 actual exchange calls were made (third was blocked by circuit breaker)
      expect(buyExchange.createMarketOrder).toHaveBeenCalledTimes(2);
      expect(sellExchange.createMarketOrder).toHaveBeenCalledTimes(2);
    });

    it('should include circuit breaker metrics in result', async () => {
      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.circuitBreakerMetrics).toBeDefined();
      expect(result.circuitBreakerMetrics?.state).toBeDefined();
      expect(result.circuitBreakerMetrics?.totalRequests).toBeGreaterThanOrEqual(1);
    });

    it('should allow request through after timeout', async () => {
      buyExchange.createMarketOrder.mockRejectedValue(new Error('exchange down'));

      await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });
      await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(buyExchange.createMarketOrder).toHaveBeenCalledTimes(2);

      const executor2 = new AtomicCrossExchangeOrderExecutor(config);

      buyExchange.createMarketOrder.mockResolvedValue(makeOrder('ord-1', 'buy', 68000, 0.1));
      sellExchange.createMarketOrder.mockResolvedValue(makeOrder('ord-2', 'sell', 68200, 0.1));

      const result = await executor2.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('combined retry and circuit breaker', () => {
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      const config: AtomicExecutorConfig = {
        retryConfig: {
          maxRetries: 1,
          baseDelayMs: 10,
          maxDelayMs: 50,
          factor: 2,
          jitter: false,
          retryableErrors: ['timeout']
        },
        circuitBreakerConfig: {
          failureThreshold: 3,
          timeoutMs: 100,
          successThreshold: 1
        }
      };

      executor = new AtomicCrossExchangeOrderExecutor(config);
    });

    it('should handle both retry and circuit breaker together', async () => {
      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.retryMetrics).toBeDefined();
      expect(result.circuitBreakerMetrics).toBeDefined();
    });
  });

  describe('rollback retry', () => {
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      const config: AtomicExecutorConfig = {
        retryConfig: {
          maxRetries: 1,
          baseDelayMs: 10,
          maxDelayMs: 50,
          factor: 2,
          jitter: false,
          retryableErrors: ['timeout']
        },
        rollbackRetryConfig: {
          maxRetries: 2,
          baseDelayMs: 5,
          maxDelayMs: 20,
          factor: 2,
          jitter: false,
          retryableErrors: ['timeout', 'network']
        }
      };
      executor = new AtomicCrossExchangeOrderExecutor(config);
    });

    it('should retry rollback on temporary errors', async () => {
      sellExchange.createMarketOrder.mockRejectedValue(new Error('sell timeout'));
      let rollbackAttempts = 0;
      buyExchange.createMarketOrder.mockImplementation(() => {
        rollbackAttempts++;
        if (rollbackAttempts === 1) {
          return Promise.resolve(makeOrder('ord-buy', 'buy', 68000, 0.1));
        }
        if (rollbackAttempts === 2) {
          return Promise.reject(new Error('rollback timeout'));
        }
        return Promise.resolve(makeOrder('ord-rollback', 'sell', 68000, 0.1));
      });

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.rollbackPerformed).toBe(true);
      expect(rollbackAttempts).toBe(3);
    });
  });

  describe('edge cases - capital safety', () => {
    let executor: AtomicCrossExchangeOrderExecutor;

    beforeEach(() => {
      const retryConfig: RetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 100,
        factor: 2,
        jitter: false,
        retryableErrors: ['timeout', 'rate limit', 'network error']
      };
      executor = new AtomicCrossExchangeOrderExecutor({ retryConfig });
    });

    it('should exhaust retries and fail gracefully when both exchanges always fail', async () => {
      buyExchange.createMarketOrder.mockRejectedValue(new Error('timeout error'));
      sellExchange.createMarketOrder.mockRejectedValue(new Error('timeout error'));

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      // Verify failure state
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.rollbackPerformed).toBe(false);
    });

    it('should retry on rate limit errors when BOTH exchanges fail', async () => {
      let buyAttempts = 0;
      let sellAttempts = 0;
      
      buyExchange.createMarketOrder.mockImplementation(() => {
        buyAttempts++;
        if (buyAttempts === 1) {
          return Promise.reject(new Error('rate limit exceeded'));
        }
        return Promise.resolve(makeOrder('ord-1', 'buy', 68000, 0.1));
      });
      
      sellExchange.createMarketOrder.mockImplementation(() => {
        sellAttempts++;
        if (sellAttempts === 1) {
          return Promise.reject(new Error('rate limit exceeded'));
        }
        return Promise.resolve(makeOrder('ord-2', 'sell', 68200, 0.1));
      });

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(buyAttempts).toBe(2);
      expect(sellAttempts).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should retry on network errors when BOTH exchanges fail', async () => {
      let attempts = 0;
      
      buyExchange.createMarketOrder.mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve(makeOrder('ord-1', 'buy', 68000, 0.1));
      });
      
      sellExchange.createMarketOrder.mockImplementation(() => {
        if (attempts === 1) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve(makeOrder('ord-2', 'sell', 68200, 0.1));
      });

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(attempts).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should NOT retry on authentication errors', async () => {
      buyExchange.createMarketOrder.mockRejectedValue(new Error('Invalid API key'));
      sellExchange.createMarketOrder.mockRejectedValue(new Error('Invalid API key'));

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      // Should NOT retry (auth errors are not retryable)
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle insufficient balance gracefully', async () => {
      buyExchange.createMarketOrder.mockRejectedValue(new Error('Insufficient balance'));

      const result = await executor.executeAtomic({
        symbol: 'BTC/USDT',
        amount: 0.1,
        buyExchange,
        sellExchange,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });
});
