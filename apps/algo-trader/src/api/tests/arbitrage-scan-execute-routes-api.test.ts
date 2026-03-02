/**
 * Integration tests for arbitrage scan and execute endpoints.
 * POST /api/v1/arb/scan  — spread detection dry-run.
 * POST /api/v1/arb/execute — trade execution with tier enforcement.
 * Uses fastify.inject() — no real network I/O.
 */

import { buildServer } from '../fastify-raas-server';
import { TenantStrategyManager } from '../../core/tenant-strategy-manager';
import { TenantArbPositionTracker } from '../../core/tenant-arbitrage-position-tracker';
import type { FastifyInstance } from 'fastify';

const SCAN_BODY = {
  symbols: ['BTC/USDT'],
  exchanges: ['binance', 'okx'],
  minSpreadPct: 0.05,
};

const EXECUTE_BODY = {
  symbol: 'BTC/USDT',
  buyExchange: 'binance',
  sellExchange: 'okx',
  amount: 0.01,
  maxSlippagePct: 0.1,
};

const PRO_TENANT = {
  id: 'tenant-arb-pro',
  name: 'Pro Arb Tenant',
  maxStrategies: 5,
  maxDailyLossUsd: 5000,
  maxPositionSizeUsd: 1000,
  allowedExchanges: ['binance', 'okx'],
  tier: 'pro' as const,
};

const FREE_TENANT = {
  id: 'tenant-arb-free',
  name: 'Free Arb Tenant',
  maxStrategies: 1,
  maxDailyLossUsd: 100,
  maxPositionSizeUsd: 50,
  allowedExchanges: ['binance'],
  tier: 'free' as const,
};

describe('arbitrage-scan-execute-routes', () => {
  let server: FastifyInstance;
  let manager: TenantStrategyManager;
  let positionTracker: TenantArbPositionTracker;

  beforeEach(async () => {
    manager = new TenantStrategyManager();
    positionTracker = new TenantArbPositionTracker();
    server = buildServer({ manager, positionTracker });
    await server.ready();
    manager.addTenant(PRO_TENANT);
    manager.addTenant(FREE_TENANT);
  });

  afterEach(async () => {
    await server.close();
  });

  // ── /arb/scan ──────────────────────────────────────────────────────────────

  it('POST /api/v1/arb/scan — 401 without auth', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/v1/arb/scan', payload: SCAN_BODY });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/arb/scan — returns spreads with valid body', async () => {
    // Inject authContext directly via preHandler simulation — set header to trigger auth bypass
    // Since auth middleware is not wired in buildServer (no keyStore), we test without auth plugin:
    // Provide fake authContext by using a custom request injection approach.
    // The routes check req.authContext — inject a mock server with authContext pre-set.
    const mockServer = buildServerWithMockAuth(manager, positionTracker, PRO_TENANT.id);
    await mockServer.ready();

    const res = await mockServer.inject({ method: 'POST', url: '/api/v1/arb/scan', payload: SCAN_BODY });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ spreads: unknown[]; profitable: unknown[]; scannedAt: number }>();
    expect(Array.isArray(body.spreads)).toBe(true);
    expect(body.spreads.length).toBeGreaterThan(0);
    expect(Array.isArray(body.profitable)).toBe(true);
    expect(typeof body.scannedAt).toBe('number');

    await mockServer.close();
  });

  it('POST /api/v1/arb/scan — 400 on missing exchanges (less than 2)', async () => {
    const mockServer = buildServerWithMockAuth(manager, positionTracker, PRO_TENANT.id);
    await mockServer.ready();

    const res = await mockServer.inject({
      method: 'POST',
      url: '/api/v1/arb/scan',
      payload: { symbols: ['BTC/USDT'], exchanges: ['binance'], minSpreadPct: 0.05 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');

    await mockServer.close();
  });

  // ── /arb/execute ───────────────────────────────────────────────────────────

  it('POST /api/v1/arb/execute — 401 without auth', async () => {
    const res = await server.inject({ method: 'POST', url: '/api/v1/arb/execute', payload: EXECUTE_BODY });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/arb/execute — 403 for free tier tenant', async () => {
    const mockServer = buildServerWithMockAuth(manager, positionTracker, FREE_TENANT.id);
    await mockServer.ready();

    const res = await mockServer.inject({ method: 'POST', url: '/api/v1/arb/execute', payload: EXECUTE_BODY });
    expect(res.statusCode).toBe(403);
    expect(res.json<{ error: string }>().error).toBe('forbidden');

    await mockServer.close();
  });

  it('POST /api/v1/arb/execute — 201 with positionId for pro tenant', async () => {
    const mockServer = buildServerWithMockAuth(manager, positionTracker, PRO_TENANT.id);
    await mockServer.ready();

    const res = await mockServer.inject({ method: 'POST', url: '/api/v1/arb/execute', payload: EXECUTE_BODY });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ positionId: string; status: string; netSpreadPct: number }>();
    expect(typeof body.positionId).toBe('string');
    expect(body.positionId).toMatch(/^arb_/);
    expect(body.status).toBe('open');
    expect(typeof body.netSpreadPct).toBe('number');

    await mockServer.close();
  });

  it('POST /api/v1/arb/execute — 400 on invalid body (missing symbol)', async () => {
    const mockServer = buildServerWithMockAuth(manager, positionTracker, PRO_TENANT.id);
    await mockServer.ready();

    const res = await mockServer.inject({
      method: 'POST',
      url: '/api/v1/arb/execute',
      payload: { buyExchange: 'binance', sellExchange: 'okx', amount: -1 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');

    await mockServer.close();
  });

  it('POST /api/v1/arb/execute — 404 for unknown tenant', async () => {
    const mockServer = buildServerWithMockAuth(manager, positionTracker, 'ghost-tenant');
    await mockServer.ready();

    const res = await mockServer.inject({ method: 'POST', url: '/api/v1/arb/execute', payload: EXECUTE_BODY });
    expect(res.statusCode).toBe(404);

    await mockServer.close();
  });
});

/** Build a test server that pre-injects authContext for a given tenantId. */
function buildServerWithMockAuth(
  manager: TenantStrategyManager,
  positionTracker: TenantArbPositionTracker,
  tenantId: string
): FastifyInstance {
  const s = buildServer({ manager, positionTracker, skipAuth: true });
  s.addHook('preHandler', async (req) => {
    (req as typeof req & { authContext: { tenantId: string; scopes: string[]; keyId: string } }).authContext = {
      tenantId,
      scopes: ['trade'],
      keyId: `mock:${tenantId}`,
    };
  });
  return s;
}
