/**
 * Tests for Polar.sh billing — subscription service, webhook handler, API routes.
 * No mocks — uses real in-memory instances.
 */

import { PolarSubscriptionService } from '../../src/billing/polar-subscription-service';
import { PolarWebhookEventHandler, PolarWebhookPayload } from '../../src/billing/polar-webhook-event-handler';
import { buildServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';

// ── PolarSubscriptionService ──

describe('PolarSubscriptionService', () => {
  let service: PolarSubscriptionService;

  beforeEach(() => {
    service = new PolarSubscriptionService();
  });

  test('getProducts returns 3 tiers', () => {
    const products = service.getProducts();
    expect(products).toHaveLength(3);
    expect(products.map(p => p.tier)).toEqual(['free', 'pro', 'enterprise']);
  });

  test('getProductByTier returns correct product', () => {
    const pro = service.getProductByTier('pro');
    expect(pro?.tier).toBe('pro');
    expect(pro?.maxStrategies).toBe(5);
    expect(pro?.priceMonthlyUsd).toBe(49);
  });

  test('getTierByProductId maps product to tier', () => {
    const products = service.getProducts();
    const proProduct = products.find(p => p.tier === 'pro')!;
    expect(service.getTierByProductId(proProduct.polarProductId)).toBe('pro');
  });

  test('getTierByProductId returns undefined for unknown', () => {
    expect(service.getTierByProductId('unknown_product')).toBeUndefined();
  });

  test('getTierLimits returns limits for tier', () => {
    const limits = service.getTierLimits('enterprise');
    expect(limits?.maxStrategies).toBe(Infinity);
    expect(limits?.maxDailyLossUsd).toBe(5000);
  });

  test('generateCheckoutData returns structured data', () => {
    const data = service.generateCheckoutData({
      tenantId: 'tenant-1',
      tier: 'pro',
    });
    expect(data.tenantId).toBe('tenant-1');
    expect(data.tier).toBe('pro');
    expect(data.successUrl).toContain('/billing/success');
    expect(data.cancelUrl).toContain('/billing/cancel');
  });

  test('generateCheckoutData throws for unknown tier', () => {
    expect(() => service.generateCheckoutData({
      tenantId: 't1',
      tier: 'unknown' as any,
    })).toThrow();
  });

  test('activateSubscription + getSubscription', () => {
    service.activateSubscription('t1', 'pro', 'prod_pro', '2026-04-01');
    const sub = service.getSubscription('t1');
    expect(sub?.active).toBe(true);
    expect(sub?.tier).toBe('pro');
    expect(sub?.currentPeriodEnd).toBe('2026-04-01');
  });

  test('deactivateSubscription sets tier to free', () => {
    service.activateSubscription('t1', 'pro', 'prod_pro', null);
    service.deactivateSubscription('t1');
    const sub = service.getSubscription('t1');
    expect(sub?.active).toBe(false);
    expect(sub?.tier).toBe('free');
  });

  test('isActive returns correct state', () => {
    expect(service.isActive('t1')).toBe(false);
    service.activateSubscription('t1', 'pro', 'prod_pro', null);
    expect(service.isActive('t1')).toBe(true);
  });

  test('getCurrentTier defaults to free', () => {
    expect(service.getCurrentTier('unknown')).toBe('free');
  });
});

// ── PolarWebhookEventHandler ──

describe('PolarWebhookEventHandler', () => {
  let service: PolarSubscriptionService;
  let handler: PolarWebhookEventHandler;
  let tierChanges: Array<{ tenantId: string; tier: string }>;

  beforeEach(() => {
    service = new PolarSubscriptionService();
    tierChanges = [];
    handler = new PolarWebhookEventHandler(service, (tenantId, tier) => {
      tierChanges.push({ tenantId, tier });
    });
  });

  test('verifySignature returns true in dev mode (no secret)', () => {
    expect(handler.verifySignature('payload', 'sig')).toBe(true);
  });

  test('handles subscription.created event', () => {
    const products = service.getProducts();
    const proProduct = products.find(p => p.tier === 'pro')!;

    const payload: PolarWebhookPayload = {
      type: 'subscription.created',
      data: {
        id: 'sub_unique_' + Date.now(),
        status: 'active',
        product_id: proProduct.polarProductId,
        metadata: { tenantId: 'tenant-abc' },
        current_period_end: '2026-04-01',
      },
    };

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('activated');
    expect(result.tier).toBe('pro');
    expect(result.tenantId).toBe('tenant-abc');
    expect(tierChanges).toHaveLength(1);
    expect(service.isActive('tenant-abc')).toBe(true);
  });

  test('handles subscription.canceled event', () => {
    service.activateSubscription('tenant-abc', 'pro', 'prod_pro', null);

    const result = handler.handleEvent({
      type: 'subscription.canceled',
      data: { id: 'sub_unique_' + Date.now(), metadata: { tenantId: 'tenant-abc' } },
    });

    expect(result.handled).toBe(true);
    expect(result.action).toBe('deactivated');
    expect(result.tier).toBe('free');
    expect(service.isActive('tenant-abc')).toBe(false);
  });

  test('ignores unknown event types', () => {
    const result = handler.handleEvent({
      type: 'order.created',
      data: { id: 'ord_unique_' + Date.now() },
    });
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('ignores events without tenantId in metadata', () => {
    const result = handler.handleEvent({
      type: 'subscription.created',
      data: { id: 'sub_unique_' + Date.now(), product_id: 'prod_pro' },
    });
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('handles subscription.updated (tier upgrade)', () => {
    const products = service.getProducts();
    const entProduct = products.find(p => p.tier === 'enterprise')!;

    service.activateSubscription('t1', 'pro', 'prod_pro', null);

    const result = handler.handleEvent({
      type: 'subscription.updated',
      data: {
        id: 'sub_unique_' + Date.now(),
        product_id: entProduct.polarProductId,
        metadata: { tenantId: 't1' },
        current_period_end: '2026-05-01',
      },
    });

    expect(result.handled).toBe(true);
    expect(result.action).toBe('updated');
    expect(result.tier).toBe('enterprise');
    expect(service.getCurrentTier('t1')).toBe('enterprise');
  });
});

// ── Billing API Routes E2E ──

describe('Polar Billing API Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  test('GET /api/v1/billing/products returns 3 tiers', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/billing/products' });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.products).toHaveLength(3);
    expect(body.products.map((p: { tier: string }) => p.tier)).toEqual(['free', 'pro', 'enterprise']);
  });

  test('POST /api/v1/billing/checkout returns checkout data', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: { tenantId: 'test-tenant', tier: 'pro' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tenantId).toBe('test-tenant');
    expect(body.tier).toBe('pro');
    expect(body.productId).toBeDefined();
  });

  test('POST /api/v1/billing/checkout rejects invalid tier', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: { tenantId: 'test', tier: 'mega' },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/v1/billing/webhook processes subscription event', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_webhook_test',
          product_id: 'prod_pro',
          metadata: { tenantId: 'webhook-tenant' },
          current_period_end: '2026-04-01',
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.handled).toBe(true);
    expect(body.action).toBe('activated');
  });

  test('GET /api/v1/billing/subscription/:tenantId returns free for unknown', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/billing/subscription/unknown-tenant',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tier).toBe('free');
    expect(body.active).toBe(false);
  });
});
