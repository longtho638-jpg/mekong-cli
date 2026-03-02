/**
 * Fastify strategy marketplace routes — /api/v1/strategies/* endpoints.
 * Delegates to StrategyMarketplace for search, stats, ratings, top performers.
 * Routes: GET /strategies, GET /strategies/stats, GET /strategies/top,
 *         GET /strategies/:id, POST /strategies/:id/rate
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StrategyMarketplace } from '../../core/strategy-marketplace';
import { MarketplaceSearchSchema, RateStrategySchema } from '../schemas/shared-schemas';
import { requireScope } from '../../auth/tenant-auth-middleware';
import { SCOPES } from '../../auth/scopes';

export function buildStrategyRoutes(marketplace: StrategyMarketplace) {
  return async function strategyRoutes(fastify: FastifyInstance): Promise<void> {

    const monitorGuard = requireScope(SCOPES.LIVE_MONITOR);

    // GET /api/v1/strategies?type=&minRating=&tag=&pair= — search
    fastify.get('/api/v1/strategies', { preHandler: [monitorGuard] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = MarketplaceSearchSchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }
      const { type, minRating, tag, pair } = parsed.data;
      const results = marketplace.search({
        type,
        minRating,
        tags: tag ? [tag] : undefined,
        pair,
      });
      return reply.status(200).send(results);
    });

    // GET /api/v1/strategies/stats — marketplace-wide statistics
    fastify.get('/api/v1/strategies/stats', { preHandler: [monitorGuard] }, async (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send(marketplace.getStats());
    });

    // GET /api/v1/strategies/top — top performers by Sharpe
    fastify.get('/api/v1/strategies/top', { preHandler: [monitorGuard] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const n = Math.min(Number((req.query as Record<string, string>).n ?? 5), 20);
      return reply.status(200).send(marketplace.getTopPerformers(n));
    });

    // GET /api/v1/strategies/:id — single strategy entry
    fastify.get('/api/v1/strategies/:id', { preHandler: [monitorGuard] }, async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const entry = marketplace.get(req.params.id);
      if (!entry) return reply.status(404).send({ error: 'not_found' });
      return reply.status(200).send(entry);
    });

    // POST /api/v1/strategies/:id/rate — submit rating (1-5)
    fastify.post('/api/v1/strategies/:id/rate', { preHandler: [monitorGuard] }, async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const parsed = RateStrategySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }
      const entry = marketplace.get(req.params.id);
      if (!entry) return reply.status(404).send({ error: 'not_found' });
      marketplace.rate(req.params.id, parsed.data.rating);
      return reply.status(200).send(marketplace.get(req.params.id));
    });
  };
}
