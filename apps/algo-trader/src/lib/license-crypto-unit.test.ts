/**
 * License Crypto Tests
 * Tests for license-crypto.ts (2-part HMAC-SHA256 format)
 */

import {
  validateLicenseKeyFormat,
  verifyLicenseKey,
  generateLicenseKey,
  decodeLicenseKey,
} from './license-crypto';

const TEST_SECRET = 'test-secret-key-min-32-characters!';

describe('License Crypto', () => {
  describe('validateLicenseKeyFormat', () => {
    it('rejects null/undefined/empty', () => {
      expect(validateLicenseKeyFormat('')).toEqual({
        valid: false,
        error: 'License key too short',
      });
      expect(validateLicenseKeyFormat(null as any)).toEqual({
        valid: false,
        error: 'License key too short',
      });
    });

    it('rejects short keys', () => {
      expect(validateLicenseKeyFormat('short')).toEqual({
        valid: false,
        error: 'License key too short',
      });
    });

    it('rejects too long keys', () => {
      const longKey = 'a'.repeat(1025);
      expect(validateLicenseKeyFormat(longKey)).toEqual({
        valid: false,
        error: 'License key too long',
      });
    });

    it('rejects non-2-part format (long enough)', () => {
      const invalidFormatKey = 'a'.repeat(60) + '.invalid.' + 'b'.repeat(60);
      expect(validateLicenseKeyFormat(invalidFormatKey)).toEqual({
        valid: false,
        error: 'Invalid license key format',
      });
    });

    it('rejects invalid base64url encoding (long enough)', () => {
      const invalidKey = 'abc!def'.padEnd(60, 'x') + '.' + 'xyz'.padEnd(60, 'y');
      expect(validateLicenseKeyFormat(invalidKey)).toEqual({
        valid: false,
        error: 'Invalid encoding',
      });
    });

    it('accepts valid 2-part format', async () => {
      const payload = { sub: 'test', tier: 'pro' as const, features: [], iss: 'raas', iat: 123456 };
      const key = await generateLicenseKey(payload, TEST_SECRET);
      expect(validateLicenseKeyFormat(key)).toEqual({ valid: true });
    });
  });

  describe('verifyLicenseKey', () => {
    it('rejects invalid format', async () => {
      const result = await verifyLicenseKey('short', TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('short');
    });

    it('rejects invalid signature', async () => {
      const payload = { sub: 'test', tier: 'pro' as const, features: [], iss: 'raas', iat: 123456 };
      const validKey = await generateLicenseKey(payload, TEST_SECRET);
      const tamperedKey = validKey.slice(0, -5) + 'xxxxx';
      const result = await verifyLicenseKey(tamperedKey, TEST_SECRET);
      expect(result.valid).toBe(false);
    });

    it('rejects expired tokens', async () => {
      const expiredPayload = {
        sub: 'test-key',
        tier: 'pro' as const,
        features: ['feature1'],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000) - 1000,
        exp: Math.floor(Date.now() / 1000) - 100,
      };

      const expiredToken = await generateLicenseKey(expiredPayload, TEST_SECRET);
      const result = await verifyLicenseKey(expiredToken, TEST_SECRET);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('accepts valid token', async () => {
      const validPayload = {
        sub: 'test-key-123',
        tier: 'pro' as const,
        features: ['ml_models', 'premium_data'],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = await generateLicenseKey(validPayload, TEST_SECRET);
      const result = await verifyLicenseKey(token, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('test-key-123');
      expect(result.payload?.tier).toBe('pro');
    });

    it('rejects invalid tier', async () => {
      const invalidTierPayload = {
        sub: 'test-key',
        tier: 'invalid-tier' as any,
        features: [],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = await generateLicenseKey(invalidTierPayload, TEST_SECRET);
      const result = await verifyLicenseKey(token, TEST_SECRET);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid tier');
    });

    it('accepts enterprise tier', async () => {
      const enterprisePayload = {
        sub: 'ent-key',
        tier: 'enterprise' as const,
        features: ['all_features'],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = await generateLicenseKey(enterprisePayload, TEST_SECRET);
      const result = await verifyLicenseKey(token, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.tier).toBe('enterprise');
    });
  });

  describe('generateLicenseKey', () => {
    it('generates valid key', async () => {
      const payload = {
        sub: 'generated-key',
        tier: 'pro' as const,
        features: ['feature1', 'feature2'],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = await generateLicenseKey(payload, TEST_SECRET);
      const parts = token.split('.');
      expect(parts.length).toBe(2);

      const result = await verifyLicenseKey(token, TEST_SECRET);
      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('generated-key');
    });

    it('sets expiration when provided', async () => {
      const payload = {
        sub: 'expiring-key',
        tier: 'pro' as const,
        features: [],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = await generateLicenseKey(payload, TEST_SECRET);
      const result = await verifyLicenseKey(token, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.exp).toBe(payload.exp);
    });
  });

  describe('decodeLicenseKey', () => {
    it('decodes valid key without verification', async () => {
      const payload = {
        sub: 'decode-test',
        tier: 'pro' as const,
        features: ['test_feature'],
        iss: 'raas',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = await generateLicenseKey(payload, TEST_SECRET);
      const decoded = decodeLicenseKey(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('decode-test');
      expect(decoded?.tier).toBe('pro');
    });

    it('returns null for invalid format', () => {
      const decoded = decodeLicenseKey('not-a-jwt');
      expect(decoded).toBeNull();
    });

    it('returns null for malformed payload', () => {
      const decoded = decodeLicenseKey('abc.def');
      expect(decoded).toBeNull();
    });
  });
});
