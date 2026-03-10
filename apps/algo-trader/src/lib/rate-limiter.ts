/**
 * Rate Limiter for API Endpoints
 *
 * Tier-based rate limiting to prevent abuse and control infrastructure costs.
 * Uses sliding window algorithm for accurate rate limiting.
 */

import { LicenseService, LicenseTier } from './raas-gate';

/**
 * Rate limit configuration per tier
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number; // Max requests in 1 second
}

/**
 * Rate limit state for a single key
 */
interface RateLimitState {
  requests: number[]; // Timestamps of requests in current window
  lastCleanup: number;
}

/**
 * Default rate limits by tier
 */
const DEFAULT_LIMITS: Record<LicenseTier, RateLimitConfig> = {
  [LicenseTier.FREE]: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    burstLimit: 2,
  },
  [LicenseTier.PRO]: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    burstLimit: 10,
  },
  [LicenseTier.ENTERPRISE]: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    burstLimit: 50,
  },
};

/**
 * In-memory store for rate limit state
 * In production, replace with Redis for distributed rate limiting
 */
const store = new Map<string, RateLimitState>();

/**
 * Cleanup old entries older than 1 hour
 */
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Get rate limit config for current license tier
 */
export function getRateLimitConfig(tier?: LicenseTier): RateLimitConfig {
  const licenseTier = tier ?? LicenseService.getInstance().getTier();
  return DEFAULT_LIMITS[licenseTier];
}

/**
 * Check if request should be rate limited
 *
 * @param key - Unique identifier (license key, IP, or user ID)
 * @param tier - Optional tier override
 * @returns True if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, tier?: LicenseTier): boolean {
  const config = getRateLimitConfig(tier);
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let state = store.get(key);

  // Initialize state if not exists
  if (!state) {
    state = { requests: [], lastCleanup: now };
    store.set(key, state);
  }

  // Periodic cleanup
  if (now - state.lastCleanup > CLEANUP_INTERVAL) {
    state.requests = state.requests.filter(ts => ts > oneHourAgo);
    state.lastCleanup = now;
  }

  // Remove old timestamps outside the window
  state.requests = state.requests.filter(ts => ts > oneHourAgo);

  // Check burst limit (requests in last second)
  const oneSecondAgo = now - 1000;
  const recentRequests = state.requests.filter(ts => ts > oneSecondAgo);
  if (recentRequests.length >= config.burstLimit) {
    return false;
  }

  // Check per-minute limit
  const minuteRequests = state.requests.filter(ts => ts > oneMinuteAgo);
  if (minuteRequests.length >= config.requestsPerMinute) {
    return false;
  }

  // Check per-hour limit
  if (state.requests.length >= config.requestsPerHour) {
    return false;
  }

  // Record this request
  state.requests.push(now);
  return true;
}

/**
 * Get current usage stats for a key
 */
export function getRateLimitUsage(key: string): {
  minuteUsage: number;
  hourUsage: number;
  limit: RateLimitConfig;
} {
  const config = getRateLimitConfig();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  const state = store.get(key);
  if (!state) {
    return {
      minuteUsage: 0,
      hourUsage: 0,
      limit: config,
    };
  }

  return {
    minuteUsage: state.requests.filter(ts => ts > oneMinuteAgo).length,
    hourUsage: state.requests.filter(ts => ts > oneHourAgo).length,
    limit: config,
  };
}

/**
 * Reset rate limit state for a key (useful for testing)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Reset all rate limit state (useful for testing)
 */
export function resetAllRateLimits(): void {
  store.clear();
}

/**
 * Get rate limit headers to include in response
 */
export function getRateLimitHeaders(key: string): Record<string, string> {
  const usage = getRateLimitUsage(key);
  const minuteRemaining = Math.max(0, usage.limit.requestsPerMinute - usage.minuteUsage);
  const hourRemaining = Math.max(0, usage.limit.requestsPerHour - usage.hourUsage);

  return {
    'X-RateLimit-Limit': usage.limit.requestsPerMinute.toString(),
    'X-RateLimit-Remaining': minuteRemaining.toString(),
    'X-RateLimit-Hour-Limit': usage.limit.requestsPerHour.toString(),
    'X-RateLimit-Hour-Remaining': hourRemaining.toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + 60 * 1000) / 1000).toString(),
  };
}
