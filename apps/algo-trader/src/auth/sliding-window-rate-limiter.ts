/**
 * In-memory sliding window rate limiter per keyId.
 * Upgrades to Redis-backed in Phase 3.
 */
import type { RateLimitResult, RateLimitState } from './types';

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, RateLimitState>();

  constructor() {
    // Phase 3: Redis-backed limiter will be injected here.
  }

  /**
   * Check whether a request for keyId is within the rate limit.
   * @param keyId     - Unique identifier for the key/client
   * @param limit     - Max requests allowed per window
   * @param windowMs  - Window size in milliseconds
   */
  async check(keyId: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const state = this.store.get(keyId);

    if (!state || now - state.windowStart >= windowMs) {
      // New window
      this.store.set(keyId, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    if (state.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: state.windowStart + windowMs,
      };
    }

    state.count += 1;
    return {
      allowed: true,
      remaining: limit - state.count,
      resetAt: state.windowStart + windowMs,
    };
  }

  /**
   * Build X-RateLimit-* headers from a RateLimitResult.
   */
  headers(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    };
  }

  /**
   * Reset state for a keyId (useful for tests or admin actions).
   */
  reset(keyId: string): void {
    this.store.delete(keyId);
  }

  /**
   * Clear all rate limit state (use in tests or on restart).
   */
  clear(): void {
    this.store.clear();
  }
}
