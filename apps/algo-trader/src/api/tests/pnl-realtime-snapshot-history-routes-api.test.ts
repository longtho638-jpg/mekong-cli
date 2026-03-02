/**
 * Integration tests for P&L real-time summary and historical snapshot Fastify routes.
 * Uses fastify.inject() and InMemoryPnlStore — no DB or network required.
 */

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { TenantArbPositionTracker } from '../../core/tenant-arbitrage-position-tracker';
import { PnlSnapshotService, InMemoryPnlStore } from '../../core/pnl-realtime-snapshot-service';
import { buildPnlRoutes } from '../routes/pnl-realtime-snapshot-history-routes';

const TENANT = 'tenant-route-test';

function buildTestServer(): { server: FastifyInstance; service: PnlSnapshotService } {
  const tracker = new TenantArbPositionTracker();
  // Open position: pnl = (102-100)*3 = 6
  tracker.openPosition(TENANT, 'pro', {
    symbol: 'BTC/USDT',
    buyExchange: 'binance',
    sellExchange: 'kraken',
    buyPrice: 100,
    sellPrice: 102,
    amount: 3,
    netSpreadPct: 2,
  });

  const store = new InMemoryPnlStore();
  const service = new PnlSnapshotService(tracker, store, 10_000);

  const server = Fastify({ logger: false });
  server.addHook('preHandler', async (req) => {
    (req as typeof req & { authContext: unknown }).authContext = {
      tenantId: TENANT,
      scopes: ['admin'],
      keyId: 'mock:test',
    };
  });
  void server.register(buildPnlRoutes(service));
  return { server, service };
}

describe('pnl-realtime-snapshot-history-routes', () => {
  let server: FastifyInstance;
  let service: PnlSnapshotService;

  beforeEach(async () => {
    ({ server, service } = buildTestServer());
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /api/v1/tenants/:tenantId/pnl/current — returns live P&L summary', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/tenants/${TENANT}/pnl/current`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      tenantId: string;
      totalPnl: number;
      realizedPnl: number;
      unrealizedPnl: number;
      openPositions: number;
      equity: number;
      computedAt: string;
    }>();
    expect(body.tenantId).toBe(TENANT);
    expect(body.unrealizedPnl).toBeCloseTo(6);
    expect(body.openPositions).toBe(1);
    expect(body.equity).toBeCloseTo(10_006);
    expect(typeof body.computedAt).toBe('string');
  });

  it('GET /api/v1/tenants/:tenantId/pnl/history — returns empty list when no snapshots', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/tenants/${TENANT}/pnl/history`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ snapshots: unknown[]; count: number }>();
    expect(body.snapshots).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  it('GET /api/v1/tenants/:tenantId/pnl/history — returns snapshots after takeSnapshot', async () => {
    await service.takeSnapshot(TENANT);
    await service.takeSnapshot(TENANT);

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/tenants/${TENANT}/pnl/history?limit=10`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ snapshots: Array<{ tenantId: string; totalPnl: number }>; count: number }>();
    expect(body.count).toBe(2);
    expect(body.snapshots[0].tenantId).toBe(TENANT);
    expect(body.snapshots[0].totalPnl).toBeCloseTo(6);
  });

  it('GET /api/v1/tenants/:tenantId/pnl/history — 400 on invalid from date', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/tenants/${TENANT}/pnl/history?from=not-a-date`,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('invalid_from_date');
  });

  it('GET /api/v1/tenants/:tenantId/pnl/history — filters by date range', async () => {
    await service.takeSnapshot(TENANT);
    const futureFrom = new Date(Date.now() + 60_000).toISOString();

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/tenants/${TENANT}/pnl/history?from=${encodeURIComponent(futureFrom)}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ count: number }>().count).toBe(0);
  });
});
