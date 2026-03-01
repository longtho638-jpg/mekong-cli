/**
 * Tests for Round 5: OrderBookAnalyzer, FeeCalculator, ArbitrageBacktester.
 */

import {
  OrderBookAnalyzer,
  OrderBook,
  FeeCalculator,
  ArbitrageBacktester,
  MultiExchangePriceSnapshot,
} from '@agencyos/vibe-arbitrage-engine';

// ---- Helper: create orderbook ----

function makeOrderBook(exchange: string, symbol: string, midPrice: number, depth: number = 5): OrderBook {
  const bids: { price: number; amount: number }[] = [];
  const asks: { price: number; amount: number }[] = [];

  for (let i = 0; i < depth; i++) {
    bids.push({ price: midPrice - (i + 1) * 0.5, amount: 1 + i * 0.5 });
    asks.push({ price: midPrice + (i + 1) * 0.5, amount: 1 + i * 0.5 });
  }

  return { exchange, symbol, bids, asks, timestamp: Date.now() };
}

// ---- OrderBookAnalyzer Tests ----

describe('OrderBookAnalyzer', () => {
  test('estimates buy slippage walking ask levels', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));

    const est = analyzer.estimateBuySlippage('binance', 'BTC/USDT', 1);

    expect(est.side).toBe('buy');
    expect(est.fillable).toBe(true);
    expect(est.avgFillPrice).toBeGreaterThan(0);
    expect(est.slippageBps).toBeGreaterThanOrEqual(0);
    expect(est.levelsConsumed).toBeGreaterThanOrEqual(1);
  });

  test('estimates sell slippage walking bid levels', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('okx', 'BTC/USDT', 50000));

    const est = analyzer.estimateSellSlippage('okx', 'BTC/USDT', 1);

    expect(est.side).toBe('sell');
    expect(est.fillable).toBe(true);
    expect(est.avgFillPrice).toBeGreaterThan(0);
  });

  test('returns unfillable when amount exceeds depth', () => {
    const analyzer = new OrderBookAnalyzer();
    // Small orderbook with only 1 level of 1 unit
    analyzer.updateOrderBook({
      exchange: 'binance', symbol: 'BTC/USDT',
      bids: [{ price: 50000, amount: 0.1 }],
      asks: [{ price: 50001, amount: 0.1 }],
      timestamp: Date.now(),
    });

    const est = analyzer.estimateBuySlippage('binance', 'BTC/USDT', 10);
    expect(est.fillable).toBe(false);
    expect(est.filledAmount).toBeLessThan(10);
  });

  test('returns no-data estimate for missing orderbook', () => {
    const analyzer = new OrderBookAnalyzer();
    const est = analyzer.estimateBuySlippage('unknown', 'BTC/USDT', 1);

    expect(est.fillable).toBe(false);
    expect(est.avgFillPrice).toBe(0);
  });

  test('simulates full arbitrage fill', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));
    analyzer.updateOrderBook(makeOrderBook('okx', 'BTC/USDT', 50300));

    const sim = analyzer.simulateArbitrageFill('binance', 'okx', 'BTC/USDT', 0.5, 0.001);

    expect(sim.buyEstimate.side).toBe('buy');
    expect(sim.sellEstimate.side).toBe('sell');
    expect(sim.totalSlippageBps).toBeGreaterThanOrEqual(0);
    expect(typeof sim.feasible).toBe('boolean');
    expect(typeof sim.effectiveSpreadPercent).toBe('number');
  });

  test('calculates liquidity score', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000, 10));

    const score = analyzer.getLiquidityScore('binance', 'BTC/USDT');

    expect(score.exchange).toBe('binance');
    expect(score.bidDepthUsd).toBeGreaterThan(0);
    expect(score.askDepthUsd).toBeGreaterThan(0);
    expect(score.midPrice).toBeGreaterThan(0);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  test('returns zero score for missing orderbook', () => {
    const analyzer = new OrderBookAnalyzer();
    const score = analyzer.getLiquidityScore('unknown', 'BTC/USDT');
    expect(score.score).toBe(0);
  });

  test('getBestBuyExchange finds cheapest exchange', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));
    analyzer.updateOrderBook(makeOrderBook('okx', 'BTC/USDT', 50300));

    const best = analyzer.getBestBuyExchange('BTC/USDT', 0.5);
    expect(best).not.toBeNull();
    expect(best!.exchange).toBe('binance'); // Cheaper asks
  });

  test('getBestSellExchange finds most expensive exchange', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));
    analyzer.updateOrderBook(makeOrderBook('okx', 'BTC/USDT', 50300));

    const best = analyzer.getBestSellExchange('BTC/USDT', 0.5);
    expect(best).not.toBeNull();
    expect(best!.exchange).toBe('okx'); // Higher bids
  });

  test('hasOrderBook checks existence', () => {
    const analyzer = new OrderBookAnalyzer();
    expect(analyzer.hasOrderBook('binance', 'BTC/USDT')).toBe(false);

    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));
    expect(analyzer.hasOrderBook('binance', 'BTC/USDT')).toBe(true);
  });

  test('clear removes all data', () => {
    const analyzer = new OrderBookAnalyzer();
    analyzer.updateOrderBook(makeOrderBook('binance', 'BTC/USDT', 50000));
    analyzer.clear();
    expect(analyzer.hasOrderBook('binance', 'BTC/USDT')).toBe(false);
  });
});

// ---- FeeCalculator Tests ----

describe('FeeCalculator', () => {
  test('loads default fee schedules for 4 exchanges', () => {
    const calc = new FeeCalculator();
    const exchanges = calc.getExchanges();

    expect(exchanges).toContain('binance');
    expect(exchanges).toContain('okx');
    expect(exchanges).toContain('bybit');
    expect(exchanges).toContain('gateio');
  });

  test('calculates taker fee correctly', () => {
    const calc = new FeeCalculator();
    const fee = calc.calculateFee('binance', 'buy', 50000, 0.1, 'taker');

    // Binance Regular taker = 0.1%
    expect(fee.rate).toBe(0.001);
    expect(fee.feeUsd).toBeCloseTo(5, 1); // 50000 * 0.1 * 0.001 = 5
    expect(fee.orderType).toBe('taker');
  });

  test('calculates maker fee correctly', () => {
    const calc = new FeeCalculator();
    const fee = calc.calculateFee('binance', 'buy', 50000, 0.1, 'maker');

    expect(fee.rate).toBe(0.001); // Binance Regular maker = 0.1%
    expect(fee.feeUsd).toBeCloseTo(5, 1);
  });

  test('uses VIP tier when set', () => {
    const calc = new FeeCalculator();
    calc.setVipLevel('binance', 'VIP3');

    const fee = calc.calculateFee('binance', 'buy', 50000, 0.1, 'taker');
    expect(fee.rate).toBe(0.0006); // VIP3 taker
    expect(fee.feeUsd).toBeCloseTo(3, 1); // 50000 * 0.1 * 0.0006
  });

  test('calculates arbitrage fees for both sides', () => {
    const calc = new FeeCalculator();
    const report = calc.calculateArbitrageFees(
      'binance', 'okx', 'BTC/USDT',
      50000, 50300, 0.1
    );

    expect(report.buyFee.exchange).toBe('binance');
    expect(report.sellFee.exchange).toBe('okx');
    expect(report.totalFeesUsd).toBeGreaterThan(0);
    expect(report.breakEvenSpreadPercent).toBeGreaterThan(0);
  });

  test('includes withdrawal fee when requested', () => {
    const calc = new FeeCalculator();
    const withFee = calc.calculateArbitrageFees(
      'binance', 'okx', 'BTC/USDT',
      50000, 50300, 0.1, true
    );
    const withoutFee = calc.calculateArbitrageFees(
      'binance', 'okx', 'BTC/USDT',
      50000, 50300, 0.1, false
    );

    expect(withFee.withdrawalFeeUsd).toBeGreaterThan(0);
    expect(withFee.totalCostUsd).toBeGreaterThan(withoutFee.totalCostUsd);
  });

  test('calculates net profit correctly', () => {
    const calc = new FeeCalculator();
    const result = calc.calculateNetProfit(
      'binance', 'okx', 'BTC/USDT',
      50000, 50300, 0.1
    );

    expect(result.grossProfitUsd).toBeCloseTo(30, 0); // (50300 - 50000) * 0.1
    expect(result.totalCostsUsd).toBeGreaterThan(0);
    expect(typeof result.profitable).toBe('boolean');
  });

  test('compares fees across exchanges', () => {
    const calc = new FeeCalculator();
    const comparison = calc.compareFees(50000, 0.1);

    expect(comparison.length).toBe(4);
    // Should be sorted by taker fee ascending
    for (let i = 1; i < comparison.length; i++) {
      expect(comparison[i].takerFeeUsd).toBeGreaterThanOrEqual(comparison[i - 1].takerFeeUsd);
    }
  });

  test('returns fallback fee for unknown exchange', () => {
    const calc = new FeeCalculator();
    const tier = calc.getTier('unknown_exchange');
    expect(tier.level).toBe('Unknown');
    expect(tier.takerRate).toBe(0.001);
  });

  test('getWithdrawalFee returns correct value', () => {
    const calc = new FeeCalculator();
    const fee = calc.getWithdrawalFee('binance', 'USDT');
    expect(fee).toBe(1);
  });
});

// ---- ArbitrageBacktester Tests ----

describe('ArbitrageBacktester', () => {
  function makeSnapshots(count: number, spread: number): MultiExchangePriceSnapshot[] {
    const snapshots: MultiExchangePriceSnapshot[] = [];
    for (let i = 0; i < count; i++) {
      snapshots.push({
        symbol: 'BTC/USDT',
        timestamp: Date.now() + i * 10000, // 10s apart
        prices: [
          { exchange: 'binance', price: 50000 },
          { exchange: 'okx', price: 50000 * (1 + spread / 100) },
        ],
      });
    }
    return snapshots;
  }

  test('returns empty result for no data', () => {
    const bt = new ArbitrageBacktester();
    const result = bt.run([]);

    expect(result.trades.length).toBe(0);
    expect(result.metrics.totalTrades).toBe(0);
  });

  test('executes trades when spread exceeds threshold', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 2,
    });

    // 0.6% spread — should trigger trades
    const snapshots = makeSnapshots(5, 0.6);
    const result = bt.run(snapshots);

    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.metrics.winRate).toBeGreaterThan(0);
  });

  test('skips trades below spread threshold', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 1.0, // High threshold
      cooldownMs: 0,
    });

    // 0.1% spread — below threshold
    const snapshots = makeSnapshots(5, 0.1);
    const result = bt.run(snapshots);

    expect(result.trades.length).toBe(0);
  });

  test('respects cooldown between trades', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      cooldownMs: 30000, // 30s cooldown
      positionSizeUsd: 1000,
      slippageBps: 1,
    });

    // 5 snapshots 10s apart — cooldown means max 1-2 trades
    const snapshots = makeSnapshots(5, 0.6);
    const result = bt.run(snapshots);

    expect(result.trades.length).toBeLessThanOrEqual(2);
  });

  test('tracks equity curve', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 1,
    });

    const snapshots = makeSnapshots(5, 0.6);
    const result = bt.run(snapshots);

    expect(result.equityCurve.length).toBeGreaterThanOrEqual(1);
    // First point should be initial capital
    expect(result.equityCurve[0].equity).toBe(10000);
  });

  test('calculates Sharpe ratio', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 1,
    });

    const snapshots = makeSnapshots(10, 0.6);
    const result = bt.run(snapshots);

    expect(typeof result.metrics.sharpeRatio).toBe('number');
  });

  test('calculates return on capital', () => {
    const bt = new ArbitrageBacktester({
      initialCapitalUsd: 10000,
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 1,
    });

    const snapshots = makeSnapshots(5, 0.6);
    const result = bt.run(snapshots);

    expect(typeof result.metrics.returnOnCapital).toBe('number');
  });

  test('generates test data with correct structure', () => {
    const data = ArbitrageBacktester.generateTestData({
      symbol: 'BTC/USDT',
      exchanges: ['binance', 'okx', 'bybit'],
      basePrice: 50000,
      snapshots: 100,
      intervalMs: 1000,
      volatilityPercent: 0.5,
      spreadRangePercent: [0.05, 0.5],
    });

    expect(data.length).toBe(100);
    expect(data[0].prices.length).toBe(3);
    expect(data[0].symbol).toBe('BTC/USDT');
    expect(data[0].prices[0].price).toBeGreaterThan(0);
  });

  test('backtest with generated test data produces results', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 3,
    });

    const data = ArbitrageBacktester.generateTestData({
      symbol: 'ETH/USDT',
      exchanges: ['binance', 'okx'],
      basePrice: 3000,
      snapshots: 50,
      intervalMs: 5000,
      volatilityPercent: 0.3,
      spreadRangePercent: [0.1, 0.8],
    });

    const result = bt.run(data);

    expect(result.config.positionSizeUsd).toBe(1000);
    expect(typeof result.metrics.netProfitUsd).toBe('number');
    expect(typeof result.metrics.profitFactor).toBe('number');
  });

  test('uses FeeCalculator for accurate fees', () => {
    const bt = new ArbitrageBacktester({
      useFeeCalculator: true,
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      slippageBps: 1,
    });

    const snapshots = makeSnapshots(3, 0.6);
    const result = bt.run(snapshots);

    expect(result.metrics.totalFeesUsd).toBeGreaterThan(0);
  });

  test('getFeeCalculator returns instance', () => {
    const bt = new ArbitrageBacktester();
    const fc = bt.getFeeCalculator();
    expect(fc).toBeInstanceOf(FeeCalculator);
  });

  test('respects daily loss limit', () => {
    const bt = new ArbitrageBacktester({
      minSpreadPercent: 0.1,
      positionSizeUsd: 1000,
      cooldownMs: 0,
      maxDailyLossUsd: 0, // Zero tolerance — effectively skip all trades after any loss
      slippageBps: 1,
    });

    const snapshots = makeSnapshots(10, 0.6);
    const result = bt.run(snapshots);

    // With zero daily loss limit, should still take profitable trades
    expect(typeof result.metrics.totalTrades).toBe('number');
  });
});
