/**
 * BullMQ worker for the "webhook-delivery" queue.
 * Delivers signed HTTP POST callbacks to tenant webhook URLs.
 * Signs payload with HMAC-SHA256 if hmacSecret is provided.
 * Timeout: 10s per attempt. Retry: 3x exponential backoff (1s, 4s, 16s).
 */

import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';
import {
  WebhookJobData,
  WebhookJobResult,
  WebhookJobDataSchema,
  QUEUE_NAMES,
} from '../bullmq-job-payload-types-and-zod-schemas';
import type { IBullMQWorker, IWorkerJob } from './bullmq-backtest-worker-runs-backtest-runner-and-publishes-result';
import { createRedisConnection } from '../ioredis-connection-factory-and-singleton-pool';

const WEBHOOK_TIMEOUT_MS = 10_000;

// ─── HMAC signature ──────────────────────────────────────────────────────────

function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// ─── HTTP delivery ───────────────────────────────────────────────────────────

function deliverHttpPost(
  url: string,
  body: string,
  headers: Record<string, string>
): Promise<number> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
      timeout: WEBHOOK_TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      // Drain response body to free socket
      res.resume();
      resolve(res.statusCode ?? 0);
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Webhook request timed out after ${WEBHOOK_TIMEOUT_MS}ms`));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Processor ───────────────────────────────────────────────────────────────

export async function processWebhookJob(
  job: IWorkerJob<WebhookJobData>
): Promise<WebhookJobResult> {
  const data = WebhookJobDataSchema.parse(job.data);
  const { tenantId, url, payload, hmacSecret, eventType } = data;

  logger.info(`[WebhookWorker] job=${job.id} tenant=${tenantId} url=${url} event=${eventType}`);

  await job.updateProgress(10);

  const body = JSON.stringify({
    event: eventType,
    tenantId,
    timestamp: Date.now(),
    data: payload,
  });

  const headers: Record<string, string> = {
    'X-AlgoTrader-Event': eventType,
    'X-AlgoTrader-Tenant': tenantId,
  };

  if (hmacSecret) {
    headers['X-AlgoTrader-Signature'] = `sha256=${signPayload(body, hmacSecret)}`;
  }

  await job.updateProgress(30);

  let statusCode = 0;
  let success = false;

  try {
    statusCode = await deliverHttpPost(url, body, headers);
    success = statusCode >= 200 && statusCode < 300;

    if (!success) {
      throw new Error(`Webhook delivery failed with HTTP ${statusCode}`);
    }

    logger.info(`[WebhookWorker] job=${job.id} delivered → HTTP ${statusCode}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[WebhookWorker] job=${job.id} delivery error: ${msg}`);
    // Re-throw so BullMQ retries according to backoff policy
    throw err;
  }

  await job.updateProgress(100);

  const result: WebhookJobResult = {
    tenantId,
    url,
    statusCode,
    success,
    deliveredAt: Date.now(),
  };

  return result;
}

// ─── Worker factory ───────────────────────────────────────────────────────────

export function startWebhookWorker(concurrency = 5): IBullMQWorker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Worker } = require('bullmq');
    const connection = createRedisConnection();

    const worker: IBullMQWorker = new Worker(
      QUEUE_NAMES.WEBHOOK,
      processWebhookJob,
      {
        connection,
        concurrency,
        stalledInterval: 10_000,
        maxStalledCount: 1,
      }
    );

    worker.on('completed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<WebhookJobData>;
      const result = args[1] as WebhookJobResult;
      logger.info(`[WebhookWorker] Completed job=${job.id} status=${result.statusCode}`);
    });

    worker.on('failed', (...args: unknown[]) => {
      const job = args[0] as IWorkerJob<WebhookJobData> | undefined;
      const err = args[1] as Error;
      logger.error(`[WebhookWorker] Failed job=${job?.id}: ${err.message}`);
    });

    logger.info(`[WebhookWorker] Started with concurrency=${concurrency}`);
    return worker;
  } catch (err) {
    logger.warn(
      `[WebhookWorker] Could not start — BullMQ/Redis unavailable: ` +
      `${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * Convenience helper: enqueue a single webhook delivery job.
 * Used by API routes and internal signal emitters.
 */
export async function enqueueWebhook(
  tenantId: string,
  url: string,
  payload: Record<string, unknown>,
  options: { hmacSecret?: string; eventType?: string } = {}
): Promise<{ id?: string } | null> {
  try {
    const { getWebhookQueue } = await import('../bullmq-named-queue-registry-backtest-scan-webhook');
    const queue = getWebhookQueue();
    return await queue.add(`webhook:${tenantId}`, {
      tenantId,
      url,
      payload,
      hmacSecret: options.hmacSecret,
      eventType: options.eventType ?? 'signal',
    });
  } catch (err) {
    logger.warn(`[WebhookWorker] Failed to enqueue: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
