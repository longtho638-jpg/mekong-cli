/**
 * License Compliance Tracker - Monitor license validation and compliance
 *
 * Tracks license validation events, compliance status, and usage patterns
 * for each tenant. Provides real-time license status monitoring.
 *
 * Features:
 * - License validation event tracking
 * - Compliance status monitoring
 * - Usage pattern analysis
 * - Expiration alerts
 * - Tier upgrade tracking
 *
 * @see ../lib/raas-gate — LicenseService
 */

import { LicenseTier, LicenseValidation, LicenseService } from '../lib/raas-gate';

/**
 * License validation event record
 */
export interface LicenseValidationEvent {
  tenantId: string;
  timestamp: number;
  valid: boolean;
  tier: LicenseTier;
  feature?: string;
  ip?: string;
  success: boolean;
}

/**
 * License compliance status for a tenant
 */
export interface LicenseComplianceStatus {
  tenantId: string;
  currentTier: LicenseTier;
  valid: boolean;
  expiresAt?: string;
  features: string[];
  validationHistory: {
    totalAttempts: number;
    successfulValidations: number;
    failedValidations: number;
    lastValidationAt?: string;
  };
  usageMetrics: {
    apiCallsCount: number;
    featureUsage: Record<string, number>;
  };
  complianceScore: number; // 0-100
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
}

/**
 * License Compliance Tracker
 */
export class LicenseComplianceTracker {
  private readonly validationEvents: LicenseValidationEvent[] = [];
  private readonly tenantStatus: Map<string, LicenseComplianceStatus> = new Map();
  private readonly licenseService: LicenseService;

  // Configuration
  private readonly maxEventsPerTenant = 1000;
  private readonly expiringSoonThresholdDays = 30;

  constructor() {
    this.licenseService = LicenseService.getInstance();
  }

  /**
   * Record a license validation event
   */
  recordValidationEvent(
    tenantId: string,
    validation: LicenseValidation,
    ip?: string,
    feature?: string
  ): void {
    const event: LicenseValidationEvent = {
      tenantId,
      timestamp: Date.now(),
      valid: validation.valid,
      tier: validation.tier,
      feature,
      ip,
      success: validation.valid,
    };

    // Record event
    this.validationEvents.push(event);

    // Update tenant status
    this.updateTenantStatus(tenantId, validation);

    // Prune old events
    this.pruneEvents();
  }

  /**
   * Record feature access
   */
  recordFeatureAccess(tenantId: string, feature: string): void {
    const status = this.getTenantStatus(tenantId);
    if (status) {
      status.usageMetrics.featureUsage[feature] =
        (status.usageMetrics.featureUsage[feature] || 0) + 1;
      status.usageMetrics.apiCallsCount++;
    }
  }

  /**
   * Get compliance status for a tenant
   */
  getTenantStatus(tenantId: string): LicenseComplianceStatus | null {
    return this.tenantStatus.get(tenantId) || null;
  }

  /**
   * Get all tenant compliance statuses
   */
  getAllTenantStatuses(): LicenseComplianceStatus[] {
    return Array.from(this.tenantStatus.values());
  }

  /**
   * Get validation history for a tenant
   */
  getValidationHistory(tenantId: string, sinceMs: number = 3600000): {
    totalAttempts: number;
    successfulValidations: number;
    failedValidations: number;
    events: LicenseValidationEvent[];
  } {
    const cutoff = Date.now() - sinceMs;
    const events = this.validationEvents.filter(
      (e) => e.tenantId === tenantId && e.timestamp >= cutoff
    );

    return {
      totalAttempts: events.length,
      successfulValidations: events.filter((e) => e.success).length,
      failedValidations: events.filter((e) => !e.success).length,
      events,
    };
  }

  /**
   * Get recent validation events across all tenants
   */
  getRecentEvents(limit: number = 50): LicenseValidationEvent[] {
    return this.validationEvents.slice(-limit);
  }

  /**
   * Calculate compliance score for a tenant (0-100)
   *
   * Score based on:
   * - License validity (40 points)
   * - Validation success rate (30 points)
   * - Feature usage compliance (30 points)
   */
  private calculateComplianceScore(status: LicenseComplianceStatus): number {
    let score = 0;

    // License validity (40 points)
    if (status.valid) {
      score += 40;
    } else if (status.status === 'expiring_soon') {
      score += 20; // Partial credit for expiring soon
    }

    // Validation success rate (30 points)
    const { successfulValidations, totalAttempts } = status.validationHistory;
    if (totalAttempts > 0) {
      const successRate = successfulValidations / totalAttempts;
      score += Math.round(successRate * 30);
    } else {
      score += 30; // No attempts = no failures
    }

    // Feature usage compliance (30 points)
    // Deduct points for failed feature access attempts
    const failedFeatureAccess = Object.entries(status.usageMetrics.featureUsage)
      .filter(([_, count]) => count < 0)
      .length;
    score += Math.max(0, 30 - failedFeatureAccess * 5);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Update tenant status from validation result
   */
  private updateTenantStatus(tenantId: string, validation: LicenseValidation): void {
    const now = new Date();
    const existing = this.tenantStatus.get(tenantId);

    // Determine status
    let status: LicenseComplianceStatus['status'] = 'active';

    if (!validation.valid) {
      status = 'revoked';
    } else if (validation.expiresAt) {
      const expiryDate = new Date(validation.expiresAt);
      const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry < this.expiringSoonThresholdDays) {
        status = 'expiring_soon';
      }
    }

    // Initialize or update status
    const newStatus: LicenseComplianceStatus = {
      tenantId,
      currentTier: validation.tier,
      valid: validation.valid,
      expiresAt: validation.expiresAt,
      features: validation.features,
      validationHistory: {
        totalAttempts: (existing?.validationHistory.totalAttempts || 0) + 1,
        successfulValidations:
          (existing?.validationHistory.successfulValidations || 0) + (validation.valid ? 1 : 0),
        failedValidations:
          (existing?.validationHistory.failedValidations || 0) + (validation.valid ? 0 : 1),
        lastValidationAt: now.toISOString(),
      },
      usageMetrics: existing?.usageMetrics || {
        apiCallsCount: 0,
        featureUsage: {},
      },
      status,
      complianceScore: 0, // Will be calculated below
    };

    newStatus.complianceScore = this.calculateComplianceScore(newStatus);
    this.tenantStatus.set(tenantId, newStatus);
  }

  /**
   * Prune old events to prevent memory bloat
   */
  private pruneEvents(): void {
    // Keep only last N events per tenant
    const tenantEvents = new Map<string, LicenseValidationEvent[]>();

    for (const event of this.validationEvents) {
      const events = tenantEvents.get(event.tenantId) || [];
      events.push(event);
      tenantEvents.set(event.tenantId, events);
    }

    // Trim if over limit
    for (const [, events] of tenantEvents.entries()) {
      if (events.length > this.maxEventsPerTenant) {
        const toRemove = events.length - this.maxEventsPerTenant;
        this.validationEvents.splice(0, toRemove);
      }
    }
  }

  /**
   * Get compliance summary across all tenants
   */
  getComplianceSummary(): {
    totalTenants: number;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
    averageComplianceScore: number;
    expiringSoonCount: number;
  } {
    const statuses = Array.from(this.tenantStatus.values());
    const byStatus: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    let totalScore = 0;

    for (const status of statuses) {
      byStatus[status.status] = (byStatus[status.status] || 0) + 1;
      byTier[status.currentTier] = (byTier[status.currentTier] || 0) + 1;
      totalScore += status.complianceScore;
    }

    return {
      totalTenants: statuses.length,
      byStatus,
      byTier,
      averageComplianceScore: statuses.length > 0 ? Math.round(totalScore / statuses.length) : 0,
      expiringSoonCount: byStatus['expiring_soon'] || 0,
    };
  }

  /**
   * Get tenants with expiring licenses
   */
  getExpiringLicenses(daysThreshold: number = 30): LicenseComplianceStatus[] {
    const now = new Date();
    return Array.from(this.tenantStatus.values()).filter((status) => {
      if (!status.expiresAt || status.status === 'expired') return false;

      const expiryDate = new Date(status.expiresAt);
      const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
    });
  }

  /**
   * Clear old data (call periodically)
   */
  pruneOldData(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;

    // Prune old events
    while (this.validationEvents.length > 0 && this.validationEvents[0].timestamp < cutoff) {
      this.validationEvents.shift();
    }
  }
}

// Singleton instance
let globalTracker: LicenseComplianceTracker | null = null;

export function getGlobalLicenseTracker(): LicenseComplianceTracker {
  if (!globalTracker) {
    globalTracker = new LicenseComplianceTracker();
  }
  return globalTracker;
}
