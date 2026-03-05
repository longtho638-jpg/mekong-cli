/**
 * JWT Validator Unit Tests
 */

import {
  validateLicenseKeyFormat,
  verifyLicenseJWT,
  generateLicenseId,
} from './jwt-validator';

describe('JWT Validator', () => {
  describe('validateLicenseKeyFormat', () => {
    test('should validate RPP- prefix', () => {
      expect(validateLicenseKeyFormat('RPP-test123')).toBe(true);
    });

    test('should validate REP- prefix', () => {
      expect(validateLicenseKeyFormat('REP-test123')).toBe(true);
    });

    test('should reject missing prefix', () => {
      expect(validateLicenseKeyFormat('test123')).toBe(false);
    });

    test('should reject empty string', () => {
      expect(validateLicenseKeyFormat('')).toBe(false);
    });
  });

  describe('generateLicenseId', () => {
    test('should generate 3-part JWT', () => {
      const token = generateLicenseId('pro', 'user-123');
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    test('should include tier in payload', () => {
      const token = generateLicenseId('enterprise', 'user-456');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(payload.tier).toBe('enterprise');
    });
  });

  describe('verifyLicenseJWT', () => {
    test('should verify valid token', async () => {
      const token = generateLicenseId('pro', 'user-789');
      const result = await verifyLicenseJWT(token);
      expect(result.valid).toBe(true);
    });

    test('should include payload in result', async () => {
      const token = generateLicenseId('pro', 'user-789', 3600); // 1 hour
      const result = await verifyLicenseJWT(token);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe('user-789');
    });
  });
});
