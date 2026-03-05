/**
 * Rate Limiter Unit Tests
 */

import { checkRateLimit, getRateLimitUsage, resetRateLimit } from './rate-limiter';

describe('Rate Limiter', () => {
  describe('checkRateLimit', () => {
    test('should allow first request', () => {
      const result = checkRateLimit('test-user-1');
      expect(result).toBe(true);
    });

    test('should track per-user separately', () => {
      checkRateLimit('user-a');
      checkRateLimit('user-b');

      const usageA = getRateLimitUsage('user-a');
      const usageB = getRateLimitUsage('user-b');
      expect(usageA.minuteUsage).toBeGreaterThanOrEqual(1);
      expect(usageB.minuteUsage).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRateLimitUsage', () => {
    test('should return usage for new user', () => {
      const usage = getRateLimitUsage('new-user-xyz');
      expect(usage.minuteUsage).toBeDefined();
      expect(usage.limit).toBeDefined();
    });

    test('should increment minute usage', () => {
      checkRateLimit('user-inc');
      checkRateLimit('user-inc');
      const usage = getRateLimitUsage('user-inc');
      expect(usage.minuteUsage).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resetRateLimit', () => {
    test('should reset user requests', () => {
      checkRateLimit('user-reset');
      checkRateLimit('user-reset');

      resetRateLimit('user-reset');

      const usage = getRateLimitUsage('user-reset');
      expect(usage.minuteUsage).toBe(0);
      expect(usage.hourUsage).toBe(0);
    });
  });
});
