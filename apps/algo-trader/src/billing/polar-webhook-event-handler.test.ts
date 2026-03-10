/**
 * Polar Webhook Event Handler Tests - Phase 1 Reconciliation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PolarWebhookEventHandler, PolarWebhookPayload } from './polar-webhook-event-handler';
import { PolarSubscriptionService } from './polar-subscription-service';
import { LicenseService } from '../lib/raas-gate';
import { PolarAuditLogger } from './polar-audit-logger';

describe('PolarWebhookEventHandler - Phase 1 Reconciliation', () => {
  let handler: PolarWebhookEventHandler;
  let subscriptionService: PolarSubscriptionService;
  let licenseService: LicenseService;
  let auditLogger: PolarAuditLogger;

  beforeEach(() => {
    subscriptionService = PolarSubscriptionService.getInstance();
    licenseService = LicenseService.getInstance();
    auditLogger = PolarAuditLogger.getInstance();

    // Reset all services
    PolarSubscriptionService.resetInstance();
    licenseService.reset();
    auditLogger.reset();

    handler = new PolarWebhookEventHandler(subscriptionService);
  });

  afterEach(() => {
    delete process.env.POLAR_WEBHOOK_SECRET;
  });

  describe('Signature Verification', () => {
    beforeEach(() => {
      process.env.POLAR_WEBHOOK_SECRET = 'test-secret';
    });

    test('should verify valid signature', () => {
      const payload = JSON.stringify({ type: 'subscription.created', data: { id: 'test_123' } });

      const crypto = require('crypto');
      const expectedSig = 'sha256=' + crypto.createHmac('sha256', 'test-secret').update(payload).digest('hex');

      const result = handler.verifySignature(payload, expectedSig);
      expect(result).toBe(true);
    });

    test('should reject invalid signature', () => {
      const payload = JSON.stringify({ type: 'subscription.created' });
      const invalidSig = 'sha256=' + 'a'.repeat(64); // Same length but wrong value

      const result = handler.verifySignature(payload, invalidSig);
      expect(result).toBe(false);
    });

    test('should accept all when no secret configured (dev mode)', () => {
      delete process.env.POLAR_WEBHOOK_SECRET;
      const result = handler.verifySignature('any', 'any');
      expect(result).toBe(true);
    });
  });

  describe('Idempotency', () => {
    test('should ignore duplicate events', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.created',
        data: {
          id: 'sub_123',
          product_id: 'prod_pro',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result1 = handler.handleEvent(payload);
      expect(result1.handled).toBe(true);
      expect(result1.action).toBe('activated');

      // Same event ID - should be ignored due to idempotency
      const result2 = handler.handleEvent(payload);
      expect(result2.handled).toBe(true);
      expect(result2.action).toBe('ignored'); // Already processed
    });
  });

  describe('order.created Event', () => {
    test('should activate lifetime license for one-time purchase', () => {
      const payload: PolarWebhookPayload = {
        type: 'order.created',
        data: {
          id: 'order_123',
          product_id: 'prod_pro',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.event).toBe('order.created');
      expect(result.action).toBe('activated');
      expect(subscriptionService.getSubscription('tenant_abc')?.tier).toBe('pro');
    });

    test('should ignore order without tenantId', () => {
      const payload: PolarWebhookPayload = {
        type: 'order.created',
        data: { id: 'order_123', product_id: 'prod_pro' },
      };

      const result = handler.handleEvent(payload);
      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });

    test('should ignore order with unknown product', () => {
      const payload: PolarWebhookPayload = {
        type: 'order.created',
        data: {
          id: 'order_123',
          product_id: 'prod_unknown',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);
      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });
  });

  describe('refund.created Event', () => {
    test('should downgrade to FREE and log refund alert', () => {
      // Setup: activate subscription first
      subscriptionService.activateSubscription('tenant_abc', 'pro', 'prod_pro', null);

      const payload: PolarWebhookPayload = {
        type: 'refund.created',
        data: {
          id: 'refund_123',
          subscription_id: 'sub_abc',
          amount: 4900,
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.event).toBe('refund.created');
      expect(result.action).toBe('refunded');
      expect(result.tier).toBe('free');

      // Verify downgraded
      expect(subscriptionService.getSubscription('tenant_abc')?.active).toBe(false);
    });

    test('should handle refund without subscription_id', () => {
      const payload: PolarWebhookPayload = {
        type: 'refund.created',
        data: {
          id: 'refund_123',
          amount: 4900,
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);
      expect(result.handled).toBe(true); // Should still process
    });

    test('should ignore refund without tenantId', () => {
      const payload: PolarWebhookPayload = {
        type: 'refund.created',
        data: { id: 'refund_123', amount: 4900 },
      };

      const result = handler.handleEvent(payload);
      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
    });
  });

  describe('Subscription Events (existing)', () => {
    test('should handle subscription.active', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.active',
        data: {
          id: 'sub_123',
          product_id: 'prod_pro',
          metadata: { tenantId: 'tenant_abc' },
          current_period_end: '2026-04-06T00:00:00Z',
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('activated');
      expect(result.tier).toBe('pro');
    });

    test('should handle subscription.updated (tier change)', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.updated',
        data: {
          id: 'sub_123',
          product_id: 'prod_enterprise',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('updated');
      expect(result.tier).toBe('enterprise');
    });

    test('should handle subscription.canceled', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.canceled',
        data: {
          id: 'sub_123',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('deactivated');
      expect(result.tier).toBe('free');
    });

    test('should handle subscription.revoked', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.revoked',
        data: {
          id: 'sub_123',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('deactivated');
    });
  });

  describe('Audit Logging', () => {
    test('should log all processed events', () => {
      const payload: PolarWebhookPayload = {
        type: 'subscription.active',
        data: {
          id: 'sub_123',
          product_id: 'prod_pro',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      handler.handleEvent(payload);

      const logs = auditLogger.getRecentLogs(1);
      expect(logs.length).toBe(1);
      expect(logs[0].eventType).toBe('subscription.active');
      expect(logs[0].tenantId).toBe('tenant_abc');
      expect(logs[0].action).toBe('activated');
    });

    test('should include idempotencyKey in logs', () => {
      const payload: PolarWebhookPayload = {
        type: 'order.created',
        data: {
          id: 'order_123',
          product_id: 'prod_pro',
          metadata: { tenantId: 'tenant_abc' },
        },
      };

      handler.handleEvent(payload);

      const logs = auditLogger.getRecentLogs(1);
      expect(logs[0].idempotencyKey).toBe('order_123');
    });
  });

  describe('Unknown Events', () => {
    test('should ignore unknown event types', () => {
      const payload: PolarWebhookPayload = {
        type: 'unknown.event',
        data: { id: 'x_123' },
      };

      const result = handler.handleEvent(payload);

      expect(result.handled).toBe(false);
      expect(result.action).toBe('ignored');
      expect(result.event).toBe('unknown.event');
    });
  });
});
