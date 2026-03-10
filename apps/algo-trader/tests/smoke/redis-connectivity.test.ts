/**
 * Smoke Tests — Redis Connectivity Validation
 *
 * Verifies Redis connection for:
 * - Basic connectivity
 * - Pub/Sub functionality
 * - Rate limiter functionality
 * - BullMQ queue operations
 *
 * Requires Redis running on localhost:6379 or REDIS_URL env var.
 */

import Redis from 'ioredis';

describe('Smoke Tests — Redis Connectivity', () => {
  let redis: Redis | null = null;
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  beforeAll(() => {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailures: 100,
    });
  });

  afterAll(async () => {
    await redis?.quit();
  });

  // ── Basic Connectivity (P0) ──

  describe('Basic Redis Operations', () => {
    test('Redis connects successfully', async () => {
      if (!redis) return;
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });

    test('Redis can set and get values', async () => {
      if (!redis) return;
      const testKey = 'smoke:test:key';
      const testValue = 'smoke-test-value';

      await redis.set(testKey, testValue);
      const retrieved = await redis.get(testKey);

      expect(retrieved).toBe(testValue);

      // Cleanup
      await redis.del(testKey);
    });

    test('Redis TTL works correctly', async () => {
      if (!redis) return;
      const testKey = 'smoke:test:ttl';
      const ttlSeconds = 60;

      await redis.set(testKey, 'value', 'EX', ttlSeconds);
      const ttl = await redis.ttl(testKey);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(ttlSeconds);

      // Cleanup
      await redis.del(testKey);
    });
  });

  // ── Pub/Sub Functionality (P1) ──

  describe('Redis Pub/Sub', () => {
    test('Pub/Sub publish and subscribe work', async () => {
      if (!redis) return;
      const testChannel = 'smoke:test:channel';
      const testMessage = 'smoke-test-message';

      // Create subscriber
      const subscriber = new Redis(redisUrl);
      let receivedMessage: string | null = null;

      await subscriber.subscribe(testChannel);

      subscriber.on('message', (channel, message) => {
        if (channel === testChannel) {
          receivedMessage = message;
        }
      });

      // Small delay to ensure subscription is ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // Publish message
      const published = await redis.publish(testChannel, testMessage);
      expect(published).toBeGreaterThanOrEqual(1);

      // Wait for message delivery
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessage).toBe(testMessage);

      // Cleanup
      await subscriber.unsubscribe(testChannel);
      await subscriber.quit();
    });
  });

  // ── Rate Limiter (P1) ──

  describe('Rate Limiter Patterns', () => {
    test('Sliding window rate limiter pattern works', async () => {
      if (!redis) return;
      const testKey = 'smoke:rate:test';
      const windowMs = 60000; // 1 minute
      const maxRequests = 10;

      // Simulate rate limiting with sorted set
      const now = Date.now();
      const windowStart = now - windowMs;

      // Add requests
      await redis.zadd(testKey, now, `${now}-1`);
      await redis.zadd(testKey, now, `${now}-2`);

      // Remove old entries
      await redis.zremrangebyscore(testKey, 0, windowStart);

      // Count current entries
      const count = await redis.zcard(testKey);
      expect(count).toBeLessThanOrEqual(maxRequests);

      // Set expiry
      await redis.expire(testKey, Math.ceil(windowMs / 1000));

      // Cleanup
      await redis.del(testKey);
    });
  });

  // ── BullMQ Queue Patterns (P2) ──

  describe('BullMQ Queue Patterns', () => {
    test('Queue list operations work', async () => {
      if (!redis) return;
      const testQueue = 'smoke:test:queue';

      // Add job to list
      await redis.lpush(`${testQueue}:jobs`, JSON.stringify({ id: 1, data: 'test' }));

      // Check queue length
      const length = await redis.llen(`${testQueue}:jobs`);
      expect(length).toBeGreaterThanOrEqual(1);

      // Retrieve job
      const job = await redis.rpop(`${testQueue}:jobs`);
      expect(job).toBeDefined();

      // Cleanup
      await redis.del(`${testQueue}:jobs`);
    });
  });

  // ── Connection Health (P0) ──

  describe('Connection Health', () => {
    test('Redis info command returns server details', async () => {
      if (!redis) return;
      const info = await redis.info();
      expect(info).toContain('redis_version');
      expect(info).toContain('tcp_port');
    });

    test('Redis connection has reasonable latency (< 10ms local)', async () => {
      if (!redis) return;
      const start = Date.now();
      await redis.ping();
      const duration = Date.now() - start;

      // Local Redis should respond within 10ms
      expect(duration).toBeLessThan(10);
    });
  });
});
