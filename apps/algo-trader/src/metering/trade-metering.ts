/**
 * Trade Metering Service — Daily Tier Limits for Algo-Trader
 *
 * ROIaaS Phase 4 - Usage-based billing with daily limits.
 * Tracks trades, signals, and API calls per user with tier-based daily quotas.
 *
 * Tier Limits (Daily):
 * - FREE: 5 trades/day + 3 signals/day + 100 API calls/day
 * - PRO: Unlimited trades + Unlimited signals + 10,000 API calls/day
 * - ENTERPRISE: Unlimited + Custom strategies + 100,000 API calls/day
 *
 * Features:
 * - Per-user daily tracking for trades, signals, API calls
 * - Tier-based limits enforcement
 * - Upgrade prompts when hitting limits
 * - In-memory storage with optional PostgreSQL sync
 * - Event emitter for limit alerts
 */

import { EventEmitter } from 'events';
import { LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

// Re-export LicenseTier for convenience
export { LicenseTier };

/**
 * Daily tier limits
 */
export interface DailyLimits {
  tradesPerDay: number;
  signalsPerDay: number;
  apiCallsPerDay: number;
}

export const TIER_LIMITS: Record<LicenseTier, DailyLimits> = {
  [LicenseTier.FREE]: {
    tradesPerDay: 5,
    signalsPerDay: 3,
    apiCallsPerDay: 100,
  },
  [LicenseTier.PRO]: {
    tradesPerDay: -1, // Unlimited
    signalsPerDay: -1,
    apiCallsPerDay: 10000,
  },
  [LicenseTier.ENTERPRISE]: {
    tradesPerDay: -1,
    signalsPerDay: -1,
    apiCallsPerDay: 100000,
  },
};

/**
 * Alert thresholds (percentage of daily limit)
 */
export const ALERT_THRESHOLDS = [80, 90, 100];

/**
 * Daily usage record
 */
export interface DailyUsageRecord {
  userId: string;
  date: string; // YYYY-MM-DD format
  tradesUsed: number;
  signalsUsed: number;
  apiCallsUsed: number;
  tier: LicenseTier;
}

/**
 * Usage status for a user
 */
export interface UsageStatus {
  userId: string;
  date: string;
  tier: LicenseTier;
  limits: DailyLimits;
  trades: {
    used: number;
    limit: number | 'Unlimited';
    remaining: number;
    percentUsed: number;
    isExceeded: boolean;
  };
  signals: {
    used: number;
    limit: number | 'Unlimited';
    remaining: number;
    percentUsed: number;
    isExceeded: boolean;
  };
  apiCalls: {
    used: number;
    limit: number | 'Unlimited';
    remaining: number;
    percentUsed: number;
    isExceeded: boolean;
  };
  canTrade: boolean;
  canConsumeSignal: boolean;
  canCallApi: boolean;
  upgradePrompt?: {
    title: string;
    description: string;
    upgradeUrl: string;
  };
}

/**
 * Limit exceeded alert event
 */
export interface LimitAlert {
  userId: string;
  resourceType: 'trades' | 'signals' | 'api_calls';
  threshold: number;
  currentUsage: number;
  dailyLimit: number;
  percentUsed: number;
  timestamp: string;
}

/**
 * In-memory storage for daily usage
 */
const usageStore = new Map<string, DailyUsageRecord>();

/**
 * User tier mapping
 */
const userTierMap = new Map<string, LicenseTier>();

/**
 * Trade Metering Service - Singleton
 *
 * Tracks daily usage per user for trades, signals, and API calls.
 * Emits alerts when approaching or exceeding daily quotas.
 */
export class TradeMeteringService extends EventEmitter {
  private static instance: TradeMeteringService;

  private constructor() {
    super();
    this.startDailyReset();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TradeMeteringService {
    if (!TradeMeteringService.instance) {
      TradeMeteringService.instance = new TradeMeteringService();
    }
    return TradeMeteringService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (TradeMeteringService.instance) {
      TradeMeteringService.instance.removeAllListeners();
    }
    TradeMeteringService.instance = new TradeMeteringService();
    usageStore.clear();
    userTierMap.clear();
  }

  /**
   * Set tier for a user
   */
  setUserTier(userId: string, tier: LicenseTier): void {
    userTierMap.set(userId, tier);
  }

  /**
   * Get tier for a user
   */
  getUserTier(userId: string): LicenseTier {
    return userTierMap.get(userId) || LicenseTier.FREE;
  }

  /**
   * Track a trade execution
   *
   * @param userId - User identifier
   * @param metadata - Optional trade metadata
   * @returns True if within limit, false if exceeded
   */
  async trackTrade(userId: string, metadata?: Record<string, unknown>): Promise<boolean> {
    return this.trackResource(userId, 'trades', metadata);
  }

  /**
   * Track a trade execution (alias for trackTrade)
   */
  async executeTrade(userId: string, metadata?: Record<string, unknown>): Promise<boolean> {
    void metadata; // Mark as intentionally unused
    return this.trackResource(userId, 'trades');
  }

  /**
   * Track a signal consumption
   *
   * @param userId - User identifier
   * @param metadata - Optional signal metadata
   * @returns True if within limit, false if exceeded
   */
  async trackSignal(userId: string, metadata?: Record<string, unknown>): Promise<boolean> {
    void metadata; // Mark as intentionally unused
    return this.trackResource(userId, 'signals');
  }

  /**
   * Track an API call
   *
   * @param userId - User identifier
   * @param endpoint - API endpoint path
   * @returns True if within limit, false if exceeded
   */
  async trackApiCall(userId: string, endpoint?: string): Promise<boolean> {
    const metadata = endpoint ? { endpoint } : undefined;
    return this.trackResource(userId, 'apiCalls', metadata);
  }

  /**
   * Track a generic resource
   */
  private async trackResource(
    userId: string,
    resourceType: 'trades' | 'signals' | 'apiCalls',
    _metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const today = this.getTodayKey();
    const key = `${userId}:${today}`;
    const tier = this.getUserTier(userId);
    const limits = TIER_LIMITS[tier];

    // Get or create daily usage record
    let usage = usageStore.get(key);
    if (!usage) {
      usage = {
        userId,
        date: today,
        tradesUsed: 0,
        signalsUsed: 0,
        apiCallsUsed: 0,
        tier,
      };
      usageStore.set(key, usage);
    }

    // Increment counters
    if (resourceType === 'trades') {
      usage.tradesUsed += 1;
    } else if (resourceType === 'signals') {
      usage.signalsUsed += 1;
    } else {
      usage.apiCallsUsed += 1;
    }

    // Check if exceeded
    const limit = this.getLimitForResource(resourceType, limits);
    const currentUsage = this.getUsageForResource(usage, resourceType);
    const isUnlimited = limit === -1;
    const isExceeded = !isUnlimited && currentUsage > limit;

    // Check thresholds and emit alerts
    if (!isUnlimited) {
      const percentUsed = (currentUsage / limit) * 100;

      for (const threshold of ALERT_THRESHOLDS) {
        const thresholdKey = `${key}:${resourceType}:${threshold}`;
        const alreadyTriggered = usageStore.get(thresholdKey);

        if (percentUsed >= threshold && !alreadyTriggered) {
          usageStore.set(thresholdKey, usage);

          const alert: LimitAlert = {
            userId,
            resourceType: resourceType === 'trades' ? 'trades' : resourceType === 'signals' ? 'signals' : 'api_calls',
            threshold,
            currentUsage,
            dailyLimit: limit,
            percentUsed: Math.round(percentUsed * 100) / 100,
            timestamp: new Date().toISOString(),
          };

          this.emit('threshold_alert', alert);

          if (threshold === 100) {
            logger.info('[TradeMetering] Limit exceeded', {
              userId: userId.substring(0, 8) + '...',
              resourceType,
              currentUsage,
              dailyLimit: limit,
              tier,
            });
          }
        }
      }
    }

    return !isExceeded;
  }

  /**
   * Get current usage status for a user
   */
  getUsageStatus(userId: string): UsageStatus {
    const today = this.getTodayKey();
    const key = `${userId}:${today}`;
    const tier = this.getUserTier(userId);
    const limits = TIER_LIMITS[tier];

    const usage = usageStore.get(key) || {
      userId,
      date: today,
      tradesUsed: 0,
      signalsUsed: 0,
      apiCallsUsed: 0,
      tier,
    };

    // Calculate status for each resource
    const tradesStatus = this.getResourceStatus('trades', limits.tradesPerDay, usage.tradesUsed);
    const signalsStatus = this.getResourceStatus('signals', limits.signalsPerDay, usage.signalsUsed);
    const apiCallsStatus = this.getResourceStatus('apiCalls', limits.apiCallsPerDay, usage.apiCallsUsed);

    return {
      userId,
      date: today,
      tier,
      limits,
      trades: tradesStatus,
      signals: signalsStatus,
      apiCalls: apiCallsStatus,
      canTrade: !tradesStatus.isExceeded,
      canConsumeSignal: !signalsStatus.isExceeded,
      canCallApi: !apiCallsStatus.isExceeded,
      upgradePrompt: this.getUpgradePrompt(userId, tier, tradesStatus, signalsStatus, apiCallsStatus),
    };
  }

  /**
   * Get upgrade prompt for user
   */
  private getUpgradePrompt(
    userId: string,
    tier: LicenseTier,
    trades: UsageStatus['trades'],
    signals: UsageStatus['signals'],
    apiCalls: UsageStatus['apiCalls']
  ): { title: string; description: string; upgradeUrl: string } | undefined {
    if (tier !== LicenseTier.FREE) {
      return undefined;
    }

    const exceededResources: string[] = [];
    if (trades.isExceeded) exceededResources.push('trades');
    if (signals.isExceeded) exceededResources.push('signals');
    if (apiCalls.isExceeded) exceededResources.push('API calls');

    if (exceededResources.length === 0) {
      return undefined;
    }

    return {
      title: 'Upgrade to Pro for Unlimited Trading',
      description: `Your Free tier limit for ${exceededResources.join(', ')} has been reached. Upgrade to Pro for unlimited access.`,
      upgradeUrl: '/pricing',
    };
  }

  /**
   * Get resource status helper
   */
  private getResourceStatus(
    resourceType: 'trades' | 'signals' | 'apiCalls',
    limit: number,
    used: number
  ): {
    used: number;
    limit: number | 'Unlimited';
    remaining: number;
    percentUsed: number;
    isExceeded: boolean;
  } {
    const isUnlimited = limit === -1;
    const displayLimit: number | 'Unlimited' = isUnlimited ? 'Unlimited' : limit;
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
    const percentUsed = isUnlimited ? 0 : Math.round((used / limit) * 10000) / 100;
    const isExceeded = !isUnlimited && used >= limit;

    return {
      used,
      limit: displayLimit,
      remaining: isUnlimited ? Infinity : remaining,
      percentUsed,
      isExceeded,
    };
  }

  /**
   * Get limit for resource type
   */
  private getLimitForResource(resourceType: 'trades' | 'signals' | 'apiCalls', limits: DailyLimits): number {
    switch (resourceType) {
      case 'trades':
        return limits.tradesPerDay;
      case 'signals':
        return limits.signalsPerDay;
      case 'apiCalls':
        return limits.apiCallsPerDay;
      default:
        return 0;
    }
  }

  /**
   * Get usage for resource type
   */
  private getUsageForResource(usage: DailyUsageRecord, resourceType: 'trades' | 'signals' | 'apiCalls'): number {
    switch (resourceType) {
      case 'trades':
        return usage.tradesUsed;
      case 'signals':
        return usage.signalsUsed;
      case 'apiCalls':
        return usage.apiCallsUsed;
      default:
        return 0;
    }
  }

  /**
   * Check if user has exceeded trade limit
   */
  hasExceededTradeLimit(userId: string): boolean {
    const status = this.getUsageStatus(userId);
    return !status.canTrade;
  }

  /**
   * Check if user has exceeded signal limit
   */
  hasExceededSignalLimit(userId: string): boolean {
    const status = this.getUsageStatus(userId);
    return !status.canConsumeSignal;
  }

  /**
   * Check if user has exceeded API call limit
   */
  hasExceededApiCallLimit(userId: string): boolean {
    const status = this.getUsageStatus(userId);
    return !status.canCallApi;
  }

  /**
   * Get daily usage record
   */
  getDailyUsage(userId: string): DailyUsageRecord | undefined {
    const today = this.getTodayKey();
    const key = `${userId}:${today}`;
    return usageStore.get(key);
  }

  /**
   * Reset usage for a specific user (testing only)
   */
  resetUsage(userId: string): void {
    const today = this.getTodayKey();
    const key = `${userId}:${today}`;
    usageStore.delete(key);

    // Also delete threshold markers
    for (const resourceType of ['trades', 'signals', 'apiCalls']) {
      for (const threshold of ALERT_THRESHOLDS) {
        usageStore.delete(`${key}:${resourceType}:${threshold}`);
      }
    }
  }

  /**
   * Clear all usage data (testing only)
   */
  clear(): void {
    usageStore.clear();
    userTierMap.clear();
  }

  /**
   * Start daily reset at midnight UTC
   */
  private startDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyUsage();
      this.startDailyReset();
    }, msUntilMidnight);
  }

  /**
   * Reset all daily usage counters
   */
  private resetDailyUsage(): void {
    const today = this.getTodayKey();

    // Keep only today's threshold markers (for audit trail)
    for (const key of usageStore.keys()) {
      if (!key.includes(today)) {
        usageStore.delete(key);
      }
    }

    logger.info('[TradeMetering] Daily usage reset complete');
  }

  /**
   * Get today's date key (YYYY-MM-DD)
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get total stored records count
   */
  getTotalRecords(): number {
    return usageStore.size;
  }

  /**
   * Get all users currently in overage
   */
  getOverageUsers(): UsageStatus[] {
    const overageUsers: UsageStatus[] = [];

    for (const userId of userTierMap.keys()) {
      const status = this.getUsageStatus(userId);
      if (!status.canTrade || !status.canConsumeSignal || !status.canCallApi) {
        overageUsers.push(status);
      }
    }

    return overageUsers;
  }
}

/**
 * Export singleton instance
 */
export const tradeMeteringService = TradeMeteringService.getInstance();
