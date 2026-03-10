/**
 * Comprehensive but lightweight integration tests for the retry handler in the algo-trader project.
 * These tests verify that the retry mechanisms work correctly in various scenarios.
 */

import { RetryHandler, RetryConfig } from '../../src/execution/retry-handler';
import { WebhookNotifier, WebhookEventType, WebhookConfig } from '../../src/core/trading-event-webhook-notifier-with-hmac-retry';

describe('Retry Handler Integration Tests', () => {
  test('should retry on network errors and eventually succeed', async () => {
    const config: RetryConfig = {
      maxRetries: 3,
      baseDelayMs: 1,  // Reduced for faster tests
      maxDelayMs: 10,
      factor: 1,
      jitter: false,    // Disabled for predictable tests
      retryableErrors: ['timeout', 'network error', 'rate limit']
    };

    const retryHandler = new RetryHandler(config);

    // Create a mock operation that fails twice then succeeds
    let callCount = 0;
    const operation = jest.fn(async () => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('timeout occurred');
      }
      return { data: 'success' };
    });

    const result = await retryHandler.execute(operation);

    expect(result).toEqual({ data: 'success' });
    expect(operation).toHaveBeenCalledTimes(3); // Original + 2 retries

    const metrics = retryHandler.getMetrics();
    expect(metrics.attempts).toBe(3);
    expect(metrics.successfulRetries).toBe(1); // One retry succeeded
  });

  test('should stop retrying after max attempts on persistent failures', async () => {
    const config: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 1,
      maxDelayMs: 10,
      factor: 1,
      jitter: false,
      retryableErrors: ['server error']  // Make 'server error' retryable
    };

    const retryHandler = new RetryHandler(config);

    const operation = jest.fn().mockRejectedValue(new Error('server error'));

    await expect(retryHandler.execute(operation)).rejects.toThrow('server error');

    expect(operation).toHaveBeenCalledTimes(3); // Original + 2 retries

    const metrics = retryHandler.getMetrics();
    expect(metrics.attempts).toBe(3); // Original attempt + 2 retries
  });

  test('should not retry on non-retryable errors', async () => {
    const config: RetryConfig = {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
      factor: 1,
      jitter: false,
      retryableErrors: ['timeout']  // Only timeout is retryable
    };

    const retryHandler = new RetryHandler(config);

    const operation = jest.fn().mockRejectedValue(new Error('invalid input'));

    await expect(retryHandler.execute(operation)).rejects.toThrow('invalid input');

    expect(operation).toHaveBeenCalledTimes(1); // Should have only tried once since it's not a retryable error

    const metrics = retryHandler.getMetrics();
    expect(metrics.attempts).toBe(1);
  });
});

describe('Webhook Notifier Integration Tests', () => {
  test('should handle webhook registration and delivery log properly', () => {
    const webhookNotifier = new WebhookNotifier();

    // Test webhook registration
    const config = {
      url: 'https://webhook.example.com/test',
      events: ['trade.executed'] as WebhookEventType[],
      retries: 2,
      timeoutMs: 3000
    };

    webhookNotifier.register(config);

    // Verify registration worked
    const registeredHooks = webhookNotifier.listWebhooks();
    expect(registeredHooks.length).toBe(1);
    expect(registeredHooks[0].url).toBe('https://webhook.example.com/test');
    expect(registeredHooks[0].retries).toBe(2);

    // Test delivery log functionality
    const initialLog = webhookNotifier.getDeliveryLog();
    expect(Array.isArray(initialLog)).toBe(true);

    const limitedLog = webhookNotifier.getDeliveryLog(10);
    expect(Array.isArray(limitedLog)).toBe(true);

    expect(webhookNotifier).toBeDefined();
  });

  test('should handle webhook unregistration properly', () => {
    const webhookNotifier = new WebhookNotifier();

    const config: WebhookConfig = {
      url: 'https://test-webhook.com/endpoint',
      events: ['trade.executed'] as WebhookEventType[],
      retries: 2,
      timeoutMs: 3000
    };

    // Register the webhook
    webhookNotifier.register(config);

    // Verify it's registered
    let registered = webhookNotifier.listWebhooks();
    expect(registered.length).toBe(1);

    // Unregister to test that functionality
    webhookNotifier.unregister('https://test-webhook.com/endpoint');
    const remaining = webhookNotifier.listWebhooks();
    expect(remaining.length).toBe(0);
  });
});

// Combined test: Test retry handler principles with webhook notifier
describe('Integrated Retry and Webhook Tests', () => {
  test('should have proper retry configuration for webhook notifier', () => {
    const webhookNotifier = new WebhookNotifier();

    // Register a webhook with retry configuration
    const config: WebhookConfig = {
      url: 'https://api.example.com/webhook',
      events: ['trade.executed', 'signal.detected'] as WebhookEventType[],
      retries: 3,
      timeoutMs: 5000
    };

    webhookNotifier.register(config);

    // Get registered webhooks to verify configuration
    const registeredHooks = webhookNotifier.listWebhooks();
    expect(registeredHooks.length).toBe(1);
    expect(registeredHooks[0].retries).toBe(3);
    expect(registeredHooks[0].timeoutMs).toBe(5000);

    // Verify that delivery log is properly maintained
    const initialLog = webhookNotifier.getDeliveryLog();
    expect(Array.isArray(initialLog)).toBe(true);
  });
});