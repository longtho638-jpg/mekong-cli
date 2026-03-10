/**
 * License Enforcement Integration Tests
 *
 * Verify license gating blocks premium features for FREE tier users:
 * - Monte Carlo simulation
 * - Walk-forward analysis
 * - Premium data access (>10k candles)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';
import { BacktestEngine } from '../../backtest/BacktestEngine';
import { DetailedTrade } from '../../backtest/backtest-engine-result-types';
import { ICandle } from '../../interfaces/ICandle';

// Generate mock candles
function generateCandles(count: number): ICandle[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 60000,
    open: 100 + i * 0.1,
    high: 100 + i * 0.1 + Math.random() * 0.5,
    low: 100 + i * 0.1 - Math.random() * 0.5,
    close: 100 + i * 0.1 + (Math.random() - 0.5) * 0.5,
    volume: 1000000 + Math.random() * 500000,
  }));
}

// Generate mock detailed trades
function generateTrades(count: number): DetailedTrade[] {
  return Array.from({ length: count }, (_, i) => ({
    entryPrice: 100 + i,
    exitPrice: 100 + i + Math.random() * 2 - 1,
    entryTime: Date.now() - (count - i) * 3600000,
    exitTime: Date.now() - (count - i - 1) * 3600000,
    profit: (Math.random() - 0.45) * 200,
    profitPercent: (Math.random() - 0.45) * 2,
    positionSize: 1,
    fees: 0.1,
    holdingPeriodMs: 3600000,
    maxAdverseExcursion: 99,
    maxFavorableExcursion: 102,
  }));
}

describe('License Enforcement - Premium Feature Gating', () => {
  let licenseService: LicenseService;
  let backtestEngine: BacktestEngine;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
    delete process.env.RAAS_LICENSE_KEY;
    delete process.env.DEBUG_AUDIT; // Clear audit flag for clean state
    backtestEngine = new BacktestEngine();
  });

  describe('Walk-Forward Analysis Gating', () => {
    test('should block walk-forward analysis for FREE tier', async () => {
      // Arrange: FREE tier (no license)
      licenseService.validateSync();

      const candles = generateCandles(2000);

      // Act & Assert: Should throw LicenseError
      await expect(async () => {
        await backtestEngine.walkForward(() => {
          throw new Error('Should not be called for FREE tier');
        }, candles, 3, 0.7);
      }).rejects.toThrow(LicenseError);

      await expect(async () => {
        await backtestEngine.walkForward(() => {
          throw new Error('Should not be called for FREE tier');
        }, candles, 3, 0.7);
      }).rejects.toThrow('walk_forward_analysis');
    });

    test('should allow walk-forward analysis for PRO tier', async () => {
      // Arrange: PRO tier
      await licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      const candles = generateCandles(2000);

      // Act: Should NOT throw LicenseError
      let licenseError: LicenseError | null = null;
      try {
        await backtestEngine.walkForward(() => {
          throw new Error('Should not be called - strategy factory only');
        }, candles, 3, 0.7);
      } catch (e) {
        if (e instanceof LicenseError) {
          licenseError = e;
        }
        // Other errors (from strategy factory) are expected
      }

      // Should not throw LicenseError
      expect(licenseError).toBeNull();
    });

    test('should allow walk-forward analysis for ENTERPRISE tier', async () => {
      // Arrange: ENTERPRISE tier
      await licenseService.activateLicense('test-ent-key', LicenseTier.ENTERPRISE);

      const candles = generateCandles(2000);

      // Act & Assert: Should NOT throw LicenseError
      let licenseError: LicenseError | null = null;
      try {
        await backtestEngine.walkForward(() => {
          throw new Error('Should not be called');
        }, candles, 3, 0.7);
      } catch (e) {
        if (e instanceof LicenseError) {
          licenseError = e;
        }
      }

      expect(licenseError).toBeNull();
    });
  });

  describe('Monte Carlo Simulation Gating', () => {
    test('should block monte carlo simulation for FREE tier', () => {
      // Arrange: FREE tier
      licenseService.validateSync();

      const trades = generateTrades(3);

      // Act & Assert: Should throw LicenseError
      expect(() => {
        backtestEngine.monteCarlo(trades, 10000, 100);
      }).toThrow(LicenseError);

      expect(() => {
        backtestEngine.monteCarlo(trades, 10000, 100);
      }).toThrow('monte_carlo_simulation');
    });

    test('should allow monte carlo simulation for PRO tier', () => {
      // Arrange: PRO tier
      licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      const trades = generateTrades(3);

      // Act & Assert: Should NOT throw
      expect(() => {
        const result = backtestEngine.monteCarlo(trades, 10000, 100);
        expect(result).toBeDefined();
        expect(result.medianReturn).toBeDefined();
      }).not.toThrow();
    });

    test('should allow monte carlo simulation for ENTERPRISE tier', () => {
      // Arrange: ENTERPRISE tier
      licenseService.activateLicense('test-ent-key', LicenseTier.ENTERPRISE);

      const trades = generateTrades(3);

      // Act & Assert: Should NOT throw
      expect(() => {
        const result = backtestEngine.monteCarlo(trades, 10000, 100);
        expect(result).toBeDefined();
      }).not.toThrow(LicenseError);
    });
  });

  describe('Premium Data Gating (>10k candles)', () => {
    test('should block premium data (>10k candles) for FREE tier', async () => {
      // Arrange: FREE tier with large dataset
      licenseService.validateSync();

      const candles = generateCandles(15000); // >10k threshold

      // Create a minimal strategy for testing
      const mockStrategy: any = {
        name: 'MockStrategy',
        init: async () => {},
        onCandle: async () => null,
      };

      // Act & Assert: Should throw LicenseError
      await expect(async () => {
        await backtestEngine.runDetailed(mockStrategy, candles, 10000);
      }).rejects.toThrow(LicenseError);

      await expect(async () => {
        await backtestEngine.runDetailed(mockStrategy, candles, 10000);
      }).rejects.toThrow('Premium historical data');
    });

    test('should allow premium data for PRO tier', async () => {
      // Arrange: PRO tier with large dataset
      await licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      const candles = generateCandles(15000);

      const mockStrategy: any = {
        name: 'MockStrategy',
        init: async () => {},
        onCandle: async () => null,
      };

      // Act: Should NOT throw LicenseError
      let licenseError: LicenseError | null = null;
      try {
        const result = await backtestEngine.runDetailed(mockStrategy, candles, 10000);
        expect(result).toBeDefined();
      } catch (e) {
        if (e instanceof LicenseError) {
          licenseError = e;
        }
      }

      // Should not throw LicenseError
      expect(licenseError).toBeNull();
    });

    test('should allow small datasets (<10k) for FREE tier', async () => {
      // Arrange: FREE tier with small dataset
      licenseService.validateSync();

      const candles = generateCandles(5000); // <10k threshold

      const mockStrategy: any = {
        name: 'MockStrategy',
        init: async () => {},
        onCandle: async () => null,
      };

      // Act: Should NOT throw
      let error: Error | null = null;
      try {
        const result = await backtestEngine.runDetailed(mockStrategy, candles, 10000);
        expect(result).toBeDefined();
      } catch (e) {
        error = e as Error;
      }

      // Should not throw LicenseError for small dataset
      if (error) {
        expect(error.message).not.toContain('Premium historical data');
      }
    });
  });

  describe('Feature Gating Middleware', () => {
    test('requireTier should throw for insufficient tier', () => {
      // Arrange: FREE tier
      licenseService.validateSync();

      // Act & Assert
      expect(() => {
        licenseService.requireTier(LicenseTier.PRO, 'test_feature');
      }).toThrow(LicenseError);

      expect(() => {
        licenseService.requireTier(LicenseTier.PRO, 'test_feature');
      }).toThrow('requires PRO license');
    });

    test('requireTier should pass for sufficient tier', () => {
      // Arrange: PRO tier
      licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      // Act & Assert: Should NOT throw
      expect(() => {
        licenseService.requireTier(LicenseTier.PRO, 'test_feature');
      }).not.toThrow();

      expect(() => {
        licenseService.requireTier(LicenseTier.FREE, 'test_feature');
      }).not.toThrow();
    });

    test('requireFeature should throw for unavailable feature', () => {
      // Arrange: FREE tier
      licenseService.validateSync();

      // Act & Assert
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).toThrow(LicenseError);

      expect(() => {
        licenseService.requireFeature('ml_models');
      }).toThrow('is not enabled');
    });

    test('requireFeature should pass for available feature', () => {
      // Arrange: PRO tier
      licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      // Act & Assert: Should NOT throw
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).not.toThrow();
    });
  });

  describe('Tier Upgrade/Downgrade Enforcement', () => {
    test('should enforce feature access after tier upgrade', async () => {
      // Arrange: Start with FREE
      licenseService.validateSync();

      // FREE cannot access ML
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).toThrow(LicenseError);

      // Act: Upgrade to PRO
      await licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      // Assert: Now can access ML
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).not.toThrow();
    });

    test('should revoke feature access after tier downgrade', async () => {
      // Arrange: Start with PRO
      await licenseService.activateLicense('test-pro-key', LicenseTier.PRO);

      // PRO can access ML
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).not.toThrow();

      // Act: Downgrade to FREE
      await licenseService.downgradeToFree('test-pro-key');

      // Assert: FREE cannot access ML
      expect(() => {
        licenseService.requireFeature('ml_models');
      }).toThrow(LicenseError);
    });
  });

  describe('Rate Limiting on Validation Failures', () => {
    test('should block after too many failed validation attempts', async () => {
      const testIp = '192.168.1.100';

      // Arrange: Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await licenseService.validate('invalid-key', testIp);
        } catch (e) {
          // Expected for invalid keys
        }
      }

      // Act: 6th attempt should be blocked
      let blocked = false;
      try {
        await licenseService.validate('another-invalid-key', testIp);
      } catch (e) {
        if (e instanceof LicenseError && e.message.includes('Too many')) {
          blocked = true;
        }
      }

      // Assert: Should be blocked (rate limited)
      expect(blocked).toBe(true);
    });

    test('should allow validation from different IPs', async () => {
      // Arrange: One IP hits rate limit
      const ip1 = '192.168.1.101';
      const ip2 = '192.168.1.102';

      for (let i = 0; i < 5; i++) {
        try {
          await licenseService.validate('invalid-key', ip1);
        } catch (e) {
          // Expected
        }
      }

      // Act: Different IP should still work
      let allowed = false;
      try {
        const result = await licenseService.validate('raas-pro-valid', ip2);
        allowed = result.tier === LicenseTier.PRO;
      } catch (e) {
        // Should not throw for valid key
      }

      // Assert: Different IP not affected
      expect(allowed).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    test('should log license check events', () => {
      // Arrange
      process.env.DEBUG_AUDIT = 'true'; // Enable audit logging for this test
      licenseService.validateSync();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      licenseService.hasFeature('ml_models');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RAAS-AUDIT]'),
        expect.stringContaining('license_check')
      );

      consoleSpy.mockRestore();
      delete process.env.DEBUG_AUDIT; // Cleanup
    });
  });
});
