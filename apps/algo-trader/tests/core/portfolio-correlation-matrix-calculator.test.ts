/**
 * Tests for PortfolioCorrelationMatrixCalculator — Pearson correlation detection.
 */

import { PortfolioCorrelationMatrixCalculator } from '../../src/core/portfolio-correlation-matrix-calculator';

describe('PortfolioCorrelationMatrixCalculator', () => {
  it('returns empty matrix for no positions', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const result = calc.calculate({ positions: [] });
    expect(result.matrix).toEqual({});
    expect(result.highCorrelationPairs).toEqual([]);
  });

  it('single position has self-correlation = 1', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const result = calc.calculate({
      positions: [{ symbol: 'BTC', returns: [0.01, 0.02, -0.01, 0.03] }],
    });
    expect(result.matrix['BTC']['BTC']).toBe(1);
    expect(result.highCorrelationPairs).toEqual([]);
  });

  it('perfectly correlated returns → correlation ≈ 1', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const returns = [0.01, 0.02, -0.01, 0.03, -0.02];
    const result = calc.calculate({
      positions: [
        { symbol: 'BTC', returns },
        { symbol: 'BTC-CLONE', returns: returns.map(r => r * 2) }, // Same direction, different magnitude
      ],
    });
    expect(result.matrix['BTC']['BTC-CLONE']).toBeCloseTo(1.0, 5);
    expect(result.highCorrelationPairs.length).toBe(1);
    expect(result.highCorrelationPairs[0].correlation).toBeCloseTo(1.0, 5);
  });

  it('negatively correlated returns → correlation ≈ -1', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const returns = [0.01, 0.02, -0.01, 0.03, -0.02];
    const result = calc.calculate({
      positions: [
        { symbol: 'BTC', returns },
        { symbol: 'INV', returns: returns.map(r => -r) },
      ],
    });
    expect(result.matrix['BTC']['INV']).toBeCloseTo(-1.0, 5);
    // -1 has abs > 0.85, so it should be flagged
    expect(result.highCorrelationPairs.length).toBe(1);
  });

  it('weakly correlated returns → |correlation| < 0.85 (no flag)', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    // Two series with low linear relationship
    const result = calc.calculate({
      positions: [
        { symbol: 'A', returns: [0.05, -0.03, 0.02, -0.04, 0.01, 0.03, -0.02, 0.04, -0.01, 0.02] },
        { symbol: 'B', returns: [-0.01, 0.04, -0.03, 0.01, 0.05, -0.04, 0.03, -0.02, 0.04, -0.05] },
      ],
    });
    // Should not be flagged as high correlation
    expect(Math.abs(result.matrix['A']['B'])).toBeLessThan(0.85);
    expect(result.highCorrelationPairs).toEqual([]);
  });

  it('custom threshold filters correctly', () => {
    const calc = new PortfolioCorrelationMatrixCalculator(0.5);
    const result = calc.calculate({
      positions: [
        { symbol: 'X', returns: [0.01, 0.02, 0.03, 0.04, 0.05] },
        { symbol: 'Y', returns: [0.01, 0.025, 0.028, 0.042, 0.048] },
      ],
    });
    // High correlation pair should be detected with lower threshold
    expect(result.matrix['X']['Y']).toBeGreaterThan(0.5);
    expect(result.highCorrelationPairs.length).toBe(1);
  });

  it('handles zero variance (constant returns)', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const result = calc.calculate({
      positions: [
        { symbol: 'FLAT', returns: [0.01, 0.01, 0.01, 0.01] },
        { symbol: 'VARY', returns: [0.01, 0.02, -0.01, 0.03] },
      ],
    });
    expect(result.matrix['FLAT']['VARY']).toBe(0);
  });

  it('handles mismatched array lengths', () => {
    const calc = new PortfolioCorrelationMatrixCalculator();
    const result = calc.calculate({
      positions: [
        { symbol: 'SHORT', returns: [0.01, 0.02] },
        { symbol: 'LONG', returns: [0.01, 0.02, 0.03, 0.04, 0.05] },
      ],
    });
    // Should use min length (2) — correlation still computable
    expect(typeof result.matrix['SHORT']['LONG']).toBe('number');
  });
});
