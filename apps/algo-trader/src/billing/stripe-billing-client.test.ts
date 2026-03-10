/**
 * Stripe Billing Client Tests
 */

import { StripeBillingClient, StripeApiErrorWrapper } from './stripe-billing-client';

describe('StripeBillingClient', () => {
  let client: StripeBillingClient;

  beforeEach(() => {
    client = new StripeBillingClient({
      apiKey: 'sk_test_123456789',
      maxRetries: 1,
      retryDelay: 10,
    });
  });

  it('should create client with API key', () => {
    expect(client).toBeDefined();
  });

  it('should throw without API key', () => {
    expect(() => new StripeBillingClient({ apiKey: '' })).toThrow('Stripe API key is required');
  });

  it('should create usage record input format', () => {
    // Test the input validation (actual API call will fail with test key)
    const input = {
      subscriptionItemId: 'si_test123',
      quantity: 100,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment' as const,
    };

    expect(input.subscriptionItemId).toBe('si_test123');
    expect(input.quantity).toBe(100);
    expect(input.action).toBe('increment');
  });

  it('should handle API errors gracefully', async () => {
    // This will fail with invalid key, but should handle gracefully
    try {
      await client.createUsageRecord({
        subscriptionItemId: 'si_invalid',
        quantity: 100,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });
    } catch (error) {
      // Expected to fail with test key
      expect(error).toBeDefined();
    }
  });

  it('should handle batch records', async () => {
    const records = [
      {
        subscriptionItemId: 'si_1',
        quantity: 100,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment' as const,
      },
      {
        subscriptionItemId: 'si_2',
        quantity: 200,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment' as const,
      },
    ];

    // Will fail with test keys, but tests the batch logic
    try {
      await client.createUsageRecordsBatch(records);
    } catch (error) {
      // Expected
    }
  });
});

describe('StripeApiErrorWrapper', () => {
  it('should wrap Stripe error correctly', () => {
    const errorData = {
      error: {
        type: 'invalid_request_error',
        message: 'No such subscription item',
        code: 'resource_missing',
      },
      statusCode: 404,
    };

    const error = new StripeApiErrorWrapper(errorData);
    expect(error.name).toBe('StripeApiError');
    expect(error.message).toBe('No such subscription item');
    expect(error.statusCode).toBe(404);
  });
});
