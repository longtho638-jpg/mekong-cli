/**
 * Fastify route plugin for arbitrage read endpoints — positions, history, stats.
 * GET /api/v1/arb/positions — open positions for authenticated tenant.
 * GET /api/v1/arb/history  — paginated trade history with optional filters.
 * GET /api/v1/arb/stats    — aggregate P&L stats (win rate, best spread, total trades).
 * All routes require JWT auth via Authorization: Bearer <token>.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantArbPositionTracker } from '../../core/tenant-arbitrage-position-tracker';
import { ArbHistoryQuerySchema } from '../schemas/arbitrage-request-response-schemas';
import type { AuthRequest } from '../../auth/tenant-auth-middleware';

export function buildArbPositionsHistoryRoutes(positionTracker: TenantArbPositionTracker) {
  return async function arbPositionsHistoryRoutes(fastify: FastifyInstance): Promise<void> {

    // GET /api/v1/arb/positions — list open positions for tenant
    fastify.get('/api/v1/arb/positions', async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as FastifyRequest & AuthRequest;
      if (!authReq.authContext) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const positions = positionTracker.getPositions(authReq.authContext.tenantId);
      return reply.status(200).send(positions);
    });

    // GET /api/v1/arb/history — paginated trade history
    fastify.get('/api/v1/arb/history', async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as FastifyRequest & AuthRequest;
      if (!authReq.authContext) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const parsed = ArbHistoryQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }

      const history = positionTracker.getHistory(authReq.authContext.tenantId, parsed.data);
      return reply.status(200).send(history);
    });

    // GET /api/v1/arb/stats — aggregate P&L stats
    fastify.get('/api/v1/arb/stats', async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as FastifyRequest & AuthRequest;
      if (!authReq.authContext) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const stats = positionTracker.getStats(authReq.authContext.tenantId);
      return reply.status(200).send(stats);
    });
  };
}
