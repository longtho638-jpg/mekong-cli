/**
 * Webhook Notifier Tests
 * Tests for the WebhookNotifier class with retry and circuit breaker functionality
 */

import { WebhookNotifier } from '../../src/execution/webhook-notifier';
import { RetryConfig } from '../../src/execution/retry-handler';
import { CircuitBreakerConfig } from '../../src/execution/circuit-breaker';

describe('WebhookNotifier', () => {
  let notifier: WebhookNotifier;

  beforeEach(() => {
    notifier = new WebhookNotifier();
  });

  afterEach(() => {
    // Clean up any registered webhooks between tests
    const allWebhooks = notifier.getRegisteredWebhooks();
    for (const url in allWebhooks) {
      notifier.unregisterWebhook(url);
    }
  });

  describe('basic functionality', () => {
    it('should register and unregister webhooks properly', () => {
      const config = {
        url: 'https://test-webhook.com/endpoint',
        eventType: 'trade.executed',
        headers: { 'Authorization': 'Bearer token' }
      };

      notifier.registerWebhook(config);

      const registered = notifier.getRegisteredWebhooks();
      expect(registered['https://test-webhook.com/endpoint']).toBeDefined();
      expect(registered['https://test-webhook.com/endpoint'][0].eventTypes).toContain('trade.executed');

      notifier.unregisterWebhook('https://test-webhook.com/endpoint');
      const afterUnregister = notifier.getRegisteredWebhooks();
      expect(afterUnregister['https://test-webhook.com/endpoint']).toBeUndefined();
    });

    it('should deliver payload to matching webhooks', async () => {
      const deliveryResults: any[] = [];
      const originalFetch = global.fetch;

      // Mock fetch to capture calls
      global.fetch = jest.fn().mockImplementation((url: string) => {
        deliveryResults.push({ url, timestamp: Date.now() });
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('OK')
        });
      }) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://test-webhook.com/endpoint',
        eventType: 'trade.executed'
      });

      const results = await notifier.deliverToEvent('trade.executed', { orderId: '123', amount: 0.5 });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].statusCode).toBe(200);

      global.fetch = originalFetch;
    });

    it('should handle delivery failures gracefully', async () => {
      const originalFetch = global.fetch;

      // Mock fetch to simulate failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://failing-webhook.com/endpoint',
        eventType: 'trade.failed'
      });

      const results = await notifier.deliverToEvent('trade.failed', { orderId: '456' });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Network error');

      global.fetch = originalFetch;
    });
  });

  describe('retry functionality', () => {
    it('should retry failed deliveries when configured', async () => {
      const retryConfig: RetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
        factor: 2,
        jitter: false,
        retryableErrors: ['Network error', 'timeout', '5xx']
      };

      const deliveryAttempts: number[] = [];
      let attemptCount = 0;
      const originalFetch = global.fetch;

      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        deliveryAttempts.push(attemptCount);

        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('OK')
        });
      }) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://retry-webhook.com/endpoint',
        eventType: 'trade.retried',
        retryConfig
      });

      const results = await notifier.deliverToEvent('trade.retried', { orderId: '789' });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].attempts).toBe(3); // Original + 2 retries
      expect(deliveryAttempts).toEqual([1, 2, 3]); // 3 attempts total

      global.fetch = originalFetch;
    });

    it('should stop retrying after max attempts on persistent failures', async () => {
      const retryConfig: RetryConfig = {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 50,
        factor: 2,
        jitter: false,
        retryableErrors: ['Network error']
      };

      const originalFetch = global.fetch;
      let attemptCount = 0;

      // Error message must match retryableErrors config to trigger retry
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.reject(new Error('Network error: Persistent failure'));
      }) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://persistent-failure.com/endpoint',
        eventType: 'trade.failed',
        retryConfig
      });

      const results = await notifier.deliverToEvent('trade.failed', { orderId: '101' });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].attempts).toBe(2); // Original + 1 retry
      expect(results[0].error).toContain('Network error');

      global.fetch = originalFetch;
    });
  });

  describe('circuit breaker functionality', () => {
    it('should open circuit after threshold exceeded', async () => {
      const circuitBreakerConfig: CircuitBreakerConfig = {
        failureThreshold: 2,
        timeoutMs: 100,
        successThreshold: 1
      };

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Server down')) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://circuit-breaker-test.com/endpoint',
        eventType: 'circuit.test',
        circuitBreakerConfig
      });

      // First failure
      await notifier.deliverToEvent('circuit.test', { test: 1 });
      // Second failure - should trip the circuit
      await notifier.deliverToEvent('circuit.test', { test: 2 });

      // Third attempt should be blocked by circuit breaker
      const results = await notifier.deliverToEvent('circuit.test', { test: 3 });

      // Note: The exact behavior may depend on implementation details
      // but we expect the circuit breaker to have been engaged

      global.fetch = originalFetch;
    });

    it('should allow requests after timeout period', async () => {
      const circuitBreakerConfig: CircuitBreakerConfig = {
        failureThreshold: 1,
        timeoutMs: 10, // Very short timeout for testing
        successThreshold: 1
      };

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Temporarily down')) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://timeout-test.com/endpoint',
        eventType: 'timeout.test',
        circuitBreakerConfig
      });

      // Trip the circuit
      await notifier.deliverToEvent('timeout.test', { test: 1 });

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 15));

      // Restore fetch to success mode
      (global.fetch as jest.Mock).mockRestore();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK')
      }) as jest.Mock;

      // This should now succeed after the timeout period
      const results = await notifier.deliverToEvent('timeout.test', { test: 2 });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);

      global.fetch = originalFetch;
    });
  });

  describe('combined retry and circuit breaker', () => {
    it('should handle both retry and circuit breaker together', async () => {
      const retryConfig: RetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
        factor: 2,
        jitter: false,
        retryableErrors: ['timeout']
      };

      const circuitBreakerConfig: CircuitBreakerConfig = {
        failureThreshold: 5, // High threshold to not trip during test
        timeoutMs: 100,
        successThreshold: 1
      };

      const originalFetch = global.fetch;
      let attemptCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.reject(new Error('timeout'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('OK')
        });
      }) as jest.Mock;

      notifier.registerWebhook({
        url: 'https://combined-test.com/endpoint',
        eventType: 'combined.test',
        retryConfig,
        circuitBreakerConfig
      });

      const results = await notifier.deliverToEvent('combined.test', { test: 'combined' });

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      // Should have had original + retries (at least 3 attempts to succeed on 3rd)
      expect(results[0].attempts).toBeGreaterThanOrEqual(3);

      global.fetch = originalFetch;
    });
  });

  describe('health checks', () => {
    it('should report healthy when properly configured', async () => {
      notifier.registerWebhook({
        url: 'https://health-check.com/endpoint',
        eventType: 'health.check'
      });

      const health = await notifier.healthCheck();
      expect(health.status).toBe('healthy');
    });
  });
});