/**
 * Overage Metering Service — Track Usage Beyond Quota
 *
 * Tracks and manages usage that exceeds licensed quota limits.
 * Supports both hard block (legacy) and soft overage (new) modes.
 *
 * Features:
 * - Singleton pattern for global state
 * - Per-license overage tracking
 * - Configurable max overage percent (default: 200% of quota)
 * - Real-time overage state queries
 * - KV sync for persistence
 *
 * Usage:
 * ```typescript
 * const metering = OverageMeteringService.getInstance();
 *
 * // Check if overage is allowed
 * const allowed = await metering.checkOverageAllowed('lic_abc123', 15000, 10000);
 * if (allowed.allowed) {
 *   await metering.trackOverage('lic_abc123', 5000); // 5000 units over quota
 * }
 *
 * // Get overage state
 * const state = await metering.getOverageState('lic_abc123');
 * ```
 */

import { UsageTrackerService } from '../metering/usage-tracker-service';
import { LicenseTier } from '../lib/raas-gate';
import { QUOTA_LIMITS } from '../lib/usage-quota';
import { logger } from '../utils/logger';

/**
 * Overage configuration per license
 */
export interface OverageConfig {
  /** Whether overage is enabled for this license */
  enabled: boolean;
  /** Maximum overage as percent of quota (e.g., 200 = 2x quota) */
  maxOveragePercent: number;
  /** Price per overage unit (optional, for display) */
  pricePerUnit?: number;
}

/**
 * Overage state for a license
 */
export interface OverageState {
  licenseKey: string;
  /** Current usage units */
  currentUsage: number;
  /** Base quota limit */
  quota: number;
  /** Overage units used (beyond quota) */
  overageUnits: number;
  /** Max overage allowed (in units) */
  maxOverage: number;
  /** Whether currently in overage */
  isInOverage: boolean;
  /** Whether overage limit exceeded */
  isOverageExceeded: boolean;
  /** Percent of quota used */
  usagePercent: number;
}

/**
 * Overage check result
 */
export interface OverageCheckResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Reason for decision */
  reason: 'within_quota' | 'overage_allowed' | 'overage_exceeded' | 'overage_disabled';
  /** Current usage */
  currentUsage: number;
  /** Quota limit */
  quota: number;
  /** Overage units if applicable */
  overageUnits?: number;
}

/**
 * Default overage configuration
 */
const DEFAULT_OVERAGE_CONFIG: Record<LicenseTier, OverageConfig> = {
  [LicenseTier.FREE]: {
    enabled: false, // FREE tier cannot have overage
    maxOveragePercent: 0,
  },
  [LicenseTier.PRO]: {
    enabled: true,
    maxOveragePercent: 200, // 2x quota max
    pricePerUnit: 0.001, // $0.001 per overage unit
  },
  [LicenseTier.ENTERPRISE]: {
    enabled: true,
    maxOveragePercent: 300, // 3x quota max
    pricePerUnit: 0.0005, // $0.0005 per overage unit (discount)
  },
};

/**
 * In-memory overage config store (sync with KV in production)
 */
const overageConfigStore = new Map<string, OverageConfig>();

/**
 * In-memory overage state cache
 */
const overageStateCache = new Map<string, OverageState>();

export class OverageMeteringService {
  private static instance: OverageMeteringService;
  private tracker: UsageTrackerService;

  private constructor() {
    this.tracker = UsageTrackerService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OverageMeteringService {
    if (!OverageMeteringService.instance) {
      OverageMeteringService.instance = new OverageMeteringService();
    }
    return OverageMeteringService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    OverageMeteringService.instance = new OverageMeteringService();
    overageConfigStore.clear();
    overageStateCache.clear();
  }

  /**
   * Configure overage for a license
   */
  async configureOverage(
    licenseKey: string,
    config: Partial<OverageConfig>
  ): Promise<void> {
    const tier = this.getCurrentTier(licenseKey);
    const defaultConfig = DEFAULT_OVERAGE_CONFIG[tier];

    const mergedConfig: OverageConfig = {
      ...defaultConfig,
      ...config,
    };

    // FREE tier cannot have overage
    if (tier === LicenseTier.FREE) {
      mergedConfig.enabled = false;
      mergedConfig.maxOveragePercent = 0;
    }

    overageConfigStore.set(licenseKey, mergedConfig);

    logger.info('[OverageMetering] Configured overage', {
      licenseKey: licenseKey.substring(0, 8) + '...',
      config: mergedConfig,
    });
  }

  /**
   * Get overage config for a license
   */
  getOverageConfig(licenseKey: string): OverageConfig | undefined {
    return overageConfigStore.get(licenseKey);
  }

  /**
   * Check if overage is allowed for current usage
   *
   * @param licenseKey - License identifier
   * @param currentUsage - Current usage units
   * @param quota - Base quota limit
   * @returns Overage check result
   */
  async checkOverageAllowed(
    licenseKey: string,
    currentUsage: number,
    quota: number
  ): Promise<OverageCheckResult> {
    const config = this.getOverageConfig(licenseKey) ||
                   DEFAULT_OVERAGE_CONFIG[this.getCurrentTier(licenseKey)];

    // Within quota = always allowed
    if (currentUsage <= quota) {
      return {
        allowed: true,
        reason: 'within_quota',
        currentUsage,
        quota,
      };
    }

    // Overage disabled = block
    if (!config.enabled) {
      return {
        allowed: false,
        reason: 'overage_disabled',
        currentUsage,
        quota,
      };
    }

    // Calculate max overage
    const maxOverage = Math.floor(quota * (config.maxOveragePercent / 100));
    const overageUnits = currentUsage - quota;

    // Check if overage limit exceeded
    if (overageUnits > maxOverage) {
      return {
        allowed: false,
        reason: 'overage_exceeded',
        currentUsage,
        quota,
        overageUnits,
      };
    }

    // Overage allowed
    return {
      allowed: true,
      reason: 'overage_allowed',
      currentUsage,
      quota,
      overageUnits,
    };
  }

  /**
   * Track overage usage
   *
   * @param licenseKey - License identifier
   * @param overageUnits - Number of overage units consumed
   * @param metadata - Optional metadata
   */
  async trackOverage(
    licenseKey: string,
    overageUnits: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Track as special 'overage' event type
    await this.tracker.track(licenseKey, 'overage', overageUnits, {
      ...metadata,
      isOverage: true,
      timestamp: new Date().toISOString(),
    });

    // Update state cache
    await this.updateOverageState(licenseKey);

    logger.info('[OverageMetering] Tracked overage', {
      licenseKey: licenseKey.substring(0, 8) + '...',
      overageUnits,
    });
  }

  /**
   * Get current overage state for a license
   */
  async getOverageState(licenseKey: string): Promise<OverageState> {
    const cached = overageStateCache.get(licenseKey);
    if (cached) {
      return cached;
    }

    // Calculate from usage
    const usage = await this.tracker.getCurrentMonthUsage(licenseKey);
    const tier = this.getCurrentTier(licenseKey);
    const quota = this.getQuotaForTier(tier);
    const config = this.getOverageConfig(licenseKey) || DEFAULT_OVERAGE_CONFIG[tier];

    const currentUsage = usage.totalUnits;
    const overageUnits = Math.max(0, currentUsage - quota);
    const maxOverage = Math.floor(quota * (config.maxOveragePercent / 100));
    const usagePercent = (currentUsage / quota) * 100;

    const state: OverageState = {
      licenseKey,
      currentUsage,
      quota,
      overageUnits,
      maxOverage,
      isInOverage: currentUsage > quota,
      isOverageExceeded: overageUnits > maxOverage,
      usagePercent,
    };

    overageStateCache.set(licenseKey, state);
    return state;
  }

  /**
   * Get all licenses currently in overage
   */
  async getOverageLicenses(): Promise<OverageState[]> {
    const allStates: OverageState[] = [];

    // Iterate through state cache
    for (const licenseKey of overageStateCache.keys()) {
      const state = await this.getOverageState(licenseKey);
      if (state.isInOverage) {
        allStates.push(state);
      }
    }

    return allStates;
  }

  /**
   * Calculate overage cost for a license
   */
  async calculateOverageCost(licenseKey: string): Promise<number> {
    const state = await this.getOverageState(licenseKey);
    const config = this.getOverageConfig(licenseKey) ||
                   DEFAULT_OVERAGE_CONFIG[this.getCurrentTier(licenseKey)];

    if (!config.enabled || !config.pricePerUnit) {
      return 0;
    }

    return Math.round(state.overageUnits * config.pricePerUnit * 100) / 100;
  }

  /**
   * Clear overage state (for webhook restoration)
   */
  clearOverageState(licenseKey: string): void {
    overageStateCache.delete(licenseKey);
    logger.info('[OverageMetering] Cleared overage state', {
      licenseKey: licenseKey.substring(0, 8) + '...',
    });
  }

  /**
   * Update overage state cache
   */
  private async updateOverageState(licenseKey: string): Promise<void> {
    await this.getOverageState(licenseKey);
  }

  /**
   * Get current tier for a license (helper)
   */
  private getCurrentTier(licenseKey: string): LicenseTier {
    // In production, fetch from LicenseService
    // For now, use default PRO tier
    return LicenseTier.PRO;
  }

  /**
   * Get quota limit for tier (helper)
   */
  private getQuotaForTier(tier: LicenseTier): number {
    const quotas: Record<LicenseTier, number> = {
      [LicenseTier.FREE]: 1000,
      [LicenseTier.PRO]: 10000,
      [LicenseTier.ENTERPRISE]: 100000,
    };
    return quotas[tier];
  }
}

// Export singleton instance
export const overageMeteringService = OverageMeteringService.getInstance();
