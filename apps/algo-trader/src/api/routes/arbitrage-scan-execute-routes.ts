/**
 * Fastify route plugin for arbitrage scan and execute endpoints.
 * POST /api/v1/arb/scan  — dry-run spread scan across exchanges for a tenant.
 * POST /api/v1/arb/execute — execute an arbitrage trade (pro/enterprise only).
 * Both routes require JWT auth via Authorization: Bearer <token>.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantStrategyManager } from '../../core/tenant-strategy-manager';
import { TenantArbPositionTracker } from '../../core/tenant-arbitrage-position-tracker';
import {
  ArbScanRequestSchema,
  ArbExecuteRequestSchema,
  type SpreadResult,
  type ArbScanResponse,
  type ArbExecuteResponse,
} from '../schemas/arbitrage-request-response-schemas';
import type { AuthRequest } from '../../auth/tenant-auth-middleware';
import { leverageEnforcementPlugin } from '../middleware/leverage-enforcement-middleware';

/** Simulate spread scan — returns mock spread data for each symbol/exchange pair. */
function simulateScan(
  symbols: string[],
  exchanges: string[],
  minSpreadPct: number
): SpreadResult[] {
  const results: SpreadResult[] = [];
  for (const symbol of symbols) {
    for (let i = 0; i < exchanges.length - 1; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const buyPrice = 30000 + Math.random() * 100;
        const sellPrice = buyPrice * (1 + (Math.random() * 0.004));
        const spreadPct = ((sellPrice - buyPrice) / buyPrice) * 100;
        results.push({
          symbol,
          buyExchange: exchanges[i]!,
          sellExchange: exchanges[j]!,
          buyPrice: parseFloat(buyPrice.toFixed(4)),
          sellPrice: parseFloat(sellPrice.toFixed(4)),
          spreadPct: parseFloat(spreadPct.toFixed(4)),
          profitable: spreadPct >= minSpreadPct,
        });
      }
    }
  }
  return results;
}

export function buildArbScanExecuteRoutes(
  manager: TenantStrategyManager,
  positionTracker: TenantArbPositionTracker
) {
  return async function arbScanExecuteRoutes(fastify: FastifyInstance): Promise<void> {

    // Enforce leverage caps on all trade routes in this scope
    await fastify.register(leverageEnforcementPlugin);

    // POST /api/v1/arb/scan — dry-run spread detection
    fastify.post('/api/v1/arb/scan', async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as FastifyRequest & AuthRequest;
      if (!authReq.authContext) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const parsed = ArbScanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }

      const { symbols, exchanges, minSpreadPct } = parsed.data;
      const spreads = simulateScan(symbols, exchanges, minSpreadPct);
      const profitable = spreads.filter(s => s.profitable);

      const response: ArbScanResponse = {
        scannedAt: Date.now(),
        spreads,
        profitable,
      };
      return reply.status(200).send(response);
    });

    // POST /api/v1/arb/execute — execute arbitrage trade (pro/enterprise only)
    fastify.post('/api/v1/arb/execute', async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as FastifyRequest & AuthRequest;
      if (!authReq.authContext) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { tenantId } = authReq.authContext;

      const tenant = manager.getTenant(tenantId);
      if (!tenant) {
        return reply.status(404).send({ error: 'tenant_not_found' });
      }

      if (tenant.config.tier === 'free') {
        return reply.status(403).send({ error: 'forbidden', message: 'Arbitrage execution requires pro or enterprise tier' });
      }

      const canTrade = manager.canTrade(tenantId);
      if (!canTrade.allowed) {
        return reply.status(403).send({ error: 'trading_blocked', message: canTrade.reason });
      }

      const parsed = ArbExecuteRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
      }

      const { symbol, buyExchange, sellExchange, amount, leverage } = parsed.data;

      // Simulate execution prices (Phase 1 stub — real executor wired in Phase 3)
      const buyPrice = 30000 + Math.random() * 100;
      const sellPrice = buyPrice * (1 + 0.001 + Math.random() * 0.002);
      const netSpreadPct = parseFloat((((sellPrice - buyPrice) / buyPrice) * 100).toFixed(4));

      const position = positionTracker.openPosition(tenantId, tenant.config.tier, {
        symbol,
        buyExchange,
        sellExchange,
        buyPrice: parseFloat(buyPrice.toFixed(4)),
        sellPrice: parseFloat(sellPrice.toFixed(4)),
        amount,
        netSpreadPct,
      });

      if (!position) {
        return reply.status(429).send({ error: 'position_limit_reached', message: 'Open position limit reached for your tier' });
      }

      const response: ArbExecuteResponse = {
        positionId: position.id,
        symbol: position.symbol,
        buyExchange: position.buyExchange,
        sellExchange: position.sellExchange,
        amount: position.amount,
        leverage,
        buyPrice: position.buyPrice,
        sellPrice: position.sellPrice,
        netSpreadPct: position.netSpreadPct,
        status: position.status,
        openedAt: position.openedAt,
      };
      return reply.status(201).send(response);
    });
  };
}
