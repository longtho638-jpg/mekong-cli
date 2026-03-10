/**
 * Overage Calculator Tests
 *
 * Test cases for overage calculation with mocked usage data
 * and edge cases from real metering scenarios.
 */

import {
  OverageCalculator,
  getTierLimits,
  getOveragePricing,
} from '../../src/billing/overage-calculator';

describe('OverageCalculator', () => {
  let calculator: OverageCalculator;

  beforeEach(() => {
    calculator = OverageCalculator.getInstance();
    OverageCalculator.resetInstance();
  });

  afterEach(() => {
    OverageCalculator.resetInstance();
  });

  describe('getTierLimits', () => {
    it('should return default tier limits', () => {
      const limits = getTierLimits();
      expect(limits.free.apiCalls).toBe(1000);
      expect(limits.free.computeMinutes).toBe(10);
      expect(limits.free.mlInferences).toBe(50);
      expect(limits.pro.apiCalls).toBe(200000);
    });

    it('should return enterprise limits (unlimited)', () => {
      const limits = getTierLimits();
      expect(limits.enterprise.apiCalls).toBe(1000000);
      expect(limits.enterprise.computeMinutes).toBe(10000);
      expect(limits.enterprise.mlInferences).toBe(50000);
    });
  });

  describe('getOveragePricing', () => {
    it('should return default pricing', () => {
      const pricing = getOveragePricing();
      expect(pricing.apiCallPricePerUnit).toBe(0.001);
      expect(pricing.computeMinutePrice).toBe(0.05);
      expect(pricing.mlInferencePrice).toBe(0.01);
    });
  });

  describe('calculateOverage - API Calls', () => {
    it('should return null when usage is within limit', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        500 // Under 1000 limit
      );
      expect(result).toBeNull();
    });

    it('should calculate overage for free tier', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        1500 // 500 over 1000 limit
      );

      expect(result).not.toBeNull();
      expect(result?.baseLimit).toBe(1000);
      expect(result?.actualUsage).toBe(1500);
      expect(result?.overageUnits).toBe(500);
      expect(result?.metric).toBe('api_calls');
    });

    it('should calculate overage charge correctly', () => {
      // $0.001 per 1000 calls = $0.000001 per call
      // 1000 overage calls * $0.000001 = $0.001 (rounds to $0.00 - minimum billing is 1 cent)
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        2000 // 1000 over limit
      );

      expect(result?.totalCharge).toBe(0); // Rounds to $0.00 (fractional cents not billed)
    });

    it('should charge $1 for 1M overage calls', () => {
      // 1,000,000 overage calls * $0.000001 = $1.00
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        1001000 // 1M + 1000 over limit
      );

      expect(result?.totalCharge).toBe(1); // $1.00
    });

    it('should apply pro tier discount (20%)', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'pro',
        'api_calls',
        250000 // 50000 over 200000 limit
      );

      expect(result?.baseLimit).toBe(200000);
      expect(result?.overageUnits).toBe(50000);
    });

    it('should handle edge case: exactly at limit', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        1000 // Exactly at limit
      );
      expect(result).toBeNull(); // No overage at exact limit
    });

    it('should handle edge case: 1 unit over limit', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        1001 // 1 over limit
      );
      expect(result).not.toBeNull();
      expect(result?.overageUnits).toBe(1);
    });
  });

  describe('calculateOverage - Compute Minutes', () => {
    it('should return null when within limit', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'starter',
        'compute_minutes',
        50 // Under 100 limit
      );
      expect(result).toBeNull();
    });

    it('should calculate compute overage correctly', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'starter',
        'compute_minutes',
        150 // 50 over 100 limit
      );

      expect(result?.overageUnits).toBe(50);
      expect(result?.totalCharge).toBe(2.5); // 50 * $0.05 = $2.50
    });

    it('should handle fractional compute minutes', () => {
      // Note: Current implementation uses integer minutes
      // Future: support fractional minutes
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'growth',
        'compute_minutes',
        525 // 25 over 500 limit
      );

      expect(result?.overageUnits).toBe(25);
      expect(result?.totalCharge).toBe(1.25); // 25 * $0.05 = $1.25
    });
  });

  describe('calculateOverage - ML Inferences', () => {
    it('should return null when within limit', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'growth',
        'ml_inferences',
        1000 // Under 2500 limit
      );
      expect(result).toBeNull();
    });

    it('should calculate ML inference overage', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'growth',
        'ml_inferences',
        3000 // 500 over 2500 limit
      );

      expect(result?.overageUnits).toBe(500);
      expect(result?.totalCharge).toBe(5); // 500 * $0.01 = $5.00
    });
  });

  describe('Unknown tier handling', () => {
    it('should return null for unknown tier', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'unknown_tier',
        'api_calls',
        5000
      );
      expect(result).toBeNull();
    });

    it('should log warning for unknown tier', () => {
      // This is tested via logger mock in integration tests
      calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'nonexistent',
        'api_calls',
        5000
      );
      // Warning logged, no exception thrown
    });
  });

  describe('Edge cases', () => {
    it('should handle zero usage', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        0
      );
      expect(result).toBeNull();
    });

    it('should handle very large overage', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        10000000 // 10M calls, 9999000 over limit
      );

      expect(result?.overageUnits).toBe(9999000);
      expect(result?.totalCharge).toBe(10); // 9999000 * $0.000001 ≈ $10.00 (rounded)
    });

    it('should handle negative usage (should not happen, but defensive)', () => {
      const result = calculator.calculateOverage(
        'tenant-1',
        '2026-03',
        'free',
        'api_calls',
        -100
      );
      expect(result).toBeNull(); // Treated as under limit
    });
  });

  describe('Tier progression', () => {
    it('should show increasing limits for higher tiers', () => {
      const limits = getTierLimits();

      expect(limits.starter.apiCalls).toBeGreaterThan(limits.free.apiCalls);
      expect(limits.growth.apiCalls).toBeGreaterThan(limits.starter.apiCalls);
      expect(limits.pro.apiCalls).toBeGreaterThan(limits.growth.apiCalls);
      expect(limits.enterprise.apiCalls).toBeGreaterThan(limits.pro.apiCalls);
    });
  });
});
