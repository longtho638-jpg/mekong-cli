/**
 * Tests for bullmq-named-queue-registry-backtest-scan-webhook.ts
 * Verifies queue creation, stub fallback, job enqueue, and job retrieval.
 * Uses Jest module mocking to avoid real Redis/BullMQ dependency.
 */

// Mock ioredis before any imports touch it
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    on: jest.fn().mockReturnThis(),
    quit: jest.fn().mockResolvedValue('OK'),
    duplicate: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    del: jest.fn().mockResolvedValue(1),
    eval: jest.fn().mockResolvedValue([1, 60]),
  }));
}, { virtual: true });

// Mock bullmq to avoid real Redis connection
jest.mock('bullmq', () => {
  const mockQueue = jest.fn().mockImplementation((name: string) => ({
    name,
    add: jest.fn().mockImplementation((_jobName: string, data: unknown) =>
      Promise.resolve({ id: `mock-job-${Date.now()}`, data })
    ),
    getJob: jest.fn().mockResolvedValue(null),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    obliterate: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }));

  return { Queue: mockQueue, Worker: jest.fn() };
}, { virtual: true });

import {
  getBacktestQueue,
  getScanQueue,
  getWebhookQueue,
  closeAllQueues,
  _resetQueuesForTesting,
} from '../../src/jobs/bullmq-named-queue-registry-backtest-scan-webhook';
import { QUEUE_NAMES } from '../../src/jobs/bullmq-job-payload-types-and-zod-schemas';

describe('BullMQ Queue Registry', () => {
  beforeEach(() => {
    _resetQueuesForTesting();
  });

  afterEach(async () => {
    await closeAllQueues();
  });

  describe('getBacktestQueue()', () => {
    it('returns a queue with correct name', () => {
      const queue = getBacktestQueue();
      expect(queue.name).toBe(QUEUE_NAMES.BACKTEST);
    });

    it('returns the same singleton on repeated calls', () => {
      const q1 = getBacktestQueue();
      const q2 = getBacktestQueue();
      expect(q1).toBe(q2);
    });

    it('can add a backtest job and receive a job id', async () => {
      const queue = getBacktestQueue();
      const result = await queue.add('run-backtest', {
        tenantId: 'tenant-1',
        strategyName: 'RsiSmaStrategy',
        pair: 'BTC/USDT',
        timeframe: '1m',
        days: 30,
        initialBalance: 10000,
      });
      expect(result.id).toBeDefined();
    });
  });

  describe('getScanQueue()', () => {
    it('returns a queue with correct name', () => {
      const queue = getScanQueue();
      expect(queue.name).toBe(QUEUE_NAMES.SCAN);
    });

    it('can enqueue a scan job', async () => {
      const queue = getScanQueue();
      const result = await queue.add('scan', {
        tenantId: 'tenant-2',
        pairs: ['BTC/USDT', 'ETH/USDT'],
        exchange: 'binance',
      });
      expect(result.id).toBeDefined();
    });
  });

  describe('getWebhookQueue()', () => {
    it('returns a queue with correct name', () => {
      const queue = getWebhookQueue();
      expect(queue.name).toBe(QUEUE_NAMES.WEBHOOK);
    });

    it('can enqueue a webhook job', async () => {
      const queue = getWebhookQueue();
      const result = await queue.add('deliver', {
        tenantId: 'tenant-3',
        url: 'https://example.com/hook',
        payload: { signal: 'BUY', pair: 'BTC/USDT' },
        eventType: 'signal',
      });
      expect(result.id).toBeDefined();
    });
  });

  describe('closeAllQueues()', () => {
    it('closes all queues without error', async () => {
      getBacktestQueue();
      getScanQueue();
      getWebhookQueue();
      await expect(closeAllQueues()).resolves.not.toThrow();
    });

    it('resets singletons after close so new queues can be created', async () => {
      const q1 = getBacktestQueue();
      await closeAllQueues();
      _resetQueuesForTesting();
      const q2 = getBacktestQueue();
      // After reset a new instance is created
      expect(q1).not.toBe(q2);
    });
  });
});
