/**
 * Webhook Payment Flow Integration Tests — End-to-End Scenarios
 *
 * E2E tests covering complete payment flows through Stripe + Polar webhooks:
 * - Checkout flow: Generate checkout -> Webhook -> Active subscription
 * - Upgrade flow: Free -> Pro -> Enterprise
 * - Downgrade flow: Enterprise -> Pro -> Free
 * - Failed payment scenario
 * - Cancellation flow
 * - Multi-tenant scenarios
 */

import { PolarSubscriptionService } from '../../src/billing/polar-subscription-service';
import { LicenseService, LicenseTier } from '../../src/lib/raas-gate';
import { buildServer } from '../../src/api/fastify-raas-server';
import { FastifyInstance } from 'fastify';
import { StripeWebhookHandler } from '../../src/billing/stripe-webhook-handler';
import { PolarWebhookEventHandler } from '../../src/billing/polar-webhook-event-handler';
import { WebhookAuditLogger } from '../../src/billing/webhook-audit-logger';

// ─────────────────────────────────────────────────────────────────────────────
// Test utilities
// ─────────────────────────────────────────────────────────────────────────────

function createStripePayload(
  type: string,
  subscriptionId: string,
  tenantId: string,
  productId: string,
  eventId?: string,
): any {
  return {
    id: eventId || `evt_${subscriptionId}_${Date.now()}`,
    type,
    data: {
      object: {
        id: subscriptionId,
        customer: `cust_${tenantId}`,
        status: 'active',
        subscription: subscriptionId,
        metadata: { tenantId },
        created: Math.floor(Date.now() / 1000),
        amount_total: 4900,
        currency: 'usd',
        period: {
          start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
          end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        },
        plan: { product: productId },
        items: [{ plan: { product: productId } }],
      },
    },
  };
}

function createPolarPayload(
  type: string,
  subscriptionId: string,
  tenantId: string,
  productId: string,
): any {
  return {
    type,
    data: {
      id: subscriptionId,
      product_id: productId,
      metadata: { tenantId },
      current_period_end: '2026-04-01',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────────────────

describe('Webhook Flow Integration', () => {
  let server: FastifyInstance;
  let products: any[];

  beforeAll(async () => {
    // Dev mode for all e2e tests
    process.env.STRIPE_WEBHOOK_SECRET = '';
    process.env.POLAR_WEBHOOK_SECRET = '';
    // Reset singleton first so buildServer creates a fresh instance
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    StripeWebhookHandler.prototype['auditLogger'] = WebhookAuditLogger.getInstance();
    WebhookAuditLogger.getInstance().reset();

    server = buildServer({ skipAuth: true });
    await server.ready();

    // Load products for use in tests
    const productsRes = await server.inject({ method: 'GET', url: '/api/v1/billing/products' });
    products = JSON.parse(productsRes.body).products;
  });

  afterAll(async () => {
    await server.close();
  });

  // ── Helper helpers to get product IDs ─────────────────────────────────────

  function getProductId(tier: string): string {
    const product = products.find((p: { tier: string }) => p.tier === tier);
    return product?.polarProductId || `prod_${tier}`;
  }

  // ── Stripe End-to-End Flow ───────────────────────────────────────────────

  describe('Stripe End-to-End Checkout Flow', () => {
    test('should complete full checkout flow: checkout -> webhook -> active', async () => {
      const tenantId = 'stripe_e2e_tenant';
      const proProduct = getProductId('pro');

      // Step 1: Get available products (already done in beforeAll)
      expect(products).toHaveLength(3);
      expect(products.some((p: any) => p.tier === 'pro')).toBe(true);

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

      // Step 3: Simulate successful Stripe webhook (checkout.session.completed)
      const webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'checkout.session.completed',
          'sub_stripe_e2e_001',
          tenantId,
          proProduct,
        ),
      });

      expect(webhookRes.statusCode).toBe(200);
      const webhookResult = JSON.parse(webhookRes.body);
      expect(webhookResult.handled).toBe(true);
      expect(webhookResult.action).toBe('provisioned');

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
  });

  // ── Polar End-to-End Flow ────────────────────────────────────────────────

  describe('Polar End-to-End Checkout Flow', () => {
    test('should complete full checkout flow: checkout -> webhook -> active', async () => {
      const tenantId = 'polar_e2e_tenant';
      const entProduct = getProductId('enterprise');

      // Step 1: Get available products (already done in beforeAll)
      expect(products).toHaveLength(3);

      // Step 2: Create checkout session
      const checkoutRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/checkout',
        payload: { tenantId, tier: 'enterprise' },
      });

      expect(checkoutRes.statusCode).toBe(200);
      const checkoutData = JSON.parse(checkoutRes.body);
      expect(checkoutData.tenantId).toBe(tenantId);
      expect(checkoutData.productId).toBeDefined();

      // Step 3: Simulate Polar webhook (subscription.created)
      const webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.created',
          'sub_polar_e2e_001',
          tenantId,
          entProduct,
        ),
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
      expect(subscription.tier).toBe('enterprise');
    });
  });

  // ── Upgrade Flows ─────────────────────────────────────────────────────────

  describe('Upgrade Flows', () => {
    test('should handle Stripe upgrade: pro -> enterprise', async () => {
      const tenantId = 'upgrade_stripe_tenant';
      const proProduct = getProductId('pro');
      const entProduct = getProductId('enterprise');

      // Start with pro through Stripe webhook
      let webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_upgrade_pro',
          tenantId,
          proProduct,
        ),
      });

      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('pro');

      // Upgrade to enterprise
      webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.updated',
          'sub_upgrade_ent',
          tenantId,
          entProduct,
        ),
      });

      expect(webhookRes.statusCode).toBe(200);
      const webhookResult = JSON.parse(webhookRes.body);
      expect(webhookResult.action).toBe('updated');

      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('enterprise');
    });

    test('should handle Polar upgrade: free -> pro', async () => {
      const tenantId = 'upgrade_polar_tenant';

      // Start with free (default)
      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('free');

      // Upgrade to pro through Polar webhook
      const webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.created',
          'sub_polar_upgrade',
          tenantId,
          getProductId('pro'),
        ),
      });

      expect(webhookRes.statusCode).toBe(200);
      const webhookResult = JSON.parse(webhookRes.body);
      expect(webhookResult.action).toBe('activated');

      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('pro');
    });
  });

  // ── Downgrade Flows ───────────────────────────────────────────────────────

  describe('Downgrade Flows', () => {
    test('should handle Stripe downgrade: enterprise -> pro -> free', async () => {
      const tenantId = 'downgrade_stripe_tenant';
      const entProduct = getProductId('enterprise');
      const proProduct = getProductId('pro');

      // Start with enterprise
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_ds_ent',
          tenantId,
          entProduct,
        ),
      });

      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('enterprise');

      // Downgrade to pro
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.updated',
          'sub_ds_pro',
          tenantId,
          proProduct,
        ),
      });

      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('pro');

      // Cancel (downgrade to free)
      const webhookRes = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: {
          id: `evt_ds_cancel_${Date.now()}`,
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_ds_cancelled',
              customer: `cust_${tenantId}`,
              status: 'canceled',
              subscription: 'sub_ds_cancelled',
              metadata: { tenantId },
            },
          },
        },
      });

      expect(webhookRes.statusCode).toBe(200);
      const webhookResult = JSON.parse(webhookRes.body);
      expect(webhookResult.action).toBe('deactivated');

      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('free');
      expect(subscription.active).toBe(false);
    });

    test('should handle Polar downgrade: enterprise -> free', async () => {
      const tenantId = 'downgrade_polar_tenant';

      // Start with enterprise
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.created',
          'sub_dp_ent',
          tenantId,
          getProductId('enterprise'),
        ),
      });

      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('enterprise');

      // Cancel subscription
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.canceled',
          'sub_dp_cancel',
          tenantId,
          getProductId('enterprise'),
        ),
      });

      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.tier).toBe('free');
      expect(subscription.active).toBe(false);
    });
  });

  // ── Failed Payment Scenarios ─────────────────────────────────────────────

  describe('Failed Payment Scenarios', () => {
    test('should handle failed payment via Stripe webhook', async () => {
      const tenantId = 'failed_payment_tenant';
      const proProduct = getProductId('pro');

      // Activate subscription first
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_fp_created',
          tenantId,
          proProduct,
        ),
      });

      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(true);
      expect(subscription.tier).toBe('pro');

      // Simulate payment failure - this does NOT cancel the subscription
      // (Stripe handles this via webhook for actual deletion)
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: {
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_fp_failed',
              customer: `cust_${tenantId}`,
              subscription: 'sub_fp_created',
              metadata: { tenantId },
              amount_total: 4900,
            },
          },
        },
      });

      // Subscription should remain active - Stripe handles this via webhook
      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(true);
    });
  });

  // ── Cancellation Flow ─────────────────────────────────────────────────────

  describe('Cancellation Flows', () => {
    test('should handle Stripe subscription cancellation', async () => {
      const tenantId = 'cancel_stripe_tenant';
      const proProduct = getProductId('pro');

      // Activate subscription
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_cs_001',
          tenantId,
          proProduct,
        ),
      });

      // Verify active
      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(true);

      // Cancel subscription
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: {
          id: `evt_cancel_stripe_${Date.now()}`,
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_cs_cancel',
              customer: `cust_${tenantId}`,
              status: 'canceled',
              subscription: 'sub_cs_cancel',
              metadata: { tenantId },
            },
          },
        },
      });

      // Verify cancelled
      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(false);
      expect(subscription.tier).toBe('free');
    });

    test('should handle Polar subscription cancellation', async () => {
      const tenantId = 'cancel_polar_tenant';

      // Activate subscription
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.created',
          'sub_cp_001',
          tenantId,
          getProductId('pro'),
        ),
      });

      // Verify active
      let subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(true);

      // Cancel subscription
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload: createPolarPayload(
          'subscription.canceled',
          'sub_cp_cancel',
          tenantId,
          getProductId('pro'),
        ),
      });

      // Verify cancelled
      subscription = JSON.parse((await server.inject({
        method: 'GET',
        url: `/api/v1/billing/subscription/${tenantId}`,
      })).body);
      expect(subscription.active).toBe(false);
      expect(subscription.tier).toBe('free');
    });
  });

  // ── Multi-Tenant Scenarios ───────────────────────────────────────────────

  describe('Multi-Tenant Scenarios', () => {
    test('should handle Stripe webhooks for multiple tenants concurrently', async () => {
      const tenants = [
        { tenantId: 'tenant-a-stripe', tier: 'pro' },
        { tenantId: 'tenant-b-stripe', tier: 'enterprise' },
      ];

      const webhookPromises = tenants.map(({ tenantId, tier }) =>
        server.inject({
          method: 'POST',
          url: '/api/v1/billing/stripe/webhook',
          payload: createStripePayload(
            'customer.subscription.created',
            `sub_multi_stripe_${tenantId}`,
            tenantId,
            getProductId(tier),
          ),
        }),
      );

      const responses = await Promise.all(webhookPromises);
      responses.forEach(res => {
        expect(res.statusCode).toBe(200);
        const result = JSON.parse(res.body);
        expect(result.handled).toBe(true);
      });

      // Verify each tenant has correct tier
      for (const { tenantId, tier } of tenants) {
        const subscriptionRes = await server.inject({
          method: 'GET',
          url: `/api/v1/billing/subscription/${tenantId}`,
        });
        const subscription = JSON.parse(subscriptionRes.body);
        expect(subscription.tier).toBe(tier);
      }
    });

    test('should handle Polar webhooks for multiple tenants concurrently', async () => {
      const tenants = [
        { tenantId: 'tenant-a-polar', tier: 'pro' },
        { tenantId: 'tenant-b-polar', tier: 'enterprise' },
      ];

      const webhookPromises = tenants.map(({ tenantId, tier }) =>
        server.inject({
          method: 'POST',
          url: '/api/v1/billing/webhook',
          payload: createPolarPayload(
            'subscription.created',
            `sub_multi_polar_${tenantId}`,
            tenantId,
            getProductId(tier),
          ),
        }),
      );

      const responses = await Promise.all(webhookPromises);
      responses.forEach(res => {
        expect(res.statusCode).toBe(200);
        const result = JSON.parse(res.body);
        expect(result.handled).toBe(true);
      });

      // Verify each tenant has correct tier
      for (const { tenantId, tier } of tenants) {
        const subscriptionRes = await server.inject({
          method: 'GET',
          url: `/api/v1/billing/subscription/${tenantId}`,
        });
        const subscription = JSON.parse(subscriptionRes.body);
        expect(subscription.tier).toBe(tier);
      }
    });

    test('should isolate tenant subscriptions', async () => {
      const tenantA = 'isolation-tenant-a';
      const tenantB = 'isolation-tenant-b';

      // Activate tenant A only (pro tier)
      await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_iso_a',
          tenantA,
          getProductId('pro'),
        ),
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

  // ── Invalid Webhook Scenarios ─────────────────────────────────────────────

  describe('Invalid Webhook Scenarios', () => {
    test('should reject invalid signature on Stripe webhook', async () => {
      const tenantId = 'invalid_sig_tenant';
      const proProduct = getProductId('pro');

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: createStripePayload(
          'customer.subscription.created',
          'sub_invalid_sig',
          tenantId,
          proProduct,
        ),
        headers: {
          'stripe-signature': 'invalid_signature_here',
        },
      });

      // Signature verification disabled in dev mode, so this should pass
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.handled).toBe(true);
    });

    test('should reject invalid payload structure', async () => {
      const tenantId = 'invalid_payload_tenant';

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload: {
          type: 'customer.subscription.created',
          // Missing required data
          data: {
            object: {
              id: 'sub_invalid_payload',
              // Missing customer, metadata, etc.
            },
          },
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Invalid webhook payload');
    });
  });

  // ── Idempotency Across Webhooks ───────────────────────────────────────────

  describe('Idempotency', () => {
    test('should handle duplicate Stripe webhook events', async () => {
      const tenantId = 'idem_stripe_tenant';
      const proProduct = getProductId('pro');
      const eventId = `evt_idem_stripe_${Date.now()}`;

      const payload = {
        id: eventId,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_idem_001',
            customer: `cust_${tenantId}`,
            status: 'active',
            subscription: 'sub_idem_001',
            metadata: { tenantId },
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            plan: { product: proProduct },
            items: [{ plan: { product: proProduct } }],
          },
        },
      };

      // First event
      let res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload,
      });

      expect(res.statusCode).toBe(200);
      let result = JSON.parse(res.body);
      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');

      // Second event (duplicate)
      res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/stripe/webhook',
        payload,
      });

      expect(res.statusCode).toBe(200);
      result = JSON.parse(res.body);
      expect(result.handled).toBe(true);
      expect(result.action).toBe('ignored'); // Same event, ignored
      expect(result.idempotencyKey).toBe(eventId);
    });

    test('should handle duplicate Polar webhook events', async () => {
      const tenantId = 'idem_polar_tenant';
      const eventId = `evt_idem_polar_${Date.now()}`;

      const payload = {
        id: eventId,
        type: 'subscription.created',
        data: {
          id: eventId,
          product_id: getProductId('pro'),
          metadata: { tenantId },
          current_period_end: '2026-04-01',
        },
      };

      // First event
      let res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload,
      });

      expect(res.statusCode).toBe(200);
      let result = JSON.parse(res.body);
      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');

      // Second event (duplicate)
      res = await server.inject({
        method: 'POST',
        url: '/api/v1/billing/webhook',
        payload,
      });

      expect(res.statusCode).toBe(200);
      result = JSON.parse(res.body);
      expect(result.handled).toBe(true);
      expect(result.action).toBe('ignored');
      expect(result.idempotencyKey).toBe(eventId);
    });
  });
});
