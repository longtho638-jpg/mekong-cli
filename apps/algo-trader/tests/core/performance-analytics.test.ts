/**
 * Tests for PerformanceAnalytics
 */

import { PerformanceAnalytics, ReturnSeries } from '../../src/core/performance-analytics';

describe('PerformanceAnalytics', () => {
  let analytics: PerformanceAnalytics;

  beforeEach(() => {
    analytics = new PerformanceAnalytics();
  });

  const createSampleSeries = (): ReturnSeries => ({
    timestamps: [1, 2, 3, 4, 5].map(d => d * 86400000),
    returns: [0.01, -0.02, 0.03, -0.01, 0.02],
    values: [100, 101, 99, 102, 101, 103],
  });

  describe('calculateSharpe', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.015];
      const sharpe = analytics.calculateSharpe(returns);

      expect(sharpe).toBeDefined();
      expect(typeof sharpe).toBe('number');
    });

    it('should return 0 for insufficient data', () => {
      const sharpe = analytics.calculateSharpe([0.01]);
      expect(sharpe).toBe(0);
    });
  });

  describe('calculateSortino', () => {
    it('should calculate Sortino ratio correctly', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
      const sortino = analytics.calculateSortino(returns);

      expect(sortino).toBeDefined();
      expect(typeof sortino).toBe('number');
    });

    it('should return capped value when no negative returns', () => {
      const returns = [0.01, 0.02, 0.03];
      const sortino = analytics.calculateSortino(returns);
      expect(sortino).toBe(3);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should calculate maximum drawdown from peak', () => {
      const values = [100, 110, 120, 110, 100, 90, 95];
      const maxDD = analytics.calculateMaxDrawdown(values);

      // Peak is 120, trough is 90, drawdown = (120-90)/120 = 0.25
      expect(maxDD).toBeCloseTo(0.25, 2);
    });

    it('should return 0 for monotonically increasing values', () => {
      const values = [100, 110, 120, 130, 140];
      const maxDD = analytics.calculateMaxDrawdown(values);
      expect(maxDD).toBe(0);
    });
  });

  describe('calculateCalmar', () => {
    it('should calculate Calmar ratio', () => {
      const series = createSampleSeries();
      const calmar = analytics.calculateCalmar(series.returns, series.values);

      expect(calmar).toBeDefined();
      expect(typeof calmar).toBe('number');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics at once', () => {
      const series = createSampleSeries();
      const metrics = analytics.calculateMetrics(series);

      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.sortinoRatio).toBeDefined();
      expect(metrics.calmarRatio).toBeDefined();
      expect(metrics.totalReturn).toBeDefined();
      expect(metrics.maxDrawdown).toBeDefined();
      expect(metrics.volatility).toBeDefined();
    });

    it('should return empty metrics for insufficient data', () => {
      const series: ReturnSeries = {
        timestamps: [1],
        returns: [0.01],
        values: [100],
      };
      const metrics = analytics.calculateMetrics(series);

      expect(metrics.sharpeRatio).toBe(0);
      expect(metrics.totalReturn).toBe(0);
    });
  });

  describe('calculateSkewness', () => {
    it('should calculate skewness', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02, 0.04, -0.03];
      const skewness = analytics.calculateSkewness(returns);
      expect(typeof skewness).toBe('number');
    });
  });

  describe('calculateKurtosis', () => {
    it('should calculate kurtosis', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02, 0.04, -0.03, 0.05];
      const kurtosis = analytics.calculateKurtosis(returns);
      expect(typeof kurtosis).toBe('number');
    });
  });

  describe('getMetricsForPeriod', () => {
    it('should filter by lookback period', () => {
      const now = Date.now();
      const series: ReturnSeries = {
        timestamps: [now - 100 * 86400000, now - 50 * 86400000, now - 10 * 86400000, now],
        returns: [0.01, -0.02, 0.03, 0.01],
        values: [100, 101, 99, 102, 103],
      };

      const metrics7d = analytics.getMetricsForPeriod(series, 7);
      const metrics30d = analytics.getMetricsForPeriod(series, 30);

      // Both should return valid metrics (may be empty if data is outside range)
      expect(metrics7d).toBeDefined();
      expect(metrics30d).toBeDefined();
    });
  });
});
