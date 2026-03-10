/**
 * RAAS License Gate - Unit Tests
 *
 * Tests for LicenseService singleton with rate limiting and audit logging.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  LicenseService,
  LicenseTier,
  LicenseError,
  PREMIUM_FEATURES,
  hasFeature,
  requireFeature,
  getLicenseStatus,
  isPremium,
  isEnterprise,
  getLicenseTier,
} from './raas-gate';

describe('RAAS License Gate', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
    delete process.env.RAAS_LICENSE_KEY;
    delete process.env.DEBUG_AUDIT;
  });

  afterEach(() => {
    delete process.env.RAAS_LICENSE_KEY;
    delete process.env.DEBUG_AUDIT;
  });

  describe('LicenseService Singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = LicenseService.getInstance();
      const instance2 = LicenseService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset license and rate limits', () => {
      licenseService.validateSync('raas_pro_test1234567890');
      expect(licenseService.hasTier('pro')).toBe(true);
      licenseService.reset();
      expect(licenseService.hasTier('pro')).toBe(false);
    });
  });

  describe('validateLicense', () => {
    it('should return free tier when no license key', () => {
      const result = licenseService.validateSync();
      expect(result.valid).toBe(false);
      expect(result.tier).toBe('free');
      expect(result.features).toEqual(PREMIUM_FEATURES.free);
    });

    it('should return free tier when license key is empty string', () => {
      process.env.RAAS_LICENSE_KEY = '';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(false);
      expect(result.tier).toBe('free');
    });

    it('should return pro tier for valid pro license key', () => {
      process.env.RAAS_LICENSE_KEY = 'raas_pro_abc123def456789';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.features).toEqual(PREMIUM_FEATURES.pro);
    });

    it('should return enterprise tier for enterprise license key', () => {
      process.env.RAAS_LICENSE_KEY = 'raas_ent_xyz789abc123456';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('enterprise');
      expect(result.features).toEqual(PREMIUM_FEATURES.enterprise);
    });

    it('should return pro tier for sk-raas- prefix', () => {
      process.env.RAAS_LICENSE_KEY = 'sk-raas-abc123def456';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
    });

    it('should return pro tier for RPP- prefix', () => {
      process.env.RAAS_LICENSE_KEY = 'RPP-abc123def456789';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
    });

    it('should return enterprise tier for REP- prefix', () => {
      process.env.RAAS_LICENSE_KEY = 'REP-abc123def456789';
      const result = licenseService.validateSync();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('enterprise');
    });

    it('should handle async validate', async () => {
      process.env.RAAS_LICENSE_KEY = 'raas_pro_test1234567890';
      const result = await licenseService.validate();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
    });
  });

  describe('hasTier', () => {
    it('should enforce tier hierarchy (FREE < PRO < ENTERPRISE)', () => {
      expect(licenseService.hasTier('free')).toBe(true);
      expect(licenseService.hasTier('pro')).toBe(false);
      expect(licenseService.hasTier('enterprise')).toBe(false);

      licenseService.validateSync('raas_pro_test1234567890');
      expect(licenseService.hasTier('free')).toBe(true);
      expect(licenseService.hasTier('pro')).toBe(true);
      expect(licenseService.hasTier('enterprise')).toBe(false);

      licenseService.validateSync('raas_ent_test1234567890');
      expect(licenseService.hasTier('free')).toBe(true);
      expect(licenseService.hasTier('pro')).toBe(true);
      expect(licenseService.hasTier('enterprise')).toBe(true);
    });
  });

  describe('hasFeature', () => {
    it('should return true for free tier features without license', () => {
      expect(hasFeature('basic_cli_commands')).toBe(true);
      expect(hasFeature('open_source_agents')).toBe(true);
    });

    it('should return false for premium features without license', () => {
      expect(hasFeature('premium_agents')).toBe(false);
      expect(hasFeature('agi_auto_pilot')).toBe(false);
    });

    it('should return true for pro features with pro license', () => {
      licenseService.validateSync('raas_pro_test1234567890');
      expect(hasFeature('premium_agents')).toBe(true);
      expect(hasFeature('ml_models')).toBe(true);
    });

    it('should return true for enterprise features with enterprise license', () => {
      licenseService.validateSync('raas_ent_test1234567890');
      expect(hasFeature('agi_auto_pilot')).toBe(true);
      expect(hasFeature('team_collaboration')).toBe(true);
    });
  });

  describe('requireFeature', () => {
    it('should not throw for available features', () => {
      licenseService.validateSync('raas_pro_test1234567890');
      expect(() => requireFeature('premium_agents')).not.toThrow();
    });

    it('should throw LicenseError for unavailable features', () => {
      licenseService.reset();
      expect(() => requireFeature('agi_auto_pilot')).toThrow(LicenseError);
    });
  });

  describe('isPremium/isEnterprise helpers', () => {
    it('should return false without license', () => {
      expect(isPremium()).toBe(false);
      expect(isEnterprise()).toBe(false);
    });

    it('should return true for pro license', () => {
      licenseService.validateSync('raas_pro_test1234567890');
      expect(isPremium()).toBe(true);
      expect(isEnterprise()).toBe(false);
    });

    it('should return true for enterprise license', () => {
      licenseService.validateSync('raas_ent_test1234567890');
      expect(isPremium()).toBe(true);
      expect(isEnterprise()).toBe(true);
    });
  });

  describe('getLicenseTier', () => {
    it('should return free without license', () => {
      expect(getLicenseTier()).toBe('free');
    });

    it('should return pro with pro license', () => {
      licenseService.validateSync('raas_pro_test1234567890');
      expect(getLicenseTier()).toBe('pro');
    });

    it('should return enterprise with enterprise license', () => {
      licenseService.validateSync('raas_ent_test1234567890');
      expect(getLicenseTier()).toBe('enterprise');
    });
  });

  describe('getLicenseStatus', () => {
    it('should return free tier status message', () => {
      licenseService.reset();
      const status = getLicenseStatus();
      expect(status).toContain('Free Tier');
    });

    it('should return pro tier status message', () => {
      process.env.RAAS_LICENSE_KEY = 'raas_pro_test1234567890';
      const status = getLicenseStatus();
      expect(status).toContain('PRO');
      expect(status).toContain('💎');
    });

    it('should return enterprise tier status message', () => {
      process.env.RAAS_LICENSE_KEY = 'raas_ent_test1234567890';
      const status = getLicenseStatus();
      expect(status).toContain('ENTERPRISE');
      expect(status).toContain('🏢');
    });
  });

  describe('activateLicense/deactivateLicense', () => {
    it('should activate license with given tier', async () => {
      await licenseService.activateLicense('test-key', 'pro');
      expect(licenseService.hasTier('pro')).toBe(true);
    });

    it('should deactivate license', async () => {
      await licenseService.activateLicense('test-key', 'pro');
      await licenseService.deactivateLicense();
      expect(licenseService.hasTier('pro')).toBe(false);
    });
  });

  describe('generateChecksum/validateWithChecksum', () => {
    it('should generate and validate checksum', () => {
      const key = 'raas_pro_test1234567890';
      const checksum = licenseService.generateChecksum(key);
      expect(checksum).toHaveLength(4);
      expect(licenseService.validateWithChecksum(key, checksum)).toBe(true);
    });

    it('should reject invalid checksum', () => {
      const key = 'raas_pro_test1234567890';
      expect(licenseService.validateWithChecksum(key, 'abcd')).toBe(false);
    });
  });
});
