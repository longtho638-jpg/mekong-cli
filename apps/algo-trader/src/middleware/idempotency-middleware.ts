/**
 * Idempotency Middleware for API Requests
 *
 * Prevents duplicate request processing using Idempotency-Key header.
 * Supports both Redis-backed store (production) and in-memory fallback.
 *
 * Usage:
 *   fastify.addHook('preHandler', idempotencyMiddleware())
 *   fastify.addHook('onSend', createIdempotencyResponseHandler())
 *
 * OWASP A08:2021 Data Integrity
 */

import { RedisIdempotencyStore } from '../execution/idempotency-store';
import { logger } from '../utils/logger';

/**
 * Idempotency record for in-memory fallback
 */
export interface IdempotencyRecord {
  requestId: string;
  response: unknown;
  processedAt: number;
  ttl: number; // milliseconds
}

/**
 * Middleware configuration options
 */
export interface IdempotencyOptions {
  headerName?: string;      // default: 'Idempotency-Key'
  ttl?: number;             // default: 24 hours in ms
  tenantIdHeader?: string;  // default: 'X-Tenant-ID'
}

const DEFAULT_HEADER_NAME = 'Idempotency-Key';
const DEFAULT_TENANT_ID_HEADER = 'X-Tenant-ID';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * In-memory fallback store when Redis is unavailable
 */
export class InMemoryIdempotencyStore {
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL) {
    this.ttlMs = ttlMs;
  }

  async get(key: string): Promise<unknown | null> {
    const record = this.store.get(key);
    if (!record) return null;
    if (Date.now() - record.processedAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return record.response;
  }

  async set(key: string, response: unknown): Promise<boolean> {
    this.store.set(key, {
      requestId: key,
      response,
      processedAt: Date.now(),
      ttl: this.ttlMs,
    });
    return true;
  }

  async exists(key: string): Promise<boolean> {
    const record = this.store.get(key);
    if (!record) return false;
    if (Date.now() - record.processedAt > this.ttlMs) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

/**
 * Combined store that tries Redis first, falls back to in-memory
 */
export class HybridIdempotencyStore {
  private redisStore: RedisIdempotencyStore;
  private memoryStore: InMemoryIdempotencyStore;
  private usingFallback = false;

  constructor(redisUrl?: string, ttlMs?: number) {
    this.redisStore = new RedisIdempotencyStore(redisUrl);
    this.memoryStore = new InMemoryIdempotencyStore(ttlMs);
  }

  async get(idempotencyKey: string, tenantId: string): Promise<unknown | null> {
    // If already in fallback mode, use memory only
    if (this.usingFallback) {
      return this.memoryStore.get(`${tenantId}:${idempotencyKey}`);
    }

    // Try Redis first
    const redisResult = await this.redisStore.get(idempotencyKey, tenantId);

    // Redis returned cached data - success
    if (redisResult !== null) {
      return redisResult;
    }

    // Redis returned null (not found or error)
    // Check memory store as fallback
    return this.memoryStore.get(`${tenantId}:${idempotencyKey}`);
  }

  async set(
    idempotencyKey: string,
    tenantId: string,
    response: unknown,
    ttl?: number
  ): Promise<boolean> {
    // If already in fallback mode, use memory only
    if (this.usingFallback) {
      return this.memoryStore.set(`${tenantId}:${idempotencyKey}`, response);
    }

    // Try Redis first
    const redisSuccess = await this.redisStore.set(idempotencyKey, tenantId, response, ttl);

    // Redis succeeded
    if (redisSuccess) {
      return true;
    }

    // Redis failed (connection error or returned false)
    // Mark as using fallback and use memory
    this.usingFallback = true;
    logger.warn('[IdempotencyStore] Redis unavailable, using in-memory fallback');
    return this.memoryStore.set(`${tenantId}:${idempotencyKey}`, response);
  }

  async exists(idempotencyKey: string, tenantId: string): Promise<boolean> {
    // If already in fallback mode, use memory only
    if (this.usingFallback) {
      return this.memoryStore.exists(`${tenantId}:${idempotencyKey}`);
    }

    // Try Redis first
    const redisExists = await this.redisStore.exists(idempotencyKey, tenantId);

    // Redis found it
    if (redisExists) {
      return true;
    }

    // Check memory store as fallback
    return this.memoryStore.exists(`${tenantId}:${idempotencyKey}`);
  }

  clear(): void {
    this.memoryStore.clear();
  }

  size(): number {
    return this.usingFallback ? this.memoryStore.size() : 0;
  }

  isUsingFallback(): boolean {
    return this.usingFallback;
  }
}

/**
 * Middleware factory for idempotency check
 * Usage: fastify.addHook('preHandler', idempotencyMiddleware(store))
 */
export function idempotencyMiddleware(
  store: HybridIdempotencyStore,
  options?: IdempotencyOptions
) {
  const headerName = options?.headerName ?? DEFAULT_HEADER_NAME;
  const tenantIdHeader = options?.tenantIdHeader ?? DEFAULT_TENANT_ID_HEADER;

  return async function idempotencyCheck(request: any, reply: any) {
    const idempotencyKey = request.headers?.[headerName.toLowerCase()] ||
                           request.headers?.[headerName];

    if (!idempotencyKey) {
      return;
    }

    const tenantId = request.headers?.[tenantIdHeader.toLowerCase()] ||
                     request.headers?.[tenantIdHeader] ||
                     'default';

    const existingResult = await store.get(idempotencyKey, tenantId);

    if (existingResult !== null) {
      logger.info(`Duplicate request - idempotencyKey=${idempotencyKey}, tenantId=${tenantId} - returning cached response`);
      return reply.send(existingResult);
    }

    await store.set(idempotencyKey, tenantId, {
      processing: true,
      timestamp: Date.now(),
    });
  };
}

/**
 * Response interceptor to cache actual result
 */
export function createIdempotencyResponseHandler(
  store: HybridIdempotencyStore,
  options?: IdempotencyOptions
) {
  const headerName = options?.headerName ?? DEFAULT_HEADER_NAME;
  const tenantIdHeader = options?.tenantIdHeader ?? DEFAULT_TENANT_ID_HEADER;

  return async function cacheResult(request: any, _reply: any, payload: any) {
    const idempotencyKey = request.headers?.[headerName.toLowerCase()] ||
                           request.headers?.[headerName];

    if (!idempotencyKey) {
      return payload;
    }

    const tenantId = request.headers?.[tenantIdHeader.toLowerCase()] ||
                     request.headers?.[tenantIdHeader] ||
                     'default';

    if (payload) {
      await store.set(idempotencyKey, tenantId, payload);
    }

    return payload;
  };
}

// Singleton instance for application-wide use
let defaultIdempotencyStore: HybridIdempotencyStore | null = null;

export function getDefaultIdempotencyStore(
  redisUrl?: string,
  ttlMs?: number
): HybridIdempotencyStore {
  if (!defaultIdempotencyStore) {
    defaultIdempotencyStore = new HybridIdempotencyStore(redisUrl, ttlMs);
  }
  return defaultIdempotencyStore;
}

/**
 * Reset singleton (for testing)
 */
export function resetDefaultIdempotencyStore(): void {
  defaultIdempotencyStore = null;
}

// Backwards-compatible alias for existing code using IdempotencyStore
export { HybridIdempotencyStore as IdempotencyStore };
