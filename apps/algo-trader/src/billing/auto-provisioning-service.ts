/**
 * Auto Provisioning Service — Tenant Resource Lifecycle Management
 *
 * Handles automatic provisioning and deprovisioning of tenant resources:
 * - Creates tenant API keys with cryptographic security
 * - Sets default strategy configuration based on tier
 * - Provisions tenant state in TenantStrategyManager
 * - Cleans up resources on cancellation
 * - Logs all provisioning events for audit compliance
 *
 * Triggered by Polar webhook events: subscription.active, subscription.canceled
 */

import { createHash, randomBytes } from 'crypto';
import { TenantTier } from './polar-subscription-service';
import { LicenseTier } from '../lib/raas-gate';
import { PolarAuditLogger } from './polar-audit-logger';
import { StrategyConfig } from '../core/strategy-config-cascade';

/**
 * Provisioning result with status and generated resources
 */
export interface ProvisioningResult {
  success: boolean;
  tenantId: string;
  subscriptionId: string;
  apiKey?: string;
  apiKeyChecksum?: string;
  defaultConfig?: StrategyConfig;
  tier: TenantTier;
  timestamp: string;
  error?: string;
}

/**
 * Deprovisioning result
 */
export interface DeprovisioningResult {
  success: boolean;
  tenantId: string;
  subscriptionId: string;
  resourcesCleaned: string[];
  timestamp: string;
  error?: string;
}

/**
 * Provisioning audit log entry
 */
interface ProvisioningAuditLog {
  event: 'provision' | 'deprovision' | 'api_key_generated' | 'config_set' | 'cleanup_failed';
  tenantId: string;
  subscriptionId: string;
  tier: TenantTier;
  success: boolean;
  timestamp: string;
  details?: Record<string, unknown>;
  error?: string;
}

/**
 * Default strategy configuration per tier
 */
const TIER_DEFAULT_CONFIGS: Record<TenantTier, StrategyConfig> = {
  free: {
    pair: 'BTC/USDT',
    timeframe: '1h',
    exchangeId: 'binance',
    maxPositionSizeUsd: 500,
    maxDailyLossUsd: 50,
    stopLossPercent: 2.0,
    takeProfitPercent: 5.0,
    pollIntervalMs: 2000,
    mode: 'paper',
  },
  pro: {
    pair: 'BTC/USDT',
    timeframe: '1h',
    exchangeId: 'binance',
    maxPositionSizeUsd: 5000,
    maxDailyLossUsd: 500,
    stopLossPercent: 1.5,
    takeProfitPercent: 4.0,
    pollIntervalMs: 2000,
    mode: 'live',
  },
  enterprise: {
    pair: 'BTC/USDT',
    timeframe: '1h',
    exchangeId: 'binance',
    maxPositionSizeUsd: 50000,
    maxDailyLossUsd: 5000,
    stopLossPercent: 1.0,
    takeProfitPercent: 3.0,
    pollIntervalMs: 2000,
    mode: 'live',
  },
};

/**
 * Auto Provisioning Service
 *
 * Manages tenant resource lifecycle:
 * - Provisioning: API key generation, default config, tenant state
 * - Deprovisioning: Resource cleanup, state removal
 * - Audit logging for compliance
 */
export class AutoProvisioningService {
  private static instance: AutoProvisioningService;
  private auditLogger: PolarAuditLogger;

  // Track provisioned tenants (in production, persist to database)
  private provisionedTenants = new Map<string, {
    subscriptionId: string;
    tier: TenantTier;
    apiKeyChecksum: string;
    provisionedAt: string;
  }>();

  private constructor() {
    this.auditLogger = PolarAuditLogger.getInstance();
  }

  static getInstance(): AutoProvisioningService {
    if (!AutoProvisioningService.instance) {
      AutoProvisioningService.instance = new AutoProvisioningService();
    }
    return AutoProvisioningService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    AutoProvisioningService.instance = new AutoProvisioningService();
  }

  /**
   * Provision tenant resources when subscription activates
   *
   * Steps:
   * 1. Generate secure API key for tenant
   * 2. Set default strategy config based on tier
   * 3. Initialize tenant state
   * 4. Log provisioning event
   */
  async provisionTenant(
    subscriptionId: string,
    customerId: string,
    tier: TenantTier,
  ): Promise<ProvisioningResult> {
    const timestamp = new Date().toISOString();
    const tenantId = `tenant_${customerId}`;

    try {
      // Check if already provisioned (idempotency)
      if (this.provisionedTenants.has(tenantId)) {
        const existing = this.provisionedTenants.get(tenantId)!;
        return {
          success: true,
          tenantId,
          subscriptionId,
          tier,
          timestamp,
          apiKeyChecksum: existing.apiKeyChecksum,
        };
      }

      // Step 1: Generate API key
      const { apiKey, checksum } = this.generateApiKey(tenantId, tier);

      // Step 2: Generate default config based on tier
      const defaultConfig = this.getDefaultConfigForTier(tier);

      // Step 3: Track provisioning
      this.provisionedTenants.set(tenantId, {
        subscriptionId,
        tier,
        apiKeyChecksum: checksum,
        provisionedAt: timestamp,
      });

      // Step 4: Log API key generation
      this.logAudit({
        event: 'api_key_generated',
        tenantId,
        subscriptionId,
        tier,
        success: true,
        timestamp,
        details: { checksum },
      });

      // Step 5: Log config set
      this.logAudit({
        event: 'config_set',
        tenantId,
        subscriptionId,
        tier,
        success: true,
        timestamp,
        details: { config: defaultConfig },
      });

      // Step 6: Log provisioning
      this.logAudit({
        event: 'provision',
        tenantId,
        subscriptionId,
        tier,
        success: true,
        timestamp,
        details: { defaultConfig },
      });

      return {
        success: true,
        tenantId,
        subscriptionId,
        apiKey,
        apiKeyChecksum: checksum,
        defaultConfig,
        tier,
        timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAudit({
        event: 'provision',
        tenantId,
        subscriptionId,
        tier,
        success: false,
        timestamp,
        error: errorMessage,
      });

      return {
        success: false,
        tenantId,
        subscriptionId,
        tier,
        timestamp,
        error: errorMessage,
      };
    }
  }

  /**
   * Deprovision tenant resources when subscription cancels
   *
   * Steps:
   * 1. Clean up tenant state
   * 2. Invalidate API key
   * 3. Remove tenant from provisioned list
   * 4. Log deprovisioning event
   */
  async deprovisionTenant(subscriptionId: string): Promise<DeprovisioningResult> {
    const timestamp = new Date().toISOString();

    // Find tenant by subscriptionId
    let tenantId: string | null = null;
    let tier: TenantTier = 'free';

    for (const [tid, data] of this.provisionedTenants.entries()) {
      if (data.subscriptionId === subscriptionId) {
        tenantId = tid;
        tier = data.tier;
        break;
      }
    }

    if (!tenantId) {
      return {
        success: false,
        tenantId: 'unknown',
        subscriptionId,
        resourcesCleaned: [],
        timestamp,
        error: 'Tenant not found for subscription',
      };
    }

    const resourcesCleaned: string[] = [];

    try {
      // Step 1: Remove from provisioned list (invalidates API key)
      this.provisionedTenants.delete(tenantId);
      resourcesCleaned.push('tenant_record');

      // Step 2: Log cleanup
      this.logAudit({
        event: 'deprovision',
        tenantId,
        subscriptionId,
        tier,
        success: true,
        timestamp,
        details: { resourcesCleaned },
      });

      return {
        success: true,
        tenantId,
        subscriptionId,
        resourcesCleaned,
        timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAudit({
        event: 'cleanup_failed',
        tenantId: tenantId || 'unknown',
        subscriptionId,
        tier,
        success: false,
        timestamp,
        error: errorMessage,
        details: { partialCleanup: resourcesCleaned },
      });

      return {
        success: false,
        tenantId,
        subscriptionId,
        resourcesCleaned,
        timestamp,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate secure API key for tenant
   *
   * Format: raas_{tier}_{random32}_{checksum}
   * Example: raas_pro_a1b2c3d4e5f6_8x9y0z
   */
  private generateApiKey(tenantId: string, tier: TenantTier): {
    apiKey: string;
    checksum: string;
  } {
    const randomPart = randomBytes(16).toString('hex');
    const prefix = `raas_${tier}`;
    const rawKey = `${prefix}_${randomPart}`;
    const checksum = this.generateChecksum(rawKey);

    return {
      apiKey: `${rawKey}_${checksum}`,
      checksum,
    };
  }

  /**
   * Generate checksum for API key validation
   */
  private generateChecksum(key: string): string {
    return createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, 6);
  }

  /**
   * Get default strategy configuration for tier
   */
  private getDefaultConfigForTier(tier: TenantTier): StrategyConfig {
    return TIER_DEFAULT_CONFIGS[tier] || TIER_DEFAULT_CONFIGS.free;
  }

  /**
   * Check if tenant is provisioned
   */
  isProvisioned(tenantId: string): boolean {
    return this.provisionedTenants.has(tenantId);
  }

  /**
   * Get tenant provisioning info
   */
  getTenantInfo(tenantId: string): {
    subscriptionId: string;
    tier: TenantTier;
    apiKeyChecksum: string;
    provisionedAt: string;
  } | undefined {
    return this.provisionedTenants.get(tenantId);
  }

  /**
   * Validate API key checksum (timing-safe)
   */
  validateApiKey(apiKey: string): { valid: boolean; tier?: TenantTier; tenantId?: string } {
    // Format: raas_{tier}_{random}_{checksum}
    const parts = apiKey.split('_');
    if (parts.length !== 4 || parts[0] !== 'raas') {
      return { valid: false };
    }

    const [, tierRaw, randomPart, providedChecksum] = parts;
    const tier = tierRaw as TenantTier;

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return { valid: false };
    }

    const rawKey = `raas_${tier}_${randomPart}`;
    const expectedChecksum = this.generateChecksum(rawKey);

    // Timing-safe comparison
    const expected = Buffer.from(expectedChecksum, 'utf8');
    const actual = Buffer.from(providedChecksum, 'utf8');

    if (expected.length !== actual.length) {
      return { valid: false };
    }

    const isValid = this.timingSafeEqual(expected, actual);

    if (!isValid) {
      return { valid: false };
    }

    // Find tenant by checksum
    for (const [tenantId, data] of this.provisionedTenants.entries()) {
      if (data.apiKeyChecksum === providedChecksum) {
        return { valid: true, tier, tenantId };
      }
    }

    return { valid: false };
  }

  /**
   * Timing-safe string comparison (fallback for Node.js < 16)
   */
  private timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  /**
   * Log audit event
   */
  private logAudit(log: ProvisioningAuditLog): void {
    this.auditLogger.log({
      eventId: `${log.event}_${log.subscriptionId}_${Date.now()}`,
      eventType: `provisioning.${log.event}`,
      tenantId: log.tenantId,
      timestamp: log.timestamp,
      action: log.success ? 'activated' : 'ignored',
      success: log.success,
      idempotencyKey: `${log.event}_${log.subscriptionId}`,
    });

    // Console log for dev
    if (process.env.DEBUG_PROVISIONING === 'true') {
      console.log('[Provisioning Audit]', JSON.stringify(log));
    }
  }

  /**
   * Get list of all provisioned tenants (for debugging)
   */
  getAllProvisionedTenants(): Array<{
    tenantId: string;
    subscriptionId: string;
    tier: TenantTier;
    provisionedAt: string;
  }> {
    return Array.from(this.provisionedTenants.entries()).map(([tenantId, data]) => ({
      tenantId,
      ...data,
    }));
  }

  /**
   * Reset provisioned tenants (testing only)
   */
  reset(): void {
    this.provisionedTenants.clear();
  }
}

/**
 * Map TenantTier to LicenseTier
 */
export function mapTenantTierToLicenseTier(tenantTier: TenantTier): LicenseTier {
  switch (tenantTier) {
    case 'pro':
      return LicenseTier.PRO;
    case 'enterprise':
      return LicenseTier.ENTERPRISE;
    default:
      return LicenseTier.FREE;
  }
}
