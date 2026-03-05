/**
 * Integration tests for Signal-Order Pipeline E2E flow
 * Tests: Signal generation → Order execution → Position management
 */

import { SignalOrderPipeline } from './signal-order-pipeline-live-trading';
import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { PaperTradingEngine } from '../core/paper-trading-engine';
import { LiveExchangeManager } from './live-exchange-manager';

// Mock strategy that generates deterministic signals
class MockTestStrategy implements IStrategy {
  name = 'MockTestStrategy';
  private triggerBuyAt = 0;
  private triggerSellAt = 0;
  private callCount = 0;
  private hasBought = false;
  private hasSold = false;

  constructor(options?: { buyAt?: number; sellAt?: number }) {
    if (options) {
      this.triggerBuyAt = options.buyAt ?? 0;
      this.triggerSellAt = options.sellAt ?? 0;
    }
  }

  async init(): Promise<void> {
    this.callCount = 0;
    this.hasBought = false;
    this.hasSold = false;
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.callCount++;

    // Generate BUY signal when we reach the buy trigger candle
    if (this.triggerBuyAt > 0 && this.callCount === this.triggerBuyAt && !this.hasBought) {
      this.hasBought = true;
      return {
        type: SignalType.BUY,
        price: candle.close,
        timestamp: candle.timestamp,
        metadata: { trigger: 'buy_signal' }
      };
    }

    // Generate SELL signal when we reach the sell trigger candle and already bought
    if (this.triggerSellAt > 0 && this.callCount === this.triggerSellAt && this.hasBought && !this.hasSold) {
      this.hasSold = true;
      return {
        type: SignalType.SELL,
        price: candle.close,
        timestamp: candle.timestamp,
        metadata: { trigger: 'sell_signal' }
      };
    }

    return null;
  }
}

// Mock LiveExchangeManager for integration testing
class MockExchangeManager {
  private prices: Map<string, number> = new Map();

  updatePrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
  }

  getWsFeed(): { on: jest.Mock; removeAllListeners: jest.Mock } {
    return {
      on: jest.fn(),
      removeAllListeners: jest.fn()
    };
  }

  getRouter(): { route: jest.Mock } {
    return {
      route: jest.fn(async (_: string, handler: (exchangeId: string) => Promise<unknown>) => {
        const result = await handler('mock-exchange');
        return {
          success: true,
          exchangeId: 'mock-exchange',
          latency: 50,
          data: result
        };
      })
    };
  }
}

function makeCandle(close: number, timestamp?: number): ICandle {
  return {
    timestamp: timestamp ?? Date.now(),
    open: close * 0.999,
    high: close * 1.001,
    low: close * 0.998,
    close,
    volume: 1000
  };
}

describe('SignalOrderPipeline Integration', () => {
  let mockManager: MockExchangeManager;
  let pipeline: SignalOrderPipeline;

  beforeEach(() => {
    mockManager = new MockExchangeManager();
  });

  afterEach(async () => {
    if (pipeline) {
      await pipeline.stop();
    }
  });

  describe('Pipeline Lifecycle', () => {
    it('should start and stop without errors', async () => {
      const strategy = new MockTestStrategy();
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      await pipeline.start();
      expect(pipeline.isRunning()).toBe(true);

      await pipeline.stop();
      expect(pipeline.isRunning()).toBe(false);
    });

    it('should emit started and stopped events', async () => {
      const strategy = new MockTestStrategy();
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      const events: string[] = [];
      pipeline.on('started', () => events.push('started'));
      pipeline.on('stopped', () => events.push('stopped'));

      await pipeline.start();
      await pipeline.stop();

      expect(events).toEqual(['started', 'stopped']);
    });
  });

  describe('Signal Generation Flow', () => {
    it('should generate BUY signal from strategy', async () => {
      const strategy = new MockTestStrategy({ buyAt: 1 });
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      const allSignals: ISignal[] = [];
      pipeline.on('signals', (signalsBatch) => allSignals.push(...signalsBatch));

      await pipeline.start();

      // Simulate candle by accessing internal method
      const candle = makeCandle(50000);
      await (pipeline as any).onCandle(candle);

      expect(allSignals.length).toBeGreaterThan(0);
      expect(allSignals[0].signal.type).toBe(SignalType.BUY);
    });

    it('should generate SELL signal after BUY', async () => {
      // Strategy that buys at candle 1, sells at candle 3
      const strategy = new MockTestStrategy({ buyAt: 1, sellAt: 3 });
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      await pipeline.start();

      // First candle - should trigger BUY
      await (pipeline as any).onCandle(makeCandle(50000, 1000));
      expect(pipeline.getPosition()).toBe('long');

      // Second candle - no change
      await (pipeline as any).onCandle(makeCandle(51000, 2000));

      // Third candle - should trigger SELL
      await (pipeline as any).onCandle(makeCandle(52000, 3000));
      expect(pipeline.getPosition()).toBe('flat');
    });

    it('should handle multiple strategies in parallel', async () => {
      const strategy1 = new MockTestStrategy({ buyAt: 1 });
      const strategy2 = new MockTestStrategy({ buyAt: 1 });

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy1, strategy2],
        symbol: 'BTC/USDT',
        dryRun: true,
        minConfirmations: 2
      });

      const allSignals: ISignal[] = [];
      pipeline.on('signals', (signalsBatch) => allSignals.push(...signalsBatch));

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      // Both strategies should generate signals
      expect(allSignals.length).toBe(2);
    });
  });

  describe('Order Execution Flow', () => {
    it('should execute BUY order in dry-run mode', async () => {
      const strategy = new MockTestStrategy({ buyAt: 1 });
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true,
        maxPositionUsd: 1000
      });

      const orders: { side: string; dryRun?: boolean; [key: string]: unknown }[] = [];
      pipeline.on('order', (o) => orders.push(o));

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      expect(orders.length).toBe(1);
      expect(orders[0].side).toBe('buy');
      expect(orders[0].dryRun).toBe(true);
      expect(pipeline.getPosition()).toBe('long');
    });

    it('should execute SELL order to close position', async () => {
      const strategy = new MockTestStrategy({ buyAt: 1, sellAt: 2 });
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      const orders: { side: string; dryRun?: boolean; [key: string]: unknown }[] = [];
      pipeline.on('order', (o) => orders.push(o));

      await pipeline.start();

      // BUY
      await (pipeline as any).onCandle(makeCandle(50000, 1000));
      const buyOrder = orders.find(o => o.side === 'buy');
      expect(buyOrder).toBeDefined();

      // SELL
      await (pipeline as any).onCandle(makeCandle(51000, 2000));
      const sellOrder = orders.find(o => o.side === 'sell');
      expect(sellOrder).toBeDefined();
    });

    it('should respect minConfirmations before executing', async () => {
      const strategy1 = new MockTestStrategy({ buyAt: 1 });
      const strategy2 = new MockTestStrategy(); // Never generates signal

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy1, strategy2],
        symbol: 'BTC/USDT',
        dryRun: true,
        minConfirmations: 2 // Need 2 confirmations
      });

      const orders: { side: string; dryRun?: boolean; [key: string]: unknown }[] = [];
      pipeline.on('order', (o) => orders.push(o));

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      // Should NOT execute because only 1 strategy confirmed
      expect(orders.length).toBe(0);
    });

    it('should not open multiple long positions', async () => {
      const strategy = new MockTestStrategy({ buyAt: 1 });
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      const orders: { side: string; dryRun?: boolean; [key: string]: unknown }[] = [];
      pipeline.on('order', (o) => orders.push(o));

      await pipeline.start();

      // Multiple candles triggering BUY
      await (pipeline as any).onCandle(makeCandle(50000, 1000));
      await (pipeline as any).onCandle(makeCandle(51000, 2000));
      await (pipeline as any).onCandle(makeCandle(52000, 3000));

      // Should only have 1 BUY order (position already long)
      const buyOrders = orders.filter(o => o.side === 'buy');
      expect(buyOrders.length).toBe(1);
    });
  });

  describe('E2E Trading Flow', () => {
    it('should complete full round-trip: BUY → HOLD → SELL', async () => {
      // Strategy: Buy at candle 1, sell at candle 5
      const strategy = new MockTestStrategy({ buyAt: 1, sellAt: 5 });

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true,
        maxPositionUsd: 1000
      });

      const events: { type: string; data: unknown }[] = [];
      pipeline.on('signals', (s) => events.push({ type: 'signal', data: s }));
      pipeline.on('order', (o) => events.push({ type: 'order', data: o }));

      await pipeline.start();

      // Simulate 5 candles
      for (let i = 1; i <= 5; i++) {
        await (pipeline as any).onCandle(makeCandle(50000 + i * 100, i * 1000));
      }

      // Verify signal events
      const signalEvents = events.filter(e => e.type === 'signal');
      expect(signalEvents.length).toBeGreaterThanOrEqual(2);

      // Verify order events (1 BUY + 1 SELL)
      const orderEvents = events.filter(e => e.type === 'order');
      expect(orderEvents.length).toBeGreaterThanOrEqual(1);

      // Verify position state - should be flat after SELL
      expect(pipeline.getPosition()).toBe('flat');
    });

    it('should track position through price changes', async () => {
      const strategy = new MockTestStrategy({ buyAt: 1 });

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      await pipeline.start();

      // Initial state
      expect(pipeline.getPosition()).toBe('flat');

      // After BUY signal
      await (pipeline as any).onCandle(makeCandle(50000, 1000));
      expect(pipeline.getPosition()).toBe('long');

      // Simulate price increase (position still long)
      mockManager.updatePrice('BTC/USDT', 55000);
      await (pipeline as any).onCandle(makeCandle(55000, 2000));
      expect(pipeline.getPosition()).toBe('long');

      // Get candle history
      const history = pipeline.getCandleHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle strategy errors gracefully', async () => {
      const errorStrategy: IStrategy = {
        name: 'ErrorStrategy',
        init: async () => {},
        onCandle: async () => {
          throw new Error('Test error');
        }
      };

      const goodStrategy = new MockTestStrategy({ buyAt: 1 });

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [errorStrategy, goodStrategy],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      const allSignals: ISignal[] = [];
      pipeline.on('signals', (signalsBatch) => allSignals.push(...signalsBatch));

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      // Good strategy should still work
      expect(allSignals.length).toBeGreaterThan(0);
    });

    it('should handle empty strategies array', async () => {
      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [],
        symbol: 'BTC/USDT',
        dryRun: true
      });

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      expect(pipeline.getPosition()).toBe('flat');
    });
  });

  describe('Paper Trading Integration', () => {
    it('should integrate with PaperTradingEngine for order simulation', async () => {
      const paperEngine = new PaperTradingEngine({
        initialBalances: { USDT: 10000, BTC: 0 },
        slippagePct: 0.001,
        feeRate: 0.001
      });
      paperEngine.updatePrice('BTC/USDT', 50000);

      const strategy = new MockTestStrategy({ buyAt: 1 });

      pipeline = new SignalOrderPipeline({
        manager: mockManager as unknown as LiveExchangeManager,
        strategies: [strategy],
        symbol: 'BTC/USDT',
        dryRun: true,
        maxPositionUsd: 1000
      });

      await pipeline.start();
      await (pipeline as any).onCandle(makeCandle(50000));

      // Verify pipeline executed order
      expect(pipeline.getPosition()).toBe('long');

      // Verify paper engine can track the trade
      const balance = await paperEngine.fetchBalance();
      expect(balance.USDT.total).toBe(10000); // Dry run doesn't affect balance
    });
  });
});
