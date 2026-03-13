/**
 * Tests for SharpeCalculator — Live risk-adjusted return metrics.
 */

import { SharpeCalculator, SharpeResult } from './sharpe-calculator';

describe('SharpeCalculator', () => {
  let calculator: SharpeCalculator;

  beforeEach(() => {
    calculator = new SharpeCalculator({
      riskFreeRate: 0.045, // 4.5% APY
      tradingDaysPerYear: 252,
    });
  });

  describe('constructor', () => {
    it('should use default config when no options provided', () => {
      const defaultCalc = new SharpeCalculator();
      expect(defaultCalc).toBeDefined();
    });

    it('should accept custom config', () => {
      const customCalc = new SharpeCalculator({
        riskFreeRate: 0.05,
        tradingDaysPerYear: 252,
      });
      expect(customCalc).toBeDefined();
    });
  });

  describe('calculate', () => {
    it('should return empty result for insufficient data', () => {
      const result = calculator.calculate([0.01]);

      expect(result.sharpeRatio).toBe(0);
      expect(result.sortinoRatio).toBe(0);
      expect(result.calmarRatio).toBe(0);
    });

    it('should calculate metrics from returns array', () => {
      const returns = [0.01, -0.005, 0.02, 0.015, -0.01, 0.008];
      const result = calculator.calculate(returns);

      expect(result).toHaveProperty('sharpeRatio');
      expect(result).toHaveProperty('sortinoRatio');
      expect(result).toHaveProperty('calmarRatio');
      expect(result).toHaveProperty('annualizedReturn');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('maxDrawdown');
      expect(result).toHaveProperty('downsideDeviation');
    });

    it('should calculate metrics with values array for drawdown', () => {
      const returns = [0.01, -0.005, 0.02, 0.015, -0.01, 0.008];
      const values = [10000, 10100, 10050, 10250, 10400, 10300, 10380];
      const result = calculator.calculate(returns, values);

      expect(result.maxDrawdown).toBeGreaterThan(0);
      expect(result.maxDrawdown).toBeLessThan(0.02); // Should be small for this data
    });

    it('should handle all positive returns', () => {
      const returns = [0.01, 0.02, 0.015, 0.008, 0.012];
      const result = calculator.calculate(returns);

      expect(result.sortinoRatio).toBeGreaterThan(2); // High Sortino when no losses
      expect(result.sharpeRatio).toBeGreaterThan(0);
    });

    it('should handle all negative returns', () => {
      const returns = [-0.01, -0.02, -0.015, -0.008, -0.012];
      const result = calculator.calculate(returns);

      expect(result.sharpeRatio).toBeLessThan(0);
      expect(result.sortinoRatio).toBeLessThan(0);
    });
  });

  describe('calculateSharpe', () => {
    it('should return 0 for single element', () => {
      expect(calculator.calculateSharpe([0.01])).toBe(0);
    });

    it('should return 0 for zero volatility', () => {
      expect(calculator.calculateSharpe([0.01, 0.01, 0.01, 0.01])).toBe(0);
    });

    it('should calculate positive Sharpe for positive returns', () => {
      const returns = [0.02, 0.015, 0.018, 0.022, 0.019];
      const sharpe = calculator.calculateSharpe(returns);

      expect(sharpe).toBeGreaterThan(0);
      expect(sharpe).toBeGreaterThan(1); // Should be high for consistent positive returns
    });

    it('should calculate negative Sharpe for negative returns', () => {
      const returns = [-0.02, -0.015, -0.018, -0.022, -0.019];
      const sharpe = calculator.calculateSharpe(returns);

      expect(sharpe).toBeLessThan(0);
    });
  });

  describe('calculateSortino', () => {
    it('should return 0 for single element', () => {
      expect(calculator.calculateSortino([0.01])).toBe(0);
    });

    it('should return high value when no negative returns', () => {
      const returns = [0.01, 0.02, 0.015, 0.008];
      const sortino = calculator.calculateSortino(returns);

      expect(sortino).toBeGreaterThanOrEqual(3);
    });

    it('should calculate Sortino with mixed returns', () => {
      const returns = [0.02, -0.01, 0.015, -0.005, 0.01];
      const sortino = calculator.calculateSortino(returns);

      expect(sortino).toBeDefined();
      expect(typeof sortino).toBe('number');
    });
  });

  describe('calculateCalmar', () => {
    it('should return 0 for insufficient values', () => {
      expect(calculator.calculateCalmar([0.01], [100])).toBe(0);
    });

    it('should return 0 when no drawdown', () => {
      const returns = [0.01, 0.01, 0.01];
      const values = [100, 101, 102.01, 103.03];
      const calmar = calculator.calculateCalmar(returns, values);

      // With strictly increasing values, drawdown is 0, so Calmar is 0
      expect(calmar).toBe(0);
    });

    it('should calculate Calmar with realistic data', () => {
      const returns = [0.02, -0.015, 0.025, -0.01, 0.03];
      const values = [100, 102, 99.48, 101.97, 99.93, 102.93];
      const calmar = calculator.calculateCalmar(returns, values);

      expect(calmar).toBeDefined();
      expect(typeof calmar).toBe('number');
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('should return 0 for single value', () => {
      expect(calculator.calculateMaxDrawdown([100])).toBe(0);
    });

    it('should return 0 for strictly increasing values', () => {
      const values = [100, 101, 102, 103, 104];
      expect(calculator.calculateMaxDrawdown(values)).toBe(0);
    });

    it('should calculate drawdown from peak', () => {
      const values = [100, 110, 120, 110, 100]; // Peak at 120, drops to 100
      const drawdown = calculator.calculateMaxDrawdown(values);

      expect(drawdown).toBeCloseTo(0.1667, 3); // (120-100)/120 = 0.1667
    });

    it('should handle multiple peaks and valleys', () => {
      const values = [100, 120, 100, 130, 110];
      const drawdown = calculator.calculateMaxDrawdown(values);

      // Peak 120 to 100 = 16.67%, Peak 130 to 110 = 15.38%
      expect(drawdown).toBeCloseTo(0.1667, 3);
    });
  });

  describe('calculateDownsideDeviation', () => {
    it('should return 0 when no negative returns', () => {
      const returns = [0.01, 0.02, 0.015];
      expect(calculator.calculateDownsideDeviation(returns)).toBe(0);
    });

    it('should calculate deviation from negative returns only', () => {
      const returns = [0.02, -0.01, 0.015, -0.005];
      const deviation = calculator.calculateDownsideDeviation(returns);

      expect(deviation).toBeGreaterThan(0);
    });
  });

  describe('annualizeReturn', () => {
    it('should return 0 for single element', () => {
      expect(calculator.annualizeReturn([0.01])).toBe(0);
    });

    it('should annualize positive returns', () => {
      const returns = [0.01, 0.01, 0.01, 0.01, 0.01]; // 5 days of 1%
      const annualized = calculator.annualizeReturn(returns);

      expect(annualized).toBeGreaterThan(0);
    });

    it('should annualize negative returns', () => {
      const returns = [-0.01, -0.01, -0.01, -0.01, -0.01];
      const annualized = calculator.annualizeReturn(returns);

      expect(annualized).toBeLessThan(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should return 0 for single element', () => {
      expect(calculator.calculateVolatility([0.01])).toBe(0);
    });

    it('should annualize daily volatility', () => {
      const returns = [0.01, -0.01, 0.015, -0.005, 0.02];
      const volatility = calculator.calculateVolatility(returns);

      // Should be higher than raw std due to annualization
      expect(volatility).toBeGreaterThan(0.01);
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays gracefully', () => {
      const result = calculator.calculate([]);
      expect(result.sharpeRatio).toBe(0);
    });

    it('should handle very small returns', () => {
      const returns = [0.0001, 0.0002, 0.00015];
      const result = calculator.calculate(returns);

      expect(result.sharpeRatio).toBeDefined();
      expect(typeof result.sharpeRatio).toBe('number');
    });

    it('should handle very large returns', () => {
      const returns = [0.5, 0.3, -0.2, 0.4];
      const result = calculator.calculate(returns);

      expect(result.sharpeRatio).toBeDefined();
    });
  });
});
