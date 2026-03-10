import { MetricsCollector } from '../../../src/testing/backtest/metrics-collector';
import { Trade } from '../../../src/backtest/backtest-types';
import { EquityPoint } from '../../../src/testing/backtest/state-manager';

function makeTrade(profit: number, profitPercent?: number): Trade {
  return {
    entryPrice: 50000,
    exitPrice: profit >= 0 ? 50000 + profit * 10 : 50000 + profit * 10,
    entryTime: Date.now() - 3600000,
    exitTime: Date.now(),
    profit,
    profitPercent: profitPercent ?? profit / 50000,
    positionSize: 0.1,
    fees: 1,
  };
}

function makeEquityPoints(values: number[]): EquityPoint[] {
  const base = Date.now() - values.length * 86400000;
  return values.map((equity, i) => ({ timestamp: base + i * 86400000, equity }));
}

describe('MetricsCollector', () => {
  it('starts with zero trades', () => {
    const mc = new MetricsCollector(0.04);
    const report = mc.computeMetrics();
    expect(report.totalTrades).toBe(0);
  });

  it('records trades correctly', () => {
    const mc = new MetricsCollector(0.04);
    mc.recordTrade(makeTrade(100));
    mc.recordTrade(makeTrade(-50));
    expect(mc.computeMetrics().totalTrades).toBe(2);
  });

  it('computes total PnL', () => {
    const mc = new MetricsCollector(0.04);
    mc.recordTrade(makeTrade(200));
    mc.recordTrade(makeTrade(-80));
    expect(mc.computeMetrics().totalPnl).toBeCloseTo(120, 5);
  });

  it('computes win rate correctly', () => {
    const mc = new MetricsCollector(0.04);
    mc.recordTrade(makeTrade(100));
    mc.recordTrade(makeTrade(50));
    mc.recordTrade(makeTrade(-30));
    expect(mc.computeMetrics().winRate).toBeCloseTo(2 / 3, 5);
  });

  it('computes profit factor', () => {
    const mc = new MetricsCollector(0.04);
    mc.recordTrade(makeTrade(300));
    mc.recordTrade(makeTrade(-100));
    expect(mc.computeMetrics().profitFactor).toBeCloseTo(3, 5);
  });

  it('computes max drawdown from equity curve', () => {
    const mc = new MetricsCollector(0.04);
    makeEquityPoints([100000, 120000, 90000, 110000]).forEach(p => mc.recordEquityPoint(p));
    const report = mc.computeMetrics();
    expect(report.maxDrawdown).toBeCloseTo(0.25, 5); // 120k → 90k = 25%
  });

  it('sharpe ratio is zero with no data', () => {
    const mc = new MetricsCollector(0.04);
    expect(mc.computeMetrics().sharpeRatio).toBe(0);
  });

  it('daily returns map has entries when equity points span multiple days', () => {
    const mc = new MetricsCollector(0.04);
    makeEquityPoints([100000, 102000, 101000, 103000]).forEach(p => mc.recordEquityPoint(p));
    const daily = mc.getDailyReturns();
    expect(daily.size).toBeGreaterThan(0);
  });

  it('monthly returns aggregated correctly', () => {
    const mc = new MetricsCollector(0.04);
    makeEquityPoints([100000, 105000, 103000]).forEach(p => mc.recordEquityPoint(p));
    const monthly = mc.getMonthlyReturns();
    expect(monthly.size).toBeGreaterThan(0);
  });

  it('avgWin and avgLoss computed correctly', () => {
    const mc = new MetricsCollector(0.04);
    mc.recordTrade(makeTrade(100, 0.02));
    mc.recordTrade(makeTrade(200, 0.04));
    mc.recordTrade(makeTrade(-50, -0.01));
    const report = mc.computeMetrics();
    expect(report.avgWin).toBeCloseTo(0.03, 5);
    expect(report.avgLoss).toBeCloseTo(-0.01, 5);
  });
});
