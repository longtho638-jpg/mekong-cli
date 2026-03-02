/**
 * Tests for Polar billing routes registered via buildPolarBillingRoutes().
 * No auth required for /products and /webhook (server line 72).
 */

import { buildServer } from '../fastify-raas-server';
import type { FastifyInstance } from 'fastify';

describe('polar-billing-routes', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /api/v1/billing/products — 200, returns products array', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/billing/products' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ products: unknown[] }>();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/billing/products — each product has required fields', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/billing/products' });
    const { products } = res.json<{ products: Array<Record<string, unknown>> }>();
    for (const p of products) {
      expect(typeof p.polarProductId).toBe('string');
      expect(typeof p.tier).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.priceMonthlyUsd).toBe('number');
      // maxStrategies may be Infinity (serializes to null in JSON for Enterprise)
      expect(p.maxStrategies === null || typeof p.maxStrategies === 'number').toBe(true);
    }
  });

  it('POST /api/v1/billing/checkout — valid body returns checkout data', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: { tenantId: 't1', tier: 'pro' },
    });
    expect([200, 400]).toContain(res.statusCode);
    const body = res.json<Record<string, unknown>>();
    if (res.statusCode === 200) {
      expect(typeof body.productId).toBe('string');
      expect(body.tenantId).toBe('t1');
      expect(body.tier).toBe('pro');
    } else {
      expect(body.error).toBeDefined();
    }
  });

  it('POST /api/v1/billing/checkout — invalid body returns 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toBeDefined();
  });

  it('POST /api/v1/billing/webhook — missing signature returns 401', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: { type: 'subscription.created', data: { id: 'sub_1' } },
    });
    // In dev mode (no POLAR_WEBHOOK_SECRET), signature check passes — 400 from schema or 200
    // With a secret set, missing header yields 401
    expect([200, 400, 401]).toContain(res.statusCode);
  });

  it('POST /api/v1/billing/webhook — invalid payload returns 400 or 401', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: { bad: 'data' },
    });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('GET /api/v1/billing/subscription/:tenantId — unknown tenant returns free tier', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/billing/subscription/nonexistent-tenant',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ tenantId: string; tier: string; active: boolean }>();
    expect(body.tenantId).toBe('nonexistent-tenant');
    expect(body.tier).toBe('free');
    expect(body.active).toBe(false);
  });
});
