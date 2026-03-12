/**
 * Tests for KellyCriterionCalculator
 */

import { KellyCriterionCalculator, KellyConfig } from './KellyCriterionCalculator';

describe('KellyCriterionCalculator', () => {
  let calculator: KellyCriterionCalculator;
  const initialPortfolioValue = 10000;

  beforeEach(() => {
    calculator = new KellyCriterionCalculator(initialPortfolioValue);
  });

  describe('constructor', () => {
    it('should throw error for non-positive portfolio value', () => {
      expect(() => new KellyCriterionCalculator(0)).toThrow('Portfolio value must be positive');
      expect(() => new KellyCriterionCalculator(-100)).toThrow('Portfolio value must be positive');
    });

    it('should initialize with valid portfolio value', () => {
      expect(calculator).toBeDefined();
    });
  });

  describe('setPortfolioValue', () => {
    it('should update portfolio value', () => {
      calculator.setPortfolioValue(20000);
      const result = calculator.calculateKelly(0.55, 2.0, undefined, { maxPercent: 50 });
      expect(result.positionSize).toBeGreaterThan(0);
    });

    it('should throw error for non-positive value', () => {
      expect(() => calculator.setPortfolioValue(0)).toThrow('Portfolio value must be positive');
    });
  });

  describe('recordTrade and getWinLossStats', () => {
    it('should record trades and calculate stats correctly', () => {
      // Record 5 wins and 5 losses
      for (let i = 0; i < 5; i++) {
        calculator.recordTrade('strategy1', 100); // Win
      }
      for (let i = 0; i < 5; i++) {
        calculator.recordTrade('strategy1', -50); // Loss
      }

      const stats = calculator.getWinLossStats('strategy1');

      expect(stats.totalTrades).toBe(10);
      expect(stats.wins).toBe(5);
      expect(stats.losses).toBe(5);
      expect(stats.winRate).toBe(0.5);
      expect(stats.avgWin).toBe(100);
      expect(stats.avgLoss).toBe(50);
      expect(stats.avgWinLossRatio).toBe(2.0); // 100/50
    });

    it('should return zeros for unknown strategy', () => {
      const stats = calculator.getWinLossStats('unknown');
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.avgWinLossRatio).toBe(0);
    });

    it('should handle mixed PnL values', () => {
      calculator.recordTrade('strategy1', 200);
      calculator.recordTrade('strategy1', -100);
      calculator.recordTrade('strategy1', 150);

      const stats = calculator.getWinLossStats('strategy1');
      expect(stats.totalTrades).toBe(3);
      expect(stats.wins).toBe(2);
      expect(stats.winRate).toBeCloseTo(2 / 3, 4);
    });
  });

  describe('calculateKelly', () => {
    it('should calculate Kelly using formula f* = (bp - q) / b', () => {
      // With winRate=0.55, winLossRatio=2.0:
      // f* = p - q/b = 0.55 - 0.45/2 = 0.55 - 0.225 = 0.325 (full Kelly)
      const result = calculator.calculateKelly(0.55, 2.0);

      expect(result.fullKelly).toBeCloseTo(32.5, 1); // 32.5%
    });

    it('should apply fractional Kelly', () => {
      const result = calculator.calculateKelly(0.55, 2.0, undefined, {
        fraction: 0.25, // Quarter Kelly
        maxPercent: 50,
      });

      // Full Kelly is 32.5%, quarter Kelly is ~8.125%
      expect(result.adjustedKelly).toBeLessThan(result.fullKelly);
      expect(result.adjustedKelly).toBeCloseTo(8.125, 1);
    });

    it('should apply max position cap', () => {
      const result = calculator.calculateKelly(0.6, 3.0, undefined, {
        fraction: 1.0, // Full Kelly
        maxPercent: 10, // Cap at 10%
      });

      expect(result.adjustedKelly).toBeLessThanOrEqual(10);
    });

    it('should return zero for negative edge', () => {
      // With winRate=0.3, winLossRatio=1.0:
      // f* = 0.3 - 0.7/1 = -0.4 (negative, should clamp to 0)
      const result = calculator.calculateKelly(0.3, 1.0);

      expect(result.fullKelly).toBe(0);
      expect(result.positionSize).toBe(0);
    });

    it('should throw error for invalid win rate', () => {
      expect(() => calculator.calculateKelly(-0.1, 2.0)).toThrow('Win rate must be between 0 and 1');
      expect(() => calculator.calculateKelly(1.5, 2.0)).toThrow('Win rate must be between 0 and 1');
    });

    it('should throw error for negative win/loss ratio', () => {
      expect(() => calculator.calculateKelly(0.5, -1.0)).toThrow('Win/loss ratio must be non-negative');
    });

    it('should handle zero win/loss ratio gracefully', () => {
      const result = calculator.calculateKelly(0.5, 0);
      expect(result.fullKelly).toBe(0);
    });
  });

  describe('calculateKellyForStrategy', () => {
    it('should calculate Kelly based on strategy history', () => {
      // Record trades with 60% win rate and 2:1 win/loss
      for (let i = 0; i < 6; i++) {
        calculator.recordTrade('test', 200);
      }
      for (let i = 0; i < 4; i++) {
        calculator.recordTrade('test', -100);
      }

      const result = calculator.calculateKellyForStrategy('test');

      expect(result.isReliable).toBe(false); // Only 10 trades, need 20
      expect(result.fullKelly).toBeGreaterThan(0);
    });

    it('should return zero for strategy with no trades', () => {
      const result = calculator.calculateKellyForStrategy('empty');
      expect(result.fullKelly).toBe(0);
      expect(result.adjustedKelly).toBe(0);
      expect(result.positionSize).toBe(0);
      expect(result.isReliable).toBe(false);
    });

    it('should respect minTrades config', () => {
      for (let i = 0; i < 10; i++) {
        calculator.recordTrade('test', 100);
      }

      const result = calculator.calculateKellyForStrategy('test', { minTrades: 5 });
      expect(result.isReliable).toBe(true); // 10 >= 5
    });
  });

  describe('getAggregateStats', () => {
    it('should aggregate stats across all strategies', () => {
      calculator.recordTrade('strategy1', 100);
      calculator.recordTrade('strategy1', -50);
      calculator.recordTrade('strategy2', 200);
      calculator.recordTrade('strategy2', -100);

      const stats = calculator.getAggregateStats();

      expect(stats.totalTrades).toBe(4);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(2);
    });

    it('should return zeros for empty history', () => {
      const stats = calculator.getAggregateStats();
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toBe(0);
    });
  });

  describe('getPositionSize', () => {
    it('should return position size based on Kelly', () => {
      calculator.recordTrade('test', 100);
      calculator.recordTrade('test', -50);

      const size = calculator.getPositionSize('test');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history when no strategy specified', () => {
      calculator.recordTrade('strategy1', 100);
      calculator.recordTrade('strategy2', 200);

      calculator.clearHistory();

      const stats1 = calculator.getWinLossStats('strategy1');
      const stats2 = calculator.getWinLossStats('strategy2');

      expect(stats1.totalTrades).toBe(0);
      expect(stats2.totalTrades).toBe(0);
    });

    it('should clear only specified strategy history', () => {
      calculator.recordTrade('strategy1', 100);
      calculator.recordTrade('strategy2', 200);

      calculator.clearHistory('strategy1');

      const stats1 = calculator.getWinLossStats('strategy1');
      const stats2 = calculator.getWinLossStats('strategy2');

      expect(stats1.totalTrades).toBe(0);
      expect(stats2.totalTrades).toBe(1);
    });
  });
});
