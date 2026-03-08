/**
 * Phase 6: Feature Flag Service
 *
 * Manages feature flags, rollout percentages, and entitlement checks.
 * Supports:
 * - Global feature flags with rollout percentages
 * - Per-license feature overrides
 * - User whitelist targeting
 * - Hash-based deterministic rollout
 */

import { PrismaClient, FeatureFlag, LicenseFeatureFlag } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

export interface FeatureFlagCheckResult {
  enabled: boolean;
  reason?: string;
  source?: 'whitelist' | 'rollout' | 'global' | 'override';
}

export interface CreateFeatureFlagInput {
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  userWhitelist?: string[];
  metadata?: Record<string, any>;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private cache: Map<string, FeatureFlag & { licenses?: LicenseFeatureFlag[] }> = new Map();
  private cacheTtl: number = 60 * 1000; // 1 minute
  private lastCacheUpdate: number = 0;

  private constructor() {}

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    const now = Date.now();
    if (this.cache.size > 0 && now - this.lastCacheUpdate < this.cacheTtl) {
      return Array.from(this.cache.values());
    }

    const flags = await prisma.featureFlag.findMany({
      include: {
        licenses: {
          include: {
            license: {
              select: { id: true, key: true, tier: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Update cache
    this.cache.clear();
    flags.forEach(flag => this.cache.set(flag.name, flag));
    this.lastCacheUpdate = now;

    return flags;
  }

  /**
   * Get feature flag by name
   */
  async getFlagByName(name: string): Promise<FeatureFlag | null> {
    const cached = this.cache.get(name);
    if (cached && Date.now() - this.lastCacheUpdate < this.cacheTtl) {
      return cached;
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { name },
      include: {
        licenses: {
          include: {
            license: {
              select: { id: true, key: true }
            }
          }
        }
      }
    });

    if (flag) {
      this.cache.set(name, flag);
      this.lastCacheUpdate = Date.now();
    }

    return flag;
  }

  /**
   * Create new feature flag
   */
  async createFlag(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    const flag = await prisma.featureFlag.create({
      data: {
        name: input.name,
        description: input.description,
        enabled: input.enabled ?? true,
        rolloutPercentage: input.rolloutPercentage ?? 100,
        userWhitelist: input.userWhitelist ?? [],
        metadata: input.metadata ?? {}
      }
    });

    // Invalidate cache
    this.cache.clear();

    return flag;
  }

  /**
   * Update feature flag
   */
  async updateFlag(name: string, updates: Partial<CreateFeatureFlagInput>): Promise<FeatureFlag> {
    const flag = await prisma.featureFlag.update({
      where: { name },
      data: {
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.rolloutPercentage !== undefined && { rolloutPercentage: updates.rolloutPercentage }),
        ...(updates.userWhitelist !== undefined && { userWhitelist: updates.userWhitelist }),
        ...(updates.metadata !== undefined && { metadata: updates.metadata })
      }
    });

    // Invalidate cache
    this.cache.delete(name);

    return flag;
  }

  /**
   * Delete feature flag
   */
  async deleteFlag(name: string): Promise<void> {
    await prisma.featureFlag.delete({
      where: { name }
    });

    // Invalidate cache
    this.cache.delete(name);
  }

  /**
   * Check if feature is enabled for a specific license
   */
  async checkFeature(
    featureName: string,
    licenseId?: string
  ): Promise<FeatureFlagCheckResult> {
    const flag = await this.getFlagByName(featureName);

    if (!flag) {
      return { enabled: false, reason: 'Feature flag not found' };
    }

    if (!flag.enabled) {
      return { enabled: false, reason: 'Feature flag globally disabled' };
    }

    // Check per-license override first
    if (licenseId) {
      const licenseFlag = await prisma.licenseFeatureFlag.findFirst({
        where: {
          licenseId,
          featureFlagId: flag.id
        }
      });

      if (licenseFlag) {
        if (licenseFlag.overrideValue !== null) {
          const override = licenseFlag.overrideValue as any;
          return {
            enabled: override.enabled ?? false,
            reason: 'License override',
            source: 'override'
          };
        }
        if (licenseFlag.enabled) {
          return {
            enabled: true,
            reason: 'License has explicit access',
            source: 'global'
          };
        }
        return {
          enabled: false,
          reason: 'License explicitly denied',
          source: 'global'
        };
      }
    }

    // Check user whitelist
    const userWhitelist = flag.userWhitelist as string[];
    if (licenseId && userWhitelist.includes(licenseId)) {
      return {
        enabled: true,
        reason: 'User in whitelist',
        source: 'whitelist'
      };
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashLicense(licenseId || 'anonymous');
      const bucket = hash % 100;

      if (bucket >= flag.rolloutPercentage) {
        return {
          enabled: false,
          reason: `User excluded from rollout (bucket ${bucket} >= ${flag.rolloutPercentage}%)`,
          source: 'rollout'
        };
      }
    }

    return {
      enabled: true,
      reason: 'Feature enabled via rollout',
      source: 'rollout'
    };
  }

  /**
   * Set license-specific feature override
   */
  async setLicenseFeature(
    licenseId: string,
    featureName: string,
    enabled: boolean,
    overrideValue?: any
  ): Promise<LicenseFeatureFlag> {
    const flag = await this.getFlagByName(featureName);
    if (!flag) {
      throw new Error(`Feature flag "${featureName}" not found`);
    }

    const existing = await prisma.licenseFeatureFlag.findFirst({
      where: {
        licenseId,
        featureFlagId: flag.id
      }
    });

    if (existing) {
      return prisma.licenseFeatureFlag.update({
        where: { id: existing.id },
        data: {
          enabled,
          overrideValue: overrideValue ?? null
        }
      });
    }

    return prisma.licenseFeatureFlag.create({
      data: {
        licenseId,
        featureFlagId: flag.id,
        enabled,
        overrideValue: overrideValue ?? null
      }
    });
  }

  /**
   * Get all features for a license
   */
  async getLicenseFeatures(licenseId: string): Promise<Record<string, boolean>> {
    const flags = await prisma.featureFlag.findMany({
      where: { enabled: true },
      include: {
        licenses: {
          where: { licenseId },
          select: { enabled: true, overrideValue: true }
        }
      }
    });

    const result: Record<string, boolean> = {};

    for (const flag of flags) {
      const licenseFlag = flag.licenses[0];

      // Check override first
      if (licenseFlag?.overrideValue !== null) {
        result[flag.name] = (licenseFlag.overrideValue as any).enabled ?? false;
        continue;
      }

      // Check explicit enable
      if (licenseFlag?.enabled) {
        result[flag.name] = true;
        continue;
      }

      // Check rollout
      const userWhitelist = flag.userWhitelist as string[];
      if (userWhitelist.includes(licenseId)) {
        result[flag.name] = true;
        continue;
      }

      if (flag.rolloutPercentage >= 100) {
        result[flag.name] = true;
      } else {
        const hash = this.hashLicense(licenseId);
        result[flag.name] = (hash % 100) < flag.rolloutPercentage;
      }
    }

    return result;
  }

  /**
   * Hash license for deterministic rollout
   */
  private hashLicense(licenseId: string): number {
    const hash = createHash('md5').update(licenseId).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }
}

// Convenience exports
export const featureFlagService = FeatureFlagService.getInstance();

export async function isFeatureEnabled(featureName: string, licenseId?: string): Promise<boolean> {
  const result = await featureFlagService.checkFeature(featureName, licenseId);
  return result.enabled;
}

export async function requireFeature(featureName: string, licenseId?: string): Promise<void> {
  const enabled = await isFeatureEnabled(featureName, licenseId);
  if (!enabled) {
    throw new Error(`Feature "${featureName}" is not enabled for this license`);
  }
}
