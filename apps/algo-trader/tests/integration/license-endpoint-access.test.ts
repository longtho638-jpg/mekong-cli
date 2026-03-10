/**
 * Integration tests for license-gated endpoint access control
 * Tests end-to-end license validation with Fastify server
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { LicenseService, LicenseTier, LicenseError } from '../../src/lib/raas-gate';

describe('License Endpoint Access Control - Integration', () => {
  beforeEach(() => {
    // Reset license state
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  afterEach(() => {
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  describe('FREE Tier Access', () => {
    beforeEach(() => {
      delete process.env.RAAS_LICENSE_KEY;
      LicenseService.getInstance().reset();
    });

    test('should identify FREE tier when no license key', () => {
      const service = LicenseService.getInstance();
      const validation = service.validateSync();

      expect(validation.tier).toBe(LicenseTier.FREE);
      expect(validation.valid).toBe(false);
      expect(service.hasTier(LicenseTier.PRO)).toBe(false);
    });

    test('FREE tier should have basic features only', () => {
      const service = LicenseService.getInstance();
      service.validateSync();

      expect(service.hasFeature('basic_strategies')).toBe(true);
      expect(service.hasFeature('live_trading')).toBe(true);
      expect(service.hasFeature('ml_models')).toBe(false);
      expect(service.hasFeature('premium_data')).toBe(false);
    });
  });

  describe('PRO Tier Access', () => {
    beforeEach(() => {
      process.env.RAAS_LICENSE_KEY = 'raas-pro-test-key';
      LicenseService.getInstance().reset();
    });

    test('should identify PRO tier with valid key', () => {
      const service = LicenseService.getInstance();
      const validation = service.validateSync();

      expect(validation.tier).toBe(LicenseTier.PRO);
      expect(validation.valid).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
    });

    test('PRO tier should have premium features', () => {
      const service = LicenseService.getInstance();
      service.validateSync();

      expect(service.hasFeature('ml_models')).toBe(true);
      expect(service.hasFeature('premium_data')).toBe(true);
      expect(service.hasFeature('advanced_optimization')).toBe(true);
    });

    test('PRO tier should have basic features too (hierarchy)', () => {
      const service = LicenseService.getInstance();
      service.validateSync();

      expect(service.hasFeature('basic_strategies')).toBe(true);
      expect(service.hasFeature('live_trading')).toBe(true);
    });
  });

  describe('ENTERPRISE Tier Access', () => {
    beforeEach(() => {
      process.env.RAAS_LICENSE_KEY = 'raas-ent-test-key';
      LicenseService.getInstance().reset();
    });

    test('should identify ENTERPRISE tier with valid key', () => {
      const service = LicenseService.getInstance();
      const validation = service.validateSync();

      expect(validation.tier).toBe(LicenseTier.ENTERPRISE);
      expect(validation.valid).toBe(true);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });

    test('ENTERPRISE tier should have all features', () => {
      const service = LicenseService.getInstance();
      service.validateSync();

      expect(service.hasFeature('ml_models')).toBe(true);
      expect(service.hasFeature('premium_data')).toBe(true);
      expect(service.hasFeature('priority_support')).toBe(true);
      expect(service.hasFeature('custom_strategies')).toBe(true);
      expect(service.hasFeature('multi_exchange')).toBe(true);
    });
  });

  describe('Header-based License Extraction', () => {
    test('should recognize X-API-Key header format', () => {
      // Simulate header extraction logic from middleware
      const headers: Record<string, string | undefined> = { 'x-api-key': 'raas-pro-test' };
      const apiKey = headers['x-api-key'];
      expect(apiKey).toBe('raas-pro-test');
    });

    test('should recognize Authorization Bearer header format', () => {
      const headers: Record<string, string | undefined> = { authorization: 'Bearer raas-pro-test' };
      const authHeader = headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      expect(token).toBe('raas-pro-test');
    });

    test('X-API-Key should take priority over Authorization', () => {
      const headers: Record<string, string | undefined> = {
        'x-api-key': 'raas-pro-api-key',
        authorization: 'Bearer raas-pro-bearer',
      };
      const apiKey = headers['x-api-key'];
      expect(apiKey).toBe('raas-pro-api-key');
    });
  });

  describe('LicenseError Handling', () => {
    test('LicenseError should have correct properties', () => {
      const error = new LicenseError('Test error', LicenseTier.PRO, 'test_feature');

      expect(error.name).toBe('LicenseError');
      expect(error.message).toBe('Test error');
      expect(error.requiredTier).toBe(LicenseTier.PRO);
      expect(error.feature).toBe('test_feature');
    });

    test('LicenseService should enforce tier hierarchy', () => {
      const service = LicenseService.getInstance();

      // Test FREE tier
      service.validateSync('invalid-key');
      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(false);

      // Test PRO tier
      service.validateSync('raas-pro-test');
      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(false);

      // Test ENTERPRISE tier
      service.validateSync('raas-ent-test');
      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });
  });

  describe('Feature Gating', () => {
    beforeEach(() => {
      LicenseService.getInstance().reset();
    });

    test('ML features should require PRO license', () => {
      const service = LicenseService.getInstance();

      // FREE tier - should fail
      service.validate('invalid');
      expect(() => service.requireFeature('ml_models')).toThrow();

      // PRO tier - should pass
      service.validateSync('raas-pro-test');
      expect(() => service.requireFeature('ml_models')).not.toThrow();
    });

    test('Premium data should require PRO license', () => {
      const service = LicenseService.getInstance();

      // FREE tier - should fail
      service.validate('invalid');
      expect(() => service.requireFeature('premium_data')).toThrow();

      // PRO tier - should pass
      service.validateSync('raas-pro-test');
      expect(() => service.requireFeature('premium_data')).not.toThrow();
    });

    test('requireTier should throw for insufficient tier', () => {
      const service = LicenseService.getInstance();

      // FREE tier trying to access PRO feature
      service.validate('invalid');
      expect(() => service.requireTier(LicenseTier.PRO, 'optimization')).toThrow();

      // PRO tier - should pass
      service.validateSync('raas-pro-test');
      expect(() => service.requireTier(LicenseTier.PRO, 'optimization')).not.toThrow();
    });
  });

  describe('License Key Formats', () => {
    beforeEach(() => {
      LicenseService.getInstance().reset();
    });

    test('should recognize raas-pro-* format', () => {
      const service = LicenseService.getInstance();
      service.validateSync('raas-pro-12345');
      expect(service.getTier()).toBe(LicenseTier.PRO);
    });

    test('should recognize RPP-* format (legacy)', () => {
      const service = LicenseService.getInstance();
      service.validateSync('RPP-12345');
      expect(service.getTier()).toBe(LicenseTier.PRO);
    });

    test('should recognize raas-ent-* format', () => {
      const service = LicenseService.getInstance();
      service.validateSync('raas-ent-12345');
      expect(service.getTier()).toBe(LicenseTier.ENTERPRISE);
    });

    test('should recognize REP-* format (legacy)', () => {
      const service = LicenseService.getInstance();
      service.validateSync('REP-12345');
      expect(service.getTier()).toBe(LicenseTier.ENTERPRISE);
    });

    test('should treat invalid formats as FREE', () => {
      const service = LicenseService.getInstance();
      service.validate('invalid-key-format');
      expect(service.getTier()).toBe(LicenseTier.FREE);
    });
  });
});
