import { AdvancedMetricsCalculator } from '../../src/backtest/AdvancedMetricsCalculator';

describe('AdvancedMetricsCalculator', () => {
  describe('calculateMetrics', () => {
    it('should calculate all advanced metrics', () => {
      // Create sample trades
      const trades = [
        { entryPrice: 50000, exitPrice: 50200, entryTime: Date.now(), exitTime: Date.now() + 1000, profit: 20, profitPercent: 0.4, positionSize: 1, fees: 1 },
        { entryPrice: 50200, exitPrice: 50100, entryTime: Date.now(), exitTime: Date.now() + 1000, profit: -10, profitPercent: -0.2, positionSize: 1, fees: 1 },
        { entryPrice: 50100, exitPrice: 50300, entryTime: Date.now(), exitTime: Date.now() + 1000, profit: 20, profitPercent: 0.4, positionSize: 1, fees: 1 }
      ];

      // Create sample equity curve
      const equityCurve = [10000, 10020, 10010, 10030];

      const metrics = AdvancedMetricsCalculator.calculateMetrics(trades, equityCurve);

      expect(metrics).toBeDefined();
      expect(metrics.totalReturn).toBeDefined();
      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.sortinoRatio).toBeDefined();
      expect(metrics.calmarRatio).toBeDefined();
      expect(metrics.maxDrawdown).toBeDefined();
      expect(metrics.winRate).toBeDefined();
      expect(metrics.profitFactor).toBeDefined();
    });

    it('should handle empty trades array', () => {
      const metrics = AdvancedMetricsCalculator.calculateMetrics([], [10000], 0.02);

      expect(metrics.totalReturn).toBe(0);
      expect(metrics.sharpeRatio).toBe(0);
      expect(metrics.winRate).toBe(0);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should calculate max drawdown correctly', () => {
      const equityCurve = [10000, 10100, 10200, 10000, 9900, 10300, 10100];

      // Call the private method by accessing it through the class prototype
      const maxDrawdown = (AdvancedMetricsCalculator as any).calculateMaxDrawdown(equityCurve);

      expect(maxDrawdown).toBeGreaterThan(0);
    });
  });
});