/**
 * Stripe Usage Sync Service
 *
 * Syncs usage data to Stripe Metered Billing API.
 * Integrates with RaaS Gateway KV usage meter data and local UsageTrackerService.
 *
 * Features:
 * - Fetch usage from RaaS Gateway KV (api_calls, compute_minutes, ml_inferences)
 * - Aggregate by tenant + subscription_item_id
 * - Batch sync for multiple tenants/licenses
 * - Idempotent operations with retry logic + Stripe idempotency keys
 * - Error handling with exponential backoff
 * - Detailed logging for audit trail
 * - Polar webhook reconciliation
 *
 * @see https://docs.stripe.com/api/usage_records
 * @see https://docs.polar.sh
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
 * RaaS Gateway KV client interface
 */
export interface RaasGatewayClient {
  /** Fetch usage metrics from KV store */
  fetchUsageMetrics(tenantId: string, period: { from: number; to: number }): Promise<KVUsageMetrics>;
  /** Aggregate usage by subscription item */
  aggregateBySubscriptionItem(tenantId: string, metrics: KVUsageMetrics): Promise<AggregatedKVUsage>;
}

/**
 * KV usage metrics structure (raw from RaaS Gateway)
 */
export interface KVUsageMetrics {
  api_calls: number;
  compute_minutes: number;
  ml_inferences: number;
  tenant_id: string;
  period_start: number;
  period_end: number;
}

/**
 * Aggregated KV usage per subscription item
 */
export interface AggregatedKVUsage {
  tenantId: string;
  subscriptionItemId: string;
  priceId: string;
  apiCalls: number;
  computeMinutes: number;
  mlInferences: number;
  timestamp: number;
}

/**
 * Usage record for Stripe sync
 */
export interface UsageRecord {
  tenantId: string;
  subscriptionItemId: string;
  priceId: string;
  quantity: number;
  timestamp: number;
  metricType: 'api_calls' | 'compute_minutes' | 'ml_inferences';
}

/**
 * Stripe push result
 */
export interface StripePushResult {
  success: boolean;
  record?: Stripe.UsageRecord;
  error?: string;
  idempotencyKey?: string;
}

/**
 * Default RaaS Gateway client implementation
 */
export class DefaultRaasGatewayClient implements RaasGatewayClient {
  private gatewayUrl: string;
  private apiKey?: string;

  constructor(gatewayUrl?: string, apiKey?: string) {
    this.gatewayUrl = gatewayUrl || process.env.RAAS_GATEWAY_URL || 'http://localhost:3003';
    this.apiKey = apiKey || process.env.RAAS_GATEWAY_API_KEY;
  }

  async fetchUsageMetrics(
    tenantId: string,
    period: { from: number; to: number }
  ): Promise<KVUsageMetrics> {
    try {
      // Fetch from RaaS Gateway KV API
      const response = await fetch(`${this.gatewayUrl}/v1/usage/${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          period_from: period.from,
          period_to: period.to,
        }),
      });

      if (!response.ok) {
        throw new Error(`RaaS Gateway error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        api_calls: data.api_calls || 0,
        compute_minutes: data.compute_minutes || 0,
        ml_inferences: data.ml_inferences || 0,
        tenant_id: tenantId,
        period_start: period.from,
        period_end: period.to,
      };
    } catch (error) {
      logger.warn('[RaasGatewayClient] KV fetch failed, using local tracker', {
        tenantId,
        error: error instanceof Error ? error.message : error,
      });

      // Fallback to local UsageTrackerService
      const tracker = UsageTrackerService.getInstance();
      const currentMonth = new Date(period.from).toISOString().slice(0, 7);
      const aggregated = await tracker.getUsage(tenantId, currentMonth);

      return {
        api_calls: aggregated.byEventType['api_call'] || 0,
        compute_minutes: aggregated.byEventType['compute_minute'] || 0,
        ml_inferences: aggregated.byEventType['ml_inference'] || 0,
        tenant_id: tenantId,
        period_start: period.from,
        period_end: period.to,
      };
    }
  }

  async aggregateBySubscriptionItem(
    tenantId: string,
    metrics: KVUsageMetrics
  ): Promise<AggregatedKVUsage> {
    // Get subscription item from tenant/license metadata
    const license = await prisma.license.findFirst({
      where: { tenantId: tenantId, status: 'active' },
      select: { metadata: true },
    });

    const metadata = (license?.metadata as any) || {};
    const subscriptionItemId = metadata.stripeSubscriptionItemId || metadata.subscription_item_id;
    const priceId = metadata.stripePriceId || metadata.price_id;

    if (!subscriptionItemId) {
      logger.warn('[RaasGatewayClient] No subscription item for tenant', { tenantId });
    }

    return {
      tenantId,
      subscriptionItemId: subscriptionItemId || '',
      priceId: priceId || '',
      apiCalls: metrics.api_calls,
      computeMinutes: metrics.compute_minutes,
      mlInferences: metrics.ml_inferences,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}

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
  raasGatewayUrl?: string;
  raasGatewayApiKey?: string;
}

/**
 * Sync options
 */
export interface SyncOptions {
  dryRun?: boolean;
  period?: { from: number; to: number };
  tenantIds?: string[];
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
  private raasGateway: RaasGatewayClient;

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
      raasGatewayUrl: config?.raasGatewayUrl,
      raasGatewayApiKey: config?.raasGatewayApiKey,
    };

    this.adapter = UsageBillingAdapter.getInstance();
    this.tracker = UsageTrackerService.getInstance();
    this.invoiceService = StripeInvoiceService.getInstance();
    this.raasGateway = new DefaultRaasGatewayClient(
      config?.raasGatewayUrl,
      config?.raasGatewayApiKey
    );
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
              idempotencyKey: this.generateIdempotencyKeyLegacy(
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
   * Fetch usage from RaaS Gateway KV for a period
   *
   * @param tenantId - Tenant identifier
   * @param period - Time range { from, to } as Unix timestamps
   * @returns Aggregated usage by subscription item
   */
  async fetchAndAggregateUsage(
    tenantId: string,
    period: { from: number; to: number }
  ): Promise<AggregatedKVUsage | null> {
    try {
      // Fetch raw metrics from RaaS Gateway KV
      const metrics = await this.raasGateway.fetchUsageMetrics(tenantId, period);

      // Aggregate by subscription item
      const aggregated = await this.raasGateway.aggregateBySubscriptionItem(tenantId, metrics);

      logger.info('[StripeUsageSync] Fetched and aggregated usage', {
        tenantId,
        subscriptionItemId: aggregated.subscriptionItemId,
        apiCalls: aggregated.apiCalls,
        computeMinutes: aggregated.computeMinutes,
        mlInferences: aggregated.mlInferences,
      });

      return aggregated;
    } catch (error) {
      logger.error('[StripeUsageSync] Fetch and aggregate failed', {
        tenantId,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Push usage records to Stripe Usage Records API
   *
   * @param records - Array of usage records to push
   * @param options - Push options (dryRun, etc.)
   * @returns Array of push results
   */
  async pushUsageToStripe(
    records: UsageRecord[],
    options?: { dryRun?: boolean }
  ): Promise<StripePushResult[]> {
    const results: StripePushResult[] = [];
    const dryRun = options?.dryRun || false;

    for (const record of records) {
      if (!record.subscriptionItemId) {
        logger.warn('[StripeUsageSync] Skipping record without subscription item', {
          tenantId: record.tenantId,
          metricType: record.metricType,
        });
        results.push({
          success: false,
          error: 'No subscription item ID',
        });
        continue;
      }

      const idempotencyKey = this.generateIdempotencyKeyForMetric(
        record.tenantId,
        record.metricType,
        record.timestamp,
        record.quantity
      );

      if (dryRun) {
        logger.info('[StripeUsageSync] [DRY RUN] Would push record', {
          subscriptionItemId: record.subscriptionItemId,
          quantity: record.quantity,
          metricType: record.metricType,
          idempotencyKey,
        });
        results.push({
          success: true,
          idempotencyKey,
        });
        continue;
      }

      try {
        const stripeRecord = await this.stripe.subscriptionItems.createUsageRecord(
          record.subscriptionItemId,
          {
            quantity: record.quantity,
            timestamp: record.timestamp,
            action: 'increment',
          },
          {
            idempotencyKey,
          }
        );

        logger.info('[StripeUsageSync] Pushed usage to Stripe', {
          tenantId: record.tenantId,
          subscriptionItemId: record.subscriptionItemId,
          recordId: stripeRecord.id,
          quantity: record.quantity,
        });

        results.push({
          success: true,
          record: stripeRecord,
          idempotencyKey,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[StripeUsageSync] Push to Stripe failed', {
          tenantId: record.tenantId,
          subscriptionItemId: record.subscriptionItemId,
          metricType: record.metricType,
          error: errorMessage,
        });

        results.push({
          success: false,
          error: errorMessage,
          idempotencyKey,
        });
      }
    }

    return results;
  }

  /**
   * Full sync: fetch from RaaS Gateway + push to Stripe with idempotency
   *
   * @param options - Sync options (dryRun, period, tenantIds)
   * @returns Sync result summary
   */
  async syncUsage(options?: SyncOptions): Promise<SyncResult> {
    const dryRun = options?.dryRun || false;
    const period = options?.period || this.getDefaultPeriod();
    const tenantIds = options?.tenantIds || [];

    logger.info('[StripeUsageSync] Starting full sync', {
      dryRun,
      period: {
        from: new Date(period.from).toISOString(),
        to: new Date(period.to).toISOString(),
      },
      tenantCount: tenantIds.length || 'all',
    });

    try {
      // Get tenants to sync
      const tenants = tenantIds.length > 0
        ? await prisma.tenant.findMany({ where: { id: { in: tenantIds } } })
        : await prisma.tenant.findMany({});

      const allRecords: UsageRecord[] = [];

      // Fetch and aggregate usage for each tenant
      for (const tenant of tenants) {
        const aggregated = await this.fetchAndAggregateUsage(tenant.id, period);

        if (!aggregated || !aggregated.subscriptionItemId) {
          logger.warn('[StripeUsageSync] No subscription item for tenant', {
            tenantId: tenant.id,
          });
          continue;
        }

        // Convert to usage records
        if (aggregated.apiCalls > 0) {
          allRecords.push({
            tenantId: tenant.id,
            subscriptionItemId: aggregated.subscriptionItemId,
            priceId: aggregated.priceId,
            quantity: aggregated.apiCalls,
            timestamp: aggregated.timestamp,
            metricType: 'api_calls',
          });
        }

        if (aggregated.computeMinutes > 0) {
          allRecords.push({
            tenantId: tenant.id,
            subscriptionItemId: aggregated.subscriptionItemId,
            priceId: aggregated.priceId,
            quantity: Math.ceil(aggregated.computeMinutes),
            timestamp: aggregated.timestamp,
            metricType: 'compute_minutes',
          });
        }

        if (aggregated.mlInferences > 0) {
          allRecords.push({
            tenantId: tenant.id,
            subscriptionItemId: aggregated.subscriptionItemId,
            priceId: aggregated.priceId,
            quantity: aggregated.mlInferences,
            timestamp: aggregated.timestamp,
            metricType: 'ml_inferences',
          });
        }
      }

      // Push all records to Stripe
      const pushResults = await this.pushUsageToStripe(allRecords, { dryRun });

      const successCount = pushResults.filter((r) => r.success).length;
      const failedCount = pushResults.length - successCount;

      logger.info('[StripeUsageSync] Full sync complete', {
        totalRecords: allRecords.length,
        successCount,
        failedCount,
        dryRun,
      });

      return {
        success: failedCount === 0,
        licenseKey: 'bulk-sync',
        recordsSent: successCount,
        error: failedCount > 0 ? `${failedCount} records failed` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[StripeUsageSync] Full sync failed', {
        error: errorMessage,
      });

      return {
        success: false,
        licenseKey: 'bulk-sync',
        recordsSent: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Get default period (last 24 hours)
   */
  private getDefaultPeriod(): { from: number; to: number } {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return { from: twentyFourHoursAgo, to: now };
  }

  /**
   * Generate idempotency key for Stripe API call (legacy)
   *
   * Ensures duplicate requests are safely ignored
   *
   * @deprecated Use generateIdempotencyKeyForMetric instead
   */
  private generateIdempotencyKeyLegacy(
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
   * Generate idempotency key for KV-based sync
   */
  private generateIdempotencyKeyForMetric(
    tenantId: string,
    metricType: string,
    timestamp: number,
    quantity: number
  ): string {
    const hash = this.hashCode(`${tenantId}:${metricType}:${timestamp}:${quantity}`);
    return `kv-sync-${tenantId}-${metricType}-${hash}`;
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
