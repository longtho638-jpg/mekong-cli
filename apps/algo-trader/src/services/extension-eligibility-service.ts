/**
 * Phase 6: Extension Eligibility Service
 *
 * Manages extension eligibility per license.
 * Extensions are premium features like:
 * - algo-trader: Core trading engine
 * - agi-auto-pilot: AI-powered autonomous trading
 * - advanced-backtest: Advanced backtesting capabilities
 *
 * Features:
 * - Per-license extension eligibility
 * - Usage tracking with limits
 * - Auto-reset at configured intervals
 * - Approval workflow for tier upgrades
 */

import { PrismaClient, ExtensionEligibility, License } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExtensionStatus {
  eligible: boolean;
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  usageCount: number;
  usageLimit: number;
  remaining: number;
  resetAt?: Date;
  approvedAt?: Date;
}

export interface ExtensionRequestInput {
  licenseId: string;
  extensionName: string;
  reason?: string;
}

export class ExtensionEligibilityService {
  private static instance: ExtensionEligibilityService;
  private cache: Map<string, ExtensionEligibility> = new Map();
  private cacheTtl: number = 30 * 1000; // 30 seconds for real-time enforcement
  private lastCacheUpdate: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ExtensionEligibilityService {
    if (!ExtensionEligibilityService.instance) {
      ExtensionEligibilityService.instance = new ExtensionEligibilityService();
    }
    return ExtensionEligibilityService.instance;
  }

  /**
   * Check extension eligibility for a license
   */
  async checkEligibility(
    licenseId: string,
    extensionName: string
  ): Promise<ExtensionStatus> {
    const cacheKey = `${licenseId}:${extensionName}`;
    const cached = this.cache.get(cacheKey);
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;

    if (cached && Date.now() - lastUpdate < this.cacheTtl) {
      return this.toExtensionStatus(cached);
    }

    const eligibility = await prisma.extensionEligibility.findFirst({
      where: {
        licenseId,
        extensionName
      }
    });

    if (!eligibility) {
      // Check license tier for default eligibility
      const license = await prisma.license.findUnique({
        where: { id: licenseId },
        select: { tier: true }
      });

      return this.getDefaultStatus(extensionName, license?.tier);
    }

    // Update cache
    this.cache.set(cacheKey, eligibility);
    this.lastCacheUpdate.set(cacheKey, Date.now());

    return this.toExtensionStatus(eligibility);
  }

  /**
   * Get default eligibility based on extension name and tier
   */
  private getDefaultStatus(
    extensionName: string,
    tier?: string
  ): ExtensionStatus {
    const defaultLimits: Record<string, { tiers: string[]; limit: number }> = {
      'algo-trader': { tiers: ['PRO', 'ENTERPRISE'], limit: 10000 },
      'agi-auto-pilot': { tiers: ['ENTERPRISE'], limit: 1000 },
      'advanced-backtest': { tiers: ['PRO', 'ENTERPRISE'], limit: 5000 }
    };

    const config = defaultLimits[extensionName];
    if (!config) {
      return {
        eligible: false,
        status: 'denied',
        usageCount: 0,
        usageLimit: 0,
        remaining: 0
      };
    }

    const isEligible = !!(tier && config.tiers.includes(tier));

    return {
      eligible: isEligible,
      status: isEligible ? 'approved' : 'pending',
      usageCount: 0,
      usageLimit: config.limit,
      remaining: config.limit
    };
  }

  /**
   * Request extension access
   */
  async requestExtension(
    licenseId: string,
    extensionName: string,
    reason?: string
  ): Promise<ExtensionEligibility> {
    const cacheKey = `${licenseId}:${extensionName}`;

    // Check if already exists
    const existing = await prisma.extensionEligibility.findFirst({
      where: { licenseId, extensionName }
    });

    if (existing) {
      if (existing.status === 'approved') {
        return existing;
      }
      if (existing.status === 'denied' && existing.deniedAt) {
        // Allow re-request after 24 hours
        const hoursSinceDenied = (Date.now() - existing.deniedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceDenied < 24) {
          throw new Error('Please wait 24 hours before re-requesting');
        }
      }
    }

    const eligibility = await prisma.extensionEligibility.upsert({
      where: {
        licenseId_extensionName: { licenseId, extensionName }
      },
      update: {
        status: 'pending',
        metadata: { reason: reason || String((existing?.metadata as Record<string, string>)?.reason ?? '') }
      },
      create: {
        licenseId,
        extensionName,
        status: 'pending',
        usageCount: 0,
        usageLimit: 1000,
        metadata: { reason }
      }
    });

    // Invalidate cache
    this.cache.delete(cacheKey);
    this.lastCacheUpdate.delete(cacheKey);

    return eligibility;
  }

  /**
   * Approve extension request
   */
  async approveExtension(
    licenseId: string,
    extensionName: string,
    usageLimit?: number,
    resetAt?: Date
  ): Promise<ExtensionEligibility> {
    const cacheKey = `${licenseId}:${extensionName}`;

    const eligibility = await prisma.extensionEligibility.update({
      where: {
        licenseId_extensionName: { licenseId, extensionName }
      },
      data: {
        eligible: true,
        status: 'approved',
        approvedAt: new Date(),
        usageLimit: usageLimit ?? 1000,
        resetAt
      }
    });

    // Invalidate cache
    this.cache.delete(cacheKey);
    this.lastCacheUpdate.delete(cacheKey);

    return eligibility;
  }

  /**
   * Deny extension request
   */
  async denyExtension(
    licenseId: string,
    extensionName: string,
    reason?: string
  ): Promise<ExtensionEligibility> {
    const cacheKey = `${licenseId}:${extensionName}`;

    const eligibility = await prisma.extensionEligibility.update({
      where: {
        licenseId_extensionName: { licenseId, extensionName }
      },
      data: {
        eligible: false,
        status: 'denied',
        deniedAt: new Date(),
        metadata: { denyReason: reason }
      }
    });

    // Invalidate cache
    this.cache.delete(cacheKey);
    this.lastCacheUpdate.delete(cacheKey);

    return eligibility;
  }

  /**
   * Track extension usage
   */
  async trackUsage(
    licenseId: string,
    extensionName: string,
    units: number = 1
  ): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
    const cacheKey = `${licenseId}:${extensionName}`;

    const eligibility = await prisma.extensionEligibility.findFirst({
      where: { licenseId, extensionName }
    });

    if (!eligibility) {
      const defaultStatus = this.getDefaultStatus(extensionName);
      return {
        allowed: defaultStatus.status === 'approved',
        remaining: defaultStatus.remaining
      };
    }

    // Check if reset is due
    if (eligibility.resetAt && eligibility.resetAt <= new Date()) {
      // Reset usage
      const updated = await prisma.extensionEligibility.update({
        where: { id: eligibility.id },
        data: {
          usageCount: 0,
          resetAt: this.getNextResetDate(eligibility.resetAt)
        }
      });

      this.cache.set(cacheKey, updated);
      this.lastCacheUpdate.set(cacheKey, Date.now());

      return {
        allowed: true,
        remaining: updated.usageLimit,
        resetAt: updated.resetAt ?? undefined
      };
    }

    const remaining = eligibility.usageLimit - eligibility.usageCount;

    if (remaining < units) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: eligibility.resetAt || undefined
      };
    }

    // Update usage
    const updated = await prisma.extensionEligibility.update({
      where: { id: eligibility.id },
      data: {
        usageCount: { increment: units }
      }
    });

    // Update cache
    this.cache.set(cacheKey, updated);
    this.lastCacheUpdate.set(cacheKey, Date.now());

    return {
      allowed: true,
      remaining: remaining - units,
      resetAt: updated.resetAt || undefined
    };
  }

  /**
   * Revoke extension access
   */
  async revokeExtension(
    licenseId: string,
    extensionName: string
  ): Promise<ExtensionEligibility> {
    const cacheKey = `${licenseId}:${extensionName}`;

    const eligibility = await prisma.extensionEligibility.update({
      where: {
        licenseId_extensionName: { licenseId, extensionName }
      },
      data: {
        eligible: false,
        status: 'revoked'
      }
    });

    // Invalidate cache
    this.cache.delete(cacheKey);
    this.lastCacheUpdate.delete(cacheKey);

    return eligibility;
  }

  /**
   * Get all extensions for a license
   */
  async getLicenseExtensions(licenseId: string): Promise<ExtensionStatus[]> {
    const eligibilities = await prisma.extensionEligibility.findMany({
      where: { licenseId }
    });

    return eligibilities.map(e => this.toExtensionStatus(e));
  }

  /**
   * Convert DB model to status object
   */
  private toExtensionStatus(eligibility: ExtensionEligibility): ExtensionStatus {
    return {
      eligible: eligibility.eligible,
      status: eligibility.status as ExtensionStatus['status'],
      usageCount: eligibility.usageCount,
      usageLimit: eligibility.usageLimit,
      remaining: eligibility.usageLimit - eligibility.usageCount,
      resetAt: eligibility.resetAt || undefined,
      approvedAt: eligibility.approvedAt || undefined
    };
  }

  /**
   * Calculate next reset date (monthly by default)
   */
  private getNextResetDate(fromDate: Date): Date {
    const date = new Date(fromDate);
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate.clear();
  }
}

// Convenience exports
export const extensionEligibilityService = ExtensionEligibilityService.getInstance();

export async function checkExtensionEligibility(
  licenseId: string,
  extensionName: string
): Promise<ExtensionStatus> {
  return extensionEligibilityService.checkEligibility(licenseId, extensionName);
}

export async function requireExtension(
  licenseId: string,
  extensionName: string
): Promise<void> {
  const status = await checkExtensionEligibility(licenseId, extensionName);
  if (!status.eligible || status.status !== 'approved') {
    throw new Error(
      `Extension "${extensionName}" is not enabled. Status: ${status.status}`
    );
  }
  if (status.remaining <= 0) {
    throw new Error(
      `Extension "${extensionName}" usage limit exceeded. Resets at: ${status.resetAt}`
    );
  }
}
