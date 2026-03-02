/**
 * Fastify routes for real-time P&L summary and historical snapshot queries.
 * GET /api/v1/tenants/:tenantId/pnl/current  — live P&L computed from open positions + closed trades
 * GET /api/v1/tenants/:tenantId/pnl/history  — paginated snapshot history (from, to, limit)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PnlSnapshotService } from '../../core/pnl-realtime-snapshot-service';
import { requireScope } from '../../auth/tenant-auth-middleware';
import { SCOPES } from '../../auth/scopes';

interface TenantParams {
  tenantId: string;
}

interface HistoryQuery {
  from?: string;
  to?: string;
  limit?: string;
}

export function buildPnlRoutes(pnlService: PnlSnapshotService) {
  return async function pnlRoutes(fastify: FastifyInstance): Promise<void> {
    const adminGuard = requireScope(SCOPES.ADMIN);

    // GET /api/v1/tenants/:tenantId/pnl/current — real-time P&L summary
    fastify.get(
      '/api/v1/tenants/:tenantId/pnl/current',
      { preHandler: [adminGuard] },
      async (
        req: FastifyRequest<{ Params: TenantParams }>,
        reply: FastifyReply,
      ) => {
        const summary = pnlService.getCurrentPnl(req.params.tenantId);
        return reply.status(200).send(summary);
      },
    );

    // GET /api/v1/tenants/:tenantId/pnl/history — snapshot history
    fastify.get(
      '/api/v1/tenants/:tenantId/pnl/history',
      { preHandler: [adminGuard] },
      async (
        req: FastifyRequest<{ Params: TenantParams; Querystring: HistoryQuery }>,
        reply: FastifyReply,
      ) => {
        const { from, to, limit } = req.query;

        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        const parsedLimit = limit ? parseInt(limit, 10) : 100;
        if (limit && isNaN(parsedLimit)) {
          return reply.status(400).send({ error: 'invalid_limit' });
        }
        const limitNum = Math.min(parsedLimit, 500);

        if (fromDate && isNaN(fromDate.getTime())) {
          return reply.status(400).send({ error: 'invalid_from_date' });
        }
        if (toDate && isNaN(toDate.getTime())) {
          return reply.status(400).send({ error: 'invalid_to_date' });
        }

        const snapshots = await pnlService.getSnapshots(req.params.tenantId, {
          from: fromDate,
          to: toDate,
          limit: limitNum,
        });

        return reply.status(200).send({ snapshots, count: snapshots.length });
      },
    );
  };
}
