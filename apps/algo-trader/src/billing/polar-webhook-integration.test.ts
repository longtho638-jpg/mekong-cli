/**
 * Polar Webhook Integration Tests
 *
 * Tests for Polar.sh webhook integration with LicenseService
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { PolarWebhookEventHandler, PolarWebhookPayload } from './polar-webhook-event-handler';
import { PolarSubscriptionService } from './polar-subscription-service';
import { LicenseService, LicenseTier } from '../lib/raas-gate';

describe('Polar Webhook Integration', () => {
  let subscriptionService: PolarSubscriptionService;
  let webhookHandler: PolarWebhookEventHandler;
  let licenseService: LicenseService;

  beforeEach(() => {
    // Reset singletons for each test
    PolarSubscriptionService.resetInstance();
    LicenseService.getInstance().reset();

    subscriptionService = PolarSubscriptionService.getInstance();
    licenseService = LicenseService.getInstance();

    webhookHandler = new PolarWebhookEventHandler(
      subscriptionService,
      (tenantId, newTier) => {
        console.log(`Tier changed for ${tenantId}: ${newTier}`);
      }
    );
  });

  const makeWebhookPayload = (type: string, tenantId: string, productId: string, eventIdSuffix?: string): PolarWebhookPayload => ({
    type,
    data: {
      id: `sub_${Date.now()}_${eventIdSuffix || type}`, // Unique event ID per event to avoid idempotency
      product_id: productId,
      metadata: { tenantId },
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  describe('Webhook Signature Verification', () => {
    test('should verify valid signature', () => {
      const payload = '{"type":"subscription.active","data":{}}';
      const crypto = require('crypto');
      const secret = 'test-secret';
      const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

      // Set secret for this test
      process.env.POLAR_WEBHOOK_SECRET = secret;

      // Re-create handler to pick up env var
      const newHandler = new PolarWebhookEventHandler(subscriptionService);
      expect(newHandler.verifySignature(payload, signature)).toBe(true);

      // Cleanup
      delete process.env.POLAR_WEBHOOK_SECRET;
    });

    test('should accept all webhooks in dev mode (no secret configured)', () => {
      delete process.env.POLAR_WEBHOOK_SECRET;
      // Re-create handler to pick up env var change
      const newHandler = new PolarWebhookEventHandler(subscriptionService);
      // Dev mode: accept webhooks without signature verification (allows local dev)
      // Production: must set POLAR_WEBHOOK_SECRET for signature verification
      expect(newHandler.verifySignature('any', 'any')).toBe(true); // Dev mode = accept
    });
  });

  describe('Subscription Activation Webhook', () => {
    test('should activate PRO subscription and sync with LicenseService', () => {
      const payload = makeWebhookPayload('subscription.active', 'tenant-123', 'prod_pro');

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');
      expect(result.tier).toBe('pro');

      // Check Polar subscription service
      const sub = subscriptionService.getSubscription('tenant-123');
      expect(sub?.active).toBe(true);
      expect(sub?.tier).toBe('pro');

      // Check LicenseService sync
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasFeature('ml_models')).toBe(true);
    });

    test('should activate ENTERPRISE subscription and sync with LicenseService', () => {
      const payload = makeWebhookPayload('subscription.active', 'tenant-456', 'prod_enterprise');

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.tier).toBe('enterprise');

      // Check LicenseService sync
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
      expect(licenseService.hasFeature('priority_support')).toBe(true);
    });

    test('should handle subscription.created event', () => {
      const payload = makeWebhookPayload('subscription.created', 'tenant-789', 'prod_pro');

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');
    });
  });

  describe('Subscription Update Webhook', () => {
    test('should handle subscription.updated event', () => {
      // First activate
      webhookHandler.handleEvent(makeWebhookPayload('subscription.active', 'tenant-123', 'prod_pro'));

      // Then update
      const payload = makeWebhookPayload('subscription.updated', 'tenant-123', 'prod_enterprise');
      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.tier).toBe('enterprise');

      // Check upgraded
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });
  });

  describe('Subscription Cancellation Webhook', () => {
    test('should deactivate subscription on cancellation', () => {
      // First activate PRO
      webhookHandler.handleEvent(makeWebhookPayload('subscription.active', 'tenant-123', 'prod_pro', 'active1'));
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);

      // Then cancel
      const payload = makeWebhookPayload('subscription.canceled', 'tenant-123', 'prod_pro', 'cancel1');
      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('deactivated');
      expect(result.tier).toBe('free');

      // Check downgraded to FREE
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
      expect(licenseService.hasFeature('ml_models')).toBe(false);
    });

    test('should handle subscription.revoked event', () => {
      webhookHandler.handleEvent(makeWebhookPayload('subscription.active', 'tenant-123', 'prod_pro', 'active2'));

      const payload = makeWebhookPayload('subscription.revoked', 'tenant-123', 'prod_pro', 'revoked1');
      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('deactivated');
    });
  });

  describe('Unknown Events', () => {
    test('should ignore unknown event types', () => {
      const payload: PolarWebhookPayload = {
        type: 'unknown.event',
        data: { id: '123' },
      };

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing tenantId', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.active',
        data: { product_id: 'prod_pro' },
      };

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(false);
    });

    test('should handle missing product_id', () => {
      const payload = makeWebhookPayload('subscription.active', 'tenant-123', '');
      payload.data.product_id = undefined;

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(false);
    });

    test('should handle unknown product tier', () => {
      const payload = makeWebhookPayload('subscription.active', 'tenant-123', 'unknown_product');

      const result = webhookHandler.handleEvent(payload);

      expect(result.handled).toBe(false);
    });
  });
});
