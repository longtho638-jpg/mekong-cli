/**
 * Stripe Usage Sync Service
 *
 * Syncs usage data to Stripe Metered Billing API.
 * Integrates with Cloudflare KV usage meter data and local UsageTrackerService.
 *
 * Features:
 * - Batch sync for multiple tenants/licenses
 * - Idempotent operations with retry logic
 * - Error handling with exponential backoff
 * - Detailed logging for audit trail
 *
 * @see https://docs.stripe.com/api/usage_records
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { UsageBillingAdapter, StripeUsageRecord } from './usage-billing-adapter';
import { UsageTrackerService } from '../metering/usage-tracker-service';
import { OverageSummary } from './overage-calculator';
import { StripeInvoiceService, InvoiceResult, InvoiceOptions } from './stripe-invoice-service';

const prisma = new PrismaClient();

/**
 * Stripe usage sync result
 */
export interface SyncResult {
  success: boolean;
  licenseKey: string;
  recordsSent: number;
  error?: string;
  retryCount?: number;
}

/**
 * Bulk sync summary
 */
export interface BulkSyncSummary {
  period: string;
  totalLicenses: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalRecordsSent: number;
  results: SyncResult[];
}

/**
 * Configuration for Stripe usage sync
 */
export interface StripeSyncConfig {
  stripeSecretKey: string;
  maxRetries: number;
  backoffMs: number;
}

/**
 * Stripe Usage Sync Service
 */
export class StripeUsageSyncService {
  private static instance: StripeUsageSyncService;
  private stripe: Stripe;
  private config: StripeSyncConfig;
  private adapter: UsageBillingAdapter;
  private tracker: UsageTrackerService;
  private invoiceService: StripeInvoiceService;

  private constructor(config?: Partial<StripeSyncConfig>) {
    const stripeSecretKey = config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '';

    if (!stripeSecretKey) {
      logger.warn('[StripeUsageSync] STRIPE_SECRET_KEY not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: config?.maxRetries || 3,
    });

    this.config = {
      stripeSecretKey,
      maxRetries: config?.maxRetries || 3,
      backoffMs: config?.backoffMs || 1000,
    };

    this.adapter = UsageBillingAdapter.getInstance();
    this.tracker = UsageTrackerService.getInstance();
    this.invoiceService = StripeInvoiceService.getInstance();
  }

  static getInstance(config?: Partial<StripeSyncConfig>): StripeUsageSyncService {
    if (!StripeUsageSyncService.instance) {
      StripeUsageSyncService.instance = new StripeUsageSyncService(config);
    }
    return StripeUsageSyncService.instance;
  }

  /**
   * Sync usage for a single license to Stripe
   *
   * Implements exponential backoff retry logic
   */
  async syncLicenseUsage(
    licenseKey: string,
    subscriptionItemId: string,
    period?: string
  ): Promise<SyncResult> {
    const now = new Date();
    const billingPeriod = period || now.toISOString().slice(0, 7);

    logger.info('[StripeUsageSync] Starting sync for license', {
      licenseKey,
      subscriptionItemId,
      period: billingPeriod,
    });

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= this.config.maxRetries) {
      try {
        // Get usage records from adapter
        const records = await this.adapter.syncUsageToStripe(
          licenseKey,
          subscriptionItemId
        );

        if (records.length === 0) {
          logger.debug('[StripeUsageSync] No usage data to sync', {
            licenseKey,
          });
          return {
            success: true,
            licenseKey,
            recordsSent: 0,
          };
        }

        // Send each record to Stripe API
        for (const record of records) {
          await this.stripe.subscriptionItems.createUsageRecord(
            subscriptionItemId,
            {
              quantity: record.quantity,
              timestamp: record.timestamp,
              action: record.action || 'increment',
            },
            {
              idempotencyKey: this.generateIdempotencyKey(
                licenseKey,
                billingPeriod,
                record
              ),
            }
          );
        }

        logger.info('[StripeUsageSync] Sync successful', {
          licenseKey,
          recordsSent: records.length,
        });

        return {
          success: true,
          licenseKey,
          recordsSent: records.length,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('[StripeUsageSync] Sync attempt failed', {
          licenseKey,
          retryCount,
          error: lastError.message,
        });

        // Exponential backoff
        if (retryCount < this.config.maxRetries) {
          const delay = this.config.backoffMs * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        retryCount++;
      }
    }

    // All retries exhausted
    logger.error('[StripeUsageSync] All retries exhausted', {
      licenseKey,
      subscriptionItemId,
      error: lastError?.message,
    });

    return {
      success: false,
      licenseKey,
      recordsSent: 0,
      error: lastError?.message || 'Unknown error',
      retryCount,
    };
  }

  /**
   * Bulk sync for all active licenses
   *
   * Useful for periodic billing sync jobs (e.g., daily or weekly)
   */
  async bulkSync(period?: string): Promise<BulkSyncSummary> {
    const now = new Date();
    const billingPeriod = period || now.toISOString().slice(0, 7);

    logger.info('[StripeUsageSync] Starting bulk sync', {
      period: billingPeriod,
    });

    // Get all active licenses with Stripe subscription info
    const licenses = await prisma.license.findMany({
      where: {
        status: 'active',
      },
      include: {
        tenant: true,
      },
    });

    // Filter licenses that have Stripe subscription metadata
    const licensesWithStripe = licenses.filter(
      (l) => l.metadata && (l.metadata as any).stripeSubscriptionItemId
    );

    const results: SyncResult[] = [];
    let successfulSyncs = 0;
    let failedSyncs = 0;
    let totalRecordsSent = 0;

    for (const license of licensesWithStripe) {
      const subscriptionItemId = (license.metadata as any).stripeSubscriptionItemId;

      const result = await this.syncLicenseUsage(
        license.key,
        subscriptionItemId,
        billingPeriod
      );

      results.push(result);

      if (result.success) {
        successfulSyncs++;
        totalRecordsSent += result.recordsSent;
      } else {
        failedSyncs++;
      }
    }

    const summary: BulkSyncSummary = {
      period: billingPeriod,
      totalLicenses: licensesWithStripe.length,
      successfulSyncs,
      failedSyncs,
      totalRecordsSent,
      results,
    };

    logger.info('[StripeUsageSync] Bulk sync complete', {
      period: billingPeriod,
      totalLicenses: licensesWithStripe.length,
      successfulSyncs,
      failedSyncs,
      totalRecordsSent,
    });

    return summary;
  }

  /**
   * Generate idempotency key for Stripe API call
   *
   * Ensures duplicate requests are safely ignored
   */
  private generateIdempotencyKey(
    licenseKey: string,
    period: string,
    record: StripeUsageRecord
  ): string {
    const hash = this.hashCode(
      `${licenseKey}:${period}:${record.subscription_item}:${record.timestamp}`
    );
    return `overage-sync-${hash}`;
  }

  /**
   * Simple hash function for idempotency keys
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get sync status for a license
   */
  async getSyncStatus(licenseKey: string, period?: string): Promise<{
    synced: boolean;
    lastSyncAt?: Date;
    recordsSynced?: number;
  }> {
    // Check if sync was performed (could be tracked in database)
    // For now, return basic status
    return {
      synced: false,
    };
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    StripeUsageSyncService.instance = new StripeUsageSyncService();
  }

  /**
   * Close Prisma connection
   */
  async shutdown(): Promise<void> {
    await prisma.$disconnect();
  }

  /**
   * Create Stripe invoice for overage charges
   *
   * @param customerId - Stripe customer ID
   * @param summary - Overage summary from OverageCalculator
   * @param options - Invoice configuration options
   * @returns Invoice result with invoice ID and details
   */
  async createOverageInvoice(
    customerId: string,
    summary: OverageSummary,
    options?: InvoiceOptions
  ): Promise<InvoiceResult> {
    logger.info('[StripeUsageSync] Creating overage invoice', {
      customerId,
      tenantId: summary.tenantId,
      period: summary.period,
      totalOverage: summary.totalOverage,
    });

    try {
      // Use StripeInvoiceService to create invoice
      const result = await this.invoiceService.createOverageInvoice(
        customerId,
        summary,
        options
      );

      logger.info('[StripeUsageSync] Overage invoice created', {
        invoiceId: result.invoiceId,
        totalAmount: result.totalAmount,
        currency: result.currency,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[StripeUsageSync] Failed to create overage invoice', {
        customerId,
        tenantId: summary.tenantId,
        error: errorMessage,
      });

      return {
        success: false,
        totalAmount: 0,
        currency: 'usd',
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const stripeUsageSyncService = StripeUsageSyncService.getInstance();
