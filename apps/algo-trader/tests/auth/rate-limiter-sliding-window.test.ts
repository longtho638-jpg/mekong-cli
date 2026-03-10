/**
 * Tests for SlidingWindowRateLimiter - in-memory rate limiting logic.
 */

import { SlidingWindowRateLimiter } from '../../src/auth/sliding-window-rate-limiter';

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter();
  });

  afterEach(() => {
    limiter.clear();
  });

  describe('check() - Basic functionality', () => {
    it('allows request when keyId not seen before', async () => {
      const result = await limiter.check('user-1', 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks request count correctly', async () => {
      await limiter.check('user-1', 5, 60000);
      const result2 = await limiter.check('user-1', 5, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);

      await limiter.check('user-1', 5, 60000);
      await limiter.check('user-1', 5, 60000);
      await limiter.check('user-1', 5, 60000);
      const result6 = await limiter.check('user-1', 5, 60000);
      expect(result6.allowed).toBe(false);
      expect(result6.remaining).toBe(0);
    });

    it('resets count when window expires', async () => {
      // Make some requests
      await limiter.check('user-1', 5, 100); // 100ms window

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 110));

      const result = await limiter.check('user-1', 5, 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      // ResetAt should be approximately now + window
      expect(result.resetAt).toBeCloseTo(Date.now() + 100, -2);
    });
  });

  describe('check() - Edge cases', () => {
    it('handles limit of 1', async () => {
      const result1 = await limiter.check('user-1', 1, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter.check('user-1', 1, 60000);
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('handles zero limit (edge case) - window starts with count 1', async () => {
      // With limit=0, first request allowed but has negative remaining
      const result = await limiter.check('user-1', 0, 60000);
      expect(result.allowed).toBe(true); // New window starts with count=1
      expect(result.remaining).toBe(-1); // 0 - 1 = -1
    });

    it('handles zero windowMs (edge case) - window always expires', async () => {
      // With windowMs=0, each request creates a new window
      const result1 = await limiter.check('user-1', 5, 0);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await limiter.check('user-1', 5, 0);
      expect(result2.allowed).toBe(true); // Fresh window since time diff >= 0
      expect(result2.remaining).toBe(4);
    });

    it('uses separate windows for different keyIds', async () => {
      await limiter.check('user-1', 1, 60000);
      await limiter.check('user-1', 1, 60000);

      // user-2 should still have first request allowed
      const result = await limiter.check('user-2', 1, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('handles large windowMs values', async () => {
      const result = await limiter.check('user-1', 5, 86400000); // 24 hours
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt - Date.now()).toBeCloseTo(86400000, -3);
    });

    it('handles multiple requests within window correctly', async () => {
      const limit = 10;
      for (let i = 1; i <= limit; i++) {
        const result = await limiter.check('user-1', limit, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i);
      }

      // 11th request should be blocked
      const result = await limiter.check('user-1', 10, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('headers() - Rate limit headers', () => {
    it('returns correct X-RateLimit-Remaining', () => {
      const result = {
        allowed: true,
        remaining: 5,
        resetAt: Date.now() + 60000,
      };
      const headers = limiter.headers(result);
      expect(headers['X-RateLimit-Remaining']).toBe('5');
    });

    it('X-RateLimit-Reset is Unix epoch seconds', () => {
      const fixedTime = 1700000000000;
      const result = {
        allowed: true,
        remaining: 5,
        resetAt: fixedTime,
      };
      const headers = limiter.headers(result);
      expect(headers['X-RateLimit-Reset']).toBe(Math.ceil(fixedTime / 1000).toString());
    });

    it('returns both required headers', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 30000,
      };
      const headers = limiter.headers(result);
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');
      expect(Object.keys(headers).length).toBe(2);
    });
  });

  describe('reset() - Reset specific keyId', () => {
    it('resets count for a specific keyId', async () => {
      // Exhaust limit for user-1
      await limiter.check('user-1', 2, 60000);
      await limiter.check('user-1', 2, 60000);

      // Should be blocked
      const blocked = await limiter.check('user-1', 2, 60000);
      expect(blocked.allowed).toBe(false);

      // Reset user-1
      limiter.reset('user-1');

      // Should be allowed again
      const allowed = await limiter.check('user-1', 2, 60000);
      expect(allowed.allowed).toBe(true);
      expect(allowed.remaining).toBe(1);
    });

    it('does not affect other keyIds', async () => {
      await limiter.check('user-1', 1, 60000);
      await limiter.check('user-1', 1, 60000);

      limiter.reset('user-1');

      // user-2 should still be blocked (if exhausted)
      await limiter.check('user-2', 1, 60000);
      await limiter.check('user-2', 1, 60000);
      const blocked = await limiter.check('user-2', 1, 60000);
      expect(blocked.allowed).toBe(false);
    });

    it('handles reset for non-existent keyId (no-op)', () => {
      expect(() => limiter.reset('non-existent')).not.toThrow();
    });
  });

  describe('clear() - Clear all state', () => {
    it('clears all rate limit state', async () => {
      await limiter.check('user-1', 5, 60000);
      await limiter.check('user-2', 5, 60000);
      await limiter.check('user-3', 5, 60000);

      limiter.clear();

      // All should be allowed again
      const result1 = await limiter.check('user-1', 5, 60000);
      const result2 = await limiter.check('user-2', 5, 60000);
      const result3 = await limiter.check('user-3', 5, 60000);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('resets counts to initial state', async () => {
      // Exhaust limits
      for (let i = 0; i < 10; i++) {
        await limiter.check('user-1', 10, 60000);
      }

      limiter.clear();

      const result = await limiter.check('user-1', 10, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('integration - End-to-end scenarios', () => {
    it('simulates real-world API rate limiting', async () => {
      const limit = 60; // 60 requests per minute
      const windowMs = 60000;

      // First 60 requests should succeed
      for (let i = 0; i < limit; i++) {
        const result = await limiter.check('api-client-1', limit, windowMs);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - 1 - i);
      }

      // 61st request should fail
      const blocked = await limiter.check('api-client-1', limit, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('handles concurrent requests (sequential simulation)', async () => {
      const limit = 3;
      const keyId = 'concurrent-user';

      // Simulate rapid sequential requests
      const results = await Promise.all([
        limiter.check(keyId, limit, 60000),
        limiter.check(keyId, limit, 60000),
        limiter.check(keyId, limit, 60000),
        limiter.check(keyId, limit, 60000), // Should fail
      ]);

      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);
      expect(results[3].allowed).toBe(false);
    });
  });
});
