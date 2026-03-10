import { ReportGenerator } from '../../../src/testing/backtest/report-generator';
import { BacktestMetricsReport } from '../../../src/testing/backtest/metrics-collector';
import { EquityPoint } from '../../../src/testing/backtest/state-manager';
import { Trade } from '../../../src/backtest/backtest-types';
import { DEFAULT_BACKTEST_CONFIG } from '../../../src/testing/backtest/backtest-config-types';

function makeMetrics(): BacktestMetricsReport {
  return {
    dailyReturns: new Map([['2024-01-01', 0.01]]),
    monthlyReturns: new Map([['2024-01', 0.05]]),
    sharpeRatio: 1.5,
    sortinoRatio: 2.0,
    calmarRatio: 1.2,
    maxDrawdown: 0.1,
    maxDrawdownDuration: 5,
    winRate: 0.6,
    avgWin: 0.02,
    avgLoss: -0.01,
    profitFactor: 2.0,
    totalTrades: 10,
    totalPnl: 5000,
    exposureByAsset: new Map(),
    exposureByExchange: new Map(),
  };
}

function makeTrade(profit: number): Trade {
  return {
    entryPrice: 50000, exitPrice: 51000,
    entryTime: Date.now() - 3600000, exitTime: Date.now(),
    profit, profitPercent: profit / 50000, positionSize: 0.1, fees: 1,
  };
}

function makeEquity(): EquityPoint[] {
  return [
    { timestamp: Date.now() - 86400000, equity: 100000 },
    { timestamp: Date.now(), equity: 105000 },
  ];
}

describe('ReportGenerator', () => {
  it('HTML output contains DOCTYPE', async () => {
    const gen = new ReportGenerator('html');
    const html = await gen.generateReport(makeMetrics(), [makeTrade(100)], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('HTML output contains equity chart canvas', async () => {
    const gen = new ReportGenerator('html');
    const html = await gen.generateReport(makeMetrics(), [], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(html).toContain('equityChart');
  });

  it('HTML output contains performance metrics', async () => {
    const gen = new ReportGenerator('html');
    const html = await gen.generateReport(makeMetrics(), [], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(html).toContain('Sharpe Ratio');
    expect(html).toContain('Win Rate');
  });

  it('HTML output contains monthly returns table', async () => {
    const gen = new ReportGenerator('html');
    const html = await gen.generateReport(makeMetrics(), [], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(html).toContain('2024-01');
  });

  it('JSON output is valid JSON', async () => {
    const gen = new ReportGenerator('json');
    const json = await gen.generateReport(makeMetrics(), [makeTrade(200)], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('JSON output contains metrics and trades keys', async () => {
    const gen = new ReportGenerator('json');
    const json = await gen.generateReport(makeMetrics(), [makeTrade(100)], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('metrics');
    expect(parsed).toHaveProperty('trades');
  });

  it('CSV output has header row', async () => {
    const gen = new ReportGenerator('csv');
    const csv = await gen.generateReport(makeMetrics(), [makeTrade(50)], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    expect(csv.split('\n')[0]).toContain('entryTime');
  });

  it('CSV output has data rows for each trade', async () => {
    const gen = new ReportGenerator('csv');
    const csv = await gen.generateReport(makeMetrics(), [makeTrade(50), makeTrade(-20)], makeEquity(), DEFAULT_BACKTEST_CONFIG);
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBe(3); // header + 2 trades
  });

  it('handles empty trades list gracefully', async () => {
    const gen = new ReportGenerator('html');
    const html = await gen.generateReport(makeMetrics(), [], [], DEFAULT_BACKTEST_CONFIG);
    expect(html).toContain('<!DOCTYPE html>');
  });
});
