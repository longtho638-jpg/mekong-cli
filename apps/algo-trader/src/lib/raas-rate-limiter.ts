/**
 * Redis-backed Rate Limiter for RaaS
 *
 * Per-tenant, per-tier rate limiting using sliding window algorithm.
 * Supports distributed rate limiting across multiple instances.
 *
 * Features:
 * - Sliding window log algorithm for precise rate limiting
 * - Atomic operations with Lua scripting
 * - Per-tenant isolation
 * - Tier-based limits configuration
 * - Graceful degradation to in-memory on Redis failure
 *
 * @see https://redis.io/commands/zadd/
 * @see https://redis.io/commands/zremrangebyscore/
 */

import Redis, { RedisOptions } from 'ioredis';
import { RaasTier } from './raas-auth-middleware';
import { logger } from '../utils/logger';

// Re-export RaasTier for convenience
export { RaasTier };

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Rate limit configuration per tier
 */
export interface TierRateLimitConfig {
  rpm: number; // Requests per minute
  burst: number; // Max requests in 1 second (burst protection)
  hourlyLimit?: number; // Optional hourly limit
}

/**
 * Default tier configurations
 *
 * These are conservative defaults. Adjust based on your infrastructure
 * and business requirements.
 */
const DEFAULT_TIER_LIMITS: Record<RaasTier, TierRateLimitConfig> = {
  [RaasTier.FREE]: {
    rpm: 10,
    burst: 2,
    hourlyLimit: 100,
  },
  [RaasTier.STARTER]: {
    rpm: 60,
    burst: 5,
    hourlyLimit: 1000,
  },
  [RaasTier.GROWTH]: {
    rpm: 300,
    burst: 10,
    hourlyLimit: 5000,
  },
  [RaasTier.PRO]: {
    rpm: 1000,
    burst: 30,
    hourlyLimit: 20000,
  },
  [RaasTier.ENTERPRISE]: {
    rpm: 5000,
    burst: 100,
    hourlyLimit: 100000,
  },
};

/**
 * Lua script for atomic sliding window rate limiting
 *
 * This script performs the following atomically:
 * 1. Remove old entries outside the window
 * 2. Count current entries
 * 3. If under limit, add new entry
 * 4. Return remaining count and reset time
 *
 * KEYS[1]: Rate limit key (e.g., "ratelimit:{tenantId}:{endpoint}")
 * ARGV[1]: Current timestamp (ms)
 * ARGV[2]: Window size (ms)
 * ARGV[3]: Max requests allowed
 * ARGV[4]: Unique request ID
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local requestId = ARGV[4]

-- Calculate window boundaries
local windowStart = now - windowMs

-- Remove old entries outside the window
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- Count current requests in window
local currentCount = redis.call('ZCARD', key)

-- Calculate reset time
local firstEntry = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local resetAt = 0
if firstEntry and #firstEntry >= 2 then
  resetAt = tonumber(firstEntry[2]) + windowMs
else
  resetAt = now + windowMs
end

-- Check if under limit
if currentCount < limit then
  -- Add new request with current timestamp as score
  redis.call('ZADD', key, now, requestId)
  -- Set expiry on the key (cleanup safety)
  redis.call('PEXPIRE', key, windowMs * 2)

  return {1, limit - currentCount - 1, resetAt} -- allowed, remaining, resetAt
else
  return {0, 0, resetAt} -- not allowed, 0 remaining, resetAt
end
`;

/**
 * Lua script for burst rate limiting (1-second window)
 */
const BURST_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local burstLimit = tonumber(ARGV[2])
local requestId = ARGV[3]

-- 1-second window for burst
local windowStart = now - 1000

-- Remove old entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- Count current requests
local currentCount = redis.call('ZCARD', key)

-- Check burst limit
if currentCount < burstLimit then
  redis.call('ZADD', key, now, requestId)
  redis.call('PEXPIRE', key, 2000) -- 2 second expiry
  return {1, burstLimit - currentCount - 1}
else
  return {0, 0}
end
`;

/**
 * In-memory fallback store (used when Redis is unavailable)
 */
interface InMemoryState {
  requests: number[]; // Timestamps
  lastCleanup: number;
}

/**
 * Redis Rate Limiter configuration
 */
export interface RaasRateLimiterConfig {
  redisUrl?: string;
  redisOptions?: RedisOptions;
  tierLimits?: Partial<Record<RaasTier, TierRateLimitConfig>>;
  fallbackToMemory?: boolean; // Graceful degradation
  windowMs?: number; // Default window size (60000ms = 1 minute)
}

/**
 * Rate limit state for key
 */
interface RateLimitState {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Redis-backed Rate Limiter
 *
 * Singleton pattern for consistent state across the application.
 * Automatically falls back to in-memory rate limiting if Redis is unavailable.
 */
export class RaasRateLimiter {
  private static instance: RaasRateLimiter;

  private redis: Redis | null = null;
  private redisConnected: boolean = false;
  private inMemoryStore: Map<string, InMemoryState> = new Map();
  private tierLimits: Record<RaasTier, TierRateLimitConfig>;
  private windowMs: number;
  private fallbackEnabled: boolean = false;
  private fallbackToMemory: boolean; // Store config option

  private constructor(config?: RaasRateLimiterConfig) {
    this.windowMs = config?.windowMs || 60000; // 1 minute default
    this.fallbackToMemory = config?.fallbackToMemory ?? true;
    this.tierLimits = {
      ...DEFAULT_TIER_LIMITS,
      ...(config?.tierLimits || {}),
    };

    // Initialize Redis connection
    const redisUrl = config?.redisUrl || process.env.REDIS_URL;
    if (redisUrl) {
      this.initializeRedis(redisUrl, config?.redisOptions);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: RaasRateLimiterConfig): RaasRateLimiter {
    if (!RaasRateLimiter.instance) {
      RaasRateLimiter.instance = new RaasRateLimiter(config);
    }
    return RaasRateLimiter.instance;
  }

  /**
   * Initialize Redis connection with error handling
   */
  private async initializeRedis(
    redisUrl: string,
    options?: RedisOptions
  ): Promise<void> {
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        ...options,
      });

      this.redis.on('connect', () => {
        logger.info('[RaasRateLimiter] Redis connected');
        this.redisConnected = true;
        this.fallbackEnabled = false;
      });

      this.redis.on('error', (error) => {
        logger.warn('[RaasRateLimiter] Redis error', { error: error.message });
        this.redisConnected = false;

        if (this.fallbackToMemory) {
          this.fallbackEnabled = true;
          logger.warn('[RaasRateLimiter] Fallback to in-memory rate limiting');
        }
      });

      this.redis.on('close', () => {
        logger.warn('[RaasRateLimiter] Redis connection closed');
        this.redisConnected = false;
        if (this.fallbackToMemory) {
          this.fallbackEnabled = true;
        }
      });

      // Define Lua scripts
      await this.defineLuaScripts();
    } catch (error) {
      logger.error('[RaasRateLimiter] Failed to initialize Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.fallbackEnabled = true;
    }
  }

  /**
   * Define Lua scripts on Redis instance
   */
  private async defineLuaScripts(): Promise<void> {
    if (!this.redis) return;

    // Define sliding window script
    (this.redis as any).defineCommand('slidingWindow', {
      numberOfKeys: 1,
      lua: SLIDING_WINDOW_SCRIPT,
    });

    // Define burst limit script
    (this.redis as any).defineCommand('burstLimit', {
      numberOfKeys: 1,
      lua: BURST_LIMIT_SCRIPT,
    });
  }

  /**
   * Check rate limit for a tenant
   *
   * @param tenantId - Unique tenant identifier
   * @param tier - Subscription tier
   * @param endpoint - Optional endpoint for specific rate limits
   * @returns Rate limit result with allowed status and metadata
   */
  async checkLimit(
    tenantId: string,
    tier: RaasTier,
    endpoint: string = 'default'
  ): Promise<RateLimitResult> {
    const config = this.tierLimits[tier] || DEFAULT_TIER_LIMITS[tier];
    const now = Date.now();
    const requestId = `${now}-${Math.random().toString(36).slice(2)}`;

    // Use Redis if available, otherwise fallback to in-memory
    if (this.redisConnected && this.redis) {
      return this.checkLimitRedis(tenantId, endpoint, config, now, requestId);
    } else {
      return this.checkLimitMemory(tenantId, endpoint, config, now);
    }
  }

  /**
   * Redis-based rate limit check
   */
  private async checkLimitRedis(
    tenantId: string,
    endpoint: string,
    config: TierRateLimitConfig,
    now: number,
    requestId: string
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.checkLimitMemory(tenantId, endpoint, config, now);
    }

    try {
      // Check burst limit first (1-second window)
      const burstKey = `ratelimit:burst:${tenantId}:${endpoint}`;
      const burstResult = await (this.redis as any).burstLimit(
        burstKey,
        now,
        config.burst,
        requestId
      );

      if (!burstResult || burstResult[0] === 0) {
        // Burst limit exceeded
        return {
          allowed: false,
          remaining: 0,
          limit: config.burst,
          resetAt: Math.ceil((now + 1000) / 1000), // 1 second from now
          retryAfter: 1,
        };
      }

      // Check main rate limit (sliding window)
      const key = `ratelimit:${tenantId}:${endpoint}`;
      const result = await (this.redis as any).slidingWindow(
        key,
        now,
        this.windowMs,
        config.rpm,
        requestId
      );

      if (!result) {
        throw new Error('Redis script returned null');
      }

      const [allowed, remaining, resetAt] = result as [number, number, number];

      return {
        allowed: allowed === 1,
        remaining,
        limit: config.rpm,
        resetAt: Math.ceil(resetAt / 1000), // Convert to seconds
        retryAfter: allowed === 0 ? Math.ceil((resetAt - now) / 1000) : undefined,
      };
    } catch (error) {
      logger.error('[RaasRateLimiter] Redis check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to in-memory on error
      return this.checkLimitMemory(tenantId, endpoint, config, now);
    }
  }

  /**
   * In-memory fallback rate limit check
   */
  private checkLimitMemory(
    tenantId: string,
    endpoint: string,
    config: TierRateLimitConfig,
    now: number
  ): RateLimitResult {
    const key = `ratelimit:${tenantId}:${endpoint}`;
    let state = this.inMemoryStore.get(key);

    const windowStart = now - this.windowMs;
    const oneSecondAgo = now - 1000;

    if (!state || now - state.lastCleanup > 60000) {
      // Initialize or cleanup
      state = { requests: [], lastCleanup: now };
      this.inMemoryStore.set(key, state);
    }

    // Clean old entries
    state.requests = state.requests.filter((ts) => ts > windowStart);

    // Check burst limit (requests in last second)
    const recentRequests = state.requests.filter((ts) => ts > oneSecondAgo);
    if (recentRequests.length >= config.burst) {
      return {
        allowed: false,
        remaining: 0,
        limit: config.burst,
        resetAt: Math.ceil((now + 1000) / 1000),
        retryAfter: 1,
      };
    }

    // Check main limit
    if (state.requests.length >= config.rpm) {
      const oldestRequest = Math.min(...state.requests);
      const resetAt = oldestRequest + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        limit: config.rpm,
        resetAt: Math.ceil(resetAt / 1000),
        retryAfter: Math.ceil((resetAt - now) / 1000),
      };
    }

    // Allowed - record request
    state.requests.push(now);

    return {
      allowed: true,
      remaining: config.rpm - state.requests.length,
      limit: config.rpm,
      resetAt: Math.ceil((now + this.windowMs) / 1000),
    };
  }

  /**
   * Record a request (for manual tracking)
   */
  async recordRequest(
    tenantId: string,
    tier: RaasTier,
    endpoint: string = 'default'
  ): Promise<void> {
    // This is called after checkLimit to record the actual request
    // In our implementation, checkLimit already records the request atomically
    // This method is kept for API compatibility with the original interface
    logger.debug('[RaasRateLimiter] recordRequest called (no-op, already recorded in checkLimit)', {
      tenantId,
      tier,
      endpoint,
    });
  }

  /**
   * Get current rate limit status (without consuming)
   */
  async getStatus(
    tenantId: string,
    tier: RaasTier,
    endpoint: string = 'default'
  ): Promise<{ remaining: number; limit: number; resetAt: number }> {
    const config = this.tierLimits[tier] || DEFAULT_TIER_LIMITS[tier];
    const key = `ratelimit:${tenantId}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (this.redisConnected && this.redis) {
      try {
        const count = await this.redis.zcount(key, windowStart, now);
        return {
          remaining: Math.max(0, config.rpm - count),
          limit: config.rpm,
          resetAt: Math.ceil((now + this.windowMs) / 1000),
        };
      } catch (error) {
        logger.warn('[RaasRateLimiter] Redis status check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Fallback to memory
    const state = this.inMemoryStore.get(key);
    if (!state) {
      return {
        remaining: config.rpm,
        limit: config.rpm,
        resetAt: Math.ceil((now + this.windowMs) / 1000),
      };
    }

    const count = state.requests.filter((ts) => ts > windowStart).length;
    return {
      remaining: Math.max(0, config.rpm - count),
      limit: config.rpm,
      resetAt: Math.ceil((now + this.windowMs) / 1000),
    };
  }

  /**
   * Reset rate limit for a tenant/endpoint
   */
  async reset(tenantId: string, endpoint: string = 'default'): Promise<void> {
    const key = `ratelimit:${tenantId}:${endpoint}`;

    if (this.redisConnected && this.redis) {
      await this.redis.del(key);
    }

    this.inMemoryStore.delete(key);
    logger.info('[RaasRateLimiter] Rate limit reset', { tenantId, endpoint });
  }

  /**
   * Get Redis connection status
   */
  isConnected(): boolean {
    return this.redisConnected;
  }

  /**
   * Get fallback mode status
   */
  isFallbackMode(): boolean {
    return this.fallbackEnabled;
  }

  /**
   * Close Redis connection
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.redisConnected = false;
      logger.info('[RaasRateLimiter] Redis connection closed');
    }
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    RaasRateLimiter.instance = new RaasRateLimiter();
  }
}

/**
 * Generate rate limit headers from result
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

/**
 * Get tier config helper
 */
export function getTierConfig(tier: RaasTier): TierRateLimitConfig {
  return DEFAULT_TIER_LIMITS[tier];
}
