/**
 * RAAS License Gate — Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  LicenseService,
  LicenseTier,
  LicenseError,
  isPremium,
  isEnterprise,
  getLicenseTier,
  validateLicense,
  requireMLFeature,
  requirePremiumData,
} from './raas-gate';

describe('RAAS License Gate', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  describe('License Tier Validation', () => {
    test('should default to FREE tier when no license key', async () => {
      const result = await validateLicense();
      expect(result.valid).toBe(false);
      expect(result.tier).toBe(LicenseTier.FREE);
      expect(result.features).toContain('basic_strategies');
      expect(result.features).not.toContain('ml_models');
    });

    test('should recognize PRO license key format', async () => {
      const result = await validateLicense('raas-pro-abc123');
      expect(result.valid).toBe(true);
      expect(result.tier).toBe(LicenseTier.PRO);
      expect(result.features).toContain('ml_models');
      expect(result.features).toContain('premium_data');
    });

    test('should recognize ENTERPRISE license key format', async () => {
      const result = await validateLicense('raas-ent-premium');
      expect(result.valid).toBe(true);
      expect(result.tier).toBe(LicenseTier.ENTERPRISE);
      expect(result.expiresAt).toBe('2027-12-31');
    });

    test('should treat invalid key format as FREE tier', async () => {
      const result = await validateLicense('invalid-key');
      expect(result.valid).toBe(false);
      expect(result.tier).toBe(LicenseTier.FREE);
    });
  });

  describe('Feature Access Control', () => {
    test('FREE tier should have basic features only', async () => {
      await validateLicense();
      const service = LicenseService.getInstance();

      expect(service.hasFeature('basic_strategies')).toBe(true);
      expect(service.hasFeature('live_trading')).toBe(true);
      expect(service.hasFeature('basic_backtest')).toBe(true);
      expect(service.hasFeature('ml_models')).toBe(false);
      expect(service.hasFeature('premium_data')).toBe(false);
    });

    test('PRO tier should have ML and premium data access', async () => {
      await validateLicense('raas-pro-test');
      const service = LicenseService.getInstance();

      expect(service.hasFeature('ml_models')).toBe(true);
      expect(service.hasFeature('premium_data')).toBe(true);
      expect(service.hasFeature('advanced_optimization')).toBe(true);
    });

    test('ENTERPRISE tier should have all features', async () => {
      await validateLicense('raas-ent-test');
      const service = LicenseService.getInstance();

      expect(service.hasFeature('priority_support')).toBe(true);
      expect(service.hasFeature('custom_strategies')).toBe(true);
      expect(service.hasFeature('multi_exchange')).toBe(true);
    });
  });

  describe('Tier Hierarchy', () => {
    test('FREE tier cannot access PRO features', async () => {
      await validateLicense();
      const service = LicenseService.getInstance();

      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(false);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(false);
    });

    test('PRO tier can access PRO and FREE features', async () => {
      await validateLicense('raas-pro-test');
      const service = LicenseService.getInstance();

      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(false);
    });

    test('ENTERPRISE tier can access all features', async () => {
      await validateLicense('raas-ent-test');
      const service = LicenseService.getInstance();

      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });
  });

  describe('LicenseError', () => {
    test('should throw LicenseError with correct properties', async () => {
      await validateLicense();
      const service = LicenseService.getInstance();

      expect(() => {
        service.requireFeature('ml_models');
      }).toThrow(LicenseError);
    });

    test('should not throw for allowed features', async () => {
      await validateLicense('raas-pro-test');
      const service = LicenseService.getInstance();

      expect(() => {
        service.requireFeature('ml_models');
      }).not.toThrow();
    });
  });

  describe('Convenience Helpers', () => {
    test('isPremium() should return false for FREE tier', async () => {
      await validateLicense();
      expect(isPremium()).toBe(false);
    });

    test('isPremium() should return true for PRO tier', async () => {
      await validateLicense('raas-pro-test');
      expect(isPremium()).toBe(true);
    });

    test('isEnterprise() should return true for ENTERPRISE tier', async () => {
      await validateLicense('raas-ent-test');
      expect(isEnterprise()).toBe(true);
    });
  });

  describe('ML Feature Gating', () => {
    test('requireMLFeature() should throw for FREE tier', async () => {
      await validateLicense();
      expect(() => {
        requireMLFeature('gru_model');
      }).toThrow(LicenseError);
    });

    test('requireMLFeature() should pass for PRO tier', async () => {
      await validateLicense('raas-pro-test');
      expect(() => {
        requireMLFeature('gru_model');
      }).not.toThrow();
    });
  });

  describe('Premium Data Gating', () => {
    test('requirePremiumData() should throw for FREE tier', async () => {
      await validateLicense();
      expect(() => {
        requirePremiumData();
      }).toThrow(LicenseError);
    });

    test('requirePremiumData() should pass for PRO tier', async () => {
      await validateLicense('raas-pro-test');
      expect(() => {
        requirePremiumData();
      }).not.toThrow();
    });
  });
});

describe('Worker Endpoint Protection', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  test('optimization worker should require PRO license', async () => {
    await validateLicense();
    expect(() => {
      LicenseService.getInstance().requireFeature('advanced_optimization');
    }).toThrow(LicenseError);

    await validateLicense('raas-pro-test');
    expect(() => {
      LicenseService.getInstance().requireFeature('advanced_optimization');
    }).not.toThrow();
  });

  test('backtest worker premium data should require PRO license', async () => {
    await validateLicense();
    expect(() => {
      requirePremiumData();
    }).toThrow(LicenseError);

    await validateLicense('raas-pro-test');
    expect(() => {
      requirePremiumData();
    }).not.toThrow();
  });
});






