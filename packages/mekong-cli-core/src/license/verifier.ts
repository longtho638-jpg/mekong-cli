/**
 * LicenseVerifier — HMAC-SHA256 signature validation + expiry + 7-day grace period
 */
import { createHmac } from 'node:crypto';
import type { LicenseKey, LicenseStatus } from './types.js';

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Signing secret — in production this comes from env or build-time injection */
const SIGNING_SECRET = process.env['MEKONG_LICENSE_SECRET'] ?? 'mekong-license-v1-secret';

/** Build the canonical message that was signed */
function buildMessage(lic: Omit<LicenseKey, 'signature'>): string {
  return [lic.key, lic.tier, lic.issuedAt, lic.expiresAt, lic.owner].join('|');
}

/** Compute expected HMAC-SHA256 signature */
export function computeSignature(lic: Omit<LicenseKey, 'signature'>, secret?: string): string {
  const s = secret ?? SIGNING_SECRET;
  return createHmac('sha256', s).update(buildMessage(lic)).digest('hex');
}

export interface VerifyResult {
  valid: boolean;
  status: LicenseStatus;
  remainingDays: number;
  message?: string;
}

/**
 * Verify a LicenseKey:
 *  1. HMAC-SHA256 signature check
 *  2. Expiry + 7-day grace window
 *  3. Revoked check
 */
export function verifyLicense(lic: LicenseKey, secret?: string): VerifyResult {
  // Revoked is always invalid
  if (lic.status === 'revoked') {
    return { valid: false, status: 'revoked', remainingDays: 0, message: 'License has been revoked.' };
  }

  // Signature check
  const expected = computeSignature(
    { key: lic.key, tier: lic.tier, status: lic.status, issuedAt: lic.issuedAt, expiresAt: lic.expiresAt, owner: lic.owner },
    secret,
  );
  if (expected !== lic.signature) {
    return { valid: false, status: 'revoked', remainingDays: 0, message: 'License signature invalid.' };
  }

  const now = Date.now();
  const expiresAt = new Date(lic.expiresAt).getTime();
  const remainingMs = expiresAt - now;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (remainingMs > 0) {
    return { valid: true, status: 'active', remainingDays };
  }

  // Within grace period
  if (now - expiresAt <= GRACE_PERIOD_MS) {
    const graceDays = Math.ceil((GRACE_PERIOD_MS - (now - expiresAt)) / (24 * 60 * 60 * 1000));
    return {
      valid: true,
      status: 'grace',
      remainingDays: 0,
      message: `License expired. Grace period: ${graceDays} day(s) remaining.`,
    };
  }

  return { valid: false, status: 'expired', remainingDays: 0, message: 'License has expired.' };
}
