/**
 * Rate Limiting - Integration Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitHeaders,
  resetAllRateLimits,
} from '../../src/lib/rate-limiter';
import { LicenseTier } from '../../src/lib/raas-gate';

describe('Rate Limiting - Integration', () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  describe('Multi-tenant isolation', () => {
    test('should isolate rate limits per API key', () => {
      const keys = ['key-a', 'key-b', 'key-c'];

      checkRateLimit(keys[0], LicenseTier.FREE);
      checkRateLimit(keys[0], LicenseTier.FREE);

      expect(checkRateLimit(keys[0], LicenseTier.FREE)).toBe(false);
      expect(checkRateLimit(keys[1], LicenseTier.FREE)).toBe(true);
      expect(checkRateLimit(keys[2], LicenseTier.FREE)).toBe(true);
    });
  });

  describe('Tier limits', () => {
    test('FREE tier: 10 req/min, burst 2', () => {
      const config = getRateLimitConfig(LicenseTier.FREE);
      expect(config.requestsPerMinute).toBe(10);
      expect(config.burstLimit).toBe(2);
    });

    test('PRO tier: 100 req/min, burst 10', () => {
      const config = getRateLimitConfig(LicenseTier.PRO);
      expect(config.requestsPerMinute).toBe(100);
      expect(config.burstLimit).toBe(10);
    });

    test('ENTERPRISE tier: 1000 req/min, burst 50', () => {
      const config = getRateLimitConfig(LicenseTier.ENTERPRISE);
      expect(config.requestsPerMinute).toBe(1000);
      expect(config.burstLimit).toBe(50);
    });
  });

  describe('Burst protection', () => {
    test('should block rapid requests', () => {
      const key = 'burst-test';
      let allowed = 0;

      for (let i = 0; i < 10; i++) {
        if (checkRateLimit(key, LicenseTier.FREE)) allowed++;
      }

      expect(allowed).toBe(2);
    });

    test('PRO tier allows higher burst', () => {
      const key = 'pro-burst';
      let allowed = 0;

      for (let i = 0; i < 20; i++) {
        if (checkRateLimit(key, LicenseTier.PRO)) allowed++;
      }

      expect(allowed).toBe(10);
    });
  });

  describe('Headers', () => {
    test('should show remaining count', () => {
      const key = 'header-test';
      const before = getRateLimitHeaders(key);
      checkRateLimit(key, LicenseTier.FREE);
      const after = getRateLimitHeaders(key);

      expect(parseInt(after['X-RateLimit-Remaining']))
        .toBe(parseInt(before['X-RateLimit-Remaining']) - 1);
    });

    test('should show FREE tier limit in headers', () => {
      checkRateLimit('free-key', LicenseTier.FREE);
      const freeHeaders = getRateLimitHeaders('free-key');

      expect(freeHeaders['X-RateLimit-Limit']).toBe('10');
      expect(freeHeaders['X-RateLimit-Hour-Limit']).toBe('100');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty key', () => {
      expect(() => checkRateLimit('', LicenseTier.FREE)).not.toThrow();
      expect(checkRateLimit('', LicenseTier.FREE)).toBe(true);
    });

    test('should handle unicode key', () => {
      expect(checkRateLimit('🚀-key', LicenseTier.FREE)).toBe(true);
    });

    test('should handle long key', () => {
      expect(checkRateLimit('a'.repeat(1000), LicenseTier.FREE)).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    test('should block scraper', () => {
      let allowed = 0;
      for (let i = 0; i < 50; i++) {
        if (checkRateLimit('scraper', LicenseTier.FREE)) allowed++;
      }
      expect(allowed).toBe(2);
    });

    test('should allow PRO user', () => {
      let allowed = 0;
      for (let i = 0; i < 50; i++) {
        if (checkRateLimit('pro-' + i, LicenseTier.PRO)) allowed++;
      }
      expect(allowed).toBe(50);
    });

    test('should allow ENTERPRISE bulk', () => {
      let allowed = 0;
      for (let i = 0; i < 500; i++) {
        if (checkRateLimit('ent-' + i, LicenseTier.ENTERPRISE)) allowed++;
      }
      expect(allowed).toBe(500);
    });
  });
});
