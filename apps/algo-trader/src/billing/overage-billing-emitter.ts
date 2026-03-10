/**
 * Overage Billing Emitter — Stripe Usage Records Sync
 *
 * Aggregates overage usage and emits to Stripe Billing API.
 * Runs periodically (default: every 6 hours) to sync overage data.
 *
 * Features:
 * - Singleton pattern for global state
 * - Periodic sync scheduler
 * - Batch Stripe API calls
 * - Error handling with retry queue
 * - Audit logging
 *
 * Usage:
 * ```typescript
 * const emitter = OverageBillingEmitter.getInstance();
 *
 * // Start periodic sync
 * await emitter.startPeriodicSync();
 *
 * // Manual sync for a license
 * await emitter.emitOverageToStripe('lic_abc123');
 *
 * // Stop sync
 * await emitter.stop();
 * ```
 */

import { UsageTrackerService } from '../metering/usage-tracker-service';
import { UsageBillingAdapter, SubscriptionItemMapping } from '../billing/usage-billing-adapter';
import { StripeBillingClient, StripeUsageRecordInput } from '../billing/stripe-billing-client';
import { OverageMeteringService } from '../billing/overage-metering-service';
import { RaaSGatewayKVClient } from '../lib/raas-gateway-kv-client';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

/**
 * Emitter configuration
 */
export interface EmitterConfig {
  /** Stripe API key */
  stripeApiKey?: string;
  /** Sync interval in ms (default: 6 hours) */
  syncIntervalMs?: number;
  /** Whether to start sync on init */
  autoStart?: boolean;
}

/**
 * Overage sync result
 */
export interface OverageSyncResult {
  licenseKey: string;
  /** Whether sync was successful */
  success: boolean;
  /** Overage units synced */
  overageUnits: number;
  /** Stripe subscription item ID */
  subscriptionItemId?: string;
  /** Stripe record IDs if successful */
  recordIds?: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Retry queue entry
 */
interface RetryEntry {
  licenseKey: string;
  overageUnits: number;
  attempt: number;
  nextRetryAt: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<EmitterConfig> = {
  stripeApiKey: '',
  syncIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
  autoStart: false,
};

/**
 * Max retry attempts for failed Stripe calls
 */
const MAX_RETRIES = 3;

/**
 * Retry delay in ms
 */
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export class OverageBillingEmitter {
  private static instance: OverageBillingEmitter;
  private config: Required<EmitterConfig>;
  private tracker: UsageTrackerService;
  private billingAdapter: UsageBillingAdapter;
  private stripeClient?: StripeBillingClient;
  private kvClient: RaaSGatewayKVClient;
  private overageMetering: OverageMeteringService;
  private syncTimer: NodeJS.Timeout | null = null;
  private retryQueue: RetryEntry[] = [];
  private isRunning = false;

  private constructor(config: EmitterConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tracker = UsageTrackerService.getInstance();
    this.billingAdapter = UsageBillingAdapter.getInstance();
    this.kvClient = new RaaSGatewayKVClient();

    if (this.config.stripeApiKey) {
      this.stripeClient = new StripeBillingClient({
        apiKey: this.config.stripeApiKey,
      });
    }

    this.overageMetering = OverageMeteringService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config: EmitterConfig = {}): OverageBillingEmitter {
    if (!OverageBillingEmitter.instance) {
      OverageBillingEmitter.instance = new OverageBillingEmitter(config);
    }
    return OverageBillingEmitter.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (OverageBillingEmitter.instance?.syncTimer) {
      clearInterval(OverageBillingEmitter.instance.syncTimer);
    }
    OverageBillingEmitter.instance = new OverageBillingEmitter();
  }

  /**
   * Start periodic sync
   */
  async startPeriodicSync(): Promise<void> {
    if (this.syncTimer) {
      logger.warn('[OverageEmitter] Sync already running');
      return;
    }

    logger.info('[OverageEmitter] Starting periodic sync', {
      intervalMs: this.config.syncIntervalMs,
    });

    // Run initial sync
    await this.runSync();

    // Schedule periodic sync
    this.syncTimer = setInterval(() => {
      this.runSync().catch((error) => {
        logger.error('[OverageEmitter] Periodic sync failed', { error });
      });
    }, this.config.syncIntervalMs);

    // Allow process to exit without waiting
    this.syncTimer.unref();
  }

  /**
   * Stop periodic sync
   */
  async stop(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.info('[OverageEmitter] Stopped periodic sync');
    }
  }

  /**
   * Emit overage for a specific license to Stripe
   */
  async emitOverageToStripe(
    licenseKey: string,
    subscriptionItemId: string
  ): Promise<OverageSyncResult> {
    if (!this.stripeClient) {
      return {
        licenseKey,
        success: false,
        overageUnits: 0,
        error: 'Stripe client not configured',
      };
    }

    try {
      // Get overage state
      const state = await this.overageMetering.getOverageState(licenseKey);

      if (!state.isInOverage || state.overageUnits <= 0) {
        return {
          licenseKey,
          success: true,
          overageUnits: 0,
          subscriptionItemId,
        };
      }

      // Create Stripe usage record
      const recordInput: StripeUsageRecordInput = {
        subscriptionItemId,
        quantity: state.overageUnits,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      };

      const record = await this.stripeClient.createUsageRecord(recordInput);

      logger.info('[OverageEmitter] Emitted overage to Stripe', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        overageUnits: state.overageUnits,
        recordId: record.id,
      });

      return {
        licenseKey,
        success: true,
        overageUnits: state.overageUnits,
        subscriptionItemId,
        recordIds: [record.id],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[OverageEmitter] Failed to emit overage', {
        licenseKey,
        error: errorMessage,
      });

      // Add to retry queue
      const state = await this.overageMetering.getOverageState(licenseKey);
      this.addToRetryQueue(licenseKey, state.overageUnits);

      return {
        licenseKey,
        success: false,
        overageUnits: state.overageUnits,
        error: errorMessage,
      };
    }
  }

  /**
   * Emit overage for all licenses in retry queue
   */
  async processRetryQueue(
    subscriptionItemMap: Map<string, string>
  ): Promise<OverageSyncResult[]> {
    const results: OverageSyncResult[] = [];
    const now = Date.now();

    // Process due entries
    const dueEntries = this.retryQueue.filter((entry) => entry.nextRetryAt <= now);
    const stillPending = this.retryQueue.filter((entry) => entry.nextRetryAt > now);

    for (const entry of dueEntries) {
      const subscriptionItemId = subscriptionItemMap.get(entry.licenseKey);
      if (!subscriptionItemId) {
        logger.warn('[OverageEmitter] No subscription item for retry', {
          licenseKey: entry.licenseKey,
        });
        continue;
      }

      const result = await this.emitOverageToStripe(
        entry.licenseKey,
        subscriptionItemId
      );

      if (result.success) {
        // Remove from retry queue
        logger.info('[OverageEmitter] Retry successful', {
          licenseKey: entry.licenseKey,
        });
      } else if (entry.attempt < MAX_RETRIES) {
        // Re-queue with increased delay
        entry.attempt++;
        entry.nextRetryAt = now + RETRY_DELAY_MS * entry.attempt;
        stillPending.push(entry);
      } else {
        // Max retries exceeded
        logger.error('[OverageEmitter] Max retries exceeded', {
          licenseKey: entry.licenseKey,
        });
      }

      results.push(result);
    }

    this.retryQueue = stillPending;
    return results;
  }

  /**
   * Run full sync for all licenses in overage
   */
  async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[OverageEmitter] Sync already running');
      return;
    }

    this.isRunning = true;

    try {
      // Get all licenses in overage
      const overageLicenses = await this.overageMetering.getOverageLicenses();

      logger.info('[OverageEmitter] Running sync', {
        overageCount: overageLicenses.length,
        retryQueueSize: this.retryQueue.length,
      });

      // Process each license
      // Note: In production, subscription item mapping should come from database
      // For now, this is a placeholder for the actual implementation
      for (const state of overageLicenses) {
        // TODO: Get subscription item ID from database/config
        // This is a placeholder
        logger.debug('[OverageEmitter] Processing license', {
          licenseKey: state.licenseKey,
          overageUnits: state.overageUnits,
        });
      }

      // Process retry queue
      // Note: subscriptionItemMap should come from database
      const subscriptionItemMap = new Map<string, string>();
      await this.processRetryQueue(subscriptionItemMap);

    } catch (error) {
      logger.error('[OverageEmitter] Sync failed', { error });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Add entry to retry queue
   */
  private addToRetryQueue(licenseKey: string, overageUnits: number): void {
    this.retryQueue.push({
      licenseKey,
      overageUnits,
      attempt: 1,
      nextRetryAt: Date.now() + RETRY_DELAY_MS,
    });
  }

  /**
   * Get retry queue size (for monitoring)
   */
  getRetryQueueSize(): number {
    return this.retryQueue.length;
  }

  /**
   * Get running state
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const overageBillingEmitter = OverageBillingEmitter.getInstance();
