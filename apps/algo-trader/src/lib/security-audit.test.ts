/**
 * Security Audit Tests: License Validation & Enforcement
 *
 * Security checks:
 * - Rate limiting on validation failures
 * - Input validation & sanitization
 * - Expiration enforcement
 * - Audit logging
 * - Timing-safe comparisons
 */

import { LicenseService, LicenseTier, LicenseError } from '../../src/lib/raas-gate';

describe('Security Audit: License Validation', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
  });

  afterEach(() => {
    licenseService.reset();
  });

  describe('Rate Limiting on Validation Failures', () => {
    const testIp = '192.168.1.100';

    test('should allow up to 5 validation attempts per minute', () => {
      for (let i = 0; i < 5; i++) {
        const allowed = licenseService['checkValidationRateLimit'](testIp);
        expect(allowed).toBe(true);
        licenseService['recordValidationAttempt'](testIp);
      }
    });

    test('should block after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        licenseService['recordValidationAttempt'](testIp);
      }

      const allowed = licenseService['checkValidationRateLimit'](testIp);
      expect(allowed).toBe(false);
    });

    test('should throw LicenseError when rate limited', async () => {
      for (let i = 0; i < 5; i++) {
        licenseService['recordValidationAttempt'](testIp);
      }

      await expect(
        licenseService.validate('invalid-key', testIp)
      ).rejects.toThrow(LicenseError);

      await expect(
        licenseService.validate('invalid-key', testIp)
      ).rejects.toThrow('Too many validation attempts');
    });

    test('should track attempts per IP separately', () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';

      for (let i = 0; i < 5; i++) {
        licenseService['recordValidationAttempt'](ip1);
      }

      const ip2Allowed = licenseService['checkValidationRateLimit'](ip2);
      expect(ip2Allowed).toBe(true);

      const ip1Allowed = licenseService['checkValidationRateLimit'](ip1);
      expect(ip1Allowed).toBe(false);
    });
  });

  describe('Input Validation & Sanitization', () => {
    test('should handle SQL injection attempts in license key', async () => {
      const maliciousKey = "'; DROP TABLE licenses; --";
      await expect(licenseService.validate(maliciousKey)).resolves.toBeDefined();
    });

    test('should handle XSS attempts in license key', async () => {
      const xssKey = "<script>alert('xss')</script>";
      await expect(licenseService.validate(xssKey)).resolves.toBeDefined();
    });

    test('should handle very long license keys', async () => {
      const longKey = 'a'.repeat(10000);
      await expect(licenseService.validate(longKey)).resolves.toBeDefined();
    });

    test('should handle empty license key gracefully', async () => {
      const result = await licenseService.validate('');
      expect(result.valid).toBe(false);
      expect(result.tier).toBe(LicenseTier.FREE);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      process.env.DEBUG_AUDIT = 'true';
    });

    afterEach(() => {
      delete process.env.DEBUG_AUDIT;
    });

    test('should log license check events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      licenseService.validateSync('raas-pro-test');
      licenseService.hasFeature('ml_models');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[RAAS-AUDIT]',
        expect.stringContaining('license_check')
      );

      consoleSpy.mockRestore();
    });

    test('should log license expiration events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      licenseService.validateSync('raas-pro-test');
      const expiredLicense = {
        valid: false,
        tier: LicenseTier.FREE,
        features: [],
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      };
      // @ts-ignore - accessing private for testing
      licenseService['validatedLicense'] = expiredLicense;
      licenseService.hasTier(LicenseTier.PRO);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[RAAS-AUDIT]',
        expect.stringContaining('license_expired')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Timing-Safe Comparisons', () => {
    test('should use timing-safe comparison for checksums', () => {
      const key1 = 'test-license-key-1';
      const key2 = 'test-license-key-2';

      const checksum1 = licenseService.generateChecksum(key1);
      const checksum2 = licenseService.generateChecksum(key2);

      expect(licenseService.validateWithChecksum(key1, checksum2)).toBe(false);
      expect(licenseService.validateWithChecksum(key1, checksum1)).toBe(true);
    });

    test('should reject different length checksums', () => {
      const key = 'test-license-key';
      const checksum = licenseService.generateChecksum(key);
      const shortChecksum = checksum.slice(0, 2);

      expect(licenseService.validateWithChecksum(key, shortChecksum)).toBe(false);
    });
  });

  describe('Premium Feature Gating', () => {
    test('should throw LicenseError for premium features without license', () => {
      licenseService.validateSync();

      expect(() => {
        licenseService.requireFeature('ml_models');
      }).toThrow(LicenseError);

      expect(() => {
        licenseService.requireFeature('premium_data');
      }).toThrow(LicenseError);
    });

    test('should include feature name in error message', () => {
      licenseService.validateSync();

      try {
        licenseService.requireFeature('test_feature');
      } catch (error) {
        expect(error).toBeInstanceOf(LicenseError);
        expect((error as LicenseError).message).toContain('test_feature');
        expect((error as LicenseError).feature).toBe('test_feature');
      }
    });

    test('should allow premium features with PRO license', async () => {
      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);

      expect(() => {
        licenseService.requireFeature('ml_models');
      }).not.toThrow();

      expect(() => {
        licenseService.requireFeature('premium_data');
      }).not.toThrow();
    });
  });

  describe('Tier Enforcement', () => {
    test('should enforce tier hierarchy (FREE < PRO < ENTERPRISE)', async () => {
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(false);

      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(false);

      await licenseService.activateLicense('raas-ent-test', LicenseTier.ENTERPRISE);
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });

    test('should requireTier throw for insufficient tier', () => {
      licenseService.validateSync();

      expect(() => {
        licenseService.requireTier(LicenseTier.PRO, 'test_feature');
      }).toThrow(LicenseError);
    });

    test('should requireTier succeed for sufficient tier', async () => {
      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);

      expect(() => {
        licenseService.requireTier(LicenseTier.FREE, 'test_feature');
      }).not.toThrow();

      expect(() => {
        licenseService.requireTier(LicenseTier.PRO, 'test_feature');
      }).not.toThrow();
    });
  });
});
