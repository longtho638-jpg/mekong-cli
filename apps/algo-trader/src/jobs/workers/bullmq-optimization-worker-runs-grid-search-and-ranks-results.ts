/** BullMQ Optimization Worker — grid search via BacktestOptimizer, ranked via StrategyPerformanceRanker. Concurrency: 1. */

import { logger } from '../../utils/logger';
import { LicenseError, LicenseTier, LicenseService } from '../../lib/raas-gate';
import { BacktestOptimizer } from '../../backtest/BacktestOptimizer';
import { StrategyPerformanceRanker } from '../../backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown';
import { StrategyLoader } from '../../core/StrategyLoader';
import { IDataProvider } from '../../interfaces/IDataProvider';
import { ICandle } from '../../interfaces/ICandle';
import {
  OptimizationJobData,
  OptimizationJobResult,
  OptimizationJobDataSchema,
  QUEUE_NAMES,
  PUBSUB_CHANNELS,
} from '../bullmq-job-payload-types-and-zod-schemas';
import { createRedisConnection } from '../ioredis-connection-factory-and-singleton-pool';
import { IBullMQWorker, IWorkerJob } from './bullmq-backtest-worker-runs-backtest-runner-and-publishes-result';

class OptWorkerDataProvider implements IDataProvider {
  constructor(private pair: string, private timeframe: string) {}

  async init(): Promise<void> { /* no-op */ }
  subscribe(_cb: (c: ICandle) => void): void { /* no-op */ }
  async start(): Promise<void> { /* no-op */ }
  async stop(): Promise<void> { /* no-op */ }

  async getHistory(limit: number): Promise<ICandle[]> {
    logger.warn(
      `[OptWorker] DataProvider returning empty history for ${this.pair}/${this.timeframe} limit=${limit}`
    );
    return [];
  }
}

export async function processOptimizationJob(
  data: OptimizationJobData
): Promise<OptimizationJobResult> {
  const { tenantId, strategyName, pair, timeframe, days, initialBalance, paramRanges, metric } = data;

  // Gate premium optimization feature behind PRO license
  const licenseService = LicenseService.getInstance();
  if (!licenseService.hasTier(LicenseTier.PRO)) {
    const err = new LicenseError(
      `Optimization requires PRO license. Current tier: ${licenseService.getTier()}`,
      LicenseTier.PRO,
      'advanced_optimization'
    );
    logger.warn(`[OptWorker] License check failed for tenant=${tenantId}: ${err.message}`);
    throw err;
  }

  // Validate strategy exists before launching grid search
  StrategyLoader.load(strategyName); // throws if unknown

  const dataProvider = new OptWorkerDataProvider(pair, timeframe);
  const optimizer = new BacktestOptimizer(dataProvider, initialBalance, days);

  // Strategy factory: creates fresh instance per param combo
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RsiSmaStrategy } = require('../../strategies/RsiSmaStrategy');
  const factory = (_params: Record<string, number>) => new RsiSmaStrategy();

  logger.info(
    `[OptWorker] Grid search: strategy=${strategyName} pair=${pair} days=${days} ` +
    `ranges=${paramRanges.length} metric=${metric}`
  );

  const rawResults = await optimizer.optimize(factory, paramRanges);
  const totalCombinations = rawResults.length;

  if (totalCombinations === 0) {
    return {
      tenantId,
      strategyName,
      totalCombinations: 0,
      bestParams: {},
      bestScore: 0,
      topResults: [],
      completedAt: Date.now(),
    };
  }

  type TopResult = { params: Record<string, number>; score: number; sharpe: number; maxDrawdown: number };
  let topResults: TopResult[];

  if (metric === 'composite') {
    topResults = new StrategyPerformanceRanker().rank(rawResults).slice(0, 5).map(r => ({
      params: r.params, score: r.compositeScore, sharpe: r.sharpe, maxDrawdown: r.maxDrawdown,
    }));
  } else {
    const sortinoEst = (r: typeof rawResults[0]) =>
      r.result.sharpeRatio * (1 + Math.max(0.5, r.result.winRate / 100) * 0.5);
    topResults = [...rawResults]
      .sort((a, b) => (metric === 'sharpe' ? b.result.sharpeRatio - a.result.sharpeRatio : sortinoEst(b) - sortinoEst(a)))
      .slice(0, 5)
      .map(r => ({ params: r.params, score: r.score, sharpe: r.result.sharpeRatio, maxDrawdown: r.result.maxDrawdown }));
  }

  const best = topResults[0];
  return {
    tenantId,
    strategyName,
    totalCombinations,
    bestParams: best.params,
    bestScore: best.score,
    topResults,
    completedAt: Date.now(),
  };
}

/** Creates and starts the BullMQ Worker for the optimization queue. Returns null if unavailable. */
export function startOptimizationWorker(): IBullMQWorker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Worker } = require('bullmq');
    const connection = createRedisConnection();

    const worker: IBullMQWorker = new Worker(
      QUEUE_NAMES.OPTIMIZATION,
      async (job: IWorkerJob<OptimizationJobData>) => {
        const data = OptimizationJobDataSchema.parse(job.data);
        logger.info(`[OptWorker] job=${job.id} tenant=${data.tenantId} strategy=${data.strategyName}`);
        await job.updateProgress(5);

        const result = await processOptimizationJob(data);
        await job.updateProgress(95);

        // Publish result to Redis pub/sub for real-time consumers
        try {
          const redis = createRedisConnection();
          const channel = PUBSUB_CHANNELS.optimization(data.tenantId);
          await redis.publish(channel, JSON.stringify(result));
          logger.info(`[OptWorker] Published result to ${channel}`);
        } catch (pubErr) {
          logger.warn(`[OptWorker] Pub/Sub publish failed (non-fatal): ${pubErr}`);
        }

        await job.updateProgress(100);
        logger.info(
          `[OptWorker] job=${job.id} done — combos=${result.totalCombinations} bestScore=${result.bestScore.toFixed(4)}`
        );
        return result;
      },
      {
        connection,
        concurrency: 1, // CPU-bound: 1 at a time to avoid OOM on M1 16GB
        stalledInterval: 60_000,
        maxStalledCount: 1,
      }
    );

    worker.on('completed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<OptimizationJobData>;
      const result = args[1] as OptimizationJobResult;
      logger.info(`[OptWorker] Completed job=${job.id} combos=${result.totalCombinations}`);
    });

    worker.on('failed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<OptimizationJobData> | undefined;
      const err = args[1] as Error;
      logger.error(`[OptWorker] Failed job=${job?.id}: ${err.message}`);
    });

    worker.on('stalled', (...args: unknown[]) => {
      const jobId = args[0] as string;
      logger.warn(`[OptWorker] Stalled job=${jobId}`);
    });

    logger.info('[OptWorker] Optimization worker started (concurrency: 1)');
    return worker;
  } catch (err) {
    logger.warn(
      `[OptWorker] Could not start — BullMQ/Redis unavailable: ` +
      `${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}
