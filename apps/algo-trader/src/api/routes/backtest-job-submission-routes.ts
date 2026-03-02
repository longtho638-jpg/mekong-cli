/**
 * Fastify backtest job submission routes — /api/v1/backtest/* endpoints.
 * Phase 1 stub: accepts job, returns 202 Accepted with a job ID.
 * Phase 3 will replace the stub body with BullMQ job enqueue logic.
 * Routes: POST /backtest/jobs, GET /backtest/jobs/:jobId
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BacktestJobSchema } from '../schemas/shared-schemas';
import { logger } from '../../utils/logger';

/** In-memory job registry for Phase 1 stub (no Redis required). */
interface JobRecord {
  id: string;
  data: Record<string, unknown>;
  status: 'queued' | 'active' | 'completed' | 'failed';
  progress: number;
  result: unknown;
  failedReason: string | null;
  createdAt: number;
}

const jobRegistry = new Map<string, JobRecord>();
let jobCounter = 0;

/** Exposed for testing — reset state between test runs. */
export function _resetJobRegistry(): void {
  jobRegistry.clear();
  jobCounter = 0;
}

export async function backtestJobRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/backtest/jobs — submit a backtest job (async, queued)
  fastify.post('/api/v1/backtest/jobs', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = BacktestJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
    }

    try {
      const { strategyId, symbol, days, initialBalance } = parsed.data;
      const jobId = `bt_${++jobCounter}_${Date.now()}`;

      const record: JobRecord = {
        id: jobId,
        data: {
          tenantId: 'default',
          strategyName: strategyId,
          pair: symbol,
          timeframe: '1m',
          days,
          initialBalance,
        },
        status: 'queued',
        progress: 0,
        result: null,
        failedReason: null,
        createdAt: Date.now(),
      };

      jobRegistry.set(jobId, record);
      logger.info(`[BacktestRoutes] Enqueued job ${jobId}`);

      return reply.status(202).send({
        jobId,
        status: 'queued',
        message: 'Backtest job accepted. Poll /api/v1/backtest/jobs/:jobId for status.',
      });
    } catch (err) {
      logger.error(`[BacktestRoutes] Failed to enqueue job: ${err instanceof Error ? err.message : String(err)}`);
      return reply.status(500).send({ error: 'internal_error', message: 'Failed to enqueue backtest job' });
    }
  });

  // GET /api/v1/backtest/jobs/:jobId — poll job status
  fastify.get('/api/v1/backtest/jobs/:jobId', async (
    req: FastifyRequest<{ Params: { jobId: string } }>,
    reply: FastifyReply,
  ) => {
    const job = jobRegistry.get(req.params.jobId);

    if (!job) {
      return reply.status(404).send({ error: 'not_found' });
    }

    return reply.status(200).send({
      id: job.id,
      data: job.data,
      progress: job.progress,
      status: job.status,
      result: job.result,
      failedReason: job.failedReason,
    });
  });
}
