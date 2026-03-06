#!/usr/bin/env tsx
/**
 * RAAS License Validator - Node.js CLI
 *
 * Invoked by Python wrapper to validate license using TypeScript source of truth.
 *
 * Usage: tsx scripts/validate-license.ts [license_key]
 *
 * Output: JSON object with validation result
 * {
 *   "valid": boolean,
 *   "tier": "free" | "pro" | "enterprise",
 *   "features": string[],
 *   "error": string | null
 * }
 */

import { LicenseService, LicenseValidation } from '../src/lib/raas-gate';

function validateLicense(licenseKey?: string): LicenseValidation {
  const service = LicenseService.getInstance();
  return service.validateSync(licenseKey);
}

function main(): void {
  const args = process.argv.slice(2);
  const licenseKey = args[0] || process.env.RAAS_LICENSE_KEY;

  try {
    const result = validateLicense(licenseKey);

    const output = {
      valid: result.valid,
      tier: result.tier,
      features: result.features,
      error: null,
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    const output = {
      valid: false,
      tier: 'free' as const,
      features: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error(JSON.stringify(output, null, 2));
    process.exit(1);
  }
}

main();
