/**
 * Leverage Caps Tests
 * Tests for checkLeverageCap() function across all tier levels
 */

import { describe, test, expect } from '@jest/globals';
import {
  checkLeverageCap,
  TIER_LEVERAGE_CAPS,
  LeverageCheckResult,
} from '../../src/execution/max-order-limits';

describe('Leverage Caps (Phase 6 Ghost Protocol)', () => {
  describe('TIER_LEVERAGE_CAPS constant', () => {
    test('should define free tier cap at 1x', () => {
      expect(TIER_LEVERAGE_CAPS.free).toBe(1);
    });

    test('should define pro tier cap at 10x', () => {
      expect(TIER_LEVERAGE_CAPS.pro).toBe(10);
    });

    test('should define enterprise tier cap at 20x', () => {
      expect(TIER_LEVERAGE_CAPS.enterprise).toBe(20);
    });

    test('should have exactly 3 tiers defined', () => {
      const tiers = Object.keys(TIER_LEVERAGE_CAPS);
      expect(tiers.length).toBe(3);
      expect(tiers.sort()).toEqual(['enterprise', 'free', 'pro']);
    });
  });

  describe('checkLeverageCap - FREE tier', () => {
    test('should pass when leverage equals 1x', () => {
      const result = checkLeverageCap(1, 'free');
      expect(result.passed).toBe(true);
      expect(result.rejectedReason).toBeUndefined();
      expect(result.requestedLeverage).toBe(1);
      expect(result.maxAllowed).toBe(1);
      expect(result.tier).toBe('free');
    });

    test('should reject when leverage exceeds 1x', () => {
      const result = checkLeverageCap(2, 'free');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('exceeds');
      expect(result.rejectedReason?.toUpperCase()).toContain('FREE');
      expect(result.requestedLeverage).toBe(2);
      expect(result.maxAllowed).toBe(1);
    });

    test('should reject high leverage on free tier', () => {
      const result = checkLeverageCap(10, 'free');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('10x');
      expect(result.rejectedReason).toContain('1x');
    });

    test('should handle case-insensitive tier name (FREE)', () => {
      const result = checkLeverageCap(1, 'FREE');
      expect(result.passed).toBe(true);
      expect(result.tier).toBe('free');
    });

    test('should handle mixed case tier name (FrEe)', () => {
      const result = checkLeverageCap(1, 'FrEe');
      expect(result.passed).toBe(true);
      expect(result.tier).toBe('free');
    });
  });

  describe('checkLeverageCap - PRO tier', () => {
    test('should pass when leverage equals 10x', () => {
      const result = checkLeverageCap(10, 'pro');
      expect(result.passed).toBe(true);
      expect(result.requestedLeverage).toBe(10);
      expect(result.maxAllowed).toBe(10);
    });

    test('should pass when leverage is less than 10x', () => {
      const result = checkLeverageCap(5, 'pro');
      expect(result.passed).toBe(true);
      expect(result.maxAllowed).toBe(10);
    });

    test('should reject when leverage exceeds 10x', () => {
      const result = checkLeverageCap(11, 'pro');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('11x');
      expect(result.rejectedReason).toContain('10x');
    });

    test('should reject 20x leverage on pro tier', () => {
      const result = checkLeverageCap(20, 'pro');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('exceeds');
    });

    test('should handle case-insensitive tier name (PRO)', () => {
      const result = checkLeverageCap(10, 'PRO');
      expect(result.passed).toBe(true);
      expect(result.tier).toBe('pro');
    });

    test('should allow 1x leverage on pro tier', () => {
      const result = checkLeverageCap(1, 'pro');
      expect(result.passed).toBe(true);
      expect(result.maxAllowed).toBe(10);
    });

    test('should allow fractional leverage (2.5x) on pro tier', () => {
      const result = checkLeverageCap(2.5, 'pro');
      expect(result.passed).toBe(true);
      expect(result.requestedLeverage).toBe(2.5);
    });
  });

  describe('checkLeverageCap - ENTERPRISE tier', () => {
    test('should pass when leverage equals 20x', () => {
      const result = checkLeverageCap(20, 'enterprise');
      expect(result.passed).toBe(true);
      expect(result.requestedLeverage).toBe(20);
      expect(result.maxAllowed).toBe(20);
    });

    test('should pass when leverage is less than 20x', () => {
      const result = checkLeverageCap(15, 'enterprise');
      expect(result.passed).toBe(true);
      expect(result.maxAllowed).toBe(20);
    });

    test('should reject when leverage exceeds 20x', () => {
      const result = checkLeverageCap(21, 'enterprise');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('21x');
      expect(result.rejectedReason).toContain('20x');
    });

    test('should reject extreme leverage on enterprise tier', () => {
      const result = checkLeverageCap(100, 'enterprise');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('100x');
    });

    test('should handle case-insensitive tier name (ENTERPRISE)', () => {
      const result = checkLeverageCap(20, 'ENTERPRISE');
      expect(result.passed).toBe(true);
      expect(result.tier).toBe('enterprise');
    });

    test('should allow all lower tier leverages on enterprise', () => {
      const testCases = [1, 2, 5, 10, 15, 20];
      testCases.forEach(leverage => {
        const result = checkLeverageCap(leverage, 'enterprise');
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('checkLeverageCap - Unknown tier (default to FREE)', () => {
    test('should default to FREE tier when tier is unknown', () => {
      const result = checkLeverageCap(1, 'unknown');
      expect(result.maxAllowed).toBe(1);
      expect(result.tier).toBe('unknown');
    });

    test('should reject leverage > 1x for unknown tier', () => {
      const result = checkLeverageCap(2, 'unknown');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('exceeds');
    });

    test('should handle empty string tier as unknown', () => {
      const result = checkLeverageCap(1, '');
      expect(result.maxAllowed).toBe(1);
    });

    test('should handle null-like tier string', () => {
      const result = checkLeverageCap(1, 'null');
      expect(result.maxAllowed).toBe(1);
    });
  });

  describe('checkLeverageCap - Edge cases', () => {
    test('should pass leverage of exactly 1x on any tier', () => {
      const tiers = ['free', 'pro', 'enterprise', 'unknown'];
      tiers.forEach(tier => {
        const result = checkLeverageCap(1, tier);
        expect(result.passed).toBe(true);
      });
    });

    test('should handle very small positive leverage', () => {
      const result = checkLeverageCap(0.1, 'pro');
      expect(result.passed).toBe(true);
      expect(result.requestedLeverage).toBe(0.1);
    });

    test('should handle decimal leverage (3.5x)', () => {
      const result = checkLeverageCap(3.5, 'pro');
      expect(result.passed).toBe(true);
    });

    test('should return correct result structure', () => {
      const result = checkLeverageCap(5, 'pro');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('requestedLeverage');
      expect(result).toHaveProperty('maxAllowed');
      expect(result).toHaveProperty('tier');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.requestedLeverage).toBe('number');
      expect(typeof result.maxAllowed).toBe('number');
      expect(typeof result.tier).toBe('string');
    });

    test('should include rejection reason when failed', () => {
      const result = checkLeverageCap(100, 'free');
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toBeDefined();
      expect(typeof result.rejectedReason).toBe('string');
      expect(result.rejectedReason!.length).toBeGreaterThan(0);
    });

    test('should not include rejection reason when passed', () => {
      const result = checkLeverageCap(5, 'pro');
      expect(result.passed).toBe(true);
      expect(result.rejectedReason).toBeUndefined();
    });
  });

  describe('checkLeverageCap - Comparison across tiers', () => {
    test('should enforce stricter limits for lower tiers', () => {
      // Test leverage = 5
      const freeResult = checkLeverageCap(5, 'free');
      const proResult = checkLeverageCap(5, 'pro');
      const enterpriseResult = checkLeverageCap(5, 'enterprise');

      expect(freeResult.passed).toBe(false);
      expect(proResult.passed).toBe(true);
      expect(enterpriseResult.passed).toBe(true);
    });

    test('should enforce stricter limits for pro vs enterprise', () => {
      // Test leverage = 15
      const proResult = checkLeverageCap(15, 'pro');
      const enterpriseResult = checkLeverageCap(15, 'enterprise');

      expect(proResult.passed).toBe(false);
      expect(enterpriseResult.passed).toBe(true);
    });

    test('should have maxAllowed in ascending tier order', () => {
      const freeResult = checkLeverageCap(1, 'free');
      const proResult = checkLeverageCap(1, 'pro');
      const enterpriseResult = checkLeverageCap(1, 'enterprise');

      expect(freeResult.maxAllowed).toBe(1);
      expect(proResult.maxAllowed).toBe(10);
      expect(enterpriseResult.maxAllowed).toBe(20);
      expect(freeResult.maxAllowed < proResult.maxAllowed).toBe(true);
      expect(proResult.maxAllowed < enterpriseResult.maxAllowed).toBe(true);
    });
  });

  describe('checkLeverageCap - Error messages', () => {
    test('should include leverage value in rejection reason', () => {
      const result = checkLeverageCap(25, 'pro');
      expect(result.rejectedReason).toContain('25x');
    });

    test('should include tier name in rejection reason', () => {
      const result = checkLeverageCap(15, 'pro');
      expect(result.rejectedReason).toContain('PRO');
    });

    test('should include max allowed in rejection reason', () => {
      const result = checkLeverageCap(15, 'pro');
      expect(result.rejectedReason).toContain('10x');
    });

    test('should have descriptive rejection message for free tier', () => {
      const result = checkLeverageCap(2, 'free');
      expect(result.rejectedReason).toMatch(/exceeds.*maximum/i);
    });

    test('should have descriptive rejection message for pro tier', () => {
      const result = checkLeverageCap(50, 'pro');
      expect(result.rejectedReason).toMatch(/exceeds.*maximum/i);
    });

    test('should have descriptive rejection message for enterprise tier', () => {
      const result = checkLeverageCap(100, 'enterprise');
      expect(result.rejectedReason).toMatch(/exceeds.*maximum/i);
    });
  });

  describe('checkLeverageCap - Type safety', () => {
    test('should accept number type for leverage', () => {
      const result = checkLeverageCap(5, 'pro');
      expect(result.requestedLeverage).toEqual(5);
    });

    test('should accept string type for tier', () => {
      const result = checkLeverageCap(5, 'pro');
      expect(result.tier).toBe('pro');
    });

    test('should return LeverageCheckResult interface', () => {
      const result: LeverageCheckResult = checkLeverageCap(5, 'pro');
      expect(result).toBeDefined();
      expect('passed' in result).toBe(true);
      expect('requestedLeverage' in result).toBe(true);
      expect('maxAllowed' in result).toBe(true);
      expect('tier' in result).toBe(true);
    });
  });
});
