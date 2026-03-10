/**
 * License Crypto Tests
 */

import {
  validateLicenseKeyFormat,
  verifyLicenseKey,
  generateLicenseKey,
  decodeLicenseKey,
  generateLicenseId,
} from './license-crypto';

const TEST_SECRET = 'test-secret-key-min-32-characters!';

describe('License Crypto', () => {
  describe('validateLicenseKeyFormat', () => {
    it('rejects null/undefined', () => {
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

    it('rejects non-license-key format', () => {
      expect(validateLicenseKeyFormat('not-a-key')).toEqual({
        valid: false,
        error: 'License key too short',
      });
    });

    it('rejects invalid encoding', () => {
      // Long key with invalid encoding (over 50 chars)
      const longInvalid = 'abcdefghijklmnopqrstuvwxyz01234!.defghijklmnopqrstuvwxyz01234567890';
      expect(validateLicenseKeyFormat(longInvalid)).toEqual({
        valid: false,
        error: 'Invalid encoding',
      });
    });

    it('rejects wrong number of parts', () => {
      // Long key with 3 parts (over 50 chars) to properly test format validation
      const longPayload = 'eyJzdWIiOiJ0ZXN0LWtleS1sb25nLWtleS1sb25nLWtleS1sb25nLWtleS1sb25nLWtleSJ9';
      const longSig = 'dGVzdHNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZQ';
      const threeParts = `${longPayload}.${longSig}.${longSig}`;
      expect(validateLicenseKeyFormat(threeParts)).toEqual({
        valid: false,
        error: 'Invalid license key format',
      });
    });

    it('accepts valid license key format', () => {
      // Long enough valid format key (over 50 chars)
      const longPayload = 'eyJzdWIiOiJ0ZXN0LWtleS1sb25nLWtleS1sb25nLWtleS1sb25nLWtleSJ9';
      const longSig = 'dGVzdHNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZQ';
      const validKey = `${longPayload}.${longSig}`;
      expect(validateLicenseKeyFormat(validKey)).toEqual({ valid: true });
    });
  });

  describe('generateLicenseKey', () => {
    it('generates valid license key', async () => {
      const payload = {
        sub: 'test-key-123',
        tier: 'pro' as const,
        features: ['ml_models', 'premium_data'],
        iss: 'raas',
      };

      const key = await generateLicenseKey(payload, TEST_SECRET);
      const parts = key.split('.');
      expect(parts.length).toBe(2);

      const result = await verifyLicenseKey(key, TEST_SECRET);
      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('test-key-123');
      expect(result.payload?.tier).toBe('pro');
    });

    it('sets expiration when expiresInDays provided', async () => {
      const payload = {
        sub: 'expiring-key',
        tier: 'pro' as const,
        features: [],
        iss: 'raas',
      };

      const key = await generateLicenseKey(payload, TEST_SECRET, 30);
      const result = await verifyLicenseKey(key, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.exp).toBeDefined();
    });

    it('generates keys with current timestamp', async () => {
      const payload = {
        sub: 'timestamp-key',
        tier: 'pro' as const,
        features: [],
        iss: 'raas',
      };

      const key1 = await generateLicenseKey(payload, TEST_SECRET);
      await new Promise(resolve => setTimeout(resolve, 10));
      const key2 = await generateLicenseKey(payload, TEST_SECRET);

      const result1 = await verifyLicenseKey(key1, TEST_SECRET);
      const result2 = await verifyLicenseKey(key2, TEST_SECRET);
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('verifyLicenseKey', () => {
    it('rejects invalid format', async () => {
      const result = await verifyLicenseKey('not-a-key', TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/short|format/);
    });

    it('rejects wrong number of parts', async () => {
      // Long key with 3 parts (over 50 chars)
      const longPayload = 'eyJzdWIiOiJ0ZXN0LWtleS1sb25nLWtleS1sb25nLWtleS1sb25nLWtleS1sb25nLWtleSJ9';
      const longSig = 'dGVzdHNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZS1sb25nLXNpZ25hdHVyZQ';
      const threeParts = `${longPayload}.${longSig}.${longSig}`;
      const result = await verifyLicenseKey(threeParts, TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/format|encoding/);
    });

    it('rejects expired keys', async () => {
      const expiredPayload = {
        sub: 'test-key',
        tier: 'pro' as const,
        features: ['feature1'],
        iss: 'raas',
        exp: Math.floor(Date.now() / 1000) - 100,
      };

      const key = await generateLicenseKey(expiredPayload, TEST_SECRET);
      const result = await verifyLicenseKey(key, TEST_SECRET);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('accepts valid key', async () => {
      const validPayload = {
        sub: 'test-key-123',
        tier: 'pro' as const,
        features: ['ml_models', 'premium_data'],
        iss: 'raas',
      };

      const key = await generateLicenseKey(validPayload, TEST_SECRET);
      const result = await verifyLicenseKey(key, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('test-key-123');
      expect(result.payload?.tier).toBe('pro');
    });

    it('rejects invalid tier', async () => {
      const invalidPayload = {
        sub: 'test-key',
        tier: 'invalid-tier' as any,
        features: [],
        iss: 'raas',
      };

      const key = await generateLicenseKey(invalidPayload, TEST_SECRET);
      const result = await verifyLicenseKey(key, TEST_SECRET);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid tier');
    });

    it('accepts enterprise tier', async () => {
      const enterprisePayload = {
        sub: 'ent-key',
        tier: 'enterprise' as const,
        features: ['all_features'],
        iss: 'raas',
      };

      const key = await generateLicenseKey(enterprisePayload, TEST_SECRET);
      const result = await verifyLicenseKey(key, TEST_SECRET);

      expect(result.valid).toBe(true);
      expect(result.payload?.tier).toBe('enterprise');
    });

    it('rejects key signed with different secret', async () => {
      const payload = {
        sub: 'test-key',
        tier: 'pro' as const,
        features: [],
        iss: 'raas',
      };

      const key = await generateLicenseKey(payload, 'secret1');
      const result = await verifyLicenseKey(key, 'secret2');

      expect(result.valid).toBe(false);
    });
  });

  describe('decodeLicenseKey', () => {
    it('decodes valid key without verification', async () => {
      const payload = {
        sub: 'decode-test',
        tier: 'pro' as const,
        features: ['test_feature'],
        iss: 'raas',
      };

      const key = await generateLicenseKey(payload, TEST_SECRET);
      const decoded = decodeLicenseKey(key);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('decode-test');
      expect(decoded?.tier).toBe('pro');
    });

    it('returns null for invalid format', () => {
      const decoded = decodeLicenseKey('not-a-key');
      expect(decoded).toBeNull();
    });

    it('returns null for malformed payload', () => {
      const decoded = decodeLicenseKey('abc.def');
      expect(decoded).toBeNull();
    });
  });

  describe('generateLicenseId', () => {
    it('generates unique IDs', () => {
      const id1 = generateLicenseId();
      const id2 = generateLicenseId();

      expect(id1).toMatch(/^lic_[a-f0-9]{32}$/);
      expect(id2).toMatch(/^lic_[a-f0-9]{32}$/);
      expect(id1).not.toBe(id2);
    });

    it('generates 36-character IDs', () => {
      const id = generateLicenseId();
      expect(id.length).toBe(36);
    });
  });
});
