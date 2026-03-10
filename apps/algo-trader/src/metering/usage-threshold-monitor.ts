/**
 * Usage Threshold Monitor Service
 *
 * Monitors usage levels and sends notifications when thresholds are breached:
 * - 80% of quota: Warning notification
 * - 100% of quota: Limit reached alert
 * - >100% of quota: Overage started notification
 *
 * Integrates with BillingNotificationService for multi-channel alerts.
 *
 * Usage:
 * ```typescript
 * const monitor = UsageThresholdMonitor.getInstance();
 *
 * // Start monitoring (runs every 5 minutes)
 * await monitor.startMonitoring();
 *
 * // Check specific license
 * await monitor.checkThreshold('lic_abc123');
 *
 * // Stop monitoring
 * await monitor.stopMonitoring();
 * ```
 */

import { UsageTrackerService } from '../metering/usage-tracker-service';
import { BillingNotificationService, NotificationData } from '../notifications/billing-notification-service';
import { UsageBillingAdapter, OverageBillingConfig } from '../billing/usage-billing-adapter';
import { logger } from '../utils/logger';

/**
 * Threshold breach types
 */
export type ThresholdBreachType = 'warning' | 'limit_reached' | 'overage_started';

/**
 * Threshold check result
 */
export interface ThresholdCheckResult {
  licenseKey: string;
  breachType: ThresholdBreachType | null;
  currentUsage: number;
  quotaLimit: number;
  percentUsed: number;
  overageUnits: number;
  notified: boolean;
}

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  warningPercent: number;     // 80% = warning notification
  limitPercent: number;        // 100% = limit reached
  overagePercent: number;      // >100% = overage started
  checkIntervalMs: number;     // Default: 5 minutes
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ThresholdConfig = {
  warningPercent: 80,
  limitPercent: 100,
  overagePercent: 100,
  checkIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Notification state tracking
 */
interface NotificationState {
  licenseKey: string;
  lastWarningSentAt?: number;
  lastLimitSentAt?: number;
  lastOverageSentAt?: number;
  cooldownMs: number; // Prevent spam - 1 hour minimum between same notifications
}

export class UsageThresholdMonitor {
  private static instance: UsageThresholdMonitor;
  private config: ThresholdConfig;
  private tracker: UsageTrackerService;
  private billingAdapter: UsageBillingAdapter;
  private notificationService: BillingNotificationService;
  private checkTimer: NodeJS.Timeout | null = null;
  private notificationStates: Map<string, NotificationState>;
  private isRunning = false;

  private constructor(config: Partial<ThresholdConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tracker = UsageTrackerService.getInstance();
    this.billingAdapter = UsageBillingAdapter.getInstance();
    this.notificationService = BillingNotificationService.getInstance();
    this.notificationStates = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ThresholdConfig>): UsageThresholdMonitor {
    if (!UsageThresholdMonitor.instance) {
      UsageThresholdMonitor.instance = new UsageThresholdMonitor(config);
    }
    return UsageThresholdMonitor.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (UsageThresholdMonitor.instance?.checkTimer) {
      clearInterval(UsageThresholdMonitor.instance.checkTimer);
    }
    UsageThresholdMonitor.instance = new UsageThresholdMonitor();
  }

  /**
   * Start periodic threshold monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.checkTimer) {
      logger.warn('[ThresholdMonitor] Monitoring already running');
      return;
    }

    logger.info('[ThresholdMonitor] Starting periodic monitoring', {
      intervalMs: this.config.checkIntervalMs,
      warningPercent: this.config.warningPercent,
      limitPercent: this.config.limitPercent,
    });

    // Run initial check
    await this.runThresholdCheck();

    // Schedule periodic checks
    this.checkTimer = setInterval(() => {
      this.runThresholdCheck().catch((error) => {
        logger.error('[ThresholdMonitor] Periodic check failed', { error });
      });
    }, this.config.checkIntervalMs);

    // Allow process to exit without waiting
    this.checkTimer?.unref();
    this.isRunning = true;
  }

  /**
   * Stop periodic monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      logger.info('[ThresholdMonitor] Stopped periodic monitoring');
    }
    this.isRunning = false;
  }

  /**
   * Run threshold check for all licenses with overage billing
   */
  private async runThresholdCheck(): Promise<void> {
    if (this.isRunning && checkTimerRunning(this.checkTimer)) {
      logger.debug('[ThresholdMonitor] Running scheduled threshold check');
    }

    const overageLicenses = this.billingAdapter.getOverageLicenses();

    for (const licenseKey of overageLicenses) {
      try {
        await this.checkThreshold(licenseKey);
      } catch (error) {
        logger.error('[ThresholdMonitor] License check failed', {
          licenseKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Check threshold for a specific license
   */
  async checkThreshold(licenseKey: string): Promise<ThresholdCheckResult> {
    const config = this.billingAdapter.getOverageConfig(licenseKey);
    if (!config || !config.overageEnabled) {
      return {
        licenseKey,
        breachType: null,
        currentUsage: 0,
        quotaLimit: 0,
        percentUsed: 0,
        overageUnits: 0,
        notified: false,
      };
    }

    // Get current usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const aggregated = await this.tracker.getUsage(licenseKey, currentMonth);
    const currentUsage = this.getUsageForMetric(aggregated, config.metric);

    // Calculate percentages
    const percentUsed = (currentUsage / config.quotaLimit) * 100;
    const overageUnits = Math.max(0, currentUsage - config.quotaLimit);

    // Determine breach type
    let breachType: ThresholdBreachType | null = null;
    if (percentUsed > this.config.overagePercent) {
      breachType = 'overage_started';
    } else if (percentUsed >= this.config.limitPercent) {
      breachType = 'limit_reached';
    } else if (percentUsed >= this.config.warningPercent) {
      breachType = 'warning';
    }

    // Send notification if breached and not in cooldown
    let notified = false;
    if (breachType) {
      notified = await this.sendNotificationIfNeeded(licenseKey, breachType, {
        currentUsage,
        quotaLimit: config.quotaLimit,
        percentUsed,
        overageUnits,
      });
    }

    return {
      licenseKey,
      breachType,
      currentUsage,
      quotaLimit: config.quotaLimit,
      percentUsed: Math.round(percentUsed * 100) / 100,
      overageUnits,
      notified,
    };
  }

  /**
   * Send notification if not in cooldown period
   */
  private async sendNotificationIfNeeded(
    licenseKey: string,
    breachType: ThresholdBreachType,
    usage: { currentUsage: number; quotaLimit: number; percentUsed: number; overageUnits: number }
  ): Promise<boolean> {
    const state = this.getOrCreateNotificationState(licenseKey);
    const now = Date.now();

    // Check cooldown
    let lastSentAt: number | undefined;
    switch (breachType) {
      case 'warning':
        lastSentAt = state.lastWarningSentAt;
        break;
      case 'limit_reached':
        lastSentAt = state.lastLimitSentAt;
        break;
      case 'overage_started':
        lastSentAt = state.lastOverageSentAt;
        break;
    }

    if (lastSentAt && now - lastSentAt < state.cooldownMs) {
      logger.debug('[ThresholdMonitor] In cooldown, skipping notification', {
        licenseKey,
        breachType,
        minutesSinceLastSent: Math.round((now - lastSentAt) / 60000),
      });
      return false;
    }

    // Send notification
    try {
      const notificationData: NotificationData = {
        tenantId: licenseKey,
        amount: this.calculateEstimatedOverageCharge(usage.overageUnits),
        currency: 'USD',
        gracePeriodDays: 7,
        retryUrl: 'https://agencyos.network/billing/topup',
        supportUrl: 'https://agencyos.network/support',
      };

      // Add breach-specific data
      switch (breachType) {
        case 'warning':
          await this.notificationService.sendNotification('grace_period_started', licenseKey, ['email', 'telegram'], {
            ...notificationData,
            gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          state.lastWarningSentAt = now;
          break;

        case 'limit_reached':
          await this.notificationService.sendNotification('account_suspended', licenseKey, ['email', 'sms', 'telegram'], {
            ...notificationData,
          });
          state.lastLimitSentAt = now;
          break;

        case 'overage_started':
          await this.notificationService.sendNotification('overage_charged', licenseKey, ['email', 'sms', 'telegram'], {
            ...notificationData,
            overageUnits: usage.overageUnits,
            overageCharge: this.calculateEstimatedOverageCharge(usage.overageUnits),
            period: new Date().toISOString().slice(0, 7),
          });
          state.lastOverageSentAt = now;
          break;
      }

      logger.info('[ThresholdMonitor] Notification sent', {
        licenseKey,
        breachType,
        percentUsed: usage.percentUsed,
      });

      return true;
    } catch (error) {
      logger.error('[ThresholdMonitor] Notification failed', {
        licenseKey,
        breachType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Calculate estimated overage charge
   */
  private calculateEstimatedOverageCharge(overageUnits: number): number {
    // Default: $0.01 per overage unit
    // This should come from the overage config in production
    const overagePricePerUnit = 0.01;
    return Math.round(overageUnits * overagePricePerUnit * 100) / 100;
  }

  /**
   * Get or create notification state for a license
   */
  private getOrCreateNotificationState(licenseKey: string): NotificationState {
    let state = this.notificationStates.get(licenseKey);
    if (!state) {
      state = {
        licenseKey,
        cooldownMs: 60 * 60 * 1000, // 1 hour cooldown
      };
      this.notificationStates.set(licenseKey, state);
    }
    return state;
  }

  /**
   * Get usage for a specific metric from aggregated data
   */
  private getUsageForMetric(
    aggregated: Awaited<ReturnType<UsageTrackerService['getUsage']>>,
    metric: 'api_calls' | 'compute_minutes' | 'ml_inferences'
  ): number {
    switch (metric) {
      case 'api_calls':
        return aggregated.byEventType['api_call'] || 0;
      case 'compute_minutes':
        return Math.ceil(aggregated.byEventType['compute_minute'] || 0);
      case 'ml_inferences':
        return aggregated.byEventType['ml_inference'] || 0;
      default:
        return 0;
    }
  }

  /**
   * Get monitoring status
   */
  isMonitoringRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get notification state for debugging
   */
  getNotificationState(licenseKey: string): NotificationState | undefined {
    return this.notificationStates.get(licenseKey);
  }

  /**
   * Shutdown monitor
   */
  async shutdown(): Promise<void> {
    await this.stopMonitoring();
  }
}

// Helper to check if timer is still running
function checkTimerRunning(timer: NodeJS.Timeout | null): boolean {
  return timer !== null;
}

// Export singleton instance
export const usageThresholdMonitor = UsageThresholdMonitor.getInstance();
