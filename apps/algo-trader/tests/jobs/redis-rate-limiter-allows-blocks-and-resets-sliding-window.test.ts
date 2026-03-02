/**
 * Tests for redis-sliding-window-rate-limiter-with-lua-atomic-increment.ts
 * Verifies: allow under limit, block at limit, reset, TTL propagation,
 * and graceful fallback to in-memory when Redis is unavailable.
 */

// ─── Redis mock ───────────────────────────────────────────────────────────────

let mockEvalCounter = 0;
let mockTtl = 60;

const mockEval = jest.fn().mockImplementation(
  (_script: string, _numkeys: number, _key: string, _window: string, _limit: string) => {
    mockEvalCounter++;
    return Promise.resolve([mockEvalCounter, mockTtl]);
  }
);

const mockDel = jest.fn().mockResolvedValue(1);

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    status: 'ready',
    on: jest.fn().mockReturnThis(),
    quit: jest.fn().mockResolvedValue('OK'),
    duplicate: jest.fn().mockReturnThis(),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    del: mockDel,
    eval: mockEval,
  })),
  { virtual: true }
);

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  RedisRateLimiter,
  createApiRateLimiter,
  createBacktestRateLimiter,
  createWebhookRateLimiter,
} from '../../src/jobs/redis-sliding-window-rate-limiter-with-lua-atomic-increment';
import { clearPool } from '../../src/jobs/ioredis-connection-factory-and-singleton-pool';

describe('RedisRateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEvalCounter = 0;
    mockTtl = 60;
    clearPool();
  });

  // ─── Basic allow/block ───────────────────────────────────────────────────────

  describe('check() — Redis-backed', () => {
    it('allows request when under limit', async () => {
      mockEvalCounter = 0; // next call returns count=1
      const limiter = new RedisRateLimiter({ limit: 5, windowSeconds: 60 });

      const result = await limiter.check('tenant-1');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4); // 5 - 1
    });

    it('blocks request when count exceeds limit', async () => {
      mockEvalCounter = 5; // next call returns count=6
      const limiter = new RedisRateLimiter({ limit: 5, windowSeconds: 60 });

      const result = await limiter.check('tenant-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('allows exactly at the limit boundary', async () => {
      mockEvalCounter = 4; // next call returns count=5 (at limit)
      const limiter = new RedisRateLimiter({ limit: 5, windowSeconds: 60 });

      const result = await limiter.check('tenant-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('propagates TTL as resetInMs', async () => {
      mockTtl = 30;
      mockEvalCounter = 0;
      const limiter = new RedisRateLimiter({ limit: 10, windowSeconds: 60 });

      const result = await limiter.check('tenant-1');

      expect(result.resetInMs).toBe(30_000); // 30s * 1000
    });

    it('calls redis.eval with correct key prefix', async () => {
      const limiter = new RedisRateLimiter({
        limit: 10,
        windowSeconds: 60,
        keyPrefix: 'rl:test',
      });

      await limiter.check('user-99');

      expect(mockEval).toHaveBeenCalledTimes(1);
      const callArgs = mockEval.mock.calls[0] as unknown[];
      // KEYS[1] = rl:test:user-99
      expect(callArgs[2]).toBe('rl:test:user-99');
    });
  });

  // ─── reset() ────────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('calls redis.del with the correct key', async () => {
      const limiter = new RedisRateLimiter({
        limit: 5,
        windowSeconds: 60,
        keyPrefix: 'rl:api',
      });

      await limiter.reset('tenant-7');

      expect(mockDel).toHaveBeenCalledWith('rl:api:tenant-7');
    });
  });

  // ─── Fallback to in-memory ────────────────────────────────────────────────────

  describe('in-memory fallback when Redis eval throws', () => {
    it('falls back gracefully and still enforces limit', async () => {
      mockEval.mockRejectedValueOnce(new Error('Redis EVAL error'));

      const limiter = new RedisRateLimiter({ limit: 3, windowSeconds: 60 });
      // First call triggers eval failure → falls back to in-memory (count=1)
      const result = await limiter.check('tenant-fallback');

      expect(result.allowed).toBe(true); // count=1, limit=3
      expect(result.remaining).toBe(2);
    });

    it('blocks after in-memory limit exceeded', async () => {
      mockEval.mockRejectedValue(new Error('always fail'));

      const limiter = new RedisRateLimiter({ limit: 2, windowSeconds: 60 });
      await limiter.check('tenant-x'); // count=1
      await limiter.check('tenant-x'); // count=2
      const result = await limiter.check('tenant-x'); // count=3 > limit=2

      expect(result.allowed).toBe(false);
    });
  });

  // ─── Factory helpers ─────────────────────────────────────────────────────────

  describe('factory helpers', () => {
    it('createApiRateLimiter returns IRateLimiter with check/reset', () => {
      const limiter = createApiRateLimiter();
      expect(typeof limiter.check).toBe('function');
      expect(typeof limiter.reset).toBe('function');
    });

    it('createBacktestRateLimiter returns IRateLimiter', () => {
      const limiter = createBacktestRateLimiter();
      expect(typeof limiter.check).toBe('function');
    });

    it('createWebhookRateLimiter returns IRateLimiter', () => {
      const limiter = createWebhookRateLimiter();
      expect(typeof limiter.check).toBe('function');
    });

    it('createApiRateLimiter allows first request', async () => {
      mockEvalCounter = 0;
      const limiter = createApiRateLimiter();
      const result = await limiter.check('tenant-api-1');
      expect(result.allowed).toBe(true);
    });
  });
});
