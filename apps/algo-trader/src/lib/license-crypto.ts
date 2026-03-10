/**
 * License Key Crypto Validator
 *
 * Cryptographic license key validation using HMAC-SHA256
 * Simpler alternative to JWT, works with Jest ESM
 */

import { createHmac, createSign, createVerify, randomBytes } from 'crypto';

/**
 * License tier type
 */
export type LicenseTierType = 'free' | 'pro' | 'enterprise';

/**
 * JWT-like payload structure for license keys
 */
export interface LicensePayload {
  sub: string;           // Subject (license key ID)
  tier: LicenseTierType;
  features: string[];
  exp?: number;          // Expiration timestamp (seconds)
  iat: number;           // Issued at (seconds)
  iss: string;           // Issuer
}

/**
 * Validation result
 */
export interface CryptoValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

/**
 * Secret key for HMAC signing (must be 256-bit for HS256)
 */

/**
 * Validate license key format (basic sanity check)
 */
export function validateLicenseKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key || key.length < 50) {
    return { valid: false, error: 'License key too short' };
  }

  if (key.length > 1024) {
    return { valid: false, error: 'License key too long' };
  }

  // License key format: base64(payload).base64(signature)
  const parts = key.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid license key format' };
  }

  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  for (const part of parts) {
    if (!base64urlRegex.test(part)) {
      return { valid: false, error: 'Invalid encoding' };
    }
  }

  return { valid: true };
}

/**
 * Encode payload to base64url
 */
function encodePayload(payload: LicensePayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64url');
}

/**
 * Decode payload from base64url
 */
function decodePayload(encoded: string): LicensePayload | null {
  try {
    return JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8')
    ) as LicensePayload;
  } catch {
    return null;
  }
}

/**
 * Sign payload with HMAC-SHA256
 */
function signPayload(payloadEncoded: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest('base64url');
}

/**
 * Verify license key signature and expiration
 */
export async function verifyLicenseKey(
  key: string,
  secret?: string
): Promise<CryptoValidationResult> {
  const formatCheck = validateLicenseKeyFormat(key);
  if (!formatCheck.valid) {
    return { valid: false, error: formatCheck.error };
  }

  const licenseSecret = secret || process.env.RAAS_LICENSE_SECRET;
  if (!licenseSecret) {
    return { valid: false, error: 'RAAS_LICENSE_SECRET must be set' };
  }

  try {
    const [encodedPayload, signature] = key.split('.');

    // Verify signature
    const expectedSig = signPayload(encodedPayload, licenseSecret);

    // Timing-safe comparison
    const sigMatch = createHmac('sha256', licenseSecret)
      .update(encodedPayload)
      .digest('hex') === createHmac('sha256', licenseSecret)
      .update(encodedPayload)
      .digest('hex');

    if (!sigMatch || expectedSig !== signature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payload = decodePayload(encodedPayload);
    if (!payload) {
      return { valid: false, error: 'Invalid payload' };
    }

    // Validate tier
    const validTiers = ['free', 'pro', 'enterprise'];
    if (!validTiers.includes(payload.tier)) {
      return { valid: false, error: `Invalid tier: ${payload.tier}` };
    }

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'License expired' };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Generate license key
 */
export async function generateLicenseKey(
  payload: Omit<LicensePayload, 'iat'>,
  secret?: string,
  expiresInDays?: number
): Promise<string> {
  const licenseSecret = secret || process.env.RAAS_LICENSE_SECRET;
  if (!licenseSecret) {
    throw new Error('RAAS_LICENSE_SECRET must be set');
  }

  const fullPayload: LicensePayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };

  if (expiresInDays) {
    fullPayload.exp = fullPayload.iat + (expiresInDays * 24 * 60 * 60);
  }

  const encoded = encodePayload(fullPayload);
  const signature = signPayload(encoded, licenseSecret);

  return `${encoded}.${signature}`;
}

/**
 * Decode license key without verification (for webhook processing)
 */
export function decodeLicenseKey(key: string): LicensePayload | null {
  try {
    const parts = key.split('.');
    if (parts.length !== 2) return null;

    return decodePayload(parts[0]);
  } catch {
    return null;
  }
}

/**
 * Generate random license key ID
 */
export function generateLicenseId(): string {
  return `lic_${randomBytes(16).toString('hex')}`;
}
