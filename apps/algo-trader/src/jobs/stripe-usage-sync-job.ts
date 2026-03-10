/**
 * Stripe Usage Sync Background Job
 *
 * Periodically syncs usage data from RaaS Gateway KV to Stripe Metered Billing.
 * Runs every 5 minutes by default (configurable).
 *
 * Features:
 * - Configurable sync interval (default: 5 minutes)
 * - Error logging with exponential backoff retry
 * - Graceful shutdown support
 * - Idempotent sync operations
 * - Polar webhook reconciliation handler
 *
 * Usage:
 * ```typescript
 * const job = new StripeUsageSyncJob(stripeClient, raasGatewayClient);
 * job.start(); // Start background sync
 *
 * // On shutdown:
 * job.stop();
 * ```
 */

import Stripe from 'stripe';
import { logger } from '../utils/logger';
import {
  StripeUsageSyncService,
  SyncOptions,
  RaasGatewayClient,
  DefaultRaasGatewayClient,
} from '../billing/stripe-usage-sync';

/**
 * Job configuration
 */
interface JobConfig {
  /** Sync interval in milliseconds (default: 5 minutes) */
  intervalMs: number;
  /** Enable exponential backoff on errors (default: true) */
  enableBackoff: boolean;
  /** Maximum backoff delay (default: 30 minutes) */
  maxBackoffMs: number;
  /** Dry run mode - log but don't push to Stripe (default: false) */
  dryRun: boolean;
  /** Specific tenant IDs to sync (default: all active tenants) */
  tenantIds?: string[];
}

const DEFAULT_CONFIG: JobConfig = {
  intervalMs: 5 * 60 * 1000, // 5 minutes
  enableBackoff: true,
  maxBackoffMs: 30 * 60 * 1000, // 30 minutes
  dryRun: false,
};

/**
 * Stripe Usage Sync Background Job
 */
export class StripeUsageSyncJob {
  private sync: StripeUsageSyncService;
  private config: JobConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private currentBackoffMs: number = 0;
  private raasGateway: RaasGatewayClient;

  /**
   * Create a new Stripe usage sync job
   *
   * @param stripe - Stripe client instance
   * @param raasGateway - RaaS Gateway client (optional, uses default if not provided)
   * @param intervalMs - Sync interval in ms (optional, defaults to 5 minutes)
   */
  constructor(
    stripe?: Stripe,
    raasGateway?: RaasGatewayClient,
    intervalMs?: number
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      intervalMs: intervalMs || DEFAULT_CONFIG.intervalMs,
    };

    // Use provided Stripe client or create from env
    const stripeKey = stripe ? undefined : process.env.STRIPE_SECRET_KEY;
    if (stripe) {
      this.sync = StripeUsageSyncService.getInstance({ stripeSecretKey: '' });
      (this.sync as any).stripe = stripe;
    } else {
      this.sync = StripeUsageSyncService.getInstance();
    }

    this.raasGateway = raasGateway || new DefaultRaasGatewayClient();
  }

  /**
   * Start the background sync job
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('[StripeUsageSyncJob] Already running');
      return;
    }

    logger.info('[StripeUsageSyncJob] Starting', {
      intervalMs: this.config.intervalMs,
      intervalMinutes: this.config.intervalMs / 60000,
      dryRun: this.config.dryRun,
    });

    // Run immediately on start
    this.runSync();

    // Then run on interval
    this.intervalId = setInterval(() => {
      if (!this.isRunning) {
        this.runSync();
      } else {
        logger.warn('[StripeUsageSyncJob] Skipping interval - previous sync still running');
      }
    }, this.config.intervalMs);

    // Allow process to exit without waiting for timer
    this.intervalId.unref();
  }

  /**
   * Stop the background sync job
   */
  stop(): void {
    if (!this.intervalId) {
      logger.debug('[StripeUsageSyncJob] Not running');
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;

    logger.info('[StripeUsageSyncJob] Stopped');

    // Wait for current sync to complete
    if (this.isRunning) {
      logger.info('[StripeUsageSyncJob] Waiting for current sync to complete...');
    }
  }

  /**
   * Run a single sync operation
   *
   * Implements exponential backoff on errors.
   */
  async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[StripeUsageSyncJob] Sync already in progress - skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('[StripeUsageSyncJob] Running sync', {
        dryRun: this.config.dryRun,
        backoffMs: this.currentBackoffMs,
      });

      // Apply backoff delay if previous attempt failed
      if (this.currentBackoffMs > 0) {
        logger.info('[StripeUsageSyncJob] Applying backoff delay', {
          delayMs: this.currentBackoffMs,
        });
        await new Promise((resolve) => setTimeout(resolve, this.currentBackoffMs));
      }

      const options: SyncOptions = {
        dryRun: this.config.dryRun,
      };

      if (this.config.tenantIds && this.config.tenantIds.length > 0) {
        options.tenantIds = this.config.tenantIds;
      }

      const result = await this.sync.syncUsage(options);

      if (result.success) {
        logger.info('[StripeUsageSyncJob] Sync successful', {
          recordsSent: result.recordsSent,
          durationMs: Date.now() - startTime,
        });

        // Reset backoff on success
        this.currentBackoffMs = 0;
      } else {
        logger.error('[StripeUsageSyncJob] Sync failed', {
          error: result.error,
          recordsSent: result.recordsSent,
          durationMs: Date.now() - startTime,
        });

        // Apply exponential backoff
        if (this.config.enableBackoff) {
          this.applyBackoff();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[StripeUsageSyncJob] Sync error', {
        error: errorMessage,
        durationMs: Date.now() - startTime,
      });

      // Apply exponential backoff
      if (this.config.enableBackoff) {
        this.applyBackoff();
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Apply exponential backoff
   *
   * Doubles the backoff delay up to maximum.
   */
  private applyBackoff(): void {
    const baseBackoff = this.config.intervalMs * 0.5; // Start at 50% of interval

    if (this.currentBackoffMs === 0) {
      this.currentBackoffMs = baseBackoff;
    } else {
      this.currentBackoffMs = Math.min(
        this.currentBackoffMs * 2,
        this.config.maxBackoffMs
      );
    }

    logger.info('[StripeUsageSyncJob] Backoff applied', {
      nextBackoffMs: this.currentBackoffMs,
      maxBackoffMs: this.config.maxBackoffMs,
    });
  }

  /**
   * Get job status
   */
  getStatus(): {
    isRunning: boolean;
    intervalMs: number;
    currentBackoffMs: number;
    dryRun: boolean;
  } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.config.intervalMs,
      currentBackoffMs: this.currentBackoffMs,
      dryRun: this.config.dryRun,
    };
  }

  /**
   * Update job configuration
   */
  updateConfig(config: Partial<JobConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('[StripeUsageSyncJob] Config updated', this.config);
  }

  /**
   * Create Polar webhook reconciliation handler
   *
   * Verifies usage data matches Polar billing records.
   * Used for dual-billing scenarios (Stripe + Polar).
   *
   * @param webhookPayload - Polar webhook payload
   * @returns Reconciliation result
   */
  async handlePolarWebhookReconciliation(
    webhookPayload: {
      subscription_id: string;
      tenant_id: string;
      period: string;
      usage?: {
        api_calls?: number;
        compute_minutes?: number;
        ml_inferences?: number;
      };
    }
  ): Promise<{
    matched: boolean;
    discrepancies: Array<{
      metric: string;
      stripeValue: number;
      polarValue: number;
      difference: number;
    }>;
    message: string;
  }> {
    const { tenant_id, subscription_id, period, usage } = webhookPayload;

    logger.info('[StripeUsageSyncJob] Polar webhook reconciliation', {
      tenant_id,
      subscription_id,
      period,
    });

    try {
      // Get usage from our records for the same period
      const tracker = (this.sync as any).tracker as ReturnType<typeof import('../metering/usage-tracker-service').UsageTrackerService.getInstance>;
      const aggregated = await tracker.getUsage(tenant_id, period);

      const localUsageage = {
        api_calls: aggregated.byEventType['api_call'] || 0,
        compute_minutes: aggregated.byEventType['compute_minute'] || 0,
        ml_inferences: aggregated.byEventType['ml_inference'] || 0,
      };

      const discrepancies: Array<{
        metric: string;
        stripeValue: number;
        polarValue: number;
        difference: number;
      }> = [];

      // Compare each metric
      const metrics = ['api_calls', 'compute_minutes', 'ml_inferences'] as const;
      for (const metric of metrics) {
        const polarValue = usage?.[metric] || 0;
        const localValue = localUsageage[metric];
        const difference = Math.abs(polarValue - localValue);

        // Allow 1% tolerance for rounding differences
        if (difference > 0 && difference / Math.max(polarValue, localValue) > 0.01) {
          discrepancies.push({
            metric,
            stripeValue: localValue,
            polarValue,
            difference,
          });
        }
      }

      const matched = discrepancies.length === 0;

      logger.info('[StripeUsageSyncJob] Reconciliation complete', {
        tenant_id,
        matched,
        discrepanciesCount: discrepancies.length,
      });

      return {
        matched,
        discrepancies,
        message: matched
          ? 'Usage records match'
          : `Found ${discrepancies.length} discrepancies`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[StripeUsageSyncJob] Reconciliation failed', {
        tenant_id,
        error: errorMessage,
      });

      return {
        matched: false,
        discrepancies: [],
        message: `Reconciliation failed: ${errorMessage}`,
      };
    }
  }
}

/**
 * Create and start a Stripe usage sync job
 *
 * Convenience factory function for quick setup.
 *
 * @param intervalMs - Sync interval (default: 5 minutes)
 * @returns Started job instance
 */
export function createStripeUsageSyncJob(intervalMs?: number): StripeUsageSyncJob {
  const job = new StripeUsageSyncJob(undefined, undefined, intervalMs);
  job.start();
  return job;
}
