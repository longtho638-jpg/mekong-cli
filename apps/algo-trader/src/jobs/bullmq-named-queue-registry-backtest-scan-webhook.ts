/**
 * BullMQ named queue registry — creates and exports backtest, strategy-scan,
 * and webhook-delivery Queue instances with shared default job options.
 * Queues use lazy Redis connection; app starts without Redis available.
 */

import { logger } from '../utils/logger';
import { QUEUE_NAMES } from './bullmq-job-payload-types-and-zod-schemas';
import { createRedisConnection } from './ioredis-connection-factory-and-singleton-pool';

// ─── BullMQ Queue interface (runtime import) ─────────────────────────────────

export interface BullMQJobOptions {
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  removeOnComplete?: number | boolean;
  removeOnFail?: number | boolean;
  delay?: number;
  timeout?: number;
  repeat?: { every?: number; cron?: string; limit?: number };
  jobId?: string;
}

export interface BullMQJob<T = unknown> {
  id?: string;
  data: T;
  opts?: BullMQJobOptions;
  progress: number | object;
  returnvalue?: unknown;
  failedReason?: string;
  updateProgress(value: number | object): Promise<void>;
}

export interface IBullMQQueue<T = unknown> {
  name: string;
  add(name: string, data: T, opts?: BullMQJobOptions): Promise<{ id?: string }>;
  getJob(jobId: string): Promise<BullMQJob<T> | null>;
  getJobCounts(...types: string[]): Promise<Record<string, number>>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  obliterate(opts?: { force?: boolean }): Promise<void>;
  close(): Promise<void>;
}

// ─── Default job options ─────────────────────────────────────────────────────

const SHARED_DEFAULTS: BullMQJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }, // 1s → 4s → 16s
  removeOnComplete: 100, // Keep last 100 completed
  removeOnFail: 50,      // Keep last 50 failed (DLQ inspection)
};

const QUEUE_TIMEOUT: Record<string, number> = {
  [QUEUE_NAMES.BACKTEST]:    5 * 60 * 1000,  // 5 min
  [QUEUE_NAMES.SCAN]:        30 * 1000,       // 30 s
  [QUEUE_NAMES.WEBHOOK]:     10 * 1000,       // 10 s
  [QUEUE_NAMES.OPTIMIZATION]: 10 * 60 * 1000, // 10 min (CPU-bound grid search)
};

// ─── Queue factory ───────────────────────────────────────────────────────────

function createQueue<T>(name: string): IBullMQQueue<T> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue } = require('bullmq');
    const connection = createRedisConnection();
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        ...SHARED_DEFAULTS,
        timeout: QUEUE_TIMEOUT[name],
      },
    });
    logger.info(`[QueueRegistry] Queue created: ${name}`);
    return queue as IBullMQQueue<T>;
  } catch (err) {
    logger.warn(
      `[QueueRegistry] BullMQ/Redis unavailable for "${name}", using stub queue: ` +
      `${err instanceof Error ? err.message : String(err)}`
    );
    return createStubQueue<T>(name);
  }
}

/** In-memory stub used when Redis is unavailable (test / cold start) */
function createStubQueue<T>(name: string): IBullMQQueue<T> {
  const jobs = new Map<string, BullMQJob<T>>();
  let idCounter = 0;

  return {
    name,
    async add(_jobName: string, data: T, opts?: BullMQJobOptions) {
      const id = String(++idCounter);
      const job: BullMQJob<T> = {
        id,
        data,
        opts,
        progress: 0,
        async updateProgress(v) { this.progress = v; },
      };
      jobs.set(id, job);
      logger.warn(`[StubQueue:${name}] Job enqueued (no Redis): id=${id}`);
      return { id };
    },
    async getJob(jobId: string) { return jobs.get(jobId) ?? null; },
    async getJobCounts() { return { waiting: jobs.size }; },
    async pause()  { /* no-op */ },
    async resume() { /* no-op */ },
    async obliterate() { jobs.clear(); },
    async close() { jobs.clear(); },
  };
}

// ─── Singleton queue instances ───────────────────────────────────────────────

import type { BacktestJobData }    from './bullmq-job-payload-types-and-zod-schemas';
import type { ScanJobData }        from './bullmq-job-payload-types-and-zod-schemas';
import type { WebhookJobData }     from './bullmq-job-payload-types-and-zod-schemas';
import type { OptimizationJobData } from './bullmq-job-payload-types-and-zod-schemas';

let _backtestQueue:     IBullMQQueue<BacktestJobData>    | null = null;
let _scanQueue:         IBullMQQueue<ScanJobData>        | null = null;
let _webhookQueue:      IBullMQQueue<WebhookJobData>     | null = null;
let _optimizationQueue: IBullMQQueue<OptimizationJobData> | null = null;

export function getBacktestQueue(): IBullMQQueue<BacktestJobData> {
  if (!_backtestQueue) _backtestQueue = createQueue<BacktestJobData>(QUEUE_NAMES.BACKTEST);
  return _backtestQueue;
}

export function getScanQueue(): IBullMQQueue<ScanJobData> {
  if (!_scanQueue) _scanQueue = createQueue<ScanJobData>(QUEUE_NAMES.SCAN);
  return _scanQueue;
}

export function getWebhookQueue(): IBullMQQueue<WebhookJobData> {
  if (!_webhookQueue) _webhookQueue = createQueue<WebhookJobData>(QUEUE_NAMES.WEBHOOK);
  return _webhookQueue;
}

export function getOptimizationQueue(): IBullMQQueue<OptimizationJobData> {
  if (!_optimizationQueue) _optimizationQueue = createQueue<OptimizationJobData>(QUEUE_NAMES.OPTIMIZATION);
  return _optimizationQueue;
}

/** Close all queue connections — call on process shutdown */
export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    _backtestQueue?.close(),
    _scanQueue?.close(),
    _webhookQueue?.close(),
    _optimizationQueue?.close(),
  ]);
  _backtestQueue     = null;
  _scanQueue         = null;
  _webhookQueue      = null;
  _optimizationQueue = null;
}

/** Reset singletons — for testing only */
export function _resetQueuesForTesting(): void {
  _backtestQueue     = null;
  _scanQueue         = null;
  _webhookQueue      = null;
  _optimizationQueue = null;
}
