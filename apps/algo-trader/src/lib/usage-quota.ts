/**
 * Usage Quota Tracking for RaaS License Management
 *
 * Tracks API usage per license key with monthly quotas by tier.
 * Integrates with Redis for distributed storage.
 *
 * Quota limits by tier:
 * - FREE: 1,000 calls/month
 * - PRO: 10,000 calls/month
 * - ENTERPRISE: 100,000 calls/month
 */

import Redis from 'ioredis';
type RedisClientType = Redis;

/**
 * Usage quota data structure
 */
export interface UsageQuota {
  licenseKey: string;
  periodStart: Date;
  periodEnd: Date;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  tier: 'free' | 'pro' | 'enterprise';
}

/**
 * Usage quota with thresholds
 */
export interface UsageQuotaWithAlerts extends UsageQuota {
  thresholds: number[];
  alertsTriggered: number[];
  isExceeded: boolean;
}

/**
 * Quota configuration by tier
 */
export const QUOTA_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10000,
  enterprise: 100000,
};

/**
 * Alert thresholds (percentage)
 */
export const ALERT_THRESHOLDS = [80, 90, 100];

/**
 * Get current billing period (monthly)
 */
export function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Get Redis key for a license key and period
 */
function getQuotaKey(licenseKey: string, period: { start: Date; end: Date }): string {
  const periodId = period.start.toISOString().slice(0, 7); // YYYY-MM
  return `raas:quota:${licenseKey}:${periodId}`;
}

/**
 * Usage Quota Service
 */
export class UsageQuotaService {
  private static instance: UsageQuotaService;
  private redis: RedisClientType | null = null;
  private redisUrl: string;

  private constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  }

  static getInstance(redisUrl?: string): UsageQuotaService {
    if (!UsageQuotaService.instance) {
      UsageQuotaService.instance = new UsageQuotaService(redisUrl);
    }
    return UsageQuotaService.instance;
  }

  /**
   * Initialize Redis connection
   */
  async init(): Promise<void> {
    if (this.redis) return;

    try {
      this.redis = new Redis(this.redisUrl);
      await this.redis.connect();
      console.log('[UsageQuota] Redis connected');
    } catch (error) {
      console.warn('[UsageQuota] Redis connection failed, using memory storage');
      this.redis = null;
    }
  }

  /**
   * Memory storage fallback (for dev/testing)
   */
  private memoryStorage: Map<string, { count: number; thresholds: number[] }> = new Map();

  /**
   * Increment usage counter for a license key
   * Returns new count
   */
  async increment(licenseKey: string, tier: string = 'free'): Promise<number> {
    const period = getCurrentPeriod();
    const key = getQuotaKey(licenseKey, period);
    const limit = QUOTA_LIMITS[tier] || QUOTA_LIMITS.free;

    if (this.redis) {
      const result = await this.redis.incr(key);
      // Set expiry to end of period + 1 day
      const ttl = Math.ceil((period.end.getTime() - Date.now()) / 1000) + 86400;
      await this.redis.expire(key, ttl);
      return result;
    } else {
      // Memory fallback
      const data = this.memoryStorage.get(key) || { count: 0, thresholds: [] };
      data.count += 1;
      this.memoryStorage.set(key, data);
      return data.count;
    }
  }

  /**
   * Get usage quota status for a license key
   */
  async getUsage(licenseKey: string, tier: string = 'free'): Promise<UsageQuotaWithAlerts> {
    const period = getCurrentPeriod();
    const key = getQuotaKey(licenseKey, period);
    const limit = QUOTA_LIMITS[tier] || QUOTA_LIMITS.free;

    let used: number;
    let triggeredThresholds: number[] = [];

    if (this.redis) {
      const count = await this.redis.get(key);
      used = parseInt(count || '0', 10);
    } else {
      // Memory fallback
      const data = this.memoryStorage.get(key);
      used = data?.count || 0;
      triggeredThresholds = data?.thresholds || [];
    }

    const percentUsed = (used / limit) * 100;
    const remaining = Math.max(0, limit - used);
    const isExceeded = used >= limit;

    // Check thresholds
    for (const threshold of ALERT_THRESHOLDS) {
      if (percentUsed >= threshold && !triggeredThresholds.includes(threshold)) {
        triggeredThresholds.push(threshold);
      }
    }

    return {
      licenseKey,
      periodStart: period.start,
      periodEnd: period.end,
      used,
      limit,
      remaining,
      percentUsed: Math.round(percentUsed * 100) / 100,
      tier: tier as 'free' | 'pro' | 'enterprise',
      thresholds: ALERT_THRESHOLDS,
      alertsTriggered: triggeredThresholds,
      isExceeded,
    };
  }

  /**
   * Reset usage for a license key
   */
  async reset(licenseKey: string): Promise<void> {
    const period = getCurrentPeriod();
    const key = getQuotaKey(licenseKey, period);

    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Check if quota is exceeded
   */
  async isExceeded(licenseKey: string, tier: string = 'free'): Promise<boolean> {
    const usage = await this.getUsage(licenseKey, tier);
    return usage.isExceeded;
  }

  /**
   * Get alerts to send (thresholds just triggered)
   */
  async getNewAlerts(licenseKey: string, tier: string = 'free'): Promise<number[]> {
    const usage = await this.getUsage(licenseKey, tier);
    // In production, compare with stored triggered thresholds
    return usage.alertsTriggered;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

/**
 * Middleware factory for quota enforcement
 */
export function requireQuotaMiddleware() {
  return async (req: any, res: any, next: (err?: any) => void) => {
    try {
      const quotaService = UsageQuotaService.getInstance();
      const licenseKey = req.headers['x-license-key'] || req.licenseKey;
      const tier = req.headers['x-license-tier'] || 'free';

      if (!licenseKey) {
        return res.status(401).json({ error: 'License key required' });
      }

      // Check if exceeded
      const exceeded = await quotaService.isExceeded(licenseKey, tier);
      if (exceeded) {
        return res.status(429).json({
          error: 'Quota exceeded',
          message: 'Monthly usage quota has been reached',
          upgradeUrl: '/pricing',
        });
      }

      // Increment usage
      await quotaService.increment(licenseKey, tier);

      // Add quota headers
      const usage = await quotaService.getUsage(licenseKey, tier);
      res.setHeader('X-RateLimit-Limit', usage.limit);
      res.setHeader('X-RateLimit-Remaining', usage.remaining);
      res.setHeader('X-RateLimit-Percent-Used', usage.percentUsed.toString());

      next();
    } catch (error) {
      next(error);
    }
  };
}
