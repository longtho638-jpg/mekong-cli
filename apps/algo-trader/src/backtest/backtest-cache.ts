/**
 * Backtest Cache — LRU cache for candle data and backtest results.
 * Improves performance by caching repeated optimization runs.
 */

import { ICandle } from '../interfaces/ICandle';
import { EngineResult } from './backtest-engine-result-types';
import { logger } from '../utils/logger';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

interface CacheKey {
  strategyName: string;
  paramHash: string;
  candleHash: string;
}

export class BacktestCache {
  private cache: Map<string, CacheEntry<EngineResult>>;
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number = 1000, ttlMinutes: number = 30) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate cache key from strategy params and candles
   */
  generateKey(strategyName: string, params: Record<string, number>, candles: ICandle[]): string {
    const paramHash = this.hashObject(params);
    const candleHash = this.hashCandles(candles);
    return `${strategyName}:${paramHash}:${candleHash}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get(key: string): EngineResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      logger.debug(`[BacktestCache] Cache miss (expired): ${key}`);
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    logger.debug(`[BacktestCache] Cache hit: ${key} (hits: ${entry.hits})`);
    return entry.value;
  }

  /**
   * Cache a backtest result
   */
  set(key: string, result: EngineResult): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value: result,
      timestamp: Date.now(),
      hits: 0,
    });

    logger.debug(`[BacktestCache] Cached: ${key}`);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('[BacktestCache] Cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxEntries: number;
    ttlMinutes: number;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const times = Array.from(this.cache.values()).map(e => e.timestamp);
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      ttlMinutes: this.ttlMs / 60000,
      oldestEntry: times.length ? Math.min(...times) : undefined,
      newestEntry: times.length ? Math.max(...times) : undefined,
    };
  }

  /**
   * Evict oldest entry (simple LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`[BacktestCache] Evicted: ${oldestKey}`);
    }
  }

  /**
   * Hash object to string
   */
  private hashObject(obj: Record<string, number>): string {
    const sorted = Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return this.simpleHash(sorted);
  }

  /**
   * Hash candles to string
   */
  private hashCandles(candles: ICandle[]): string {
    if (candles.length === 0) return 'empty';
    const key = `${candles.length}:${candles[0].timestamp}:${candles[candles.length - 1].timestamp}`;
    return this.simpleHash(key);
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Parallel Backtest Runner
 * Runs multiple backtests concurrently with caching
 */
export class ParallelBacktestRunner {
  private cache: BacktestCache;
  private maxConcurrency: number;

  constructor(cache?: BacktestCache, maxConcurrency: number = 4) {
    this.cache = cache || new BacktestCache();
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Run multiple backtests in parallel with concurrency limit
   */
  async runAll(
    tasks: Array<{
      strategyName: string;
      params: Record<string, number>;
      runBacktest: () => Promise<EngineResult>;
    }>,
    candles: ICandle[]
  ): Promise<EngineResult[]> {
    const results: EngineResult[] = [];
    const queue = [...tasks];
    const running = new Set<Promise<EngineResult>>();

    while (queue.length > 0 || running.size > 0) {
      // Fill up to maxConcurrency
      while (running.size < this.maxConcurrency && queue.length > 0) {
        const task = queue.shift()!;
        const cacheKey = this.cache.generateKey(task.strategyName, task.params, candles);

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
          results.push(cached);
          continue;
        }

        // Run and cache
        const promise = task.runBacktest().then(result => {
          this.cache.set(cacheKey, result);
          running.delete(promise);
          return result;
        });

        results.push(await promise);
        running.add(promise);
      }

      // Wait for at least one to complete
      if (running.size > 0) {
        await Promise.race(running);
      }
    }

    return results;
  }

  /**
   * Get cache instance
   */
  getCache(): BacktestCache {
    return this.cache;
  }
}
