/**
 * RAAS License Validator — Startup Validation
 *
 * Validates RAAS_LICENSE_KEY environment variable at application startup.
 * Exits with non-zero status code if key is missing or invalid.
 *
 * Features:
 * - UUIDv4 format validation
 * - Environment variable presence check
 * - Clear error logging
 * - Non-zero exit on failure
 *
 * @module license-validator
 */

import { logger } from '../utils/logger';

/**
 * UUIDv4 regex pattern
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, A, or B
 */
const UUIDV4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * License validation result
 */
export interface LicenseValidationResult {
  valid: boolean;
  error?: string;
  keyFormat: 'uuid-v4' | 'legacy' | 'unknown';
}

/**
 * Validate UUIDv4 format
 */
export function isValidUUIDv4(key: string): boolean {
  return UUIDV4_PATTERN.test(key);
}

/**
 * Detect license key format type
 */
export function detectKeyFormat(key: string): 'uuid-v4' | 'legacy' | 'unknown' {
  if (isValidUUIDv4(key)) {
    return 'uuid-v4';
  }

  // Legacy formats (case-insensitive): raas-pro-*, raas-ent-*, RPP-*, REP-*
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.startsWith('raas-pro-') ||
    lowerKey.startsWith('raas-ent-') ||
    lowerKey.startsWith('rpp-') ||
    lowerKey.startsWith('rep-')
  ) {
    return 'legacy';
  }

  return 'unknown';
}

/**
 * Validate RAAS_LICENSE_KEY at startup
 *
 * Checks:
 * 1. Environment variable presence
 * 2. Format validation (UUIDv4 or legacy)
 * 3. Logs error and exits with code 1 if invalid
 *
 * @param options - Validation options
 * @param options.required - If true, key is required (default: true)
 * @param options.allowLegacy - Allow legacy format keys (default: true)
 * @returns Validation result
 * @throws Process exit with code 1 if validation fails
 */
export function validateLicenseKeyAtStartup(
  options: { required?: boolean; allowLegacy?: boolean } = {}
): LicenseValidationResult {
  const { required = true, allowLegacy = true } = options;

  const licenseKey = process.env.RAAS_LICENSE_KEY;

  // Check if key is present
  if (!licenseKey) {
    if (required) {
      logger.error('❌ LỖI: RAAS_LICENSE_KEY environment variable is MISSING');
      logger.error('');
      logger.error('Required format (UUIDv4): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
      logger.error('Example: 550e8400-e29b-41d4-a716-446655440000');
      logger.error('');
      logger.error('To get a license key:');
      logger.error('  1. Visit: https://polar.sh/agencyos');
      logger.error('  2. Subscribe to a plan (PRO or ENTERPRISE)');
      logger.error('  3. Copy your license key from dashboard');
      logger.error('  4. Add to .env file: RAAS_LICENSE_KEY=your-key-here');
      logger.error('');
      logger.error('Or set environment variable:');
      logger.error('  export RAAS_LICENSE_KEY=your-license-key');
      process.exit(1);
    } else {
      logger.warn('⚠️  RAAS_LICENSE_KEY not set - running in FREE mode');
      return { valid: false, error: 'missing', keyFormat: 'unknown' };
    }
  }

  // Check if key is empty
  if (!licenseKey.trim()) {
    logger.error('❌ LỖI: RAAS_LICENSE_KEY is EMPTY');
    logger.error('');
    logger.error('Please provide a valid license key in UUIDv4 format:');
    logger.error('  xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    process.exit(1);
  }

  // Validate format
  const format = detectKeyFormat(licenseKey);

  if (format === 'unknown') {
    logger.error('❌ LỖI: RAAS_LICENSE_KEY has INVALID FORMAT');
    logger.error('');
    logger.error(`Provided key: ${licenseKey.substring(0, 10)}...`);
    logger.error('');
    logger.error('Expected format (UUIDv4): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    logger.error('Example: 550e8400-e29b-41d4-a716-446655440000');
    logger.error('');
    logger.error('Legacy formats also supported:');
    logger.error('  - raas-pro-xxxxxxxxxx');
    logger.error('  - raas-ent-xxxxxxxxxx');
    logger.error('  - RPP-xxxxxxxxxx');
    logger.error('  - REP-xxxxxxxxxx');
    process.exit(1);
  }

  if (format === 'uuid-v4') {
    logger.info('✅ License key validated (UUIDv4 format)');
    return { valid: true, keyFormat: 'uuid-v4' };
  }

  // Legacy format
  if (!allowLegacy) {
    logger.error('❌ LỖI: Legacy license key format is DEPRECATED');
    logger.error('');
    logger.error('Please upgrade to UUIDv4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    logger.error('Legacy format detected: ' + licenseKey.substring(0, 15) + '...');
    process.exit(1);
  }

  logger.info('✅ License key validated (legacy format - consider upgrading to UUIDv4)');
  return { valid: true, keyFormat: 'legacy' };
}

/**
 * Initialize license validation at startup
 * Alias for validateLicenseKeyAtStartup() - kept for semantic clarity
 */
export function initLicenseValidation(): LicenseValidationResult {
  logger.info('🔑 Initializing license validation...');
  return validateLicenseKeyAtStartup();
}
