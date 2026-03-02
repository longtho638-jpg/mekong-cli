/**
 * Hyperparameter optimization API routes.
 * POST /api/v1/optimization — submit optimization job
 * GET /api/v1/optimization/:jobId — check job status + results
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BacktestOptimizer } from '../../backtest/BacktestOptimizer';
import type { SearchMode } from '../../backtest/BacktestOptimizer';
import { StrategyPerformanceRanker } from '../../backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown';
import { MockDataProvider } from '../../data/MockDataProvider';

const OptimizationRequestSchema = z.object({
  strategyName: z.string().min(1),
  pair: z.string().min(1).default('BTC/USDT'),
  days: z.number().int().positive().max(90).default(30),
  initialBalance: z.number().positive().default(10000),
  paramRanges: z.array(z.object({
    name: z.string(),
    values: z.array(z.number()),
  })).min(1).max(10),
  metric: z.enum(['sharpe', 'sortino', 'composite']).default('composite'),
  searchMode: z.enum(['grid', 'random']).default('grid'),
  maxTrials: z.number().int().positive().default(50),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export interface OptimizationJobResult {
  strategyName: string;
  totalCombinations: number;
  bestParams: Record<string, number>;
  bestScore: number;
  topResults: Array<{
    rank: number;
    params: Record<string, number>;
    compositeScore: number;
    sharpe: number;
    sortino: number;
    maxDrawdown: number;
    winRate: number;
    totalReturn: number;
  }>;
  completedAt: string;
}

// In-memory job store (BullMQ integration deferred — YAGNI until Redis available)
const jobStore = new Map<string, {
  status: 'queued' | 'running' | 'completed' | 'failed';
  request: OptimizationRequest;
  result?: OptimizationJobResult;
  error?: string;
  createdAt: string;
}>();

let jobCounter = 0;

export async function hyperparameterOptimizationRoutes(fastify: FastifyInstance): Promise<void> {

  /** POST /api/v1/optimization — submit optimization job */
  fastify.post('/api/v1/optimization', async (req, reply) => {
    const parsed = OptimizationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const jobId = `opt-${++jobCounter}-${Date.now()}`;
    const job = {
      status: 'queued' as const,
      request: parsed.data,
      createdAt: new Date().toISOString(),
    };
    jobStore.set(jobId, job);

    // Run synchronously in-process (swap for BullMQ when Redis available)
    setImmediate(async () => {
      const entry = jobStore.get(jobId);
      if (!entry) return;

      entry.status = 'running';

      try {
        const dataProvider = new MockDataProvider();
        const optimizer = new BacktestOptimizer(
          dataProvider,
          parsed.data.initialBalance,
          parsed.data.days,
        );

        const results = await optimizer.optimize(
          (params) => {
            // Generic strategy factory — applies params as config overrides
            const { RsiSmaStrategy } = require('../../strategies/RsiSmaStrategy');
            return new RsiSmaStrategy(params);
          },
          parsed.data.paramRanges,
          parsed.data.searchMode as SearchMode,
          parsed.data.maxTrials,
        );

        const ranker = new StrategyPerformanceRanker();
        const ranked = ranker.rank(results);

        entry.status = 'completed';
        entry.result = {
          strategyName: parsed.data.strategyName,
          totalCombinations: results.length,
          bestParams: ranked[0]?.params ?? {},
          bestScore: ranked[0]?.compositeScore ?? 0,
          topResults: ranked.slice(0, 5),
          completedAt: new Date().toISOString(),
        };
      } catch (err) {
        entry.status = 'failed';
        entry.error = err instanceof Error ? err.message : String(err);
      }
    });

    return reply.status(202).send({ jobId, status: 'queued' });
  });

  /** GET /api/v1/optimization/:jobId — check job status */
  fastify.get<{ Params: { jobId: string } }>(
    '/api/v1/optimization/:jobId',
    async (req, reply) => {
      const { jobId } = req.params;
      const job = jobStore.get(jobId);

      if (!job) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      return reply.status(200).send({
        jobId,
        status: job.status,
        ...(job.result ? { result: job.result } : {}),
        ...(job.error ? { error: job.error } : {}),
        createdAt: job.createdAt,
      });
    },
  );
}
