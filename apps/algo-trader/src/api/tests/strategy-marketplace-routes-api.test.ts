/**
 * Tests for Fastify strategy marketplace routes — /api/v1/strategies/* endpoints.
 * Uses fastify.inject() to avoid real network I/O.
 */

import { buildServer } from '../fastify-raas-server';
import { StrategyMarketplace } from '../../core/strategy-marketplace';
import type { FastifyInstance } from 'fastify';

describe('strategy-marketplace-routes', () => {
  let server: FastifyInstance;
  let marketplace: StrategyMarketplace;

  beforeEach(async () => {
    marketplace = new StrategyMarketplace();
    server = buildServer({ marketplace, skipAuth: true });
    server.addHook('preHandler', async (req) => {
      (req as typeof req & { authContext: unknown }).authContext = {
        tenantId: 'test-tenant',
        scopes: ['live:monitor'],
        keyId: 'mock:test-tenant',
      };
    });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /api/v1/strategies — 200 returns array', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/strategies' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('GET /api/v1/strategies/stats — 200 returns stats shape', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/strategies/stats' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      totalStrategies: number;
      avgRating: number;
      topPerformers: unknown[];
      byType: Record<string, number>;
    }>();
    expect(typeof body.totalStrategies).toBe('number');
    expect(typeof body.avgRating).toBe('number');
    expect(Array.isArray(body.topPerformers)).toBe(true);
    expect(typeof body.byType).toBe('object');
  });

  it('GET /api/v1/strategies/top — 200 returns array', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/strategies/top' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('GET /api/v1/strategies/top?n=3 — 200 respects n param', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/strategies/top?n=3' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(body.length).toBeLessThanOrEqual(3);
  });

  it('GET /api/v1/strategies/:id — 404 for nonexistent id', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/strategies/nonexistent-id' });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ error: string }>().error).toBe('not_found');
  });

  it('POST /api/v1/strategies/:id/rate — 404 for nonexistent id', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/strategies/nonexistent-id/rate',
      payload: { rating: 4 },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ error: string }>().error).toBe('not_found');
  });

  it('POST /api/v1/strategies/:id/rate — 400 on invalid body', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/strategies/some-id/rate',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');
  });
});
