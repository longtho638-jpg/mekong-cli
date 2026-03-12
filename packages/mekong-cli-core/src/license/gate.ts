/**
 * LicenseGate — central access control for license-gated features.
 */
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { LicenseTier, LicenseValidation, UsageQuota } from './types.js';
import { TIER_QUOTAS } from './types.js';
import { LicenseStore } from './store.js';
import { verifyLicense } from './verifier.js';
import { tierMeetsMinimum, getRequiredTier } from './feature-map.js';

export class LicenseGate {
  private readonly store: LicenseStore;
  private cachedValidation: LicenseValidation | null = null;

  constructor(store?: LicenseStore) {
    this.store = store ?? new LicenseStore();
  }

  /** Validate stored license and return full validation result. */
  async validate(): Promise<Result<LicenseValidation, Error>> {
    const loaded = await this.store.load();
    if (!loaded.ok) return err(loaded.error);

    if (loaded.value === null) {
      const validation: LicenseValidation = {
        valid: true,
        tier: 'free',
        remainingDays: -1,
        quotas: TIER_QUOTAS['free'],
        message: 'No license key — running on free tier.',
      };
      this.cachedValidation = validation;
      return ok(validation);
    }

    const license = loaded.value;
    const result = verifyLicense(license);
    const tier: LicenseTier = result.valid ? license.tier : 'free';

    const validation: LicenseValidation = {
      valid: result.valid,
      tier,
      remainingDays: result.remainingDays,
      quotas: TIER_QUOTAS[tier],
      message: result.message,
    };
    this.cachedValidation = validation;
    return ok(validation);
  }

  /**
   * Check whether the current license allows access to a given command.
   * Returns ok(true) on access granted, err() with upgrade message on deny.
   */
  async canAccess(command: string): Promise<Result<true, Error>> {
    const validation = await this.validate();
    if (!validation.ok) return err(validation.error);

    const currentTier = validation.value.tier;
    const requiredTier = getRequiredTier(command);

    if (tierMeetsMinimum(currentTier, requiredTier)) {
      return ok(true);
    }

    return err(
      new Error(
        `Command '${command}' requires ${requiredTier} tier or higher.\n` +
        `Your current tier: ${currentTier}.\n` +
        `Upgrade at: https://mekong.ai/pricing`,
      ),
    );
  }

  /** Return current tier (free if no valid license). */
  async getCurrentTier(): Promise<LicenseTier> {
    const validation = await this.validate();
    return validation.ok ? validation.value.tier : 'free';
  }

  /** Return quotas for the current tier. */
  async getQuotas(): Promise<UsageQuota> {
    const tier = await this.getCurrentTier();
    return TIER_QUOTAS[tier];
  }

  /** Return cached validation (null if validate() not called yet). */
  getCachedValidation(): LicenseValidation | null {
    return this.cachedValidation;
  }
}
