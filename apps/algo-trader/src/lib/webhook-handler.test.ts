/**
 * Webhook Handler Tests - Jest Format
 */

import { createHmac } from 'crypto';
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  handleWebhookEvent,
  webhookHandler
} from './webhook-handler';
import { LicenseService, LicenseTier } from './raas-gate';

const WEBHOOK_SECRET = 'whsec_test_secret';

function generateSignature(payload: string): string {
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  return `whsec_${hmac.update(payload).digest('hex')}`;
}

describe('Webhook Handler', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
  });

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

    it('rejects missing prefix', () => {
      const payload = '{"type":"payment.success"}';
      const hmac = createHmac('sha256', WEBHOOK_SECRET);
      const signature = hmac.update(payload).digest('hex');
      expect(verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)).toBe(false);
    });
  });

  describe('parseWebhookPayload', () => {
    it('parses valid payload', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date().toISOString()
      });
      const signature = generateSignature(payload);
      const event = parseWebhookPayload(payload, signature, WEBHOOK_SECRET);
      expect(event.type).toBe('payment.success');
    });

    it('rejects expired timestamp', () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
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
  });

  describe('handleWebhookEvent', () => {
    it('handles payment.success event', async () => {
      const event = {
        type: 'payment.success',
        data: { license_key: 'test-key-123', tier: 'PRO' },
        timestamp: new Date().toISOString()
      };

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.licenseKey).toBe('test-key-123');
      expect(result.newTier).toBe('pro');
    });

    it('handles subscription.created event', async () => {
      const event = {
        type: 'subscription.created',
        data: { license_key: 'test-key-456', tier: 'ENTERPRISE' },
        timestamp: new Date().toISOString()
      };

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.newTier).toBe('enterprise');
    });

    it('handles subscription.cancelled event', async () => {
      const event = {
        type: 'subscription.cancelled',
        data: { license_key: 'test-key-789' },
        timestamp: new Date().toISOString()
      };

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.newTier).toBe('free');
    });

    it('handles subscription.refunded event', async () => {
      const event = {
        type: 'subscription.refunded',
        data: { license_key: 'test-key-refund' },
        timestamp: new Date().toISOString()
      };

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toContain('revoked');
    });

    it('returns false for unknown event type', async () => {
      const event = {
        type: 'unknown.event',
        data: {},
        timestamp: new Date().toISOString()
      };

      const result = await handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unhandled');
    });
  });

  describe('webhookHandler', () => {
    it('processes valid webhook request', async () => {
      const payload = JSON.stringify({
        type: 'payment.success',
        data: { license_key: 'test-key', tier: 'PRO' },
        timestamp: new Date().toISOString()
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
  });
});
