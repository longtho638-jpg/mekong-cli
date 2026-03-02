/**
 * Fastify tenant CRUD routes — /api/v1/tenants/* endpoints.
 * Delegates all business logic to TenantStrategyManager.
 * Routes: POST /tenants, GET /tenants, GET /tenants/:id,
 *         POST /tenants/:id/strategies, DELETE /tenants/:id/strategies/:strategyId,
 *         GET /tenants/:id/pnl, DELETE /tenants/:id
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantStrategyManager } from '../../core/tenant-strategy-manager';
import { CreateTenantSchema, AssignStrategySchema } from '../schemas/shared-schemas';
import { requireScope } from '../../auth/tenant-auth-middleware';
import { SCOPES } from '../../auth/scopes';

export function buildTenantRoutes(manager: TenantStrategyManager) {
  return async function tenantRoutes(fastify: FastifyInstance): Promise<void> {

    // All tenant routes require ADMIN scope
    const adminGuard = requireScope(SCOPES.ADMIN);

    // POST /api/v1/tenants — create tenant
    fastify.post('/api/v1/tenants', { preHandler: [adminGuard] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }
      manager.addTenant(parsed.data);
      return reply.status(201).send(manager.getTenant(parsed.data.id));
    });

    // GET /api/v1/tenants — list all tenants
    fastify.get('/api/v1/tenants', { preHandler: [adminGuard] }, async (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send(manager.listTenants());
    });

    // GET /api/v1/tenants/:id — get single tenant
    fastify.get('/api/v1/tenants/:id', { preHandler: [adminGuard] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const tenant = manager.getTenant(req.params.id);
      if (!tenant) return reply.status(404).send({ error: 'not_found' });
      return reply.status(200).send(tenant);
    });

    // DELETE /api/v1/tenants/:id — remove tenant
    fastify.delete('/api/v1/tenants/:id', { preHandler: [adminGuard] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const removed = manager.removeTenant(req.params.id);
      if (!removed) return reply.status(404).send({ error: 'not_found' });
      return reply.status(200).send({ removed: req.params.id });
    });

    // POST /api/v1/tenants/:id/strategies — assign strategy to tenant
    fastify.post('/api/v1/tenants/:id/strategies', { preHandler: [adminGuard] }, async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const tenant = manager.getTenant(req.params.id);
      if (!tenant) return reply.status(404).send({ error: 'not_found' });

      const parsed = AssignStrategySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }

      const { strategyId, strategyName, accountName, configOverrides } = parsed.data;
      const ok = manager.startStrategy(
        req.params.id,
        strategyId,
        strategyName,
        accountName,
        configOverrides as Record<string, unknown> | undefined,
      );
      if (!ok) return reply.status(400).send({ error: 'strategy_start_failed' });
      return reply.status(201).send(manager.getTenant(req.params.id));
    });

    // DELETE /api/v1/tenants/:id/strategies/:strategyId — stop strategy
    fastify.delete('/api/v1/tenants/:id/strategies/:strategyId', { preHandler: [adminGuard] }, async (
      req: FastifyRequest<{ Params: { id: string; strategyId: string } }>,
      reply: FastifyReply,
    ) => {
      const tenant = manager.getTenant(req.params.id);
      if (!tenant) return reply.status(404).send({ error: 'not_found' });

      const ok = manager.stopStrategy(req.params.id, req.params.strategyId);
      if (!ok) return reply.status(404).send({ error: 'strategy_not_found' });
      return reply.status(200).send({ stopped: req.params.strategyId });
    });

    // GET /api/v1/tenants/:id/pnl — performance summary
    fastify.get('/api/v1/tenants/:id/pnl', { preHandler: [adminGuard] }, async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const perf = manager.getPerformance(req.params.id);
      if (!perf) return reply.status(404).send({ error: 'not_found' });
      return reply.status(200).send(perf);
    });
  };
}
