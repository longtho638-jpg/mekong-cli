/**
 * Redis-backed Idempotency Store
 *
 * Prevents duplicate API requests using idempotency keys.
 * Uses Redis SETNX for thread-safe atomic operations.
 * Graceful degradation: bypasses when Redis is unavailable.
 *
 * Key format: idempotency:{tenantId}:{key}
 * TTL: 24 hours (configurable)
 */

import { logger } from '../utils/logger';
import { createRedisConnection, IRedisClient } from '../jobs/ioredis-connection-factory-and-singleton-pool';

/**
 * Idempotency record stored in Redis
 */
export interface IdempotencyRecord {
  requestId: string;
  response: unknown;
  createdAt: number;
  ttl: number; // milliseconds
}

/**
 * Redis-backed idempotency store with graceful degradation
 */
export class RedisIdempotencyStore {
  private redis: IRedisClient | null = null;
  private readonly DEFAULT_TTL: number = 24 * 60 * 60 * 1000; // 24 hours
  private readonly keyPrefix: string = 'idempotency';

  constructor(private redisUrl?: string) {}

  /**
   * Get Redis connection with lazy initialization
   */
  private getRedis(): IRedisClient | null {
    if (!this.redis) {
      try {
        this.redis = createRedisConnection(this.redisUrl);
      } catch (error) {
        logger.warn(
          `[IdempotencyStore] Redis connection failed: ${error instanceof Error ? error.message : String(error)}`
        );
        return null;
      }
    }
    return this.redis;
  }

  /**
   * Generate Redis key from tenantId and idempotency key
   */
  private generateKey(idempotencyKey: string, tenantId: string): string {
    return `${this.keyPrefix}:${tenantId}:${idempotencyKey}`;
  }

  /**
   * Check if idempotency key exists and return cached response
   * Returns null if key not found or expired
   */
  async get(idempotencyKey: string, tenantId: string): Promise<unknown | null> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[IdempotencyStore] Redis unavailable - bypassing idempotency check');
      return null;
    }

    try {
      const key = this.generateKey(idempotencyKey, tenantId);
      const data = await redis.get(key);

      if (!data) {
        return null;
      }

      const record: IdempotencyRecord = JSON.parse(data);

      // Check if expired
      if (Date.now() - record.createdAt > record.ttl) {
        await redis.del(key);
        return null;
      }

      return record.response;
    } catch (error) {
      logger.warn(
        `[IdempotencyStore] Get error: ${error instanceof Error ? error.message : String(error)} - bypassing`
      );
      return null;
    }
  }

  /**
   * Store response for idempotency key using SETNX for atomic operation
   * Returns true if successfully set, false if key already exists
   */
  async set(
    idempotencyKey: string,
    tenantId: string,
    response: unknown,
    ttl?: number
  ): Promise<boolean> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[IdempotencyStore] Redis unavailable - bypassing idempotency set');
      return false;
    }

    try {
      const key = this.generateKey(idempotencyKey, tenantId);
      const record: IdempotencyRecord = {
        requestId: idempotencyKey,
        response,
        createdAt: Date.now(),
        ttl: ttl ?? this.DEFAULT_TTL,
      };

      const serialized = JSON.stringify(record);
      const ttlSeconds = Math.ceil(record.ttl / 1000);

      // Use SETNX pattern via SET with NX flag for atomic operation
      // Redis SET with NX only sets if key does not exist
      const result = await redis.set(key, serialized, 'NX', 'EX', ttlSeconds);

      if (result === null || result === 'OK') {
        logger.debug(`[IdempotencyStore] Set key: ${key}`);
        return result !== null;
      }

      return false;
    } catch (error) {
      logger.warn(
        `[IdempotencyStore] Set error: ${error instanceof Error ? error.message : String(error)} - bypassing`
      );
      return false;
    }
  }

  /**
   * Check if idempotency key exists (without returning data)
   */
  async exists(idempotencyKey: string, tenantId: string): Promise<boolean> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[IdempotencyStore] Redis unavailable - assuming key does not exist');
      return false;
    }

    try {
      const key = this.generateKey(idempotencyKey, tenantId);
      const data = await redis.get(key);

      if (!data) {
        return false;
      }

      // Check TTL
      const record: IdempotencyRecord = JSON.parse(data);
      const isExpired = Date.now() - record.createdAt > record.ttl;

      if (isExpired) {
        await redis.del(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.warn(
        `[IdempotencyStore] Exists error: ${error instanceof Error ? error.message : String(error)} - assuming false`
      );
      return false;
    }
  }

  /**
   * Delete idempotency key (for manual invalidation)
   */
  async delete(idempotencyKey: string, tenantId: string): Promise<boolean> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[IdempotencyStore] Redis unavailable - delete skipped');
      return false;
    }

    try {
      const key = this.generateKey(idempotencyKey, tenantId);
      await redis.del(key);
      logger.debug(`[IdempotencyStore] Deleted key: ${key}`);
      return true;
    } catch (error) {
      logger.warn(
        `[IdempotencyStore] Delete error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Clear all idempotency keys for a tenant (for testing/admin)
   */
  async clearTenant(tenantId: string): Promise<number> {
    const redis = this.getRedis();

    if (!redis) {
      logger.warn('[IdempotencyStore] Redis unavailable - clear skipped');
      return 0;
    }

    try {
      const pattern = `${this.keyPrefix}:${tenantId}:*`;
      // Note: KEYS command is not recommended for production with large datasets
      // but acceptable for admin/testing operations
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`[IdempotencyStore] Cleared ${keys.length} keys for tenant ${tenantId}`);
      }

      return keys.length;
    } catch (error) {
      logger.warn(
        `[IdempotencyStore] ClearTenant error: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
let defaultIdempotencyStore: RedisIdempotencyStore | null = null;

export function getDefaultIdempotencyStore(redisUrl?: string): RedisIdempotencyStore {
  if (!defaultIdempotencyStore) {
    defaultIdempotencyStore = new RedisIdempotencyStore(redisUrl);
  }
  return defaultIdempotencyStore;
}

/**
 * Reset singleton (for testing)
 */
export function resetDefaultIdempotencyStore(): void {
  defaultIdempotencyStore = null;
}
