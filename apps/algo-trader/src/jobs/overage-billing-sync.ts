/**
 * Overage Billing Sync — Hourly Cron Job
 *
 * Syncs overage usage to Stripe Billing API.
 * Processes retry queue for failed emissions.
 *
 * Runs hourly at minute 15 via GitHub Actions.
 *
 * Usage:
 * ```bash
 * # Manual execution
 * npx ts-node src/jobs/overage-billing-sync.ts
 *
 * # Scheduled via cron
 * 15 * * * * npx ts-node src/jobs/overage-billing-sync.ts
 * ```
 */

import { OverageBillingEmitter } from '../billing/overage-billing-emitter';
import { UsageBillingAdapter } from '../billing/usage-billing-adapter';
import { StripeBillingClient } from '../billing/stripe-billing-client';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncResult {
  licensesProcessed: number;
  successfulSyncs: number;
  failedSyncs: number;
  retryQueueProcessed: number;
  retryQueueRemaining: number;
}

/**
 * Sync overage billing to Stripe
 */
export async function syncOverageBilling(): Promise<SyncResult> {
  logger.info('[OverageSync] Starting hourly overage billing sync');

  const billingAdapter = UsageBillingAdapter.getInstance();
  const emitter = OverageBillingEmitter.getInstance();

  // Get Stripe API key from environment
  const stripeApiKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeApiKey) {
    logger.warn('[OverageSync] STRIPE_SECRET_KEY not configured, skipping sync');
    return {
      licensesProcessed: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      retryQueueProcessed: 0,
      retryQueueRemaining: emitter.getRetryQueueSize(),
    };
  }

  // Initialize Stripe client
  const stripeClient = new StripeBillingClient({ apiKey: stripeApiKey });

  // Get all licenses with overage billing
  const overageLicenses = billingAdapter.getOverageLicenses();
  logger.info('[OverageSync] Processing overage licenses', {
    count: overageLicenses.length,
  });

  let successfulSyncs = 0;
  let failedSyncs = 0;

  // Process each license
  for (const licenseKey of overageLicenses) {
    try {
      // Get subscription item mapping
      const subscriptionItem = billingAdapter.getSubscriptionItem(licenseKey);
      if (!subscriptionItem) {
        logger.warn('[OverageSync] No subscription item for license', { licenseKey });
        failedSyncs++;
        continue;
      }

      // Generate overage records
      const records = await billingAdapter.generateOverageRecords(licenseKey);
      if (records.length === 0) {
        logger.debug('[OverageSync] No overage records for license', { licenseKey });
        continue;
      }

      // Emit to Stripe
      for (const record of records) {
        await stripeClient.createUsageRecord({
          subscriptionItemId: record.subscription_item,
          quantity: record.quantity,
          timestamp: record.timestamp,
          action: record.action || 'increment',
        });
      }

      logger.info('[OverageSync] Synced overage to Stripe', {
        licenseKey: licenseKey.substring(0, 8) + '...',
        records: records.length,
        totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
      });

      successfulSyncs++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[OverageSync] Sync failed for license', {
        licenseKey,
        error: errorMessage,
      });
      failedSyncs++;
    }
  }

  // Process retry queue
  const subscriptionItemMap = new Map<string, string>();
  for (const licenseKey of overageLicenses) {
    const subscriptionItem = billingAdapter.getSubscriptionItem(licenseKey);
    if (subscriptionItem) {
      subscriptionItemMap.set(licenseKey, subscriptionItem.subscriptionItemId);
    }
  }

  const retryResults = await emitter.processRetryQueue(subscriptionItemMap);
  const retryQueueRemaining = emitter.getRetryQueueSize();

  logger.info('[OverageSync] Hourly sync complete', {
    licensesProcessed: overageLicenses.length,
    successfulSyncs,
    failedSyncs,
    retryQueueProcessed: retryResults.length,
    retryQueueRemaining,
  });

  return {
    licensesProcessed: overageLicenses.length,
    successfulSyncs,
    failedSyncs,
    retryQueueProcessed: retryResults.length,
    retryQueueRemaining,
  };
}

/**
 * Main entry point for cron job
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    const result = await syncOverageBilling();

    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      job: 'overage-billing-sync',
      status: 'success',
      licensesProcessed: result.licensesProcessed,
      successfulSyncs: result.successfulSyncs,
      failedSyncs: result.failedSyncs,
      retryQueueProcessed: result.retryQueueProcessed,
      retryQueueRemaining: result.retryQueueRemaining,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }, null, 2));

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    console.error(JSON.stringify({
      job: 'overage-billing-sync',
      status: 'error',
      error: errorMessage,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }, null, 2));

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing and scheduling
export { main };
