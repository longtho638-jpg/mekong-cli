/**
 * Webhook Handler Unit Tests - Comprehensive Coverage
 *
 * Tests for all 9 event types:
 * - payment.success, payment.paid, payment.failed
 * - subscription.created, subscription.activated, subscription.updated
 * - subscription.deactivated, subscription.cancelled, subscription.refunded
 *
 * Plus validation and error handling tests
 */

import { createHmac } from 'crypto';
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  handleWebhookEvent,
  webhookHandler,
  validateLicenseKey,
  WebhookEvent,
} from './webhook-handler';
import { LicenseService, LicenseTier } from './raas-gate';
import { UsageQuotaService } from './usage-quota';

const WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests';

function generateSignature(payload: string, secret = WEBHOOK_SECRET): string {
  const hmac = createHmac('sha256', secret);
  return `whsec_${hmac.update(payload).digest('hex')}`;
}

function createEvent(type: string, data: Record<string, unknown>): WebhookEvent {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
}

describe('Webhook Handler Unit Tests', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    UsageQuotaService.getInstance().reset('test-license-key');
  });

  afterEach(() => {
    LicenseService.getInstance().reset();
    UsageQuotaService.getInstance().reset('test-license-key');
  });

  // ============================================================================
  // validateLicenseKey Tests
  // ============================================================================
  describe('validateLicenseKey', () => {
    it('accepts valid license key', () => {
      const result = validateLicenseKey('valid-key-123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects non-string license key', () => {
      expect(validateLicenseKey(null).valid).toBe(false);
      expect(validateLicenseKey(123).valid).toBe(false);
      expect(validateLicenseKey({}).valid).toBe(false);
    });

    it('rejects too short license key', () => {
      expect(validateLicenseKey('a').valid).toBe(false);
      expect(validateLicenseKey('ab').valid).toBe(false);
    });

    it('rejects too long license key', () => {
      const longKey = 'a'.repeat(257);
      expect(validateLicenseKey(longKey).valid).toBe(false);
    });

    it('rejects invalid characters', () => {
      expect(validateLicenseKey('key@123').valid).toBe(false);
      expect(validateLicenseKey('key space').valid).toBe(false);
      expect(validateLicenseKey('key/123').valid).toBe(false);
    });

    it('accepts alphanumeric with underscore and hyphen', () => {
      expect(validateLicenseKey('abc_123-XYZ').valid).toBe(true);
    });
  });

  // ============================================================================
  // verifyWebhookSignature Tests
  // ============================================================================
  describe('verifyWebhookSignature', () => {
    it('accepts valid signature', () => {
      const payload = '{"type":"payment.success"}';
      const signature = generateSignature(payload);
      expect(verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const payload = '{"type":"payment.success"}';
      expect(verifyWebhookSignature(payload, 'whsec_invalid', WEBHOOK_SECRET)).toBe(false);
    });

    it('rejects empty signature', () => {
      expect(verifyWebhookSignature('{}', '', WEBHOOK_SECRET)).toBe(false);
    });

    it('rejects signature without whsec_ prefix', () => {
      const payload = '{"type":"payment.success"}';
      const hmac = createHmac('sha256', WEBHOOK_SECRET);
      const signature = hmac.update(payload).digest('hex');
      expect(verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)).toBe(false);
    });

    it('rejects wrong secret', () => {
      const payload = '{"type":"payment.success"}';
      const signature = generateSignature(payload);
      expect(verifyWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
    });
  });

  // ============================================================================
  // parseWebhookPayload Tests
  // ============================================================================
  describe('parseWebhookPayload', () => {
    it('parses valid payload', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date().toISOString(),
      });
      const signature = generateSignature(payload);
      const event = parseWebhookPayload(payload, signature, WEBHOOK_SECRET);
      expect(event.type).toBe('payment.success');
    });

    it('rejects expired timestamp', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      });
      const signature = generateSignature(payload);
      expect(() => parseWebhookPayload(payload, signature, WEBHOOK_SECRET))
        .toThrow('Webhook timestamp expired');
    });

    it('rejects invalid signature', () => {
      const payload = '{"type":"payment.success","timestamp":"2024-01-01T00:00:00Z"}';
      expect(() => parseWebhookPayload(payload, 'invalid', WEBHOOK_SECRET))
        .toThrow('Invalid webhook signature');
    });

    it('rejects invalid JSON', () => {
      const payload = 'not-json';
      const signature = generateSignature(payload);
      expect(() => parseWebhookPayload(payload, signature, WEBHOOK_SECRET))
        .toThrow('Invalid JSON payload');
    });

    it('rejects missing event type', () => {
      const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
      });
      const signature = generateSignature(payload);
      expect(() => parseWebhookPayload(payload, signature, WEBHOOK_SECRET))
        .toThrow('Missing or invalid event type');
    });

    it('rejects missing timestamp', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
      });
      const signature = generateSignature(payload);
      expect(() => parseWebhookPayload(payload, signature, WEBHOOK_SECRET))
        .toThrow('Missing or invalid timestamp');
    });

    it('rejects webhook secret not configured', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date().toISOString(),
      });
      const signature = generateSignature(payload);
      expect(() => parseWebhookPayload(payload, signature, ''))
        .toThrow('Webhook secret not configured');
    });
  });

  // ============================================================================
  // handleWebhookEvent - Payment Events
  // ============================================================================
  describe('handleWebhookEvent - Payment Events', () => {
    describe('payment.success', () => {
      it('handles valid payment.success event', async () => {
        const event = createEvent('payment.success', {
          license_key: 'test-key-123',
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('test-key-123');
        expect(result.newTier).toBe('pro');
        expect(result.message).toBe('License activated successfully');
      });

      it('handles payment.success with FREE tier', async () => {
        const event = createEvent('payment.success', {
          license_key: 'free-key',
          tier: 'FREE',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.newTier).toBe('free');
      });

      it('handles payment.success with ENTERPRISE tier', async () => {
        const event = createEvent('payment.success', {
          license_key: 'ent-key',
          tier: 'ENTERPRISE',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.newTier).toBe('enterprise');
      });

      it('rejects payment.success with invalid license key', async () => {
        const event = createEvent('payment.success', {
          license_key: '',
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });

      it('rejects payment.success with invalid tier', async () => {
        const event = createEvent('payment.success', {
          license_key: 'test-key',
          tier: 'INVALID_TIER',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid tier');
      });

      it('handles payment.success with missing tier (defaults to PRO)', async () => {
        const event = createEvent('payment.success', {
          license_key: 'no-tier-key',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.newTier).toBe('pro');
      });
    });

    describe('payment.paid', () => {
      it('handles valid payment.paid event', async () => {
        const event = createEvent('payment.paid', {
          license_key: 'paid-key-123',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('paid-key-123');
        expect(result.message).toBe('Payment recorded, subscription extended');
      });

      it('rejects payment.paid with invalid license key', async () => {
        const event = createEvent('payment.paid', {
          license_key: null,
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('payment.failed', () => {
      it('handles payment.failed event', async () => {
        const event = createEvent('payment.failed', {
          license_key: 'failed-key',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('failed-key');
        expect(result.message).toBe('Payment failed warning recorded');
      });

      it('rejects payment.failed with invalid license key', async () => {
        const event = createEvent('payment.failed', {
          license_key: '',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });
  });

  // ============================================================================
  // handleWebhookEvent - Subscription Events
  // ============================================================================
  describe('handleWebhookEvent - Subscription Events', () => {
    describe('subscription.created', () => {
      it('handles valid subscription.created event', async () => {
        const event = createEvent('subscription.created', {
          license_key: 'new-sub-key',
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('new-sub-key');
        expect(result.newTier).toBe('pro');
        expect(result.message).toBe('Subscription created');
      });

      it('rejects subscription.created with invalid tier', async () => {
        const event = createEvent('subscription.created', {
          license_key: 'key',
          tier: 'GOLD',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid tier');
      });

      it('rejects subscription.created with invalid license key', async () => {
        const event = createEvent('subscription.created', {
          license_key: 123,
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('subscription.activated', () => {
      it('handles valid subscription.activated event', async () => {
        const event = createEvent('subscription.activated', {
          license_key: 'activated-key',
          tier: 'ENTERPRISE',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('activated-key');
        expect(result.newTier).toBe('enterprise');
        expect(result.message).toBe('Subscription activated');
      });

      it('rejects subscription.activated with invalid license key', async () => {
        const event = createEvent('subscription.activated', {
          license_key: '',
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('subscription.updated', () => {
      it('handles valid subscription.updated event', async () => {
        const event = createEvent('subscription.updated', {
          license_key: 'update-key',
          tier: 'ENTERPRISE',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('update-key');
        expect(result.newTier).toBe('enterprise');
        expect(result.message).toBe('Subscription updated');
      });

      it('rejects subscription.updated with invalid license key', async () => {
        const event = createEvent('subscription.updated', {
          license_key: null,
          tier: 'PRO',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('subscription.deactivated', () => {
      it('handles subscription.deactivated event', async () => {
        const event = createEvent('subscription.deactivated', {
          license_key: 'deactivated-key',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('deactivated-key');
        expect(result.newTier).toBe('free');
        expect(result.message).toBe('Subscription cancelled, downgraded to FREE');
      });

      it('rejects subscription.deactivated with invalid license key', async () => {
        const event = createEvent('subscription.deactivated', {
          license_key: '',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('subscription.cancelled', () => {
      it('handles subscription.cancelled event', async () => {
        const event = createEvent('subscription.cancelled', {
          license_key: 'cancelled-key',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('cancelled-key');
        expect(result.newTier).toBe('free');
        expect(result.message).toBe('Subscription cancelled, downgraded to FREE');
      });

      it('rejects subscription.cancelled with invalid license key', async () => {
        const event = createEvent('subscription.cancelled', {
          license_key: null,
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });

    describe('subscription.refunded', () => {
      it('handles subscription.refunded event', async () => {
        const event = createEvent('subscription.refunded', {
          license_key: 'refund-key',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(true);
        expect(result.licenseKey).toBe('refund-key');
        expect(result.message).toBe('License revoked due to refund');
      });

      it('rejects subscription.refunded with invalid license key', async () => {
        const event = createEvent('subscription.refunded', {
          license_key: '',
        });

        const result = await handleWebhookEvent(event);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid license_key');
      });
    });
  });

  // ============================================================================
  // handleWebhookEvent - Edge Cases
  // ============================================================================
  describe('handleWebhookEvent - Edge Cases', () => {
    it('returns false for unknown event type', async () => {
      const event = createEvent('unknown.event', { data: 'test' });

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unhandled event type');
    });

    it('handles case-insensitive tier matching', async () => {
      const event = createEvent('payment.success', {
        license_key: 'case-test',
        tier: 'PrO',
      });

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.newTier).toBe('pro');
    });

    it('handles missing data object gracefully', async () => {
      const event = createEvent('payment.success', {});

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid license_key');
    });
  });

  // ============================================================================
  // webhookHandler Integration Tests
  // ============================================================================
  describe('webhookHandler', () => {
    it('processes valid webhook request', async () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        data: { license_key: 'test-key', tier: 'PRO' },
        timestamp: new Date().toISOString(),
      });
      const signature = generateSignature(payload);

      const result = await webhookHandler(payload, signature, WEBHOOK_SECRET);

      expect(result.success).toBe(true);
      expect(result.licenseKey).toBe('test-key');
    });

    it('returns error for invalid signature', async () => {
      const payload = '{"type":"payment.success"}';

      const result = await webhookHandler(payload, 'invalid', WEBHOOK_SECRET);

      expect(result.success).toBe(false);
      expect(result.message).toContain('signature');
    });

    it('returns error for malformed JSON', async () => {
      const payload = 'not-json';
      const signature = generateSignature(payload);

      const result = await webhookHandler(payload, signature, WEBHOOK_SECRET);

      expect(result.success).toBe(false);
    });

    it('returns error for empty body', async () => {
      const result = await webhookHandler('', 'whsec_sig', WEBHOOK_SECRET);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid request body');
    });

    it('returns error for too large body', async () => {
      const largePayload = 'a'.repeat(1024 * 10 + 1);
      const signature = generateSignature(largePayload);

      const result = await webhookHandler(largePayload, signature, WEBHOOK_SECRET);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid request body');
    });

    it('returns error for empty signature', async () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date().toISOString(),
      });

      const result = await webhookHandler(payload, '', WEBHOOK_SECRET);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('returns error for too long signature', async () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date().toISOString(),
      });
      const longSig = 'whsec_' + 'a'.repeat(512);

      const result = await webhookHandler(payload, longSig, WEBHOOK_SECRET);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('handles all 9 event types through webhookHandler', async () => {
      const eventTypes = [
        'payment.success',
        'payment.paid',
        'payment.failed',
        'subscription.created',
        'subscription.activated',
        'subscription.updated',
        'subscription.deactivated',
        'subscription.cancelled',
        'subscription.refunded',
      ];

      for (const eventType of eventTypes) {
        const payload = JSON.stringify({
          type: eventType,
          data: { license_key: 'test-key', tier: 'PRO' },
          timestamp: new Date().toISOString(),
        });
        const signature = generateSignature(payload);

        const result = await webhookHandler(payload, signature, WEBHOOK_SECRET);

        expect(result.success).toBe(true);
      }
    });
  });
});
