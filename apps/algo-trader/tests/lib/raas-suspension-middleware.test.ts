/**
 * RaaS Suspension Middleware Tests
 * Tests for KV suspension flag integration
 */

import { createLicenseMiddleware, MiddlewareContext } from '../../src/lib/raas-middleware';
import { LicenseTier } from '../../src/lib/raas-gate';
import { raasKVClient } from '../../src/lib/raas-gateway-kv-client';

// Mock KV client
jest.mock('../../src/lib/raas-gateway-kv-client', () => ({
  raasKVClient: {
    isSuspended: jest.fn(),
  },
}));

const mockKVClient = raasKVClient as jest.Mocked<typeof raasKVClient>;

describe('RaaS Suspension Middleware', () => {
  let mockCtx: jest.Mocked<MiddlewareContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCtx = {
      getHeader: jest.fn(),
      getIP: jest.fn(),
      deny: jest.fn(),
      allow: jest.fn(),
    };
  });

  describe('Suspension Check', () => {
    it('should block request when account is suspended', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_suspended';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      mockKVClient.isSuspended.mockResolvedValue({
        suspended: true,
        reason: 'payment_failed',
        suspendedAt: '2026-03-09T00:00:00Z',
      });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      const result = await middleware(mockCtx);

      expect(result).toBe(false);
      expect(mockCtx.deny).toHaveBeenCalledWith(
        403,
        expect.objectContaining({
          error: 'Account Suspended',
          message: 'Access suspended due to payment failure',
          reason: 'payment_failed',
          suspendedAt: '2026-03-09T00:00:00Z',
          retryUrl: 'https://agencyos.network/billing/restore',
        })
      );
    });

    it('should allow request when account is not suspended', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_active';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      mockKVClient.isSuspended.mockResolvedValue({ suspended: false });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      const result = await middleware(mockCtx);

      expect(result).toBe(true);
      expect(mockCtx.deny).not.toHaveBeenCalled();
    });

    it('should allow request when KV is not configured (fail-open)', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_active';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      // KV returns undefined when not configured
      mockKVClient.isSuspended.mockResolvedValue({ suspended: false });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      const result = await middleware(mockCtx);

      expect(result).toBe(true);
    });

    it('should allow request when KV check fails (fail-open)', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_active';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      // KV error - should fail open
      mockKVClient.isSuspended.mockRejectedValue(new Error('KV connection failed'));

      const middleware = createLicenseMiddleware(LicenseTier.PRO);

      // Should not throw - fail-open behavior
      await expect(middleware(mockCtx)).resolves.not.toThrow();
    });
  });

  describe('Suspension State Format', () => {
    it('should handle suspension with all fields', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_suspended';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      mockKVClient.isSuspended.mockResolvedValue({
        suspended: true,
        reason: 'payment_failed',
        suspendedAt: '2026-03-09T10:00:00Z',
      });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      await middleware(mockCtx);

      expect(mockCtx.deny).toHaveBeenCalledWith(
        403,
        expect.objectContaining({
          reason: 'payment_failed',
          suspendedAt: '2026-03-09T10:00:00Z',
        })
      );
    });

    it('should handle suspension without suspendedAt timestamp', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_suspended';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      mockKVClient.isSuspended.mockResolvedValue({
        suspended: true,
        reason: 'manual',
      });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      await middleware(mockCtx);

      expect(mockCtx.deny).toHaveBeenCalledWith(
        403,
        expect.objectContaining({
          reason: 'manual',
          suspendedAt: undefined,
        })
      );
    });
  });

  describe('Integration with License Validation', () => {
    it('should check suspension after license validation passes', async () => {
      mockCtx.getHeader.mockImplementation((name) => {
        if (name === 'x-api-key') return 'lic_valid_but_suspended';
        return undefined;
      });
      mockCtx.getIP.mockReturnValue('127.0.0.1');

      // First license passes, then suspension check happens
      mockKVClient.isSuspended.mockResolvedValue({
        suspended: true,
        reason: 'payment_failed',
      });

      const middleware = createLicenseMiddleware(LicenseTier.PRO);
      const result = await middleware(mockCtx);

      // Should be blocked due to suspension (not invalid license)
      expect(result).toBe(false);
      expect(mockCtx.deny).toHaveBeenCalledWith(
        403,
        expect.objectContaining({
          error: 'Account Suspended',
        })
      );
    });
  });
});
