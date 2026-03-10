/**
 * Dunning KV Sync Job — Sync suspended/revoked tenants to RaaS Gateway KV cache
 *
 * Runs daily via cron job
 * Fetches DunningState WHERE status IN ('SUSPENDED', 'REVOKED')
 * POSTs to RaaS Gateway /internal/sync-suspension endpoint
 */

import { PrismaClient, DunningStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface DunningStateToSync {
  tenantId: string;
  status: 'SUSPENDED' | 'REVOKED';
  suspendedAt?: Date;
  revokedAt?: Date;
}

/**
 * Fetch all suspended/revoked tenants from database
 */
async function fetchSuspendedTenants(): Promise<DunningStateToSync[]> {
  const states = await prisma.dunningState.findMany({
    where: {
      status: {
        in: [DunningStatus.SUSPENDED, DunningStatus.REVOKED],
      },
    },
    select: {
      tenantId: true,
      status: true,
      suspendedAt: true,
      revokedAt: true,
    },
  });

  return states as DunningStateToSync[];
}

/**
 * Sync tenant suspension status to RaaS Gateway KV
 * Uses service token for authentication
 */
async function syncToRaasGateway(
  tenantId: string,
  status: 'SUSPENDED' | 'REVOKED',
  since: Date
): Promise<boolean> {
  const gatewayUrl = process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network';
  const serviceToken = process.env.RAAS_SERVICE_TOKEN;

  try {
    const response = await fetch(`${gatewayUrl}/internal/sync-suspension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceToken}`,
        'X-RaaS-Source': 'dunning-kv-sync',
      },
      body: JSON.stringify({
        tenantId,
        status,
        since: since.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }

    logger.info(`[DunningSync] Synced ${tenantId} (${status}) to RaaS Gateway KV`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[DunningSync] Failed to sync ${tenantId}:`, errorMessage);
    return false;
  }
}

/**
 * Reactivate tenant in KV (remove suspension)
 */
async function reactivateInRaasGateway(tenantId: string): Promise<boolean> {
  const gatewayUrl = process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network';
  const serviceToken = process.env.RAAS_SERVICE_TOKEN;

  try {
    const response = await fetch(`${gatewayUrl}/internal/sync-suspension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceToken}`,
        'X-RaaS-Source': 'dunning-kv-sync',
      },
      body: JSON.stringify({
        tenantId,
        status: 'ACTIVE',
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }

    logger.info(`[DunningSync] Reactivated ${tenantId} in RaaS Gateway KV`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[DunningSync] Failed to reactivate ${tenantId}:`, errorMessage);
    return false;
  }
}

/**
 * Fetch ACTIVE tenants that should NOT be in suspension cache
 */
async function fetchActiveTenants(): Promise<string[]> {
  const states = await prisma.dunningState.findMany({
    where: {
      status: DunningStatus.ACTIVE,
    },
    select: {
      tenantId: true,
    },
  });

  return states.map(s => s.tenantId);
}

/**
 * Main sync job
 */
export async function syncDunningToKV(): Promise<{
  synced: number;
  failed: number;
  reactivated: number;
}> {
  logger.info('[DunningSync] Starting daily KV sync job');

  // Step 1: Sync suspended/revoked tenants TO KV
  const suspendedTenants = await fetchSuspendedTenants();
  let syncedCount = 0;
  let failedCount = 0;

  for (const tenant of suspendedTenants) {
    const since = tenant.status === 'SUSPENDED' ? tenant.suspendedAt : tenant.revokedAt;
    const success = await syncToRaasGateway(tenant.tenantId, tenant.status, since || new Date());
    if (success) {
      syncedCount++;
    } else {
      failedCount++;
    }
  }

  // Step 2: Reactivate ACTIVE tenants (remove from KV)
  const activeTenants = await fetchActiveTenants();
  let reactivatedCount = 0;

  for (const tenantId of activeTenants) {
    const success = await reactivateInRaasGateway(tenantId);
    if (success) {
      reactivatedCount++;
    }
  }

  const summary = {
    synced: syncedCount,
    failed: failedCount,
    reactivated: reactivatedCount,
  };

  logger.info('[DunningSync] Sync complete:', summary);
  return summary;
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const result = await syncDunningToKV();
    console.log('Sync completed:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', errorMessage);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing and cron schedulers
export { main };
