/**
 * Polar Webhook Integration Tests
 */

import { PolarWebhookHandler } from './polar-webhook';
import { LicenseService } from '../../../lib/raas-gate';

class TestableWebhookHandler extends PolarWebhookHandler {
  async verifyWebhook(payload: string, sig: string): Promise<boolean> {
    return sig === 'valid-sig';
  }
}

describe('PolarWebhookHandler', () => {
  let handler: TestableWebhookHandler;
  let licenseService: LicenseService;

  beforeEach(() => {
    handler = new TestableWebhookHandler();
    licenseService = LicenseService.getInstance();
    licenseService.reset();
  });

  test('should handle subscription.created event', async () => {
    const mockPayload = JSON.stringify({
      type: 'subscription.created',
      data: { object: { id: 'sub_123', product_id: 'pro-monthly' } }
    });

    const result = await handler.handleWebhook(mockPayload, 'valid-sig');

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('subscription.created');
  });

  test('should handle subscription.cancelled event', async () => {
    licenseService.activateLicense('sub_123', 'pro');

    const mockPayload = JSON.stringify({
      type: 'subscription.cancelled',
      data: { object: { id: 'sub_123' } }
    });

    const result = await handler.handleWebhook(mockPayload, 'valid-sig');

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('subscription.cancelled');
  });

  test('should reject invalid webhook signature', async () => {
    const mockPayload = JSON.stringify({ type: 'test' });

    const result = await handler.handleWebhook(mockPayload, 'invalid-sig');

    expect(result.success).toBe(false);
  });
});
