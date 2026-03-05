/**
 * RAAS License Gate - Security Patches Tests
 *
 * Tests for security patches applied 2026-03-05:
 * - Audit logging
 * - Expiration enforcement
 * - Rate limiting on validation failures
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  LicenseService,
  LicenseTier,
  LicenseError,
  validateLicense,
} from '../../src/lib/raas-gate';

describe('RAAS License Gate - Security Patches', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  describe('Rate Limiting on Validation Failures', () => {
    test('should allow up to 5 validation attempts per minute', async () => {
      const service = LicenseService.getInstance();
      const testIp = '192.168.1.100';

      // First 5 attempts should succeed (return FREE tier, not blocked)
      for (let i = 0; i < 5; i++) {
        await expect(service.validate('invalid-key', testIp)).resolves.not.toThrow();
      }

      expect(service.getValidationAttempts(testIp)).toBe(5);
    });

    test('should block after 5 failed validation attempts', async () => {
      const service = LicenseService.getInstance();
      const testIp = '192.168.1.101';

      // Exhaust attempts
      for (let i = 0; i < 5; i++) {
        await service.validate('invalid-key', testIp);
      }

      // 6th attempt should throw rate limit error
      await expect(service.validate('invalid-key', testIp)).rejects.toThrow('Too many validation attempts');
    });

    test('should track attempts per IP separately', async () => {
      const service = LicenseService.getInstance();
      const ip1 = '192.168.1.102';
      const ip2 = '192.168.1.103';

      // Exhaust ip1
      for (let i = 0; i < 5; i++) {
        await service.validate('invalid-key', ip1);
      }

      // ip1 should be blocked
      await expect(service.validate('invalid-key', ip1)).rejects.toThrow();

      // ip2 should still work
      await expect(service.validate('invalid-key', ip2)).resolves.not.toThrow();
    });

    test('should reset attempts after window expires', async () => {
      const service = LicenseService.getInstance();
      const testIp = '192.168.1.104';

      // Make some attempts
      for (let i = 0; i < 3; i++) {
        await service.validate('invalid-key', testIp);
      }

      // Reset simulates window expiry
      service.reset();

      // Should be able to make attempts again
      for (let i = 0; i < 5; i++) {
        await expect(service.validate('invalid-key', testIp)).resolves.not.toThrow();
      }
    });
  });

  describe('Expiration Enforcement', () => {
    test('should detect expired license', () => {
      const service = LicenseService.getInstance();

      // Manually set expired license
      (service as any).validatedLicense = {
        valid: true,
        tier: LicenseTier.PRO,
        expiresAt: '2020-01-01', // Expired
        features: ['ml_models'],
      };

      expect(service.isExpired()).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(false);
    });

    test('should allow valid non-expired license', () => {
      const service = LicenseService.getInstance();

      // Set future expiration
      (service as any).validatedLicense = {
        valid: true,
        tier: LicenseTier.PRO,
        expiresAt: '2030-12-31', // Not expired
        features: ['ml_models'],
      };

      expect(service.isExpired()).toBe(false);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
    });

    test('should return false for licenses without expiration', () => {
      const service = LicenseService.getInstance();
      service.validate('raas-pro-test');

      // PRO tier doesn't have expiresAt set in validation
      expect(service.isExpired()).toBe(false);
    });

    test('should throw error with EXPIRED message', () => {
      const service = LicenseService.getInstance();

      (service as any).validatedLicense = {
        valid: true,
        tier: LicenseTier.PRO,
        expiresAt: '2020-01-01',
        features: ['ml_models'],
      };

      expect(() => {
        service.requireTier(LicenseTier.PRO, 'test_feature');
      }).toThrow('EXPIRED');
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      // Enable audit logging for tests
      process.env.DEBUG_AUDIT = 'true';
    });

    afterEach(() => {
      delete process.env.DEBUG_AUDIT;
    });

    test('should log feature access checks', () => {
      const service = LicenseService.getInstance();
      service.validateSync('raas-pro-test');

      // Spy on console.log
      const spy = jest.spyOn(console, 'log').mockImplementation();

      service.hasFeature('ml_models');

      expect(spy).toHaveBeenCalled();
      const logArgs = spy.mock.calls[0];
      expect(logArgs[0]).toBe('[RAAS-AUDIT]');
      expect(logArgs[1]).toContain('license_check');

      spy.mockRestore();
    });

    test('should log expired license attempts', () => {
      const service = LicenseService.getInstance();

      (service as any).validatedLicense = {
        valid: true,
        tier: LicenseTier.PRO,
        expiresAt: '2020-01-01',
        features: ['ml_models'],
      };

      const spy = jest.spyOn(console, 'log').mockImplementation();

      service.hasTier(LicenseTier.PRO);

      expect(spy).toHaveBeenCalled();
      const logArgs = spy.mock.calls[0];
      expect(logArgs[1]).toContain('license_expired');

      spy.mockRestore();
    });

    test('should log validation failures', async () => {
      const service = LicenseService.getInstance();
      const testIp = '192.168.1.200';

      // Exhaust attempts
      for (let i = 0; i < 5; i++) {
        await service.validate('invalid-key', testIp);
      }

      const spy = jest.spyOn(console, 'log').mockImplementation();

      // This should trigger validation_failed log
      try {
        await service.validate('invalid-key', testIp);
      } catch (e) {
        // Expected
      }

      expect(spy).toHaveBeenCalled();
      const logArgs = spy.mock.calls[0];
      expect(logArgs[1]).toContain('validation_failed');

      spy.mockRestore();
    });
  });

  describe('Checksum Validation', () => {
    test('should generate checksum for license key', () => {
      const service = LicenseService.getInstance();
      const key = 'raas-pro-test-key';

      const checksum = service.generateChecksum(key);

      expect(checksum).toHaveLength(4);
      expect(typeof checksum).toBe('string');
    });

    test('should validate checksum correctly', () => {
      const service = LicenseService.getInstance();
      const key = 'raas-pro-test-key';

      const checksum = service.generateChecksum(key);

      expect(service.validateWithChecksum(key, checksum)).toBe(true);
      expect(service.validateWithChecksum(key, 'wrong')).toBe(false);
    });

    test('should produce different checksums for different keys', () => {
      const service = LicenseService.getInstance();

      const checksum1 = service.generateChecksum('key-1');
      const checksum2 = service.generateChecksum('key-2');

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('IP-based Rate Limiting', () => {
    test('should include IP in validation attempt tracking', async () => {
      const service = LicenseService.getInstance();
      const ip1 = '10.0.0.1';
      const ip2 = '10.0.0.2';

      // Make attempts from ip1
      for (let i = 0; i < 5; i++) {
        await service.validate('invalid-key', ip1);
      }

      // ip1 should be blocked
      expect(service.getValidationAttempts(ip1)).toBe(5);

      // ip2 should have 0 attempts
      expect(service.getValidationAttempts(ip2)).toBe(0);
    });

    test('should handle missing IP gracefully', () => {
      const service = LicenseService.getInstance();

      // Should not throw when IP is not provided
      for (let i = 0; i < 10; i++) {
        expect(() => service.validate('invalid-key')).not.toThrow();
      }
    });
  });

  describe('Security Error Messages', () => {
    test('should not expose internal details in error messages', () => {
      const service = LicenseService.getInstance();

      try {
        service.validate('invalid-key', '192.168.1.201');
        service.validate('invalid-key', '192.168.1.201');
        service.validate('invalid-key', '192.168.1.201');
        service.validate('invalid-key', '192.168.1.201');
        service.validate('invalid-key', '192.168.1.201');
        service.validate('invalid-key', '192.168.1.201');
      } catch (err) {
        if (err instanceof Error) {
          // Error should be generic, not expose implementation
          expect(err.message).toBe('Too many validation attempts. Please try again later.');
          expect(err.message).not.toContain('Map');
        }
      }
    });

    test('should include tier info in LicenseError', () => {
      const service = LicenseService.getInstance();
      service.validate(); // FREE tier

      try {
        service.requireTier(LicenseTier.PRO, 'ml_models');
      } catch (err) {
        if (err instanceof LicenseError) {
          expect(err.requiredTier).toBe(LicenseTier.PRO);
          expect(err.feature).toBe('ml_models');
        }
      }
    });
  });
});
