import { SignalOrderPipeline } from '../../src/execution/signal-order-pipeline-live-trading';
import { LiveExchangeManager } from '../../src/execution/live-exchange-manager';
import { ExchangeRegistry } from '../../src/execution/exchange-registry';
import { IStrategy, ISignal, SignalType } from '../../src/interfaces/IStrategy';
import { ICandle } from '../../src/interfaces/ICandle';

// Mock WebSocket
jest.mock('ws', () => {
  return class MockWebSocket {
    static OPEN = 1;
    readyState = 1;
    on = jest.fn();
    send = jest.fn();
    close = jest.fn();
    ping = jest.fn();
  };
});

// Mock exchange-factory
jest.mock('../../src/cli/exchange-factory', () => ({
  createExchangeAdapter: jest.fn((id: string) => ({ exchangeId: id })),
}));

/** Create a mock strategy that returns a fixed signal */
function createMockStrategy(name: string, signalType: SignalType = SignalType.NONE): IStrategy {
  return {
    name,
    init: jest.fn().mockResolvedValue(undefined),
    onCandle: jest.fn().mockResolvedValue(
      signalType === SignalType.NONE ? null : {
        type: signalType,
        price: 50000,
        timestamp: Date.now(),
      } as ISignal,
    ),
  };
}

describe('SignalOrderPipeline', () => {
  let registry: ExchangeRegistry;
  let manager: LiveExchangeManager;

  beforeEach(async () => {
    registry = new ExchangeRegistry();
    registry.register({ id: 'binance', enabled: true, tradingPairs: ['BTC/USDT'] });

    manager = new LiveExchangeManager({
      registry,
      staleThresholdMs: 30_000,
      healthCheckIntervalMs: 60_000,
    });
    await manager.start();
  });

  afterEach(async () => {
    await manager.stop();
    manager.removeAllListeners();
  });

  test('start initializes strategies and emits started', async () => {
    const strategy = createMockStrategy('test-strat');
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [strategy],
      symbol: 'BTC/USDT',
      candleIntervalMs: 100,
    });

    const events: string[] = [];
    pipeline.on('started', () => events.push('started'));
    await pipeline.start();

    expect(strategy.init).toHaveBeenCalled();
    expect(pipeline.isRunning()).toBe(true);
    expect(events).toContain('started');

    await pipeline.stop();
  });

  test('stop cleans up and emits stopped', async () => {
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [createMockStrategy('s1')],
      symbol: 'BTC/USDT',
    });
    await pipeline.start();

    const events: string[] = [];
    pipeline.on('stopped', () => events.push('stopped'));
    await pipeline.stop();

    expect(pipeline.isRunning()).toBe(false);
    expect(events).toContain('stopped');
  });

  test('start and stop are idempotent', async () => {
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [createMockStrategy('s1')],
      symbol: 'BTC/USDT',
    });
    await pipeline.start();
    await pipeline.start(); // no-op
    expect(pipeline.isRunning()).toBe(true);

    await pipeline.stop();
    await pipeline.stop(); // no-op
    expect(pipeline.isRunning()).toBe(false);
  });

  test('initial position is flat', async () => {
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [createMockStrategy('s1')],
      symbol: 'BTC/USDT',
    });
    expect(pipeline.getPosition()).toBe('flat');
    expect(pipeline.getCandleHistory()).toHaveLength(0);
  });

  test('BUY signal in dry-run mode updates position to long', async () => {
    const strategy = createMockStrategy('buyer', SignalType.BUY);
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [strategy],
      symbol: 'BTC/USDT',
      candleIntervalMs: 50,
      dryRun: true,
    });

    await pipeline.start();

    // Simulate candle emission by directly calling the aggregator flush
    const orderEvents: unknown[] = [];
    pipeline.on('order', (e) => orderEvents.push(e));

    // Feed the pipeline a candle by emitting on aggregator via internal event
    // We access the aggregator through a candle event simulation
    const candle: ICandle = {
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    };

    // Trigger strategy evaluation directly via event
    // The pipeline listens to aggregator 'candle' events internally
    // We simulate by manually triggering the same path
    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle);

    expect(pipeline.getPosition()).toBe('long');
    expect(orderEvents).toHaveLength(1);
    expect((orderEvents[0] as { side: string }).side).toBe('buy');
    expect((orderEvents[0] as { dryRun: boolean }).dryRun).toBe(true);

    await pipeline.stop();
  });

  test('SELL signal after BUY returns position to flat', async () => {
    const buyStrategy = createMockStrategy('buyer', SignalType.BUY);
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [buyStrategy],
      symbol: 'BTC/USDT',
      dryRun: true,
    });
    await pipeline.start();

    const candle: ICandle = {
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    };

    // First: BUY
    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle);
    expect(pipeline.getPosition()).toBe('long');

    // Switch strategy to SELL
    (buyStrategy.onCandle as jest.Mock).mockResolvedValue({
      type: SignalType.SELL, price: 50100, timestamp: Date.now(),
    });

    // Second: SELL
    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle);
    expect(pipeline.getPosition()).toBe('flat');

    await pipeline.stop();
  });

  test('minConfirmations requires multiple strategies to agree', async () => {
    const buyer = createMockStrategy('buyer', SignalType.BUY);
    const neutral = createMockStrategy('neutral', SignalType.NONE);
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [buyer, neutral],
      symbol: 'BTC/USDT',
      minConfirmations: 2,
      dryRun: true,
    });
    await pipeline.start();

    const candle: ICandle = {
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    };

    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle);
    // Only 1 BUY, need 2 → no order
    expect(pipeline.getPosition()).toBe('flat');

    await pipeline.stop();
  });

  test('minConfirmations met triggers order', async () => {
    const buyer1 = createMockStrategy('buyer1', SignalType.BUY);
    const buyer2 = createMockStrategy('buyer2', SignalType.BUY);
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [buyer1, buyer2],
      symbol: 'BTC/USDT',
      minConfirmations: 2,
      dryRun: true,
    });
    await pipeline.start();

    const candle: ICandle = {
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    };

    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle);
    expect(pipeline.getPosition()).toBe('long');

    await pipeline.stop();
  });

  test('candle history is buffered up to maxHistory', async () => {
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [createMockStrategy('s1')],
      symbol: 'BTC/USDT',
    });
    await pipeline.start();

    const onCandle = (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle.bind(pipeline);
    for (let i = 0; i < 5; i++) {
      await onCandle({
        timestamp: Date.now() + i,
        open: 50000 + i, high: 50100, low: 49900, close: 50050, volume: 100,
      });
    }

    expect(pipeline.getCandleHistory()).toHaveLength(5);

    await pipeline.stop();
  });

  test('strategy error does not crash pipeline', async () => {
    const errorStrategy: IStrategy = {
      name: 'crasher',
      init: jest.fn().mockResolvedValue(undefined),
      onCandle: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [errorStrategy],
      symbol: 'BTC/USDT',
      dryRun: true,
    });
    await pipeline.start();

    const candle: ICandle = {
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    };

    // Should not throw
    await expect(
      (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle(candle),
    ).resolves.not.toThrow();

    expect(pipeline.getPosition()).toBe('flat');
    await pipeline.stop();
  });

  test('signals event emitted with strategy details', async () => {
    const buyer = createMockStrategy('sig-buyer', SignalType.BUY);
    const pipeline = new SignalOrderPipeline({
      manager,
      strategies: [buyer],
      symbol: 'BTC/USDT',
      dryRun: true,
    });
    await pipeline.start();

    const signalEvents: unknown[] = [];
    pipeline.on('signals', (s) => signalEvents.push(s));

    await (pipeline as unknown as { onCandle(c: ICandle): Promise<void> }).onCandle({
      timestamp: Date.now(),
      open: 50000, high: 50100, low: 49900, close: 50050, volume: 100,
    });

    expect(signalEvents).toHaveLength(1);
    const signals = signalEvents[0] as Array<{ strategy: string }>;
    expect(signals[0].strategy).toBe('sig-buyer');

    await pipeline.stop();
  });
});
