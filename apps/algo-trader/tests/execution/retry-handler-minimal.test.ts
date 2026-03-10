/**
 * Minimal integration test for the retry handler in the algo-trader project.
 * This test is simplified to avoid process termination issues.
 */

import { RetryHandler, RetryConfig } from '../../src/execution/retry-handler';
import { WebhookNotifier, WebhookEventType } from '../../src/core/trading-event-webhook-notifier-with-hmac-retry';

describe('Minimal Retry Handler Test', () => {
  test('should verify basic retry handler creation', () => {
    const config: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 100,
      factor: 2,
      jitter: false,
      retryableErrors: ['timeout', 'network error']
    };

    const retryHandler = new RetryHandler(config);
    expect(retryHandler).toBeDefined();

    const metrics = retryHandler.getMetrics();
    expect(metrics.attempts).toBe(0);
    expect(metrics.successfulRetries).toBe(0);
  });
});

describe('Minimal Webhook Notifier Test', () => {
  test('should verify basic webhook notifier creation and functionality', () => {
    const webhookNotifier = new WebhookNotifier();
    expect(webhookNotifier).toBeDefined();

    // Test basic registration
    const config = {
      url: 'https://test.example.com/webhook',
      events: ['trade.executed'] as WebhookEventType[],
      retries: 2,
      timeoutMs: 3000
    };

    webhookNotifier.register(config);

    const registeredHooks = webhookNotifier.listWebhooks();
    expect(registeredHooks.length).toBe(1);
    expect(registeredHooks[0].url).toBe('https://test.example.com/webhook');
    expect(registeredHooks[0].retries).toBe(2);

    // Test delivery log
    const log = webhookNotifier.getDeliveryLog();
    expect(Array.isArray(log)).toBe(true);
  });
});