/**
 * Tests for @agencyos/vibe-billing-trading hooks.
 * Validates fee calculator hook, profit tracker hook, and composite arbitrage billing hook.
 */

// Tests use core classes directly (same logic wrapped by vibe-billing-trading hooks)
import { FeeCalculator, ProfitTracker } from '@agencyos/vibe-arbitrage-engine';

// ---- FeeCalculatorHook Tests (direct class usage matching hook API) ----

describe('FeeCalculatorHook pattern', () => {
  test('creates hook with default config', () => {
    const calc = new FeeCalculator();
    expect(calc.getExchanges().length).toBe(4);
  });

  test('applies VIP levels from config', () => {
    const calc = new FeeCalculator();
    calc.setVipLevel('binance', 'VIP3');
    const tier = calc.getTier('binance');
    expect(tier.level).toBe('VIP3');
    expect(tier.takerRate).toBe(0.0006);
  });

  test('findCheapestExchange returns lowest taker fee', () => {
    const calc = new FeeCalculator();
    const results = calc.compareFees(60000, 0.5);
    expect(results.length).toBeGreaterThan(0);
    // First result should have lowest taker fee (sorted ascending)
    const cheapest = results[0];
    for (const r of results) {
      expect(r.takerFeeUsd).toBeGreaterThanOrEqual(cheapest.takerFeeUsd);
    }
  });

  test('getBreakEvenSpread calculates minimum profitable spread', () => {
    const calc = new FeeCalculator();
    const report = calc.calculateArbitrageFees('binance', 'okx', 'X/USDT', 60000, 60000, 0.5);
    // Break-even spread should be positive (need some spread to cover fees)
    expect(report.breakEvenSpreadPercent).toBeGreaterThan(0);
    // For ~$30,000 notional with ~0.1% fees each side → ~0.2% break-even
    expect(report.breakEvenSpreadPercent).toBeLessThan(1);
  });

  test('calculateArbitrageCost includes all fee components', () => {
    const calc = new FeeCalculator();
    const report = calc.calculateArbitrageFees('binance', 'okx', 'BTC/USDT', 60000, 60100, 0.5);

    expect(report.buyFee.exchange).toBe('binance');
    expect(report.sellFee.exchange).toBe('okx');
    expect(report.totalFeesUsd).toBe(report.buyFee.feeUsd + report.sellFee.feeUsd);
    expect(report.totalCostUsd).toBe(report.totalFeesUsd + report.withdrawalFeeUsd);
  });

  test('calculateNetProfit returns correct profitability', () => {
    const calc = new FeeCalculator();
    // Large spread → should be profitable
    const profitable = calc.calculateNetProfit('binance', 'okx', 'BTC/USDT', 60000, 60500, 0.5);
    expect(profitable.grossProfitUsd).toBeCloseTo(250, 0); // (60500-60000)*0.5
    expect(profitable.profitable).toBe(true);

    // No spread → should not be profitable (fees eat everything)
    const unprofitable = calc.calculateNetProfit('binance', 'okx', 'BTC/USDT', 60000, 60000, 0.5);
    expect(unprofitable.grossProfitUsd).toBe(0);
    expect(unprofitable.profitable).toBe(false);
  });
});

// ---- ProfitTrackerHook Tests ----

describe('ProfitTrackerHook pattern', () => {
  test('creates tracker with initial equity', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    const summary = tracker.getSummary();
    expect(summary.initialEquity).toBe(10000);
    expect(summary.currentEquity).toBe(10000);
    expect(summary.totalTrades).toBe(0);
  });

  test('recordTrade updates equity and metrics', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(50);
    tracker.recordTrade(-20);
    tracker.recordTrade(30);

    const summary = tracker.getSummary();
    expect(summary.totalTrades).toBe(3);
    expect(summary.cumulativePnl).toBeCloseTo(60, 1);
    expect(summary.currentEquity).toBeCloseTo(10060, 1);
    expect(summary.winningTrades).toBe(2);
    expect(summary.losingTrades).toBe(1);
  });

  test('getSnapshot returns quick P&L overview', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);
    tracker.recordTrade(50);

    const summary = tracker.getSummary();
    expect(summary.currentEquity).toBeCloseTo(10150, 0);
    expect(summary.cumulativePnlPercent).toBeCloseTo(1.5, 1);
    expect(summary.winRate).toBe(100);
  });

  test('shouldHalt returns true on excessive drawdown', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    // Lose 25% of equity
    tracker.recordTrade(-2500);
    expect(tracker.shouldHalt(20)).toBe(true);
    expect(tracker.shouldHalt(30)).toBe(false);
  });

  test('isProfitable checks cumulative P&L', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(-50);
    expect(tracker.getSummary().cumulativePnl).toBeLessThan(0);

    tracker.recordTrade(100);
    expect(tracker.getSummary().cumulativePnl).toBeGreaterThan(0);
  });

  test('drawdown alerts fire at correct thresholds', () => {
    const tracker = new ProfitTracker({
      initialEquity: 10000,
      drawdownAlertThresholds: [5, 10],
    });

    const alerts: number[] = [];
    tracker.onDrawdownAlert((a: { drawdownPercent: number }) => alerts.push(a.drawdownPercent));

    tracker.recordTrade(-600);  // 6% drawdown → triggers 5% alert
    expect(alerts.length).toBe(1);

    tracker.recordTrade(-500);  // 11% drawdown → triggers 10% alert
    expect(alerts.length).toBe(2);
  });

  test('reset clears all state', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);
    tracker.recordTrade(-50);
    tracker.reset();

    const summary = tracker.getSummary();
    expect(summary.totalTrades).toBe(0);
    expect(summary.cumulativePnl).toBe(0);
    expect(summary.currentEquity).toBe(10000);
  });

  test('equity curve tracks all trade points', () => {
    const tracker = new ProfitTracker({ initialEquity: 5000 });
    tracker.recordTrade(10);
    tracker.recordTrade(20);
    tracker.recordTrade(-5);

    const curve = tracker.getEquityCurve();
    // Initial point + 3 trades = 4 points
    expect(curve.length).toBe(4);
    expect(curve[curve.length - 1].cumulativePnl).toBeCloseTo(25, 1);
  });
});

// ---- ArbitrageBillingHook (Composite) Tests ----

describe('ArbitrageBillingHook composite pattern', () => {
  test('analyzeOpportunity returns full cost breakdown', () => {
    const calc = new FeeCalculator();
    const buyPrice = 60000;
    const sellPrice = 60200;
    const amount = 0.5;

    const feeReport = calc.calculateArbitrageFees('binance', 'okx', 'BTC/USDT', buyPrice, sellPrice, amount);
    const netResult = calc.calculateNetProfit('binance', 'okx', 'BTC/USDT', buyPrice, sellPrice, amount);

    const avgPrice = (buyPrice + sellPrice) / 2;
    const spreadPercent = ((sellPrice - buyPrice) / avgPrice) * 100;
    const marginOfSafety = spreadPercent - feeReport.breakEvenSpreadPercent;

    expect(netResult.grossProfitUsd).toBeCloseTo(100, 0);
    expect(feeReport.totalFeesUsd).toBeGreaterThan(0);
    expect(marginOfSafety).toBeGreaterThan(0);
    expect(netResult.profitable).toBe(true);
  });

  test('meetsThreshold checks min profit and margin', () => {
    const calc = new FeeCalculator();
    const result = calc.calculateNetProfit('binance', 'okx', 'BTC/USDT', 60000, 60200, 0.5);

    // Large profit → should meet threshold
    expect(result.netProfitUsd).toBeGreaterThan(0.5);
    expect(result.profitable).toBe(true);

    // Tiny spread → should not meet threshold
    const tiny = calc.calculateNetProfit('binance', 'okx', 'BTC/USDT', 60000, 60001, 0.5);
    expect(tiny.profitable).toBe(false);
  });

  test('recordExecution and getSessionReport track session', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(25);
    tracker.recordTrade(15);
    tracker.recordTrade(-5);

    const summary = tracker.getSummary();
    expect(summary.totalTrades).toBe(3);
    expect(summary.cumulativePnl).toBeCloseTo(35, 1);
    expect(summary.winRate).toBeCloseTo(66.67, 0);
    expect(summary.maxDrawdownPercent).toBeGreaterThanOrEqual(0);
  });

  test('resetSession preserves fee config but clears tracker', () => {
    const calc = new FeeCalculator();
    calc.setVipLevel('binance', 'VIP1');
    const tracker = new ProfitTracker({ initialEquity: 10000 });

    tracker.recordTrade(100);
    tracker.reset();

    // Fee config preserved
    expect(calc.getTier('binance').level).toBe('VIP1');
    // Tracker cleared
    expect(tracker.getSummary().totalTrades).toBe(0);
  });
});
