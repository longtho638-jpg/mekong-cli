import { ParameterOptimizer } from '../../../src/testing/backtest/parameter-optimizer';
import { BacktestMetricsReport } from '../../../src/testing/backtest/metrics-collector';

function makeReport(sharpe: number, totalPnl = 0, winRate = 0): BacktestMetricsReport {
  return {
    dailyReturns: new Map(),
    monthlyReturns: new Map(),
    sharpeRatio: sharpe,
    sortinoRatio: 0,
    calmarRatio: 0,
    maxDrawdown: 0,
    maxDrawdownDuration: 0,
    winRate,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    totalTrades: 0,
    totalPnl,
    exposureByAsset: new Map(),
    exposureByExchange: new Map(),
  };
}

describe('ParameterOptimizer', () => {
  it('finds best params from grid', async () => {
    const opt = new ParameterOptimizer('sharpeRatio');
    const grid = { threshold: [0.001, 0.002, 0.005] };
    const runBacktest = async (params: Record<string, unknown>) => {
      const t = params['threshold'] as number;
      return makeReport(t === 0.002 ? 2.5 : 1.0);
    };
    const result = await opt.gridSearch(grid, runBacktest);
    expect(result.bestParams['threshold']).toBe(0.002);
    expect(result.bestMetric).toBe(2.5);
  });

  it('returns all results sorted descending', async () => {
    const opt = new ParameterOptimizer('sharpeRatio');
    const grid = { x: [1, 2, 3] };
    const runBacktest = async (p: Record<string, unknown>) => makeReport(p['x'] as number);
    const result = await opt.gridSearch(grid, runBacktest);
    expect(result.allResults.length).toBe(3);
    for (let i = 1; i < result.allResults.length; i++) {
      expect(result.allResults[i - 1].metric).toBeGreaterThanOrEqual(result.allResults[i].metric);
    }
  });

  it('handles empty param grid', async () => {
    const opt = new ParameterOptimizer('sharpeRatio');
    const runBacktest = async () => makeReport(1.5);
    const result = await opt.gridSearch({}, runBacktest);
    expect(result.allResults.length).toBe(1);
    expect(result.bestMetric).toBe(1.5);
  });

  it('generates all combinations for multi-param grid', async () => {
    const opt = new ParameterOptimizer('totalPnl');
    const grid = { a: [1, 2], b: ['x', 'y'] };
    const calls: Record<string, unknown>[] = [];
    const runBacktest = async (p: Record<string, unknown>) => { calls.push(p); return makeReport(0, 100); };
    await opt.gridSearch(grid, runBacktest);
    expect(calls.length).toBe(4); // 2 × 2
  });

  it('uses winRate as target metric when specified', async () => {
    const opt = new ParameterOptimizer('winRate');
    const grid = { v: [0.1, 0.2] };
    const runBacktest = async (p: Record<string, unknown>) => makeReport(0, 0, p['v'] as number);
    const result = await opt.gridSearch(grid, runBacktest);
    expect(result.bestParams['v']).toBe(0.2);
  });

  it('handles non-finite metric gracefully', async () => {
    const opt = new ParameterOptimizer('sharpeRatio');
    const grid = { x: [1] };
    const runBacktest = async () => makeReport(Infinity);
    const result = await opt.gridSearch(grid, runBacktest);
    expect(result.bestMetric).toBe(0); // Infinity normalized to 0
  });
});
