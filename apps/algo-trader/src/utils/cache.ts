/**
 * LRU Cache với TTL support — Dành cho trading data
 *
 * Features:
 * - Max size limit (LRU eviction)
 * - Per-entry TTL
 * - Stats tracking (hit/miss rates)
 * - Auto-cleanup expired entries
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  expired: number;
  size: number;
  hitRate: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private defaultTTL: number; // ms
  private stats: { hits: number; misses: number; evictions: number; expired: number };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxSize: number = 1000, defaultTTL: number = 100) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0, expired: 0 };

    // Auto-cleanup every 10 seconds
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 10000);
    // Don't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.expired++;
      this.stats.misses++;
      return undefined;
    }

    // Update last accessed for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Evict LRU entries if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + (ttlMs ?? this.defaultTTL),
      lastAccessed: now,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.expired++;
      return false;
    }

    return true;
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.expired++;
      }
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, expired: 0 };
  }

  /**
   * Shutdown cleanup interval
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Generate cache key from array + params
 */
export function createCacheKey(...args: unknown[]): string {
  return args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join('|');
}

/**
 * Simple hash function for strings
 */
export function hashKey(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Memoize decorator factory for pure functions
 *
 * Usage:
 * @Memoize({ maxAge: 100, maxSize: 500 })
 * static expensiveCalc(data: number[], param: number) { ... }
 */
export function Memoize(options?: { maxAge?: number; maxSize?: number; keyFn?: (...args: unknown[]) => string }) {
  const maxAge = options?.maxAge ?? 100;
  const maxSize = options?.maxSize ?? 500;
  const caches = new Map<Function, LRUCache<string, unknown>>();

  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new LRUCache<string, unknown>(maxSize, maxAge);
    caches.set(originalMethod, cache);

    descriptor.value = function (...args: unknown[]) {
      const key = options?.keyFn
        ? options.keyFn(...args)
        : createCacheKey(...args);

      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

// Singleton cache instances for common use cases
export const indicatorCache = new LRUCache<string, unknown>(1000, 100);
export const riskCalcCache = new LRUCache<string, unknown>(500, 500);
export const arbCache = new LRUCache<string, unknown>(200, 50);
