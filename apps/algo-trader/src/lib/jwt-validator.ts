/**
 * JWT License Key Validator
 *
 * Re-export from license-crypto for backward compatibility
 * Uses crypto built-in instead of jose for Jest ESM compatibility
 */

export {
  validateLicenseKeyFormat,
  verifyLicenseKey as verifyLicenseJWT,
  generateLicenseKey as generateLicenseJWT,
  decodeLicenseKey as decodeLicenseJWT,
  generateLicenseId,
} from './license-crypto';
export type {
  LicensePayload as LicenseJWTPayload,
  LicenseTierType,
  CryptoValidationResult as JWTValidationResult,
} from './license-crypto';
