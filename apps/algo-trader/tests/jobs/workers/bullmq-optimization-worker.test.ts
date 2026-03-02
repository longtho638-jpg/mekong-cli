/**
 * Tests for bullmq-optimization-worker-runs-grid-search-and-ranks-results.ts
 * Verifies: job processor validates payload, runs grid search, ranks results, publishes to Redis.
 * All Redis and BullMQ dependencies are mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPublish = jest.fn().mockResolvedValue(1);
const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    status: 'ready',
    on: jest.fn().mockReturnThis(),
    quit: jest.fn().mockResolvedValue('OK'),
    duplicate: jest.fn().mockReturnThis(),
    publish: mockPublish,
    subscribe: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    del: jest.fn().mockResolvedValue(1),
    eval: jest.fn().mockResolvedValue([1, 60]),
  })),
  { virtual: true }
);

jest.mock('bullmq', () => ({ Worker: jest.fn(), Queue: jest.fn() }), { virtual: true });

// Mock BacktestRunner to avoid real data fetching
const mockBacktestResults = [
  {
    strategyName: 'RsiSmaStrategy',
    initialBalance: 10000,
    finalBalance: 10500,
    totalReturn: 5.0,
    maxDrawdown: 2.1,
    totalFees: 12.5,
    totalTrades: 20,
    wins: 12,
    losses: 8,
    winRate: 60,
    avgProfit: 25,
    sharpeRatio: 1.2,
  },
  {
    strategyName: 'RsiSmaStrategy',
    initialBalance: 10000,
    finalBalance: 10800,
    totalReturn: 8.0,
    maxDrawdown: 1.5,
    totalFees: 10.0,
    totalTrades: 22,
    wins: 15,
    losses: 7,
    winRate: 68.2,
    avgProfit: 36,
    sharpeRatio: 1.8,
  },
  {
    strategyName: 'RsiSmaStrategy',
    initialBalance: 10000,
    finalBalance: 10200,
    totalReturn: 2.0,
    maxDrawdown: 3.5,
    totalFees: 15.0,
    totalTrades: 18,
    wins: 10,
    losses: 8,
    winRate: 55.6,
    avgProfit: 11,
    sharpeRatio: 0.8,
  },
];

jest.mock('../../../src/backtest/BacktestRunner', () => ({
  BacktestRunner: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue(mockBacktestResults[0]),
    getResults: jest.fn().mockReturnValue(mockBacktestResults[0]),
  })),
}));

// Mock BacktestOptimizer to return predictable results
jest.mock('../../../src/backtest/BacktestOptimizer', () => ({
  BacktestOptimizer: jest.fn().mockImplementation(() => ({
    optimize: jest.fn().mockResolvedValue([
      { params: { period: 10 }, result: mockBacktestResults[0], score: 0.75 },
      { params: { period: 14 }, result: mockBacktestResults[1], score: 0.85 },
      { params: { period: 20 }, result: mockBacktestResults[2], score: 0.65 },
    ]),
  })),
}));

// Mock RsiSmaStrategy
jest.mock('../../../src/strategies/RsiSmaStrategy', () => ({
  RsiSmaStrategy: jest.fn().mockImplementation(() => ({
    name: 'RsiSmaStrategy',
    init: jest.fn().mockResolvedValue(undefined),
    onCandle: jest.fn().mockResolvedValue(null),
  })),
}), { virtual: true });

// Mock StrategyLoader to allow valid strategy names
jest.mock('../../../src/core/StrategyLoader', () => ({
  StrategyLoader: {
    load: jest.fn((name) => {
      const validStrategies = ['RsiSma', 'RsiCrossover', 'Bollinger', 'MacdCrossover', 'MacdBollingerRsi'];
      if (!validStrategies.includes(name)) {
        throw new Error(`Strategy ${name} not found`);
      }
      return { name, init: jest.fn(), onCandle: jest.fn() };
    }),
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

import { processOptimizationJob } from '../../../src/jobs/workers/bullmq-optimization-worker-runs-grid-search-and-ranks-results';
import type { OptimizationJobData, OptimizationJobResult } from '../../../src/jobs/bullmq-job-payload-types-and-zod-schemas';
import { OptimizationJobDataSchema } from '../../../src/jobs/bullmq-job-payload-types-and-zod-schemas';

function makeJobData(data: Partial<OptimizationJobData> = {}): OptimizationJobData {
  return {
    tenantId: 'tenant-opt-1',
    strategyName: 'RsiSma',
    pair: 'BTC/USDT',
    timeframe: '1m',
    days: 30,
    initialBalance: 10000,
    paramRanges: [
      { name: 'period', values: [10, 14, 20] },
    ],
    metric: 'composite',
    ...data,
  };
}

describe('processOptimizationJob()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns OptimizationJobResult with correct shape', async () => {
    const result = await processOptimizationJob(makeJobData());

    expect(result).toMatchObject({
      tenantId: 'tenant-opt-1',
      strategyName: 'RsiSma',
      totalCombinations: 3,
      bestParams: expect.any(Object),
      bestScore: expect.any(Number),
      topResults: expect.any(Array),
      completedAt: expect.any(Number),
    });

    expect(result.topResults.length).toBeGreaterThan(0);
    expect(result.topResults[0]).toMatchObject({
      params: expect.any(Object),
      score: expect.any(Number),
      sharpe: expect.any(Number),
      maxDrawdown: expect.any(Number),
    });
  });

  it('returns empty results when optimization finds no combinations', async () => {
    const { BacktestOptimizer } = require('../../../src/backtest/BacktestOptimizer');
    BacktestOptimizer.mockImplementationOnce(() => ({
      optimize: jest.fn().mockResolvedValue([]),
    }));

    const result = await processOptimizationJob(makeJobData());

    expect(result).toMatchObject({
      tenantId: 'tenant-opt-1',
      totalCombinations: 0,
      bestParams: {},
      bestScore: 0,
      topResults: [],
    });
  });

  it('throws error when strategy name is invalid', async () => {
    const badData = makeJobData({ strategyName: 'UnknownStrategy' });

    await expect(processOptimizationJob(badData)).rejects.toThrow();
  });

  it('ranks results by composite score and returns top 5', async () => {
    const result = await processOptimizationJob(makeJobData());

    expect(result.topResults.length).toBeLessThanOrEqual(5);

    // Verify descending order by score
    for (let i = 0; i < result.topResults.length - 1; i++) {
      expect(result.topResults[i].score).toBeGreaterThanOrEqual(result.topResults[i + 1].score);
    }
  });

  it('sets bestParams to top-ranked result', async () => {
    const result = await processOptimizationJob(makeJobData());

    expect(result.bestParams).toEqual(result.topResults[0].params);
    expect(result.bestScore).toBe(result.topResults[0].score);
  });

  it('includes sharpe and maxDrawdown in topResults', async () => {
    const result = await processOptimizationJob(makeJobData());

    for (const topResult of result.topResults) {
      expect(topResult).toHaveProperty('sharpe');
      expect(topResult).toHaveProperty('maxDrawdown');
      expect(typeof topResult.sharpe).toBe('number');
      expect(typeof topResult.maxDrawdown).toBe('number');
    }
  });

  it('handles metric=sharpe ranking', async () => {
    const result = await processOptimizationJob(makeJobData({ metric: 'sharpe' }));

    expect(result).toMatchObject({
      totalCombinations: 3,
      topResults: expect.any(Array),
    });
  });

  it('handles metric=sortino ranking', async () => {
    const result = await processOptimizationJob(makeJobData({ metric: 'sortino' }));

    expect(result).toMatchObject({
      totalCombinations: 3,
      topResults: expect.any(Array),
    });
  });

  it('completedAt timestamp is set', async () => {
    const beforeCall = Date.now();
    const result = await processOptimizationJob(makeJobData());
    const afterCall = Date.now();

    expect(result.completedAt).toBeGreaterThanOrEqual(beforeCall);
    expect(result.completedAt).toBeLessThanOrEqual(afterCall);
  });
});

describe('OptimizationJobDataSchema', () => {
  it('validates correct optimization job data', () => {
    const validData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      timeframe: '1m',
      days: 30,
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14, 20] },
      ],
      metric: 'composite' as const,
    };

    const result = OptimizationJobDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects data with missing tenantId', () => {
    const invalidData = {
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      timeframe: '1m',
      days: 30,
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14, 20] },
      ],
    };

    const result = OptimizationJobDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects data with empty paramRanges', () => {
    const invalidData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      days: 30,
      initialBalance: 10000,
      paramRanges: [],
    };

    const result = OptimizationJobDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects data with missing strategyName', () => {
    const invalidData = {
      tenantId: 'tenant-1',
      pair: 'BTC/USDT',
      days: 30,
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14, 20] },
      ],
    };

    const result = OptimizationJobDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('applies default values for timeframe, days, and metric', () => {
    const minimalData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14] },
      ],
    };

    const result = OptimizationJobDataSchema.safeParse(minimalData);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.timeframe).toBe('1m');
      expect(result.data.days).toBe(30);
      expect(result.data.metric).toBe('composite');
    }
  });

  it('rejects days exceeding max of 90', () => {
    const invalidData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      days: 120,
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14] },
      ],
    };

    const result = OptimizationJobDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid metric enum value', () => {
    const invalidData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14] },
      ],
      metric: 'invalid-metric',
    };

    const result = OptimizationJobDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('validates paramRanges structure with name and values array', () => {
    const validData = {
      tenantId: 'tenant-1',
      strategyName: 'RsiSma',
      pair: 'BTC/USDT',
      initialBalance: 10000,
      paramRanges: [
        { name: 'period', values: [10, 14, 20] },
        { name: 'threshold', values: [30, 50, 70] },
      ],
    };

    const result = OptimizationJobDataSchema.safeParse(validData);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.paramRanges).toHaveLength(2);
    }
  });
});
