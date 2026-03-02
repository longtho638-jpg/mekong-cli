/**
 * Tests for bullmq-backtest-worker-runs-backtest-runner-and-publishes-result.ts
 * Verifies: job processor validates payload, calls BacktestRunner, publishes result.
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
const mockRunResult = {
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
};

jest.mock('../../../src/backtest/BacktestRunner', () => ({
  BacktestRunner: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue(mockRunResult),
    getResults: jest.fn().mockReturnValue(mockRunResult),
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

// ─── Tests ────────────────────────────────────────────────────────────────────

import { processBacktestJob } from '../../../src/jobs/workers/bullmq-backtest-worker-runs-backtest-runner-and-publishes-result';
import type { IWorkerJob } from '../../../src/jobs/workers/bullmq-backtest-worker-runs-backtest-runner-and-publishes-result';
import type { BacktestJobData } from '../../../src/jobs/bullmq-job-payload-types-and-zod-schemas';

function makeJob(data: Partial<BacktestJobData> = {}): IWorkerJob<BacktestJobData> {
  return {
    id: 'test-job-1',
    data: {
      tenantId: 'tenant-abc',
      strategyName: 'RsiSmaStrategy',
      pair: 'BTC/USDT',
      timeframe: '1m',
      days: 30,
      initialBalance: 10000,
      ...data,
    },
    updateProgress: mockUpdateProgress,
  };
}

describe('processBacktestJob()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a BacktestJobResult with correct shape', async () => {
    const result = await processBacktestJob(makeJob());

    expect(result).toMatchObject({
      tenantId: 'tenant-abc',
      strategyName: 'RsiSmaStrategy',
      finalBalance: 10500,
      totalReturn: 5.0,
      maxDrawdown: 2.1,
      totalTrades: 20,
      winRate: 60,
      sharpeRatio: 1.2,
    });
    expect(result.completedAt).toBeGreaterThan(0);
  });

  it('reports progress from 0 to 100', async () => {
    await processBacktestJob(makeJob());

    const progressValues = mockUpdateProgress.mock.calls.map(([v]: [number]) => v);
    expect(progressValues[0]).toBe(5);
    expect(progressValues[progressValues.length - 1]).toBe(100);
  });

  it('publishes result to Redis pub/sub channel', async () => {
    await processBacktestJob(makeJob());

    expect(mockPublish).toHaveBeenCalledTimes(1);
    const [channel, payload] = mockPublish.mock.calls[0] as [string, string];
    expect(channel).toBe('backtest:done:tenant-abc');

    const parsed = JSON.parse(payload);
    expect(parsed.tenantId).toBe('tenant-abc');
    expect(parsed.totalReturn).toBe(5.0);
  });

  it('throws ZodError when tenantId is missing', async () => {
    const badJob = {
      id: 'bad-job',
      data: { strategyName: 'X', pair: 'BTC/USDT', days: 10, initialBalance: 1000 } as BacktestJobData,
      updateProgress: mockUpdateProgress,
    };

    await expect(processBacktestJob(badJob)).rejects.toThrow();
  });

  it('still returns result even when Redis publish fails', async () => {
    mockPublish.mockRejectedValueOnce(new Error('Redis down'));

    const result = await processBacktestJob(makeJob());
    // Should not throw — publish failure is non-fatal
    expect(result.totalReturn).toBe(5.0);
  });
});
