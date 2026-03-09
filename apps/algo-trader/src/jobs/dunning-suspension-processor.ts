/**
 * Dunning Suspension Processor — Weekly Cron Job
 *
 * Processes suspension timeouts and revokes accounts
 * that have exceeded their suspension period (default: 14 days).
 *
 * Runs weekly on Monday at 3:00 AM UTC via GitHub Actions.
 *
 * Usage:
 * ```bash
 * # Manual execution
 * npx ts-node src/jobs/dunning-suspension-processor.ts
 *
 * # Scheduled via cron
 * 0 3 * * 1 npx ts-node src/jobs/dunning-suspension-processor.ts
 * ```
 */

import { DunningStateMachine } from '../billing/dunning-state-machine';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Process suspension timeouts
 */
export async function processSuspensionTimeouts(): Promise<{
  processed: number;
  tenantIds: string[];
  errors: Array<{ tenantId: string; error: string }>;
}> {
  logger.info('[DunningSuspension] Starting weekly suspension processor');

  const dunningMachine = DunningStateMachine.getInstance();
  const errors: Array<{ tenantId: string; error: string }> = [];

  try {
    const result = await dunningMachine.processSuspensionTimeouts();

    logger.info('[DunningSuspension] Suspension processing complete', {
      processed: result.processed,
      tenantIds: result.tenantIds.slice(0, 10), // Log first 10 for brevity
      totalTenants: result.tenantIds.length,
    });

    return {
      processed: result.processed,
      tenantIds: result.tenantIds,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DunningSuspension] Processing failed', { error: errorMessage });
    errors.push({ tenantId: 'unknown', error: errorMessage });

    return {
      processed: 0,
      tenantIds: [],
      errors,
    };
  }
}

/**
 * Main entry point for cron job
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    const result = await processSuspensionTimeouts();

    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      job: 'dunning-suspension-processor',
      status: 'success',
      processed: result.processed,
      revokedCount: result.tenantIds.length,
      errors: result.errors.length,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }, null, 2));

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    console.error(JSON.stringify({
      job: 'dunning-suspension-processor',
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
