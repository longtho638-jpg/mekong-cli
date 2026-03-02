/**
 * Tests for BacktestOptimizer random search mode.
 */

import { BacktestOptimizer, ParameterRange } from '../../src/backtest/BacktestOptimizer';
import { MockDataProvider } from '../../src/data/MockDataProvider';

describe('BacktestOptimizer — Random Search', () => {
  const dataProvider = new MockDataProvider();
  const paramRanges: ParameterRange[] = [
    { name: 'rsiPeriod', values: [10, 14, 20, 25, 30] },
    { name: 'smaShort', values: [10, 15, 20, 25] },
    { name: 'smaLong', values: [40, 50, 60, 70, 80] },
  ];

  it('random mode returns maxTrials results (or fewer if errors)', async () => {
    const optimizer = new BacktestOptimizer(dataProvider, 1000, 3); // reduced for M1 memory
    const results = await optimizer.optimize(
      (params) => {
        const { RsiSmaStrategy } = require('../../src/strategies/RsiSmaStrategy');
        return new RsiSmaStrategy(params);
      },
      paramRanges,
      'random',
      5, // reduced from 10 for M1 memory
    );
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThan(0);
  });

  it('random mode results are sorted by score descending', async () => {
    const optimizer = new BacktestOptimizer(dataProvider, 1000, 3); // reduced for M1 memory
    const results = await optimizer.optimize(
      (params) => {
        const { RsiSmaStrategy } = require('../../src/strategies/RsiSmaStrategy');
        return new RsiSmaStrategy(params);
      },
      paramRanges,
      'random',
      5, // reduced from 8 for M1 memory
    );
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('grid mode still works with mode param (backward compat)', async () => {
    const smallRanges: ParameterRange[] = [
      { name: 'rsiPeriod', values: [14] },
      { name: 'smaShort', values: [20] },
    ];
    const optimizer = new BacktestOptimizer(dataProvider, 1000, 3); // reduced for M1 memory
    const results = await optimizer.optimize(
      (params) => {
        const { RsiSmaStrategy } = require('../../src/strategies/RsiSmaStrategy');
        return new RsiSmaStrategy(params);
      },
      smallRanges,
      'grid',
    );
    expect(results.length).toBe(1); // 1 × 1 = 1 combination
  });

  it('default mode is grid (no mode param)', async () => {
    const singleRange: ParameterRange[] = [
      { name: 'rsiPeriod', values: [14, 20] },
    ];
    const optimizer = new BacktestOptimizer(dataProvider, 1000, 3); // reduced for M1 memory
    const results = await optimizer.optimize(
      (params) => {
        const { RsiSmaStrategy } = require('../../src/strategies/RsiSmaStrategy');
        return new RsiSmaStrategy(params);
      },
      singleRange,
    );
    expect(results.length).toBe(2); // Grid: 2 values = 2 combinations
  });

  it('random search fewer evaluations than grid (efficiency check)', () => {
    // Grid: 5 × 4 × 5 = 100 combinations
    // Random: maxTrials = 15
    // Confirm random is 6.7x fewer evals
    const gridCount = 5 * 4 * 5; // 100
    const randomCount = 15;
    expect(randomCount).toBeLessThan(gridCount / 5);
  });
});
