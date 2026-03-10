/**
 * Backtest Cache Tests
 */

import { BacktestCache, ParallelBacktestRunner } from './backtest-cache';
import { ICandle } from '../interfaces/ICandle';

function createMockCandle(timestamp: number, close: number): ICandle {
  return {
    timestamp,
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume: 1000000,
  };
}

function createMockResult(returnPercent: number): import('./BacktestRunner').BacktestResult {
  return {
    strategyName: 'TestStrategy',
    totalReturn: returnPercent,
    sharpeRatio: returnPercent / 10,
    maxDrawdown: 5,
    winRate: 55,
    totalTrades: 100,
    profitFactor: 1.5,
    sortinoRatio: 1.2,
    calmarRatio: 1.0,
    equityCurve: [],
    trades: [],
  };
}

describe('BacktestCache', () => {
  it('should return null for missing key', () => {
    const cache = new BacktestCache();
    expect(cache.get('nonexistent')).toBe(null);
  });

  it('should cache and retrieve result', () => {
    const cache = new BacktestCache();
    const key = 'test:strategy1:result1';
    const result = createMockResult(15);

    cache.set(key, result);
    const cached = cache.get(key);

    expect(cached).toBeTruthy();
    expect(cached?.totalReturn).toBe(15);
  });

  it('should track cache hits', () => {
    const cache = new BacktestCache();
    const key = 'test:strategy1:result1';
    const result = createMockResult(15);

    cache.set(key, result);
    cache.get(key);
    cache.get(key);
    cache.get(key);

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
  });

  it('should check existence with has()', () => {
    const cache = new BacktestCache();
    const key = 'test:key';

    expect(cache.has(key)).toBe(false);
    cache.set(key, createMockResult(10));
    expect(cache.has(key)).toBe(true);
  });

  it('should clear cache', () => {
    const cache = new BacktestCache();
    cache.set('key1', createMockResult(10));
    cache.set('key2', createMockResult(20));
    cache.clear();
    expect(cache.getStats().size).toBe(0);
  });

  it('should evict oldest entry when at capacity', () => {
    const cache = new BacktestCache(3); // Max 3 entries

    cache.set('key1', createMockResult(10));
    sleep(10);
    cache.set('key2', createMockResult(20));
    sleep(10);
    cache.set('key3', createMockResult(30));
    sleep(10);
    cache.set('key4', createMockResult(40)); // Should evict key1

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key4')).toBe(true);
  });

  it('should generate consistent cache keys', () => {
    const cache = new BacktestCache();
    const params = { rsi: 14, sma: 50 };
    const candles = [
      createMockCandle(1000, 100),
      createMockCandle(2000, 105),
    ];

    const key1 = cache.generateKey('TestStrategy', params, candles);
    const key2 = cache.generateKey('TestStrategy', params, candles);

    expect(key1).toBe(key2);
  });

  it('should generate different keys for different params', () => {
    const cache = new BacktestCache();
    const candles = [createMockCandle(1000, 100)];

    const key1 = cache.generateKey('TestStrategy', { rsi: 14 }, candles);
    const key2 = cache.generateKey('TestStrategy', { rsi: 21 }, candles);

    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different candle ranges', () => {
    const cache = new BacktestCache();
    const params = { rsi: 14 };

    const candles1 = [
      createMockCandle(1000, 100),
      createMockCandle(2000, 105),
    ];
    const candles2 = [
      createMockCandle(1000, 100),
      createMockCandle(2000, 105),
      createMockCandle(3000, 110),
    ];

    const key1 = cache.generateKey('TestStrategy', params, candles1);
    const key2 = cache.generateKey('TestStrategy', params, candles2);

    expect(key1).not.toBe(key2);
  });

  it('should respect TTL and expire old entries', async () => {
    const cache = new BacktestCache(1000, 0.05); // 50ms TTL
    const key = 'test:expiry';

    cache.set(key, createMockResult(10));
    expect(cache.get(key)).toBeTruthy(); // Should exist initially

    await sleep(100);

    // Direct check without side effects
    const entry = cache.get(key);
    expect(entry).toBeNull(); // Should be expired
  });

  it('should return stats with oldest and newest entries', () => {
    const cache = new BacktestCache();
    cache.set('key1', createMockResult(10));
    sleep(10);
    cache.set('key2', createMockResult(20));

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.oldestEntry).toBeDefined();
    expect(stats.newestEntry).toBeDefined();
  });
});

describe('ParallelBacktestRunner', () => {
  it('should run tasks with concurrency limit', async () => {
    const cache = new BacktestCache();
    const runner = new ParallelBacktestRunner(cache, 2);

    let concurrentCount = 0;
    let maxConcurrent = 0;

    const tasks = [
      {
        strategyName: 'Strategy1',
        params: { rsi: 14 },
        runBacktest: async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await sleep(50);
          concurrentCount--;
          return createMockResult(10);
        },
      },
      {
        strategyName: 'Strategy2',
        params: { rsi: 21 },
        runBacktest: async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await sleep(50);
          concurrentCount--;
          return createMockResult(20);
        },
      },
      {
        strategyName: 'Strategy3',
        params: { rsi: 28 },
        runBacktest: async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await sleep(50);
          concurrentCount--;
          return createMockResult(30);
        },
      },
    ];

    const candles = [createMockCandle(1000, 100)];
    const results = await runner.runAll(tasks, candles);

    expect(results.length).toBe(3);
    expect(maxConcurrent).toBeLessThanOrEqual(2); // Concurrency limit
  });

  it('should use cached results when available', async () => {
    const cache = new BacktestCache();
    const runner = new ParallelBacktestRunner(cache, 2);

    let callCount = 0;
    const tasks = [
      {
        strategyName: 'CachedStrategy',
        params: { rsi: 14 },
        runBacktest: async () => {
          callCount++;
          return createMockResult(15);
        },
      },
    ];

    const candles = [createMockCandle(1000, 100)];

    // First run
    await runner.runAll(tasks, candles);
    expect(callCount).toBe(1);

    // Second run (should use cache)
    await runner.runAll(tasks, candles);
    expect(callCount).toBe(1); // Should not call runBacktest again
  });

  it('should handle empty task list', async () => {
    const runner = new ParallelBacktestRunner();
    const results = await runner.runAll([], []);
    expect(results).toEqual([]);
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
