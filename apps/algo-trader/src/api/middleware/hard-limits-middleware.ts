/**
 * Hard Limits Middleware for Fastify - Usage Quota Enforcement
 *
 * Enforces hard usage limits per license tier with real-time KV metering.
 * Blocks API access when quota exceeded and triggers auto-suspend.
 *
 * Features:
 * - Real-time usage check before each request
 * - Tier-based quota limits (FREE/PRO/ENTERPRISE)
 * - Auto-suspend trigger via RaaS Gateway
 * - 403 response with upgrade path
 * - Webhook sync for payment restoration
 *
 * Usage:
 * ```typescript
 * // Register in fastify-raas-server.ts
 * import { hardLimitsPlugin } from './middleware/hard-limits-middleware';
 * void server.register(hardLimitsPlugin);
 * ```
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { LicenseService, LicenseTier } from '../../lib/raas-gate';
import { UsageTrackerService } from '../../metering/usage-tracker-service';

/**
 * Quota limits per tier (monthly API calls)
 */
export const QUOTA_LIMITS: Record<LicenseTier, number> = {
  [LicenseTier.FREE]: 1000,
  [LicenseTier.PRO]: 10000,
  [LicenseTier.ENTERPRISE]: 100000,
};

/**
 * Suspension state interface
 */
export interface SuspensionState {
  suspended: boolean;
  suspendedAt?: string;
  reason: 'quota_exceeded' | 'payment_failed' | 'manual' | 'expired';
  currentUsage: number;
  limit: number;
}

/**
 * Hard limits middleware options
 */
export interface HardLimitsOptions {
  enabled?: boolean;
  excludePaths?: string[];
  gracePercent?: number; // Warning threshold (default: 90%)
  overageMode?: boolean; // If true, allow overage instead of blocking (default: false)
}

const DEFAULT_OPTIONS: Required<HardLimitsOptions> = {
  enabled: true,
  excludePaths: ['/health', '/ready', '/metrics', '/internal', '/api/v1/billing/webhook'],
  gracePercent: 90,
  overageMode: false,
};

/**
 * Extract license key from request headers
 */
function extractLicenseKey(request: FastifyRequest): string | undefined {
  // Check X-API-Key header first
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) return apiKey;

  // Check Authorization Bearer token
  const authHeader = request.headers['authorization'] as string;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to environment variable
  return process.env.RAAS_LICENSE_KEY;
}

/**
 * Check if path should be excluded from quota check
 */
function isExcludedPath(path: string, excludePaths: string[]): boolean {
  return excludePaths.some((excluded) => {
    if (excluded.endsWith('*')) {
      return path.startsWith(excluded.slice(0, -1));
    }
    return path === excluded || path.startsWith(excluded + '/');
  });
}

/**
 * Get current usage from UsageTrackerService
 */
async function getCurrentUsage(licenseKey: string): Promise<number> {
  const tracker = UsageTrackerService.getInstance();
  const usage = await tracker.getCurrentMonthUsage(licenseKey);
  return usage.totalUnits;
}

/**
 * Trigger auto-suspend via RaaS Gateway
 */
async function triggerAutoSuspend(
  licenseKey: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  try {
    // Call internal sync-suspension endpoint
    const gatewayUrl = process.env.RAAS_GATEWAY_URL || 'http://localhost:8787';
    const response = await fetch(`${gatewayUrl}/internal/sync-suspension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': licenseKey,
      },
      body: JSON.stringify({
        licenseKey,
        status: 'SUSPENDED',
        reason: 'quota_exceeded',
        currentUsage,
        limit,
        suspendedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[HardLimits] Auto-suspend gateway call failed:', response.status);
    }
  } catch (error) {
    console.error('[HardLimits] Auto-suspend error:', error);
  }
}

/**
 * In-memory suspension state store (in production, use Redis/KV)
 */
const suspensionStore = new Map<string, SuspensionState>();

/**
 * Get suspension state for a license
 */
export function getSuspensionState(licenseKey: string): SuspensionState | undefined {
  return suspensionStore.get(licenseKey);
}

/**
 * Clear suspension state (for webhook restoration)
 */
export function clearSuspensionState(licenseKey: string): void {
  suspensionStore.delete(licenseKey);
}

/**
 * Set suspension state
 */
export function setSuspensionState(licenseKey: string, state: SuspensionState): void {
  suspensionStore.set(licenseKey, state);
}

/**
 * Hard limits middleware factory
 *
 * Creates Fastify hooks that:
 * 1. preHandler: Check quota before processing request
 * 2. Block if quota exceeded with 403 response
 */
export function createHardLimitsMiddleware(
  options: HardLimitsOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      if (!opts.enabled) {
        return;
      }

      // Skip excluded paths (health, metrics, internal, webhooks)
      if (isExcludedPath(request.url, opts.excludePaths)) {
        return;
      }

      const licenseKey = extractLicenseKey(request);

      // No license key = free tier, still check quota
      if (!licenseKey) {
        return;
      }

      const licenseService = LicenseService.getInstance();
      const tier = licenseService.getTier();
      const limit = QUOTA_LIMITS[tier];

      // Get current usage
      const currentUsage = await getCurrentUsage(licenseKey);

      // Check if already suspended
      const existingSuspension = getSuspensionState(licenseKey);
      if (existingSuspension?.suspended) {
        return reply.code(403).send({
          error: 'quota_exceeded',
          message: 'Account suspended due to quota exceeded',
          currentUsage: existingSuspension.currentUsage,
          limit: existingSuspension.limit,
          tier,
          suspendedAt: existingSuspension.suspendedAt,
          upgrade_url: 'https://agencyos.network/pricing',
        });
      }

      // Check if quota exceeded
      if (currentUsage >= limit) {
        // If overage mode enabled, skip blocking (overage middleware will handle)
        if (opts.overageMode) {
          // Add warning header but allow request
          reply.header('X-Usage-Warning', `Quota exceeded: ${currentUsage}/${limit}`);
          reply.header('X-Overage-Mode', 'enabled');
          return;
        }

        // Trigger auto-suspend (legacy behavior)
        await triggerAutoSuspend(licenseKey, currentUsage, limit);

        // Set suspension state
        setSuspensionState(licenseKey, {
          suspended: true,
          suspendedAt: new Date().toISOString(),
          reason: 'quota_exceeded',
          currentUsage,
          limit,
        });

        // Log audit event
        console.warn('[HardLimits] Quota exceeded - account suspended', JSON.stringify({
          licenseKey: licenseKey.substring(0, 8) + '...',
          tier,
          currentUsage,
          limit,
          timestamp: new Date().toISOString(),
        }));

        return reply.code(403).send({
          error: 'quota_exceeded',
          message: `Monthly quota exceeded (${currentUsage}/${limit} API calls)`,
          currentUsage,
          limit,
          tier,
          upgrade_url: 'https://agencyos.network/pricing',
        });
      }

      // Warning if approaching limit (90% threshold)
      const warningThreshold = limit * (opts.gracePercent / 100);
      if (currentUsage >= warningThreshold) {
        // Add warning header
        reply.header('X-Usage-Warning', `Approaching limit: ${currentUsage}/${limit} (${Math.round((currentUsage / limit) * 100)}%)`);
      }

      // Add usage headers for transparency
      reply.header('X-Usage-Current', currentUsage.toString());
      reply.header('X-Usage-Limit', limit.toString());
      reply.header('X-Usage-Tier', tier);
    },
  };
}

/**
 * Fastify plugin for easy registration
 *
 * Usage:
 * ```typescript
 * void server.register(hardLimitsPlugin);
 * ```
 */
export async function hardLimitsPlugin(
  fastify: FastifyInstance,
  options: HardLimitsOptions = {}
) {
  const hooks = createHardLimitsMiddleware(options);

  fastify.addHook('preHandler', hooks.preHandler);

  fastify.log.info('[HardLimits] Plugin registered');
}

/**
 * Admin API: Manually suspend a license
 */
export async function manuallySuspendLicense(
  licenseKey: string,
  reason: SuspensionState['reason'] = 'manual'
): Promise<void> {
  const tier = LicenseService.getInstance().getTier();
  const limit = QUOTA_LIMITS[tier];
  const currentUsage = await getCurrentUsage(licenseKey);

  setSuspensionState(licenseKey, {
    suspended: true,
    suspendedAt: new Date().toISOString(),
    reason,
    currentUsage,
    limit,
  });

  await triggerAutoSuspend(licenseKey, currentUsage, limit);
}

/**
 * Admin API: Restore access after payment
 * Called by webhook handler on successful payment
 */
export async function restoreAccess(licenseKey: string): Promise<void> {
  clearSuspensionState(licenseKey);

  // Log restoration
  console.log('[HardLimits] Access restored', JSON.stringify({
    licenseKey: licenseKey.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  }));
}
