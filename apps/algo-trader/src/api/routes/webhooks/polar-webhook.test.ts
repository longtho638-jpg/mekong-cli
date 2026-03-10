/**
 * Polar Webhook Integration Tests
 */

import { PolarWebhookHandler } from './polar-webhook';
import { LicenseService, LicenseTier } from '../../../lib/raas-gate';
import { PolarService } from '../../../payment/polar-service';

describe('PolarWebhookHandler', () => {
  let handler: PolarWebhookHandler;
  let licenseService: LicenseService;
  let polarServiceMock: jest.Mocked<PolarService>;

  beforeEach(() => {
    handler = new PolarWebhookHandler();
    licenseService = LicenseService.getInstance();
    licenseService.reset();

    polarServiceMock = {
      verifyWebhook: jest.fn().mockResolvedValue(true),
      parseWebhookEvent: jest.fn(),
    } as any;

    (handler as any).polarService = polarServiceMock;
  });

  test('should handle subscription.created event', async () => {
    const mockPayload = JSON.stringify({
      type: 'subscription.created',
      data: { object: { id: 'sub_123', product_id: 'pro-monthly' } }
    });

    polarServiceMock.parseWebhookEvent.mockReturnValue(JSON.parse(mockPayload));

    const result = await handler.handleWebhook(mockPayload, 'valid-sig');

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('subscription.created');
  });

  test('should handle subscription.cancelled event', async () => {
    licenseService.activateLicense('sub_123', LicenseTier.PRO);

    const mockPayload = JSON.stringify({
      type: 'subscription.cancelled',
      data: { object: { id: 'sub_123' } }
    });

    polarServiceMock.parseWebhookEvent.mockReturnValue(JSON.parse(mockPayload));

    const result = await handler.handleWebhook(mockPayload, 'valid-sig');

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('subscription.cancelled');
  });

  test('should reject invalid webhook signature', async () => {
    const mockPayload = JSON.stringify({ type: 'test' });
    polarServiceMock.verifyWebhook.mockResolvedValue(false);

    const result = await handler.handleWebhook(mockPayload, 'invalid-sig');

    expect(result.success).toBe(false);
    expect(result.eventType).toBe('invalid');
    expect(result.message).toContain('Invalid webhook signature');
  });
});
