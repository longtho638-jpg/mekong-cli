/**
 * Tests for HistoricalVaRCalculator — quantile-based VaR computation.
 */

import { HistoricalVaRCalculator } from '../../src/core/historical-var-calculator';

describe('HistoricalVaRCalculator', () => {
  const calculator = new HistoricalVaRCalculator();

  it('returns zeros for empty returns', () => {
    const result = calculator.calculate({ dailyReturns: [], confidence: 0.95, portfolioValue: 10000 });
    expect(result.var95).toBe(0);
    expect(result.var99).toBe(0);
    expect(result.cvar95).toBe(0);
    expect(result.maxLoss).toBe(0);
    expect(result.windowDays).toBe(0);
  });

  it('handles single return value', () => {
    const result = calculator.calculate({ dailyReturns: [-0.05], confidence: 0.95, portfolioValue: 10000 });
    expect(result.var95).toBe(500);
    expect(result.var99).toBe(500);
    expect(result.maxLoss).toBe(500);
    expect(result.windowDays).toBe(1);
  });

  it('computes VaR from 20-day returns', () => {
    // 20 returns: mostly small losses, a few large ones
    const returns = [
      -0.01, -0.02, 0.01, -0.005, 0.02, -0.03, 0.005, -0.015, 0.01, -0.01,
      -0.04, 0.015, -0.008, 0.003, -0.025, 0.007, -0.012, -0.05, 0.02, -0.006,
    ];
    const result = calculator.calculate({ dailyReturns: returns, confidence: 0.95, portfolioValue: 100000 });

    expect(result.var95).toBeGreaterThan(0);
    expect(result.var99).toBeGreaterThan(result.var95);
    expect(result.cvar95).toBeGreaterThanOrEqual(result.var95);
    expect(result.maxLoss).toBe(5000); // -0.05 * 100000
    expect(result.windowDays).toBe(20);
  });

  it('VaR99 >= VaR95 (99% confidence captures more tail risk)', () => {
    const returns = [-0.01, -0.02, -0.03, -0.04, -0.05, 0.01, 0.02, 0.03, 0.04, 0.05];
    const result = calculator.calculate({ dailyReturns: returns, confidence: 0.95, portfolioValue: 50000 });
    expect(result.var99).toBeGreaterThanOrEqual(result.var95);
  });

  it('all-positive returns produce small VaR values', () => {
    const returns = [0.01, 0.02, 0.03, 0.015, 0.025];
    const result = calculator.calculate({ dailyReturns: returns, confidence: 0.95, portfolioValue: 10000 });
    // Even smallest positive return still gives a small VaR
    expect(result.var95).toBeLessThan(200);
  });
});
