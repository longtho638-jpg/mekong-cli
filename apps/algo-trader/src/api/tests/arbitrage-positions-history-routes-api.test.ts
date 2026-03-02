/**
 * Integration tests for arbitrage read endpoints — positions, history, stats.
 * GET /api/v1/arb/positions — open positions for authenticated tenant.
 * GET /api/v1/arb/history  — paginated trade history.
 * GET /api/v1/arb/stats    — aggregate P&L stats.
 * Uses fastify.inject() — no real network I/O.
 */

import { buildServer } from '../fastify-raas-server';
import { TenantStrategyManager } from '../../core/tenant-strategy-manager';
import { TenantArbPositionTracker } from '../../core/tenant-arbitrage-position-tracker';
import type { FastifyInstance } from 'fastify';

const PRO_TENANT = {
  id: 'tenant-hist-pro',
  name: 'History Test Tenant',
  maxStrategies: 5,
  maxDailyLossUsd: 5000,
  maxPositionSizeUsd: 1000,
  allowedExchanges: ['binance', 'okx'],
  tier: 'pro' as const,
};

describe('arbitrage-positions-history-routes', () => {
  let server: FastifyInstance;
  let manager: TenantStrategyManager;
  let positionTracker: TenantArbPositionTracker;

  beforeEach(async () => {
    manager = new TenantStrategyManager();
    positionTracker = new TenantArbPositionTracker();
    manager.addTenant(PRO_TENANT);
    server = buildServerWithMockAuth(
      buildServer({ manager, positionTracker, skipAuth: true }),
      PRO_TENANT.id
    );
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  // ── /arb/positions ─────────────────────────────────────────────────────────

  it('GET /api/v1/arb/positions — returns empty array initially', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/positions' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('GET /api/v1/arb/positions — returns open positions after execute', async () => {
    positionTracker.openPosition(PRO_TENANT.id, 'pro', {
      symbol: 'BTC/USDT',
      buyExchange: 'binance',
      sellExchange: 'okx',
      buyPrice: 30000,
      sellPrice: 30050,
      amount: 0.01,
      netSpreadPct: 0.166,
    });

    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/positions' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ symbol: string; status: string }>>();
    expect(body.length).toBe(1);
    expect(body[0]?.symbol).toBe('BTC/USDT');
    expect(body[0]?.status).toBe('open');
  });

  it('GET /api/v1/arb/positions — 401 without auth context', async () => {
    const noAuthServer = buildServer({ manager, positionTracker });
    await noAuthServer.ready();
    const res = await noAuthServer.inject({ method: 'GET', url: '/api/v1/arb/positions' });
    expect(res.statusCode).toBe(401);
    await noAuthServer.close();
  });

  // ── /arb/history ───────────────────────────────────────────────────────────

  it('GET /api/v1/arb/history — returns empty paginated result initially', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: unknown[]; total: number; page: number; limit: number }>();
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('GET /api/v1/arb/history — filters by symbol query param', async () => {
    const pos = positionTracker.openPosition(PRO_TENANT.id, 'pro', {
      symbol: 'ETH/USDT',
      buyExchange: 'binance',
      sellExchange: 'okx',
      buyPrice: 2000,
      sellPrice: 2005,
      amount: 0.1,
      netSpreadPct: 0.25,
    });
    positionTracker.openPosition(PRO_TENANT.id, 'pro', {
      symbol: 'SOL/USDT',
      buyExchange: 'binance',
      sellExchange: 'bybit',
      buyPrice: 100,
      sellPrice: 100.2,
      amount: 1,
      netSpreadPct: 0.2,
    });
    if (pos) positionTracker.closePosition(PRO_TENANT.id, pos.id);

    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/history?symbol=ETH%2FUSDT' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: Array<{ symbol: string }>; total: number }>();
    expect(body.items.every(i => i.symbol === 'ETH/USDT')).toBe(true);
  });

  it('GET /api/v1/arb/history — respects page and limit params', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/history?page=2&limit=5' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ page: number; limit: number }>();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(5);
  });

  it('GET /api/v1/arb/history — 400 on invalid limit (> 100)', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/history?limit=999' });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');
  });

  // ── /arb/stats ─────────────────────────────────────────────────────────────

  it('GET /api/v1/arb/stats — returns zero stats initially', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ totalPnl: number; totalTrades: number; winRate: number }>();
    expect(body.totalPnl).toBe(0);
    expect(body.totalTrades).toBe(0);
    expect(body.winRate).toBe(0);
  });

  it('GET /api/v1/arb/stats — reflects closed positions in stats', async () => {
    const pos = positionTracker.openPosition(PRO_TENANT.id, 'pro', {
      symbol: 'BTC/USDT',
      buyExchange: 'binance',
      sellExchange: 'okx',
      buyPrice: 30000,
      sellPrice: 30060,
      amount: 0.01,
      netSpreadPct: 0.2,
    });
    if (pos) positionTracker.closePosition(PRO_TENANT.id, pos.id, 0.6);

    const res = await server.inject({ method: 'GET', url: '/api/v1/arb/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ totalTrades: number; winRate: number; totalPnl: number }>();
    expect(body.totalTrades).toBe(1);
    expect(body.winRate).toBe(1);
    expect(body.totalPnl).toBe(0.6);
  });
});

/** Attach a preHandler hook that injects authContext for given tenantId. */
function buildServerWithMockAuth(server: FastifyInstance, tenantId: string): FastifyInstance {
  server.addHook('preHandler', async (req) => {
    (req as typeof req & { authContext: { tenantId: string; scopes: string[]; keyId: string } }).authContext = {
      tenantId,
      scopes: ['read'],
      keyId: `mock:${tenantId}`,
    };
  });
  return server;
}
