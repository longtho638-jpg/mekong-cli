/**
 * Tests for ParameterTuner
 */

import { ParameterTuner, PerformanceMetrics } from './ParameterTuner';

describe('ParameterTuner', () => {
  let tuner: ParameterTuner;
  const baseConfig = {
    baseBankroll: 10000,
    baseEdgeThreshold: 0.05,
    basePositionPercent: 25,
    volatilitySensitivity: 0.5,
  };

  beforeEach(() => {
    tuner = new ParameterTuner(baseConfig);
  });

  describe('constructor', () => {
    it('should initialize with default config values', () => {
      const defaultTuner = new ParameterTuner({ baseBankroll: 5000 });
      expect(defaultTuner).toBeDefined();
    });
  });

  describe('setBankroll', () => {
    it('should update bankroll', () => {
      tuner.setBankroll(20000);
      tuner.recordTrade('test', 100);
      tuner.recordTrade('test', -50);

      const result = tuner.getDynamicParams('test');
      expect(result.maxPositionSize).toBeGreaterThan(0);
    });

    it('should throw error for non-positive bankroll', () => {
      expect(() => tuner.setBankroll(0)).toThrow('Bankroll must be positive');
    });
  });

  describe('recordTrade', () => {
    it('should record trades for Kelly calculation', () => {
      tuner.recordTrade('strategy1', 100);
      tuner.recordTrade('strategy1', -50);

      const params = tuner.getDynamicParams('strategy1');
      expect(params).toBeDefined();
    });
  });

  describe('updateMetrics and getMetrics', () => {
    it('should store and retrieve performance metrics', () => {
      const metrics: PerformanceMetrics = {
        strategyId: 'test',
        winRate: 0.6,
        sharpeRatio: 1.5,
        totalPnl: 500,
        tradesCount: 50,
        avgDrawdown: 0.05,
        lastUpdated: Date.now(),
      };

      tuner.updateMetrics(metrics);
      const retrieved = tuner.getMetrics('test');

      expect(retrieved).toBeDefined();
      expect(retrieved?.winRate).toBe(0.6);
      expect(retrieved?.sharpeRatio).toBe(1.5);
    });

    it('should return null for unknown strategy', () => {
      const metrics = tuner.getMetrics('unknown');
      expect(metrics).toBeNull();
    });
  });

  describe('setMarketVolatility and getVolatilityRegime', () => {
    it('should classify volatility regimes correctly', () => {
      expect(tuner.getVolatilityRegime('market1', 0.5)).toBe('low');
      expect(tuner.getVolatilityRegime('market1', 2.0)).toBe('normal');
      expect(tuner.getVolatilityRegime('market1', 4.0)).toBe('high');
      expect(tuner.getVolatilityRegime('market1', 8.0)).toBe('extreme');
    });

    it('should use stored market volatility', () => {
      tuner.setMarketVolatility('market1', 5.0);
      expect(tuner.getVolatilityRegime('market1')).toBe('high');
    });

    it('should throw error for negative volatility', () => {
      expect(() => tuner.setMarketVolatility('market1', -1)).toThrow('Volatility must be non-negative');
    });
  });

  describe('calculateVolatilityMultiplier', () => {
    it('should return 1.0 for normal volatility', () => {
      const multiplier = tuner.calculateVolatilityMultiplier('market1', 2.0);
      expect(multiplier).toBeCloseTo(1.0, 2);
    });

    it('should reduce multiplier for high volatility', () => {
      const multiplier = tuner.calculateVolatilityMultiplier('market1', 6.0);
      expect(multiplier).toBeLessThan(1.0);
    });

    it('should increase multiplier for low volatility', () => {
      const multiplier = tuner.calculateVolatilityMultiplier('market1', 0.5);
      expect(multiplier).toBeGreaterThan(1.0);
    });

    it('should clamp multiplier to range [0.3, 1.5]', () => {
      const lowVol = tuner.calculateVolatilityMultiplier('market1', 0.1);
      const highVol = tuner.calculateVolatilityMultiplier('market1', 20.0);

      expect(lowVol).toBeLessThanOrEqual(1.5);
      expect(highVol).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe('getDynamicParams', () => {
    it('should return base params for unknown strategy', () => {
      const params = tuner.getDynamicParams('unknown');

      expect(params.minEdgeThreshold).toBeCloseTo(0.05, 2);
      expect(params.maxPositionSize).toBeGreaterThan(0);
      expect(params.positionMultiplier).toBe(1.0);
      expect(params.leverageAdjustment).toBe(1.0);
    });

    it('should adjust edge threshold based on Sharpe ratio', () => {
      tuner.updateMetrics({
        strategyId: 'highSharpe',
        winRate: 0.6,
        sharpeRatio: 2.0, // High Sharpe
        totalPnl: 1000,
        tradesCount: 100,
        avgDrawdown: 0.02,
        lastUpdated: Date.now(),
      });

      const params = tuner.getDynamicParams('highSharpe');
      expect(params.minEdgeThreshold).toBeLessThan(0.05); // Lower threshold for good performance
    });

    it('should apply volatility adjustment to position size', () => {
      tuner.setMarketVolatility('volatile', 8.0); // Extreme volatility
      tuner.recordTrade('test', 100);
      tuner.recordTrade('test', -50);

      const params = tuner.getDynamicParams('test', 'volatile');
      expect(params.positionMultiplier).toBeLessThan(1.0);
    });

    it('should adjust leverage based on volatility regime', () => {
      tuner.setMarketVolatility('extreme', 10.0);
      const params = tuner.getDynamicParams('test', 'extreme');

      expect(params.leverageAdjustment).toBe(0.4); // Extreme = 0.4
    });
  });

  describe('manual overrides', () => {
    it('should apply manual override', () => {
      tuner.setManualOverride({
        strategyId: 'test',
        minEdgeThreshold: 0.1,
        maxPositionSize: 5000,
        positionMultiplier: 0.8,
      });

      const params = tuner.getDynamicParams('test');

      expect(params.minEdgeThreshold).toBe(0.1);
      expect(params.maxPositionSize).toBe(5000);
      expect(params.positionMultiplier).toBe(0.8);
    });

    it('should respect override expiry', () => {
      const expiredTime = Date.now() - 10000; // 10 seconds ago
      tuner.setManualOverride({
        strategyId: 'test',
        minEdgeThreshold: 0.1,
        expiresAt: expiredTime,
      });

      const params = tuner.getDynamicParams('test');
      expect(params.minEdgeThreshold).not.toBe(0.1); // Should use default
    });

    it('should clear manual override', () => {
      tuner.setManualOverride({
        strategyId: 'test',
        minEdgeThreshold: 0.1,
      });

      tuner.clearManualOverride('test');

      const params = tuner.getDynamicParams('test');
      expect(params.minEdgeThreshold).toBeCloseTo(0.05, 2); // Back to default
    });

    it('should return all active overrides', () => {
      tuner.setManualOverride({ strategyId: 'test1', minEdgeThreshold: 0.1 });
      tuner.setManualOverride({ strategyId: 'test2', maxPositionSize: 1000 });

      const overrides = tuner.getManualOverrides();
      expect(overrides.length).toBe(2);
    });
  });

  describe('getTuningRecommendations', () => {
    it('should recommend more aggressive params for strong performance', () => {
      tuner.updateMetrics({
        strategyId: 'strong',
        winRate: 0.65,
        sharpeRatio: 2.0,
        totalPnl: 2000,
        tradesCount: 100,
        avgDrawdown: 0.02,
        lastUpdated: Date.now(),
      });

      const rec = tuner.getTuningRecommendations('strong');

      expect(rec.recommended.minEdgeThreshold).toBeLessThan(rec.current.minEdgeThreshold);
      expect(rec.recommended.maxPositionSize).toBeGreaterThan(rec.current.maxPositionSize);
      expect(rec.reason).toContain('Strong performance');
    });

    it('should recommend conservative params for weak performance', () => {
      tuner.updateMetrics({
        strategyId: 'weak',
        winRate: 0.35,
        sharpeRatio: -0.5,
        totalPnl: -500,
        tradesCount: 50,
        avgDrawdown: 0.15,
        lastUpdated: Date.now(),
      });

      const rec = tuner.getTuningRecommendations('weak');

      expect(rec.recommended.minEdgeThreshold).toBeGreaterThan(rec.current.minEdgeThreshold);
      expect(rec.recommended.maxPositionSize).toBeLessThan(rec.current.maxPositionSize);
      expect(rec.reason).toContain('Weak performance');
    });

    it('should return no significant signals for neutral performance', () => {
      tuner.updateMetrics({
        strategyId: 'neutral',
        winRate: 0.5,
        sharpeRatio: 0.8,
        totalPnl: 100,
        tradesCount: 30,
        avgDrawdown: 0.05,
        lastUpdated: Date.now(),
      });

      const rec = tuner.getTuningRecommendations('neutral');
      expect(rec.reason).toContain('No significant performance signals');
    });
  });

  describe('reset', () => {
    it('should clear all cached data', () => {
      tuner.recordTrade('test', 100);
      tuner.updateMetrics({
        strategyId: 'test',
        winRate: 0.5,
        sharpeRatio: 1.0,
        totalPnl: 100,
        tradesCount: 10,
        avgDrawdown: 0.05,
        lastUpdated: Date.now(),
      });
      tuner.setManualOverride({ strategyId: 'test', minEdgeThreshold: 0.1 });
      tuner.setMarketVolatility('market1', 3.0);

      tuner.reset();

      expect(tuner.getMetrics('test')).toBeNull();
      expect(tuner.getManualOverrides().length).toBe(0);
    });
  });
});
