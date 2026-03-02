/**
 * Redis-backed sliding window rate limiter using atomic Lua script (INCR + EXPIRE).
 * Implements the same interface as the in-memory SlidingWindowLimiter so it can be
 * used as a drop-in replacement when Redis is available.
 * Falls back to an in-memory counter when Redis is unavailable.
 */

import { logger } from '../utils/logger';
import { createRedisConnection, IRedisClient } from './ioredis-connection-factory-and-singleton-pool';

// ─── Interface (matches in-memory SlidingWindowLimiter contract) ─────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  limit: number;
}

export interface IRateLimiter {
  check(key: string): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

// ─── Lua script for atomic INCR + EXPIRE ────────────────────────────────────
// Returns [current_count, ttl_ms]
// KEYS[1] = rate limit key, ARGV[1] = window_seconds, ARGV[2] = limit

const RATE_LIMIT_LUA = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit  = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, window)
end

local ttl = redis.call('TTL', key)
return {current, ttl}
`;

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface MemoryBucket {
  count: number;
  resetAt: number;
}

class InMemoryFallbackLimiter implements IRateLimiter {
  private buckets = new Map<string, MemoryBucket>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count++;
    const allowed = bucket.count <= this.limit;
    const remaining = Math.max(0, this.limit - bucket.count);
    const resetInMs = Math.max(0, bucket.resetAt - now);

    return { allowed, remaining, resetInMs, limit: this.limit };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

// ─── Redis rate limiter ───────────────────────────────────────────────────────

export class RedisRateLimiter implements IRateLimiter {
  private readonly limit: number;
  private readonly windowSeconds: number;
  private readonly keyPrefix: string;
  private redis: IRedisClient | null = null;
  private fallback: InMemoryFallbackLimiter;

  constructor(options: {
    limit: number;
    windowSeconds: number;
    keyPrefix?: string;
  }) {
    this.limit = options.limit;
    this.windowSeconds = options.windowSeconds;
    this.keyPrefix = options.keyPrefix ?? 'rl';
    this.fallback = new InMemoryFallbackLimiter(
      options.limit,
      options.windowSeconds * 1000
    );
  }

  private getRedis(): IRedisClient | null {
    if (!this.redis) {
      try {
        this.redis = createRedisConnection();
      } catch {
        return null;
      }
    }
    return this.redis;
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async check(key: string): Promise<RateLimitResult> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[RateLimiter] Redis unavailable — using in-memory fallback');
      return this.fallback.check(key);
    }

    try {
      const redisKey = this.buildKey(key);
      const result = await redis.eval(
        RATE_LIMIT_LUA,
        1,             // numkeys
        redisKey,      // KEYS[1]
        String(this.windowSeconds), // ARGV[1]
        String(this.limit)          // ARGV[2]
      ) as [number, number];

      const [current, ttl] = result;
      const allowed = current <= this.limit;
      const remaining = Math.max(0, this.limit - current);
      const resetInMs = ttl > 0 ? ttl * 1000 : this.windowSeconds * 1000;

      return { allowed, remaining, resetInMs, limit: this.limit };
    } catch (err) {
      logger.warn(
        `[RateLimiter] Redis eval error, falling back: ` +
        `${err instanceof Error ? err.message : String(err)}`
      );
      return this.fallback.check(key);
    }
  }

  async reset(key: string): Promise<void> {
    const redis = this.getRedis();
    if (redis) {
      try {
        await redis.del(this.buildKey(key));
      } catch (err) {
        logger.warn(`[RateLimiter] Reset error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    await this.fallback.reset(key);
  }
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

/** 100 requests per 60 seconds per tenant — API default */
export function createApiRateLimiter(): IRateLimiter {
  return new RedisRateLimiter({ limit: 100, windowSeconds: 60, keyPrefix: 'rl:api' });
}

/** 10 backtest jobs per 60 seconds per tenant */
export function createBacktestRateLimiter(): IRateLimiter {
  return new RedisRateLimiter({ limit: 10, windowSeconds: 60, keyPrefix: 'rl:backtest' });
}

/** 5 webhook deliveries per 10 seconds per tenant */
export function createWebhookRateLimiter(): IRateLimiter {
  return new RedisRateLimiter({ limit: 5, windowSeconds: 10, keyPrefix: 'rl:webhook' });
}
