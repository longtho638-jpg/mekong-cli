/**
 * Webhook Hardening Test Suite
 *
 * Comprehensive tests for idempotency, retry logic, and webhook processing.
 *
 * Run with: npm test
 * or: npx vitest run
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withIdempotency,
  getIdempotencyStats
} from '../backend/lib/idempotency-manager';
import {
  withRetry,
  isRetryableError
} from '../backend/lib/retry-handler';

// ========== IDEMPOTENCY TESTS ==========

describe('Idempotency Manager', () => {
  beforeEach(() => {
    // Clear any previous test data
    vi.clearAllMocks();
  });

  it('should process event only once', async () => {
    let executionCount = 0;

    const handler = async () => {
      executionCount++;
      return 'success';
    };

    // First call - should execute
    const result1 = await withIdempotency('evt_123', 'payment.succeeded', handler);
    expect(executionCount).toBe(1);
    expect(result1).toBe('success');

    // Second call - should detect duplicate
    const result2 = await withIdempotency('evt_123', 'payment.succeeded', handler);
    expect(executionCount).toBe(1); // Still 1
    expect(result2).toBe(null);     // Duplicate detected
  });

  it('should process different events independently', async () => {
    let executionCount = 0;

    const handler = async () => {
      executionCount++;
      return 'success';
    };

    // Process event 1
    await withIdempotency('evt_001', 'payment.succeeded', handler);

    // Process event 2 (different ID)
    await withIdempotency('evt_002', 'payment.succeeded', handler);

    expect(executionCount).toBe(2); // Both executed
  });

  it('should track failed events separately', async () => {
    const handler = async () => {
      throw new Error('Processing failed');
    };

    // First attempt - should fail
    await expect(
      withIdempotency('evt_fail', 'payment.failed', handler)
    ).rejects.toThrow('Processing failed');

    // Check stats
    const stats = getIdempotencyStats();
    expect(stats.failed).toBe(1);
  });

  it('should provide accurate statistics', async () => {
    await withIdempotency('evt_a', 'type_a', async () => 'success');
    await withIdempotency('evt_b', 'type_b', async () => 'success');

    try {
      await withIdempotency('evt_c', 'type_c', async () => {
        throw new Error('fail');
      });
    } catch (e) {
      // Expected
    }

    const stats = getIdempotencyStats();
    expect(stats.totalEvents).toBe(3);
    expect(stats.processed).toBe(2);
    expect(stats.failed).toBe(1);
  });
});

// ========== RETRY LOGIC TESTS ==========

describe('Retry Handler', () => {
  it('should succeed on first attempt if handler succeeds', async () => {
    let attempts = 0;

    const handler = async () => {
      attempts++;
      return 'success';
    };

    const result = await withRetry(handler, { maxAttempts: 3 });

    expect(attempts).toBe(1);
    expect(result).toBe('success');
  });

  it('should retry on failure and succeed eventually', async () => {
    let attempts = 0;

    const handler = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await withRetry(handler, {
      maxAttempts: 3,
      initialDelayMs: 10 // Fast for testing
    });

    expect(attempts).toBe(3);
    expect(result).toBe('success');
  });

  it('should fail after max attempts', async () => {
    let attempts = 0;

    const handler = async () => {
      attempts++;
      throw new Error('Persistent failure');
    };

    await expect(
      withRetry(handler, {
        maxAttempts: 3,
        initialDelayMs: 10
      })
    ).rejects.toThrow('Retry failed after 3 attempts');

    expect(attempts).toBe(3);
  });

  it('should apply exponential backoff', async () => {
    const delays: number[] = [];
    let attempts = 0;

    const handler = async () => {
      const now = Date.now();
      if (attempts > 0) {
        delays.push(now);
      } else {
        delays.push(now); // First attempt baseline
      }
      attempts++;
      throw new Error('Fail');
    };

    try {
      await withRetry(handler, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2
      });
    } catch (e) {
      // Expected
    }

    // Verify exponential backoff: ~100ms, ~200ms, ~400ms
    const backoff1 = delays[1] - delays[0];
    const backoff2 = delays[2] - delays[1];

    expect(backoff1).toBeGreaterThanOrEqual(90);  // ~100ms
    expect(backoff1).toBeLessThanOrEqual(150);

    expect(backoff2).toBeGreaterThanOrEqual(180); // ~200ms
    expect(backoff2).toBeLessThanOrEqual(250);
  });

  it('should identify retryable errors correctly', () => {
    // Retryable errors
    expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);

    // Non-retryable errors
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
    expect(isRetryableError({ status: 404 })).toBe(false);
    expect(isRetryableError(new Error('Generic error'))).toBe(false);
  });
});

// ========== INTEGRATION TESTS ==========

describe('Webhook Processing Integration', () => {
  it('should combine idempotency and retry correctly', async () => {
    let attempts = 0;
    let processingCount = 0;

    const handler = async () => {
      processingCount++;
      attempts++;

      // Fail first 2 attempts
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }

      return 'success';
    };

    // First webhook delivery
    const result1 = await withIdempotency('evt_int_001', 'test', async () => {
      return await withRetry(handler, {
        maxAttempts: 3,
        initialDelayMs: 10
      });
    });

    expect(result1).toBe('success');
    expect(processingCount).toBe(3); // 2 retries + 1 success

    // Second webhook delivery (duplicate)
    const result2 = await withIdempotency('evt_int_001', 'test', async () => {
      return await withRetry(handler, {
        maxAttempts: 3,
        initialDelayMs: 10
      });
    });

    expect(result2).toBe(null);       // Duplicate detected
    expect(processingCount).toBe(3);   // No additional processing
  });

  it('should handle concurrent duplicate webhooks correctly', async () => {
    let processingCount = 0;

    const handler = async () => {
      processingCount++;
      // Simulate slow processing
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'success';
    };

    // Send 3 duplicate webhooks concurrently
    const promises = [
      withIdempotency('evt_concurrent', 'test', handler),
      withIdempotency('evt_concurrent', 'test', handler),
      withIdempotency('evt_concurrent', 'test', handler)
    ];

    const results = await Promise.all(promises);

    // Only one should process, others should return null
    const successCount = results.filter(r => r === 'success').length;
    const duplicateCount = results.filter(r => r === null).length;

    expect(successCount).toBe(1);
    expect(duplicateCount).toBe(2);
    expect(processingCount).toBe(1);
  });
});

// ========== MOCK WEBHOOK TESTS ==========

describe('Stripe Webhook Processing', () => {
  it('should reject webhooks with invalid signature', async () => {
    const { processStripeWebhook } = await import(
      '../backend/lib/stripe-webhook-handler-hardened'
    );

    const result = await processStripeWebhook(
      '{"type": "payment_intent.succeeded"}',
      'invalid_signature'
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('verification failed');
  });

  // Note: Full integration tests with real Stripe signatures
  // should use Stripe CLI for testing
});

describe('PayPal Webhook Processing', () => {
  it('should reject webhooks with missing headers', async () => {
    const { processPayPalWebhook } = await import(
      '../backend/lib/paypal-webhook-handler-hardened'
    );

    const result = await processPayPalWebhook(
      {}, // Empty headers
      '{"event_type": "PAYMENT.CAPTURE.COMPLETED"}'
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('verification failed');
  });

  // Note: Full integration tests with real PayPal webhooks
  // should use PayPal Sandbox
});

// ========== PERFORMANCE TESTS ==========

describe('Performance', () => {
  it('should process idempotency check in under 5ms', async () => {
    const handler = async () => 'success';

    // Warm up
    await withIdempotency('perf_001', 'test', handler);

    // Measure duplicate check performance
    const start = Date.now();
    await withIdempotency('perf_001', 'test', handler);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5);
  });

  it('should handle 100 concurrent webhooks', async () => {
    const handler = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'success';
    };

    const promises = Array.from({ length: 100 }, (_, i) =>
      withIdempotency(`perf_${i}`, 'test', handler)
    );

    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;

    // Should complete in under 1 second (parallel processing)
    expect(duration).toBeLessThan(1000);
  });
});
