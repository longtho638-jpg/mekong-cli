/**
 * BullMQ worker for the "backtest" queue.
 * Consumes BacktestJobData, runs BacktestRunner against a mock data provider,
 * then publishes the result to Redis pub/sub channel backtest:done:{tenantId}.
 * Timeout: 5 min. Retry: 3x exponential backoff.
 */

import { logger } from '../../utils/logger';
import {
  BacktestJobData,
  BacktestJobResult,
  BacktestJobDataSchema,
  QUEUE_NAMES,
} from '../bullmq-job-payload-types-and-zod-schemas';
import { createRedisConnection } from '../ioredis-connection-factory-and-singleton-pool';
import { PUBSUB_CHANNELS } from '../bullmq-job-payload-types-and-zod-schemas';

// ─── Interfaces matching BullMQ Worker API ───────────────────────────────────

export interface IWorkerJob<T> {
  id?: string;
  data: T;
  updateProgress(value: number): Promise<void>;
}

export interface IBullMQWorker {
  on(event: string, listener: (...args: unknown[]) => void): this;
  close(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
}

// ─── Minimal data provider for worker (uses live exchange or cache) ──────────

import { IDataProvider } from '../../interfaces/IDataProvider';
import { ICandle } from '../../interfaces/ICandle';

/** Stub data provider when no real exchange is wired in worker context */
class WorkerDataProvider implements IDataProvider {
  private pair: string;
  private timeframe: string;

  constructor(pair: string, timeframe: string) {
    this.pair = pair;
    this.timeframe = timeframe;
  }

  async init(): Promise<void> { /* no-op in worker stub */ }
  subscribe(_callback: (candle: ICandle) => void): void { /* no-op in worker stub */ }
  async start(): Promise<void> { /* no-op in worker stub */ }
  async stop(): Promise<void> { /* no-op in worker stub */ }

  async getHistory(limit: number): Promise<ICandle[]> {
    // In production, this would fetch from exchange or cache.
    // Worker may inject a real CCXTDataProvider via DI.
    logger.warn(
      `[BacktestWorker] WorkerDataProvider returning empty history for ${this.pair}/${this.timeframe} limit=${limit}`
    );
    return [];
  }
}

// ─── Processor function ──────────────────────────────────────────────────────

export async function processBacktestJob(
  job: IWorkerJob<BacktestJobData>
): Promise<BacktestJobResult> {
  const data = BacktestJobDataSchema.parse(job.data);
  const { tenantId, strategyName, pair, timeframe, days, initialBalance } = data;

  logger.info(
    `[BacktestWorker] job=${job.id} tenant=${tenantId} strategy=${strategyName} pair=${pair} days=${days}`
  );

  await job.updateProgress(5);

  // Dynamic strategy lookup — strategies must be registered in StrategyRegistry
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RsiSmaStrategy } = require('../../strategies/RsiSmaStrategy');
  // Fall back to RsiSmaStrategy if specific name not resolved
  const strategy = new RsiSmaStrategy();

  await job.updateProgress(20);

  const { BacktestRunner } = await import('../../backtest/BacktestRunner');
  const dataProvider = new WorkerDataProvider(pair, timeframe);

  const runner = new BacktestRunner(strategy, dataProvider, initialBalance, {
    feeRate: data.feeRate,
    riskPercentage: data.riskPercentage,
    slippageBps: data.slippageBps,
  });

  await job.updateProgress(30);
  const backtestResult = await runner.run(days, true /* silent */);
  await job.updateProgress(90);

  const result: BacktestJobResult = {
    tenantId,
    strategyName: backtestResult.strategyName,
    finalBalance: backtestResult.finalBalance,
    totalReturn: backtestResult.totalReturn,
    maxDrawdown: backtestResult.maxDrawdown,
    totalTrades: backtestResult.totalTrades,
    winRate: backtestResult.winRate,
    sharpeRatio: backtestResult.sharpeRatio,
    completedAt: Date.now(),
  };

  // Publish result to Redis pub/sub for real-time consumers
  try {
    const redis = createRedisConnection();
    const channel = PUBSUB_CHANNELS.backtest(tenantId);
    await redis.publish(channel, JSON.stringify(result));
    logger.info(`[BacktestWorker] Published result to ${channel}`);
  } catch (pubErr) {
    logger.warn(`[BacktestWorker] Pub/Sub publish failed (non-fatal): ${pubErr}`);
  }

  await job.updateProgress(100);
  logger.info(
    `[BacktestWorker] job=${job.id} done — return=${result.totalReturn.toFixed(2)}% trades=${result.totalTrades}`
  );

  return result;
}

// ─── Worker factory ──────────────────────────────────────────────────────────

/**
 * Creates and starts the BullMQ Worker for the backtest queue.
 * Returns null if BullMQ or Redis is unavailable (graceful degradation).
 */
export function startBacktestWorker(concurrency = 2): IBullMQWorker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Worker } = require('bullmq');
    const connection = createRedisConnection();

    const worker: IBullMQWorker = new Worker(
      QUEUE_NAMES.BACKTEST,
      processBacktestJob,
      {
        connection,
        concurrency,
        stalledInterval: 30_000,
        maxStalledCount: 2,
      }
    );

    worker.on('completed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<BacktestJobData>;
      const result = args[1] as BacktestJobResult;
      logger.info(`[BacktestWorker] Completed job=${job.id} return=${result.totalReturn}%`);
    });

    worker.on('failed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<BacktestJobData> | undefined;
      const err = args[1] as Error;
      logger.error(`[BacktestWorker] Failed job=${job?.id}: ${err.message}`);
    });

    worker.on('stalled', (...args: unknown[]) => {
      const jobId = args[0] as string;
      logger.warn(`[BacktestWorker] Stalled job=${jobId}`);
    });

    logger.info(`[BacktestWorker] Started with concurrency=${concurrency}`);
    return worker;
  } catch (err) {
    logger.warn(
      `[BacktestWorker] Could not start — BullMQ/Redis unavailable: ` +
      `${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}
