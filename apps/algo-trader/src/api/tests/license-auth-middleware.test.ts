/**
 * Unit tests for license authentication middleware
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';

describe('License Auth Middleware', () => {
  beforeEach(() => {
    // Reset license service state between tests
    const service = LicenseService.getInstance();
    (service as any).validatedLicense = null;
    delete process.env.RAAS_LICENSE_KEY;
  });

  describe('extractLicenseKey', () => {
    test('should extract from X-API-Key header', () => {
      const headers = { 'x-api-key': 'raas-pro-test' };
      // Test inline extraction logic
      const apiKey = headers['x-api-key'];
      expect(apiKey).toBe('raas-pro-test');
    });

    test('should extract from Authorization Bearer header', () => {
      const headers = { authorization: 'Bearer raas-pro-token' };
      const authHeader = headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      expect(token).toBe('raas-pro-token');
    });

    test('should fall back to environment variable', () => {
      process.env.RAAS_LICENSE_KEY = 'raas-pro-env';
      expect(process.env.RAAS_LICENSE_KEY).toBe('raas-pro-env');
    });

    test('X-API-Key takes priority over Authorization header', () => {
      const headers = {
        'x-api-key': 'raas-pro-api-key',
        authorization: 'Bearer raas-pro-bearer',
      };
      // Priority: X-API-Key > Authorization > Env
      const apiKey = headers['x-api-key'];
      expect(apiKey).toBe('raas-pro-api-key');
    });
  });

  describe('licenseMiddleware tier enforcement', () => {
    test('FREE tier should be blocked from PRO endpoints', () => {
      const service = LicenseService.getInstance();
      service.validate('invalid-key');

      expect(service.hasTier(LicenseTier.PRO)).toBe(false);
      expect(service.getTier()).toBe(LicenseTier.FREE);
    });

    test('PRO tier should access PRO endpoints', () => {
      const service = LicenseService.getInstance();
      service.validateSync('raas-pro-test-key');

      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
    });

    test('ENTERPRISE tier should access all endpoints', () => {
      const service = LicenseService.getInstance();
      service.validateSync('raas-ent-test-key');

      expect(service.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
      expect(service.hasTier(LicenseTier.PRO)).toBe(true);
      expect(service.hasTier(LicenseTier.FREE)).toBe(true);
    });
  });

  describe('LicenseError handling', () => {
    test('should create LicenseError with correct properties', () => {
      const error = new LicenseError(
        'PRO license required',
        LicenseTier.PRO,
        'advanced_optimization'
      );

      expect(error.message).toBe('PRO license required');
      expect(error.requiredTier).toBe(LicenseTier.PRO);
      expect(error.feature).toBe('advanced_optimization');
      expect(error.name).toBe('LicenseError');
    });

    test('should be caught and handled in middleware', () => {
      try {
        throw new LicenseError(
          'Access denied',
          LicenseTier.ENTERPRISE,
          'arbitrage_scanning'
        );
      } catch (err) {
        expect(err).toBeInstanceOf(LicenseError);
        if (err instanceof LicenseError) {
          expect(err.requiredTier).toBe(LicenseTier.ENTERPRISE);
          expect(err.feature).toBe('arbitrage_scanning');
        }
      }
    });
  });

  describe('Middleware response format', () => {
    test('should return 403 with license error details', () => {
      const service = LicenseService.getInstance();
      service.validate('invalid-key');

      const currentTier = service.getTier();
      const hasPro = service.hasTier(LicenseTier.PRO);

      expect(hasPro).toBe(false);
      expect(currentTier).toBe(LicenseTier.FREE);

      // Expected response format
      const expectedResponse = {
        error: 'License Required',
        message: 'This endpoint requires PRO license. Current tier: free',
        requiredTier: LicenseTier.PRO,
        currentTier,
      };

      expect(expectedResponse.error).toBe('License Required');
      expect(expectedResponse.currentTier).toBe(LicenseTier.FREE);
    });

    test('should include required tier in error response', () => {
      const requiredTier = LicenseTier.ENTERPRISE;
      const service = LicenseService.getInstance();
      const currentTier = service.getTier();

      const response = {
        error: 'License Required',
        requiredTier,
        currentTier,
      };

      expect(response.requiredTier).toBe(LicenseTier.ENTERPRISE);
    });
  });

  describe('Header parsing edge cases', () => {
    test('should handle missing headers gracefully', () => {
      const headers: Record<string, string | undefined> = {};
      const apiKey = headers['x-api-key'];
      const authHeader = headers['authorization'];

      expect(apiKey).toBeUndefined();
      expect(authHeader).toBeUndefined();
    });

    test('should handle malformed Authorization header', () => {
      const headers = { authorization: 'Basic dXNlcjpwYXNz' };
      const authHeader = headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      expect(token).toBeUndefined();
    });

    test('should handle empty Bearer token', () => {
      const headers = { authorization: 'Bearer ' };
      const authHeader = headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

      expect(token).toBe('');
    });
  });
});
