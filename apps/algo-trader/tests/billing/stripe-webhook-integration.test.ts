/**
 * Stripe Webhook Integration Tests
 *
 * Tests for Stripe webhook handler including:
 * - Valid webhook signature and event processing
 * - Invalid signature -> 400 error
 * - Duplicate event -> idempotency (skipped)
 * - Subscription lifecycle: create -> update -> delete
 */

import { createHmac } from 'crypto';
import { StripeWebhookHandler, StripeWebhookPayload } from '../../src/billing/stripe-webhook-handler';
import { PolarSubscriptionService } from '../../src/billing/polar-subscription-service';
import { LicenseService, LicenseTier } from '../../src/lib/raas-gate';
import { WebhookAuditLogger } from '../../src/billing/webhook-audit-logger';

// ─────────────────────────────────────────────────────────────────────────────
// Test utilities
// ─────────────────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'whsec_test_secret_stripe_integration';

function generateSignature(payload: string, secret: string = WEBHOOK_SECRET): string {
  return `v1=${createHmac('sha256', secret).update(payload).digest('hex')}`;
}

function createStripePayload(
  type: string,
  subscriptionId: string,
  tenantId: string,
  productId: string,
  periodEnd?: number,
): StripeWebhookPayload {
  return {
    id: `evt_${subscriptionId}_${Date.now()}`,
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
          end: periodEnd ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        },
        plan: {
          product: productId,
        },
        items: [
          {
            plan: {
              product: productId,
            },
          },
        ],
      },
    },
  };
}

function createStripePaymentPayload(
  type: 'invoice.payment_succeeded' | 'invoice.payment_failed',
  invoiceId: string,
  tenantId: string,
  subscriptionId: string,
  amount: number = 4900,
): StripeWebhookPayload {
  return {
    id: `evt_${invoiceId}_${Date.now()}`,
    type,
    data: {
      object: {
        id: invoiceId,
        customer: `cust_${tenantId}`,
        subscription: subscriptionId,
        metadata: { tenantId },
        amount_total: amount,
        currency: 'usd',
        period: {
          start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
          end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        },
        status: type === 'invoice.payment_succeeded' ? 'paid' : 'failed',
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────────────────

describe('StripeWebhookHandler', () => {
  let handler: StripeWebhookHandler;
  let service: PolarSubscriptionService;
  let licenseService: LicenseService;
  let auditLogger: WebhookAuditLogger;
  let tierChanges: Array<{ tenantId: string; tier: string }>;
  let products: any[];
  let proProduct: any;
  let entProduct: any;

  beforeEach(() => {
    // Reset instances for clean test state
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();
    WebhookAuditLogger.getInstance().reset();

    service = PolarSubscriptionService.getInstance();
    licenseService = LicenseService.getInstance();
    auditLogger = WebhookAuditLogger.getInstance();
    tierChanges = [];
    products = service.getProducts();
    proProduct = products.find((p: any) => p.tier === 'pro')!;
    entProduct = products.find((p: any) => p.tier === 'enterprise')!;

    handler = new StripeWebhookHandler(service, (tenantId, tier) => {
      tierChanges.push({ tenantId, tier });
    });
  });

  // ── Signature Verification ───────────────────────────────────────────────

  describe('Signature Verification', () => {
    test('verifySignature returns true in dev mode (no secret configured)', () => {
      process.env.STRIPE_WEBHOOK_SECRET = '';
      const testHandler = new StripeWebhookHandler(service);
      const payload = JSON.stringify({ type: 'test', id: 'evt_123' });
      expect(testHandler.verifySignature(payload, 'any-signature')).toBe(true);
    });

    test('verifySignature validates correct HMAC-SHA256 signature', () => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const payload = JSON.stringify({ type: 'test', id: 'evt_123' });
      const signature = generateSignature(payload, WEBHOOK_SECRET);
      expect(handler.verifySignature(payload, signature)).toBe(true);
    });

    test('verifySignature rejects invalid signature', () => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const payload = JSON.stringify({ type: 'test', id: 'evt_123' });
      expect(handler.verifySignature(payload, 'invalid_signature_xyz')).toBe(false);
    });

    test('verifySignature rejects empty signature when secret configured', () => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const payload = JSON.stringify({ type: 'test', id: 'evt_123' });
      expect(handler.verifySignature(payload, '')).toBe(false);
    });
  });

  // ── Event Processing ─────────────────────────────────────────────────────

  describe('Event Processing', () => {
    test('handles checkout.session.completed event', async () => {
      const tenantId = 'tenant_checkout_complete';
      const subscriptionId = 'sub_checkout_complete_001';

      const payload = createStripePayload(
        'checkout.session.completed',
        subscriptionId,
        tenantId,
        proProduct.polarProductId,
      );

      // Clear audit logger for this test
      auditLogger.reset();

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('provisioned');
      expect(result.tier).toBe('pro');
      expect(result.tenantId).toBe(tenantId);

      // Verify subscription was activated
      expect(service.isActive(tenantId)).toBe(true);
      expect(service.getCurrentTier(tenantId)).toBe('pro');

      // Verify license was activated
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
    });

    test('handles customer.subscription.created event', async () => {
      const tenantId = 'tenant_sub_created';
      const subscriptionId = 'sub_created_001';

      const payload = createStripePayload(
        'customer.subscription.created',
        subscriptionId,
        tenantId,
        proProduct.polarProductId,
      );

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');
      expect(result.tier).toBe('pro');
      expect(result.tenantId).toBe(tenantId);
    });

    test('handles customer.subscription.active event', async () => {
      const tenantId = 'tenant_sub_active';
      const subscriptionId = 'sub_active_001';

      const payload = createStripePayload(
        'customer.subscription.active',
        subscriptionId,
        tenantId,
        proProduct.polarProductId,
      );

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');
      expect(result.tier).toBe('pro');
    });

    test('handles customer.subscription.updated event (tier upgrade)', async () => {
      // Start with pro
      service.activateSubscription('t1_upgrade', 'pro', proProduct.polarProductId, null);

      const tenantId = 't1_upgrade';
      const subscriptionId = 'sub_updated_001';

      const payload = createStripePayload(
        'customer.subscription.updated',
        subscriptionId,
        tenantId,
        entProduct.polarProductId,
      );

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.tier).toBe('enterprise');
      expect(service.getCurrentTier(tenantId)).toBe('enterprise');
    });

    test('handles customer.subscription.deleted event (cancellation)', async () => {
      // Start with pro
      service.activateSubscription('t1_cancel', 'pro', proProduct.polarProductId, null);

      const tenantId = 't1_cancel';
      const subscriptionId = 'sub_deleted_001';

      const payload: StripeWebhookPayload = {
        id: `evt_${subscriptionId}_${Date.now()}`,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: subscriptionId,
            customer: `cust_${tenantId}`,
            status: 'canceled',
            subscription: subscriptionId,
            metadata: { tenantId },
          },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('deactivated');
      expect(result.tier).toBe('free');
      expect(service.isActive(tenantId)).toBe(false);
      expect(service.getCurrentTier(tenantId)).toBe('free');
    });
  });

  // ── Payment Events ───────────────────────────────────────────────────────

  describe('Payment Events', () => {
    test('handles invoice.payment_succeeded event', async () => {
      const tenantId = 'tenant_payment_succeeded';
      const subscriptionId = 'sub_payment_succeeded_001';
      const invoiceId = 'in_payment_succeeded_001';

      // First activate subscription
      service.activateSubscription(tenantId, 'pro', 'prod_pro', null);

      const payload = createStripePaymentPayload(
        'invoice.payment_succeeded',
        invoiceId,
        tenantId,
        subscriptionId,
      );

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.tenantId).toBe(tenantId);
    });

    test('handles invoice.payment_failed event', async () => {
      const tenantId = 'tenant_payment_failed';
      const subscriptionId = 'sub_payment_failed_001';
      const invoiceId = 'in_payment_failed_001';

      // First activate subscription
      service.activateSubscription(tenantId, 'pro', 'prod_pro', null);

      const payload = createStripePaymentPayload(
        'invoice.payment_failed',
        invoiceId,
        tenantId,
        subscriptionId,
      );

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('ignored');
      expect(result.tenantId).toBe(tenantId);
    });
  });

  // ── Idempotency ──────────────────────────────────────────────────────────

  describe('Idempotency', () => {
    test('skips duplicate events (same eventId)', async () => {
      const tenantId = 'tenant_duplicate';
      const subscriptionId = 'sub_duplicate_001';
      const eventId = `evt_duplicate_${Date.now()}`;

      const payload: StripeWebhookPayload = {
        id: eventId,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: subscriptionId,
            customer: `cust_${tenantId}`,
            status: 'active',
            subscription: subscriptionId,
            metadata: { tenantId },
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            plan: {
              product: proProduct.polarProductId,
            },
            items: [
              {
                plan: {
                  product: proProduct.polarProductId,
                },
              },
            ],
          },
        },
      };

      // First process
      const result1 = handler.handleEvent(payload);
      expect(result1.handled).toBe(true);
      expect(result1.action).toBe('activated');

      // Second process (duplicate)
      const result2 = handler.handleEvent(payload);
      expect(result2.handled).toBe(true);
      expect(result2.action).toBe('ignored');
      expect(result2.idempotencyKey).toBe(eventId);
    });

    test('processes different events with different eventIds', async () => {
      const tenantId = 'tenant_multi_events';

      const payload1: StripeWebhookPayload = {
        id: `evt_multi_1_${Date.now()}`,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_multi_1',
            customer: `cust_${tenantId}`,
            status: 'active',
            subscription: 'sub_multi_1',
            metadata: { tenantId },
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            plan: { product: proProduct.polarProductId },
            items: [{ plan: { product: proProduct.polarProductId } }],
          },
        },
      };

      const payload2: StripeWebhookPayload = {
        id: `evt_multi_2_${Date.now() + 1}`,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_multi_2',
            customer: `cust_${tenantId}`,
            status: 'active',
            subscription: 'sub_multi_2',
            metadata: { tenantId },
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            plan: { product: proProduct.polarProductId },
            items: [{ plan: { product: proProduct.polarProductId } }],
          },
        },
      };

      const result1 = handler.handleEvent(payload1);
      const result2 = handler.handleEvent(payload2);

      expect(result1.handled).toBe(true);
      expect(result2.handled).toBe(true);
      expect(result1.action).toBe('activated');
      expect(result2.action).toBe('updated');
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  describe('Error Handling', () => {
    test('ignores events without tenantId in metadata', async () => {
      const subscriptionId = 'sub_no_tenant';

      const payload: StripeWebhookPayload = {
        id: `evt_no_tenant_${Date.now()}`,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: subscriptionId,
            customer: 'cust_no_tenant',
            status: 'active',
            subscription: subscriptionId,
            // Missing metadata.tenantId
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            plan: { product: proProduct.polarProductId },
            items: [{ plan: { product: proProduct.polarProductId } }],
          },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
      expect(result.tenantId).toBeNull();
    });

    test('ignores events without required product_id', async () => {
      const tenantId = 'tenant_no_product';

      const payload: StripeWebhookPayload = {
        id: `evt_no_product_${Date.now()}`,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_no_product',
            customer: `cust_${tenantId}`,
            status: 'active',
            subscription: 'sub_no_product',
            metadata: { tenantId },
            // Missing plan.product
            period: {
              start: Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
            items: [{ plan: {} }], // Empty plan
          },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });

    test('ignores unknown event types', async () => {
      const tenantId = 'tenant_unknown_event';

      const payload: StripeWebhookPayload = {
        id: `evt_unknown_${Date.now()}`,
        type: 'customer.balance.updated', // Unknown event
        data: {
          object: {
            id: 'bal_updated',
            customer: `cust_${tenantId}`,
            metadata: { tenantId },
          },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });
  });

  // ── Tier Change Callback ─────────────────────────────────────────────────

  describe('Tier Change Callback', () => {
    test('calls onTierChange when tier changes', async () => {
      const tenantId = 'tenant_callback';
      const productId = proProduct.polarProductId;

      const callbackHandler = new StripeWebhookHandler(service, (tid, tier) => {
        tierChanges.push({ tenantId: tid, tier });
      });

      const payload = createStripePayload(
        'customer.subscription.created',
        'sub_callback_001',
        tenantId,
        productId,
      );

      callbackHandler.handleEvent(payload);

      expect(tierChanges).toHaveLength(1);
      expect(tierChanges[0]).toEqual({ tenantId, tier: 'pro' });
    });
  });

  // ── Complete Subscription Lifecycle ──────────────────────────────────────

  describe('Complete Subscription Lifecycle', () => {
    test('processes full lifecycle: created -> updated -> deleted', async () => {
      const tenantId = 'tenant_lifecycle';

      // 1. Subscription created
      const created = handler.handleEvent(
        createStripePayload('customer.subscription.created', 'sub_lc_1', tenantId, proProduct.polarProductId),
      );
      expect(created.action).toBe('activated');
      expect(service.getCurrentTier(tenantId)).toBe('pro');

      // 2. Subscription updated (upgrade to enterprise)
      const updated = handler.handleEvent(
        createStripePayload('customer.subscription.updated', 'sub_lc_2', tenantId, entProduct.polarProductId),
      );
      expect(updated.action).toBe('updated');
      expect(service.getCurrentTier(tenantId)).toBe('enterprise');

      // 3. Subscription deleted (cancellation)
      const deleted: StripeWebhookPayload = {
        id: `evt_lc_3_${Date.now()}`,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_lc_3',
            customer: `cust_${tenantId}`,
            status: 'canceled',
            subscription: 'sub_lc_3',
            metadata: { tenantId },
          },
        },
      };
      const resultDelete = handler.handleEvent(deleted);
      expect(resultDelete.action).toBe('deactivated');
      expect(service.getCurrentTier(tenantId)).toBe('free');
    });
  });
});
