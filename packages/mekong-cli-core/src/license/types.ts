/** License tier hierarchy */
export type LicenseTier = 'free' | 'starter' | 'pro' | 'enterprise';

/** License lifecycle status */
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'grace';

/** A stored/transmitted license key record */
export interface LicenseKey {
  key: string;
  tier: LicenseTier;
  status: LicenseStatus;
  issuedAt: string;   // ISO 8601
  expiresAt: string;  // ISO 8601
  owner: string;
  signature: string;  // HMAC-SHA256 over key|tier|issuedAt|expiresAt|owner
}

/** Per-tier resource quotas */
export interface UsageQuota {
  tier: LicenseTier;
  llmCallsPerDay: number;
  toolRunsPerDay: number;
  sopRunsPerDay: number;
  storageBytes: number;
}

/** Result of a license validation check */
export interface LicenseValidation {
  valid: boolean;
  tier: LicenseTier;
  remainingDays: number;
  quotas: UsageQuota;
  message?: string;
}

export const TIER_QUOTAS: Record<LicenseTier, UsageQuota> = {
  free: {
    tier: 'free',
    llmCallsPerDay: 10,
    toolRunsPerDay: 50,
    sopRunsPerDay: 5,
    storageBytes: 100 * 1024 * 1024, // 100 MB
  },
  starter: {
    tier: 'starter',
    llmCallsPerDay: 100,
    toolRunsPerDay: 500,
    sopRunsPerDay: 50,
    storageBytes: 1024 * 1024 * 1024, // 1 GB
  },
  pro: {
    tier: 'pro',
    llmCallsPerDay: 1000,
    toolRunsPerDay: 5000,
    sopRunsPerDay: 500,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  },
  enterprise: {
    tier: 'enterprise',
    llmCallsPerDay: -1, // unlimited
    toolRunsPerDay: -1,
    sopRunsPerDay: -1,
    storageBytes: -1,
  },
};

/** Ordered tiers for comparison */
export const TIER_ORDER: LicenseTier[] = ['free', 'starter', 'pro', 'enterprise'];
