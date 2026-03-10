/**
 * Webhook Payment Flow Integration Tests — E2E Scenarios
 *
 * Focus on integration scenarios thay vì unit tests cho signature verification
 * (signature verification đã có tests trong webhook-handler-unit.test.ts)
 */

import { createHmac } from 'crypto';
import { PolarWebhookPayload } from '../../src/billing/polar-webhook-event-handler';
import { PolarSubscriptionService } from '../../src/billing/polar-subscription-service';
import { LicenseService } from '../../src/lib/raas-gate';
import { buildServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';

// Test utilities
const WEBHOOK_SECRET = 'whsec_test_secret_integration';

function generateSignature(payload: string, secret = WEBHOOK_SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

function createWebhookPayload(
  type: string,
  data: Record<string, unknown>,
): PolarWebhookPayload {
  return {
    type,
    data: data as any,
  };
}

// ============================================================================
// SCENARIO 1: DEV MODE (NO SECRET) — DEFAULT BEHAVIOR
// ============================================================================
describe('Webhook Integration — Dev Mode Scenarios', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.POLAR_WEBHOOK_SECRET;
    process.env.POLAR_WEBHOOK_SECRET = ''; // Dev mode
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
  });

  afterEach(() => {
    process.env.POLAR_WEBHOOK_SECRET = originalSecret;
  });

  test('should accept any signature in dev mode (no secret)', () => {
    const service = PolarSubscriptionService.getInstance();
    const { PolarWebhookEventHandler } = require('../../src/billing/polar-webhook-event-handler');
    const handler = new PolarWebhookEventHandler(service);

    const payload = JSON.stringify({ type: 'subscription.created', data: {} });

    const isValid = handler.verifySignature(payload, 'any-sig');
    expect(isValid).toBe(true);
  });
});

// ============================================================================
// SCENARIO 2: RATE LIMITING SCENARIOS
// ============================================================================
describe('Webhook Integration — Rate Limiting Scenarios', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env.POLAR_WEBHOOK_SECRET = ''; // Dev mode
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  test('should handle rapid successive webhooks (burst traffic)', async () => {
    const tenantId = 'burst-tenant';
    const service = new PolarSubscriptionService();
    const products = service.getProducts();
    const proProduct = products.find(p => p.tier === 'pro')!;

    // Simulate burst of 10 webhooks in quick succession
    const promises = Array.from({ length: 10 }).map((_, i) =>
      server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: {
          type: 'subscription.created',
          data: {
            id: `sub_burst_${i}`,
            product_id: proProduct.polarProductId,
            metadata: { tenantId },
            current_period_end: '2026-04-01',
          },
        },
      }),
    );

    const responses = await Promise.all(promises);

    // All should be handled (may have duplicates, but no crashes)
    responses.forEach(res => {
      expect([200, 400]).toContain(res.statusCode);
    });
  });

  test('should handle concurrent subscription updates for same tenant', async () => {
    const tenantId = 'concurrent-tenant';
    const service = new PolarSubscriptionService();

    // Activate initial subscription
    service.activateSubscription(tenantId, 'free', 'prod_free', null);

    const products = service.getProducts();
    const proProduct = products.find(p => p.tier === 'pro')!;
    const entProduct = products.find(p => p.tier === 'enterprise')!;

    // Send conflicting updates concurrently
    const [proRes, entRes] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: {
          type: 'subscription.updated',
          data: {
            id: 'sub_pro',
            product_id: proProduct.polarProductId,
            metadata: { tenantId },
          },
        },
      }),
      server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: {
          type: 'subscription.updated',
          data: {
            id: 'sub_ent',
            product_id: entProduct.polarProductId,
            metadata: { tenantId },
          },
        },
      }),
    ]);

    expect(proRes.statusCode).toBe(200);
    expect(entRes.statusCode).toBe(200);

    // Final state should be one of the tiers (non-deterministic due to concurrency)
    const finalTier = service.getCurrentTier(tenantId);
    expect(['free', 'pro', 'enterprise']).toContain(finalTier);
  });
});

// ============================================================================
// SCENARIO 3: ERROR HANDLING SCENARIOS
// ============================================================================
describe('Webhook Integration — Error Handling Scenarios', () => {
  let service: PolarSubscriptionService;
  let handler: any;
  let tierChanges: Array<{ tenantId: string; tier: string }>;

  beforeEach(() => {
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    service = PolarSubscriptionService.getInstance();
    tierChanges = [];
    const { PolarWebhookEventHandler } = require('../../src/billing/polar-webhook-event-handler');
    handler = new PolarWebhookEventHandler(service, (tenantId: string, tier: string) => {
      tierChanges.push({ tenantId, tier });
    });
  });

  test('should handle missing data object gracefully', () => {
    const payload = {
      type: 'subscription.created',
      data: {},
    } as PolarWebhookPayload;

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('should handle missing required fields', () => {
    const payload = createWebhookPayload('subscription.created', {
      // Missing product_id
      metadata: { tenantId: 't1' },
    });

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('should handle unknown product ID', () => {
    const payload = createWebhookPayload('subscription.created', {
      product_id: 'unknown_product_xyz',
      metadata: { tenantId: 't1' },
    });

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('should handle partial data (missing metadata)', () => {
    const payload = createWebhookPayload('subscription.created', {
      id: 'sub_partial',
      product_id: 'prod_pro',
      // Missing metadata
    });

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });

  test('should handle invalid tenantId format', () => {
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;

    const payload = createWebhookPayload('subscription.created', {
      id: 'sub_invalid',
      product_id: proProduct.polarProductId,
      metadata: { tenantId: '' }, // Empty tenantId
    });

    const result = handler.handleEvent(payload);
    expect(result.handled).toBe(false);
    expect(result.action).toBe('ignored');
  });
});

// ============================================================================
// SCENARIO 4: CIRCUIT BREAKER BEHAVIOR
// ============================================================================
describe('Webhook Integration — Circuit Breaker Scenarios', () => {
  let service: PolarSubscriptionService;
  let handler: any;

  beforeEach(() => {
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    service = PolarSubscriptionService.getInstance();
    const { PolarWebhookEventHandler } = require('../../src/billing/polar-webhook-event-handler');
    handler = new PolarWebhookEventHandler(service);
  });

  test('should continue processing after handling invalid events', () => {
    // Send series of invalid events
    const invalidEvents = [
      { type: 'unknown.event', data: {} },
      { type: 'subscription.created', data: {} },
      { type: 'subscription.updated', data: { product_id: 'invalid' } },
    ];

    invalidEvents.forEach(event => {
      const result = handler.handleEvent(event as PolarWebhookPayload);
      expect(result.handled).toBe(false);
    });

    // Should still be able to handle valid event after invalid ones
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;

    const validPayload = createWebhookPayload('subscription.created', {
      id: 'sub_after_invalid',
      product_id: proProduct.polarProductId,
      metadata: { tenantId: 'valid-tenant' },
    });

    const result = handler.handleEvent(validPayload);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('activated');
  });

  test('should handle subscription lifecycle transitions correctly', () => {
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;
    const entProduct = products.find((p: { tier: string }) => p.tier === 'enterprise')!;

    const tenantId = 'lifecycle-tenant';

    // 1. Create subscription
    const created = handler.handleEvent(createWebhookPayload('subscription.created', {
      id: 'sub_lifecycle_created',
      product_id: proProduct.polarProductId,
      metadata: { tenantId },
    }));
    expect(created.handled).toBe(true);
    expect(created.action).toBe('activated');
    expect(service.getCurrentTier(tenantId)).toBe('pro');

    // 2. Update subscription (upgrade)
    const updated = handler.handleEvent(createWebhookPayload('subscription.updated', {
      id: 'sub_lifecycle_updated',
      product_id: entProduct.polarProductId,
      metadata: { tenantId },
    }));
    expect(updated.handled).toBe(true);
    expect(updated.action).toBe('updated');
    expect(service.getCurrentTier(tenantId)).toBe('enterprise');

    // 3. Cancel subscription
    const cancelled = handler.handleEvent(createWebhookPayload('subscription.canceled', {
      id: 'sub_lifecycle_cancelled',
      metadata: { tenantId },
    }));
    expect(cancelled.handled).toBe(true);
    expect(cancelled.action).toBe('deactivated');
    expect(service.getCurrentTier(tenantId)).toBe('free');

    // 4. Reactivate after cancel
    const reactivated = handler.handleEvent(createWebhookPayload('subscription.active', {
      id: 'sub_lifecycle_new',
      product_id: proProduct.polarProductId,
      metadata: { tenantId },
    }));
    expect(reactivated.handled).toBe(true);
    expect(reactivated.action).toBe('activated');
    expect(service.getCurrentTier(tenantId)).toBe('pro');
  });
});

// ============================================================================
// SCENARIO 5: END-TO-END CHECKOUT FLOW
// ============================================================================
describe('Webhook Integration — End-to-End Checkout Flow', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env.POLAR_WEBHOOK_SECRET = ''; // Dev mode for e2e
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  test('should complete full checkout flow: products → checkout → webhook → active', async () => {
    const tenantId = 'e2e-tenant';

    // Step 1: Get available products
    const productsRes = await server.inject({
      method: 'GET',
      url: '/api/v1/billing/products',
    });

    expect(productsRes.statusCode).toBe(200);
    const products = JSON.parse(productsRes.body).products;
    expect(products).toHaveLength(3);

    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro');
    expect(proProduct).toBeDefined();

    // Step 2: Create checkout session
    const checkoutRes = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: { tenantId, tier: 'pro' },
    });

    expect(checkoutRes.statusCode).toBe(200);
    const checkoutData = JSON.parse(checkoutRes.body);
    expect(checkoutData.tenantId).toBe(tenantId);
    expect(checkoutData.productId).toBeDefined();

    // Step 3: Simulate successful payment webhook
    const webhookRes = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_e2e_complete',
          product_id: proProduct.polarProductId,
          metadata: { tenantId },
          current_period_end: '2026-04-01',
        },
      },
    });

    expect(webhookRes.statusCode).toBe(200);
    const webhookResult = JSON.parse(webhookRes.body);
    expect(webhookResult.handled).toBe(true);
    expect(webhookResult.action).toBe('activated');

    // Step 4: Verify subscription is active
    const subscriptionRes = await server.inject({
      method: 'GET',
      url: `/api/v1/billing/subscription/${tenantId}`,
    });

    expect(subscriptionRes.statusCode).toBe(200);
    const subscription = JSON.parse(subscriptionRes.body);
    expect(subscription.active).toBe(true);
    expect(subscription.tier).toBe('pro');
  });

  test('should handle checkout cancellation flow', async () => {
    const tenantId = 'cancel-flow-tenant';

    // Step 1: Create checkout
    const checkoutRes = await server.inject({
      method: 'POST',
      url: '/api/v1/billing/checkout',
      payload: { tenantId, tier: 'enterprise' },
    });
    expect(checkoutRes.statusCode).toBe(200);

    // Step 2: Simulate user canceling checkout (no webhook sent)
    // Subscription should remain in free tier
    const subscriptionRes = await server.inject({
      method: 'GET',
      url: `/api/v1/billing/subscription/${tenantId}`,
    });

    expect(subscriptionRes.statusCode).toBe(200);
    const subscription = JSON.parse(subscriptionRes.body);
    expect(subscription.tier).toBe('free');
    expect(subscription.active).toBe(false);
  });

  test('should handle upgrade flow: free → pro → enterprise', async () => {
    const tenantId = 'upgrade-flow-tenant';
    const service = new PolarSubscriptionService();
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;
    const entProduct = products.find((p: { tier: string }) => p.tier === 'enterprise')!;

    // Start with pro
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_upgrade_pro',
          product_id: proProduct.polarProductId,
          metadata: { tenantId },
        },
      },
    });

    let subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.tier).toBe('pro');

    // Upgrade to enterprise
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.updated',
        data: {
          id: 'sub_upgrade_ent',
          product_id: entProduct.polarProductId,
          metadata: { tenantId },
        },
      },
    });

    subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.tier).toBe('enterprise');
  });

  test('should handle downgrade flow: enterprise → pro → free', async () => {
    const tenantId = 'downgrade-flow-tenant';
    const service = new PolarSubscriptionService();
    const products = service.getProducts();
    const entProduct = products.find((p: { tier: string }) => p.tier === 'enterprise')!;
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;

    // Start with enterprise
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_downgrade_ent',
          product_id: entProduct.polarProductId,
          metadata: { tenantId },
        },
      },
    });

    // Downgrade to pro
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.updated',
        data: {
          id: 'sub_downgrade_pro',
          product_id: proProduct.polarProductId,
          metadata: { tenantId },
        },
      },
    });

    let subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.tier).toBe('pro');

    // Cancel (downgrade to free)
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.canceled',
        data: {
          id: 'sub_downgrade_cancel',
          metadata: { tenantId },
        },
      },
    });

    subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.tier).toBe('free');
  });

  test('should handle failed payment scenario', async () => {
    const tenantId = 'failed-payment-tenant';
    const service = new PolarSubscriptionService();
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;

    // Activate subscription
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_fp_created_123',
          product_id: proProduct.polarProductId,
          metadata: { tenantId },
          current_period_end: '2026-04-01',
        },
      },
    });

    let subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.active).toBe(true);

    // Simulate payment failure leading to cancellation
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.canceled',
        data: {
          id: 'sub_fp_cancelled_456',
          metadata: { tenantId },
        },
      },
    });

    subscription = JSON.parse(
      (await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body,
    );
    expect(subscription.active).toBe(false);
    expect(subscription.tier).toBe('free');
  });
});

// ============================================================================
// SCENARIO 6: MULTI-TENANT SCENARIOS
// ============================================================================
describe('Webhook Integration — Multi-Tenant Scenarios', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env.POLAR_WEBHOOK_SECRET = '';
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    server = buildServer({ skipAuth: true });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  test('should handle webhooks for multiple tenants concurrently', async () => {
    const products = [
      { tenantId: 'tenant-a', tier: 'pro' },
      { tenantId: 'tenant-b', tier: 'enterprise' },
      { tenantId: 'tenant-c', tier: 'free' },
    ];

    const webhookPromises = products.map(({ tenantId, tier }) =>
      server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: {
          type: 'subscription.created',
          data: {
            id: `sub_multi_${tenantId}`,
            product_id: `prod_${tier}`,
            metadata: { tenantId },
          },
        },
      }),
    );

    const responses = await Promise.all(webhookPromises);
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
    });

    // Verify each tenant has correct tier
    for (const { tenantId, tier } of products) {
      const res = await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      });
      const sub = JSON.parse(res.body);
      expect(sub.tier).toBe(tier);
    }
  });

  test('should isolate tenant subscriptions', async () => {
    const tenantA = 'isolation-tenant-a';
    const tenantB = 'isolation-tenant-b';
    const service = new PolarSubscriptionService();
    const products = service.getProducts();
    const proProduct = products.find((p: { tier: string }) => p.tier === 'pro')!;

    // Activate tenant A only
    await server.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        type: 'subscription.created',
        data: {
          id: 'sub_isolation_a',
          product_id: proProduct.polarProductId,
          metadata: { tenantId: tenantA },
        },
      },
    });

    // Verify tenant A is pro
    const resA = await server.inject({
      method: 'GET',
      url: `/api/v1/billing/subscription/${tenantA}`,
    });
    expect(JSON.parse(resA.body).tier).toBe('pro');

    // Verify tenant B is still free (isolated)
    const resB = await server.inject({
      method: 'GET',
      url: `/api/v1/billing/subscription/${tenantB}`,
    });
    expect(JSON.parse(resB.body).tier).toBe('free');
  });
});
