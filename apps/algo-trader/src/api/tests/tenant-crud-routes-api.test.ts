/**
 * Tests for Fastify tenant CRUD routes — happy paths and validation errors.
 * Uses fastify.inject() to avoid real network I/O.
 */

import { buildServer } from '../fastify-raas-server';
import { TenantStrategyManager } from '../../core/tenant-strategy-manager';
import type { FastifyInstance } from 'fastify';

const BASE_TENANT = {
  id: 'tenant-api-test',
  name: 'API Test Tenant',
  maxStrategies: 5,
  maxDailyLossUsd: 1000,
  maxPositionSizeUsd: 500,
  allowedExchanges: ['binance'],
  tier: 'pro' as const,
};

describe('tenant-crud-routes', () => {
  let server: FastifyInstance;
  let manager: TenantStrategyManager;

  beforeEach(async () => {
    manager = new TenantStrategyManager();
    server = buildServer({ manager, skipAuth: true });
    server.addHook('preHandler', async (req) => {
      (req as typeof req & { authContext: unknown }).authContext = {
        tenantId: 'test-tenant',
        scopes: ['admin'],
        keyId: 'mock:test-tenant',
      };
    });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('POST /api/v1/tenants — creates tenant', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/tenants',
      payload: BASE_TENANT,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ config: { id: string } }>();
    expect(body.config.id).toBe(BASE_TENANT.id);
  });

  it('POST /api/v1/tenants — 400 on invalid body', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/tenants',
      payload: { id: '', tier: 'unknown' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBe('validation_error');
  });

  it('GET /api/v1/tenants — lists tenants', async () => {
    manager.addTenant(BASE_TENANT);
    const res = await server.inject({ method: 'GET', url: '/api/v1/tenants' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ config: { id: string } }>>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some(t => t.config.id === BASE_TENANT.id)).toBe(true);
  });

  it('GET /api/v1/tenants/:id — returns tenant', async () => {
    manager.addTenant(BASE_TENANT);
    const res = await server.inject({ method: 'GET', url: `/api/v1/tenants/${BASE_TENANT.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ config: { id: string } }>().config.id).toBe(BASE_TENANT.id);
  });

  it('GET /api/v1/tenants/:id — 404 for unknown tenant', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/tenants/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/v1/tenants/:id — removes tenant', async () => {
    manager.addTenant(BASE_TENANT);
    const res = await server.inject({ method: 'DELETE', url: `/api/v1/tenants/${BASE_TENANT.id}` });
    expect(res.statusCode).toBe(200);
    expect(manager.getTenant(BASE_TENANT.id)).toBeUndefined();
  });

  it('GET /api/v1/tenants/:id/pnl — 404 for unknown tenant', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/tenants/ghost/pnl' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/tenants/:id/pnl — returns performance for existing tenant', async () => {
    manager.addTenant(BASE_TENANT);
    const res = await server.inject({ method: 'GET', url: `/api/v1/tenants/${BASE_TENANT.id}/pnl` });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ totalPnl: number; activeStrategies: number }>();
    expect(typeof body.totalPnl).toBe('number');
    expect(typeof body.activeStrategies).toBe('number');
  });
});
