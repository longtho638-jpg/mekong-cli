/**
 * Subscription E2E Integration Tests
 */

import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';

describe('Subscription E2E', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
  });

  describe('License Tier Upgrades', () => {
    test('should upgrade from FREE to PRO', async () => {
      licenseService.validateSync();
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);

      await licenseService.activateLicense('sub_pro_123', LicenseTier.PRO);

      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasFeature('ml_models')).toBe(true);
    });

    test('should upgrade from PRO to ENTERPRISE', async () => {
      await licenseService.activateLicense('sub_pro_456', LicenseTier.PRO);
      await licenseService.setTier('sub_pro_456', LicenseTier.ENTERPRISE);

      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
      expect(licenseService.hasFeature('priority_support')).toBe(true);
    });

    test('should downgrade from PRO to FREE on cancellation', async () => {
      await licenseService.activateLicense('sub_pro_789', LicenseTier.PRO);
      await licenseService.downgradeToFree('sub_pro_789');

      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
    });
  });

  describe('Feature Access Control', () => {
    test('FREE tier cannot access ML models', async () => {
      licenseService.validateSync();

      try {
        licenseService.requireFeature('ml_models');
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LicenseError);
      }
    });

    test('PRO tier can access ML models', async () => {
      await licenseService.activateLicense('sub_test', LicenseTier.PRO);

      expect(() => {
        licenseService.requireFeature('ml_models');
      }).not.toThrow();
    });

    test('PRO tier cannot access ENTERPRISE features', async () => {
      await licenseService.activateLicense('sub_test', LicenseTier.PRO);

      try {
        licenseService.requireFeature('priority_support');
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LicenseError);
      }
    });
  });

  describe('Webhook Event Flow', () => {
    test('should handle full subscription lifecycle', async () => {
      await licenseService.activateLicense('sub_lifecycle', LicenseTier.PRO);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);

      await licenseService.setTier('sub_lifecycle', LicenseTier.ENTERPRISE);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);

      await licenseService.downgradeToFree('sub_lifecycle');
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
    });

    test('should handle multiple subscriptions', async () => {
      await licenseService.activateLicense('sub_1', LicenseTier.PRO);
      await licenseService.activateLicense('sub_2', LicenseTier.ENTERPRISE);

      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });
  });

  describe('Security Controls', () => {
    test('should validate license key format', async () => {
      const result = await licenseService.validate('invalid-key-format');

      expect(result.valid).toBe(false);
      expect(result.tier).toBe(LicenseTier.FREE);
    });

    test('should reject expired licenses', async () => {
      const result = await licenseService.validate('expired-key');
      
      expect(result.tier).toBe(LicenseTier.FREE);
    });
  });
});
