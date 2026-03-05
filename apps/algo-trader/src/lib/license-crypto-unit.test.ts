/**
 * License Crypto Unit Tests
 * JWT-based license key validation
 */

import {
  validateLicenseKeyFormat,
  verifyLicenseJWT,
  generateLicenseId,
  decodeLicenseJWT,
} from './license-crypto';

describe('License Crypto', () => {
  describe('validateLicenseKeyFormat', () => {
    test('should accept valid RPP- format', () => {
      expect(validateLicenseKeyFormat('RPP-abc123')).toBe(true);
    });

    test('should accept valid REP- format', () => {
      expect(validateLicenseKeyFormat('REP-xyz789')).toBe(true);
    });

    test('should reject invalid format', () => {
      expect(validateLicenseKeyFormat('invalid')).toBe(false);
      expect(validateLicenseKeyFormat('')).toBe(false);
    });
  });

  describe('generateLicenseId', () => {
    test('should generate valid JWT for PRO tier', async () => {
      const token = generateLicenseId('pro', 'test-user');
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    test('should generate valid JWT for ENTERPRISE tier', async () => {
      const token = generateLicenseId('enterprise', 'test-user');
      expect(token).toBeDefined();
    });
  });

  describe('verifyLicenseJWT', () => {
    test('should verify valid JWT', async () => {
      const token = generateLicenseId('pro', 'test-user');
      const result = await verifyLicenseJWT(token);
      expect(result.valid).toBe(true);
      expect(result.payload?.tier).toBe('pro');
    });

    test('should reject invalid signature', async () => {
      const token = generateLicenseId('pro', 'test-user');
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}.tampered`;

      const result = await verifyLicenseJWT(tampered);
      expect(result.valid).toBe(false);
    });

    test('should reject expired token', async () => {
      const token = generateLicenseId('pro', 'test-user', -86400); // 1 day ago
      const result = await verifyLicenseJWT(token);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('decodeLicenseJWT', () => {
    test('should decode valid token', () => {
      const token = generateLicenseId('pro', 'test-user');
      const decoded = decodeLicenseJWT(token);
      expect(decoded).toBeDefined();
      expect(decoded?.payload?.tier).toBe('pro');
    });

    test('should return null for invalid token', () => {
      const decoded = decodeLicenseJWT('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });
});
