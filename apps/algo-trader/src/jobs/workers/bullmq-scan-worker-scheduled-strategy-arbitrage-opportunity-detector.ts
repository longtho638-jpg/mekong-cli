/**
 * BullMQ worker for the "strategy-scan" queue.
 * Consumes ScanJobData and runs arbitrage/strategy opportunity detection
 * across specified trading pairs. Supports repeatable (scheduled) jobs
 * via BullMQ's built-in repeat scheduler (every 5 minutes by default).
 * Timeout: 30s. Retry: 3x exponential backoff.
 */

import { logger } from '../../utils/logger';
import {
  ScanJobData,
  ScanJobResult,
  ScanJobDataSchema,
  QUEUE_NAMES,
} from '../bullmq-job-payload-types-and-zod-schemas';
import type { IBullMQWorker, IWorkerJob } from './bullmq-backtest-worker-runs-backtest-runner-and-publishes-result';
import { createRedisConnection } from '../ioredis-connection-factory-and-singleton-pool';
import { PUBSUB_CHANNELS } from '../bullmq-job-payload-types-and-zod-schemas';
import { StrategyAutoDetector } from '../../core/strategy-auto-detector';

// ─── Repeat schedule ─────────────────────────────────────────────────────────

export const SCAN_REPEAT_EVERY_MS = 5 * 60 * 1000; // 5 minutes

// ─── Processor ───────────────────────────────────────────────────────────────

export async function processScanJob(
  job: IWorkerJob<ScanJobData>
): Promise<ScanJobResult> {
  const data = ScanJobDataSchema.parse(job.data);
  const { tenantId, pairs, exchange } = data;

  logger.info(
    `[ScanWorker] job=${job.id} tenant=${tenantId} pairs=${pairs.join(',')} exchange=${exchange}`
  );

  await job.updateProgress(10);

  // Run a lightweight arbitrage opportunity scan across pairs.
  const detector = new StrategyAutoDetector();
  const opportunities: string[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    await job.updateProgress(10 + Math.floor((i / pairs.length) * 70));

    try {
      // In production, this would fetch real market data.
      // For now, we use the detector's logic (which might still be partially mocked)
      const result = detector.detect({ name: pair, pairs: [pair] });
      if (result.type !== 'unknown') opportunities.push(pair);
    } catch (err) {
      logger.warn(`[ScanWorker] Pair ${pair} scan error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await job.updateProgress(85);

  const result: ScanJobResult = {
    tenantId,
    opportunitiesFound: opportunities.length,
    pairs: opportunities,
    completedAt: Date.now(),
  };

  // Publish opportunities to Redis pub/sub so downstream consumers act on them
  if (opportunities.length > 0) {
    try {
      const redis = createRedisConnection();
      const channel = PUBSUB_CHANNELS.signal(tenantId);
      await redis.publish(channel, JSON.stringify({ type: 'scan-result', ...result }));
      logger.info(`[ScanWorker] Published ${opportunities.length} opportunities to ${channel}`);
    } catch (pubErr) {
      logger.warn(`[ScanWorker] Pub/Sub publish failed (non-fatal): ${pubErr}`);
    }
  }

  await job.updateProgress(100);
  logger.info(`[ScanWorker] job=${job.id} done — ${opportunities.length}/${pairs.length} pairs flagged`);

  return result;
}

// ─── Worker factory ───────────────────────────────────────────────────────────

/**
 * Creates and starts the BullMQ Worker for the strategy-scan queue.
 * Returns null if BullMQ or Redis is unavailable.
 */
export function startScanWorker(concurrency = 1): IBullMQWorker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Worker } = require('bullmq');
    const connection = createRedisConnection();

    const worker: IBullMQWorker = new Worker(
      QUEUE_NAMES.SCAN,
      processScanJob,
      {
        connection,
        concurrency,
        stalledInterval: 15_000,
        maxStalledCount: 1,
      }
    );

    worker.on('completed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<ScanJobData>;
      const result = args[1] as ScanJobResult;
      logger.info(`[ScanWorker] Completed job=${job.id} found=${result.opportunitiesFound}`);
    });

    worker.on('failed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<ScanJobData> | undefined;
      const err = args[1] as Error;
      logger.error(`[ScanWorker] Failed job=${job?.id}: ${err.message}`);
    });

    logger.info('[ScanWorker] Started');
    return worker;
  } catch (err) {
    logger.warn(
      `[ScanWorker] Could not start — BullMQ/Redis unavailable: ` +
      `${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * Enqueues a repeatable scan job for a tenant.
 * Uses BullMQ's built-in repeat scheduler so no external cron is needed.
 */
export async function scheduleRepeatedScanJob(
  tenantId: string,
  pairs: string[],
  exchange = 'binance',
  everyMs = SCAN_REPEAT_EVERY_MS
): Promise<{ id?: string } | null> {
  try {
    const { getScanQueue } = await import('../bullmq-named-queue-registry-backtest-scan-webhook');
    const queue = getScanQueue();
    const job = await queue.add(
      `scan:${tenantId}`,
      { tenantId, pairs, exchange },
      {
        repeat: { every: everyMs },
        jobId: `repeat:scan:${tenantId}`, // Stable ID prevents duplicates
      }
    );
    logger.info(`[ScanWorker] Scheduled repeat scan for tenant=${tenantId} every=${everyMs}ms`);
    return job;
  } catch (err) {
    logger.warn(`[ScanWorker] Failed to schedule repeat scan: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
