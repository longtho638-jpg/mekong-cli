/**
 * Tests for SlidingWindowRateLimiter: allow, deny, window reset, headers.
 */
import { SlidingWindowRateLimiter } from './sliding-window-rate-limiter';

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter();
  });

  describe('check — within limit', () => {
    it('allows first request', async () => {
      const result = await limiter.check('key1', 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('allows requests up to the limit', async () => {
      for (let i = 0; i < 5; i++) {
        const r = await limiter.check('key1', 5, 60_000);
        expect(r.allowed).toBe(true);
      }
    });

    it('remaining decrements correctly', async () => {
      await limiter.check('key1', 10, 60_000); // 9 remaining
      await limiter.check('key1', 10, 60_000); // 8 remaining
      const r = await limiter.check('key1', 10, 60_000); // 7 remaining
      expect(r.remaining).toBe(7);
    });
  });

  describe('check — exceeding limit', () => {
    it('blocks on request exceeding limit', async () => {
      for (let i = 0; i < 3; i++) await limiter.check('key1', 3, 60_000);
      const r = await limiter.check('key1', 3, 60_000);
      expect(r.allowed).toBe(false);
      expect(r.remaining).toBe(0);
    });

    it('continues blocking until window resets', async () => {
      for (let i = 0; i < 3; i++) await limiter.check('key1', 3, 60_000);
      // 4th and 5th also blocked
      expect((await limiter.check('key1', 3, 60_000)).allowed).toBe(false);
      expect((await limiter.check('key1', 3, 60_000)).allowed).toBe(false);
    });
  });

  describe('check — window reset', () => {
    it('resets after window expires', async () => {
      // Exhaust with 1ms window
      for (let i = 0; i < 3; i++) await limiter.check('key1', 3, 1);
      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          const r = await limiter.check('key1', 3, 1);
          expect(r.allowed).toBe(true);
          expect(r.remaining).toBe(2);
          resolve();
        }, 10);
      });
    });
  });

  describe('check — isolation between keys', () => {
    it('tracks different keys independently', async () => {
      for (let i = 0; i < 3; i++) await limiter.check('keyA', 3, 60_000);
      expect((await limiter.check('keyA', 3, 60_000)).allowed).toBe(false);
      expect((await limiter.check('keyB', 3, 60_000)).allowed).toBe(true);
    });
  });

  describe('resetAt', () => {
    it('resetAt is in the future', async () => {
      const now = Date.now();
      const r = await limiter.check('key1', 5, 60_000);
      expect(r.resetAt).toBeGreaterThan(now);
    });

    it('resetAt reflects windowMs', async () => {
      const before = Date.now();
      const r = await limiter.check('key1', 5, 30_000);
      expect(r.resetAt).toBeGreaterThanOrEqual(before + 30_000);
    });
  });

  describe('headers', () => {
    it('returns X-RateLimit-Remaining and X-RateLimit-Reset', async () => {
      const r = await limiter.check('key1', 5, 60_000);
      const h = limiter.headers(r);
      expect(h['X-RateLimit-Remaining']).toBe('4');
      expect(typeof h['X-RateLimit-Reset']).toBe('string');
      expect(Number(h['X-RateLimit-Reset'])).toBeGreaterThan(0);
    });

    it('X-RateLimit-Remaining is 0 when blocked', async () => {
      for (let i = 0; i < 3; i++) await limiter.check('key1', 3, 60_000);
      const r = await limiter.check('key1', 3, 60_000);
      const h = limiter.headers(r);
      expect(h['X-RateLimit-Remaining']).toBe('0');
    });
  });

  describe('reset and clear', () => {
    it('reset allows requests again after manual reset', async () => {
      for (let i = 0; i < 3; i++) await limiter.check('key1', 3, 60_000);
      expect((await limiter.check('key1', 3, 60_000)).allowed).toBe(false);
      limiter.reset('key1');
      expect((await limiter.check('key1', 3, 60_000)).allowed).toBe(true);
    });

    it('clear removes all keys', async () => {
      for (let i = 0; i < 3; i++) {
        await limiter.check('key1', 3, 60_000);
        await limiter.check('key2', 3, 60_000);
      }
      limiter.clear();
      expect((await limiter.check('key1', 3, 60_000)).allowed).toBe(true);
      expect((await limiter.check('key2', 3, 60_000)).allowed).toBe(true);
    });
  });
});
