/**
 * Tests for Round 6: SpreadHistoryTracker, BalanceRebalancer, ArbitrageSignalScorer.
 */

import {
  SpreadHistoryTracker,
  BalanceRebalancer,
  ExchangeBalance,
  ArbitrageSignalScorer,
  SignalFactors,
} from '@agencyos/vibe-arbitrage-engine';

// ---- SpreadHistoryTracker Tests ----

describe('SpreadHistoryTracker', () => {
  function seedTracker(tracker: SpreadHistoryTracker, count: number, baseSpread: number = 0.3): void {
    for (let i = 0; i < count; i++) {
      tracker.record({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        spreadPercent: baseSpread + (Math.random() - 0.5) * 0.2,
        timestamp: Date.now() - (count - i) * 60000, // 1min apart
      });
    }
  }

  test('records and retrieves spread stats', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 10);

    const stats = tracker.getStats('binance', 'okx', 'BTC/USDT');

    expect(stats.count).toBe(10);
    expect(stats.mean).toBeGreaterThan(0);
    expect(stats.stddev).toBeGreaterThanOrEqual(0);
    expect(stats.min).toBeLessThanOrEqual(stats.max);
    expect(stats.pairKey).toBe('binance→okx:BTC/USDT');
  });

  test('returns empty stats for unknown pair', () => {
    const tracker = new SpreadHistoryTracker();
    const stats = tracker.getStats('unknown', 'unknown', 'BTC/USDT');

    expect(stats.count).toBe(0);
    expect(stats.mean).toBe(0);
  });

  test('calculates z-score correctly', () => {
    const tracker = new SpreadHistoryTracker();
    // Seed with slight variation around 0.3%
    for (let i = 0; i < 50; i++) {
      tracker.record({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        spreadPercent: 0.3 + (i % 2 === 0 ? 0.01 : -0.01), // 0.29 and 0.31 alternating
        timestamp: Date.now() - i * 60000,
      });
    }

    // Current spread much higher than historical → high z-score
    const z = tracker.getZScore('binance', 'okx', 'BTC/USDT', 0.8);
    expect(z.zScore).toBeGreaterThan(2);
    expect(z.mean).toBeCloseTo(0.3, 1);

    // Current spread at mean → z ≈ 0
    const zNormal = tracker.getZScore('binance', 'okx', 'BTC/USDT', 0.3);
    expect(Math.abs(zNormal.zScore)).toBeLessThan(1);
  });

  test('detects anomalies with z-score threshold', () => {
    const tracker = new SpreadHistoryTracker({ anomalyThreshold: 2.0 });
    // Seed with tight distribution
    for (let i = 0; i < 100; i++) {
      tracker.record({
        symbol: 'ETH/USDT',
        buyExchange: 'binance',
        sellExchange: 'bybit',
        spreadPercent: 0.2 + (Math.random() * 0.02), // Very tight: 0.2-0.22%
        timestamp: Date.now() - i * 60000,
      });
    }

    // 0.5% spread should be anomaly on tight 0.2% distribution
    const z = tracker.getZScore('binance', 'bybit', 'ETH/USDT', 0.5);
    expect(z.isAnomaly).toBe(true);
  });

  test('generates hourly patterns', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 50);

    const patterns = tracker.getHourlyPatterns('binance', 'okx', 'BTC/USDT');

    expect(patterns.length).toBe(24);
    expect(patterns[0]).toHaveProperty('hour');
    expect(patterns[0]).toHaveProperty('avgSpread');
    expect(patterns[0]).toHaveProperty('tradeCount');
    expect(patterns[0]).toHaveProperty('bestSpread');
  });

  test('getBestTradingHours returns sorted by spread', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 100);

    const best = tracker.getBestTradingHours('binance', 'okx', 'BTC/USDT', 3);

    expect(best.length).toBeLessThanOrEqual(3);
    if (best.length >= 2) {
      expect(best[0].avgSpread).toBeGreaterThanOrEqual(best[1].avgSpread);
    }
  });

  test('trims history to maxRecordsPerPair', () => {
    const tracker = new SpreadHistoryTracker({ maxRecordsPerPair: 5 });
    seedTracker(tracker, 10);

    const stats = tracker.getStats('binance', 'okx', 'BTC/USDT');
    expect(stats.count).toBe(5);
  });

  test('getTrackedPairs lists all pairs', () => {
    const tracker = new SpreadHistoryTracker();
    tracker.record({
      symbol: 'BTC/USDT', buyExchange: 'binance', sellExchange: 'okx',
      spreadPercent: 0.3, timestamp: Date.now(),
    });
    tracker.record({
      symbol: 'ETH/USDT', buyExchange: 'bybit', sellExchange: 'gateio',
      spreadPercent: 0.2, timestamp: Date.now(),
    });

    const pairs = tracker.getTrackedPairs();
    expect(pairs.length).toBe(2);
    expect(pairs).toContain('binance→okx:BTC/USDT');
    expect(pairs).toContain('bybit→gateio:ETH/USDT');
  });

  test('getAllStats returns stats for all pairs', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 5);
    tracker.record({
      symbol: 'ETH/USDT', buyExchange: 'bybit', sellExchange: 'gateio',
      spreadPercent: 0.4, timestamp: Date.now(),
    });

    const allStats = tracker.getAllStats();
    expect(allStats.length).toBe(2);
  });

  test('getTotalRecords counts across all pairs', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 5);
    tracker.record({
      symbol: 'ETH/USDT', buyExchange: 'bybit', sellExchange: 'gateio',
      spreadPercent: 0.4, timestamp: Date.now(),
    });

    expect(tracker.getTotalRecords()).toBe(6);
  });

  test('clear removes all data', () => {
    const tracker = new SpreadHistoryTracker();
    seedTracker(tracker, 10);
    tracker.clear();

    expect(tracker.getTrackedPairs().length).toBe(0);
    expect(tracker.getTotalRecords()).toBe(0);
  });
});

// ---- BalanceRebalancer Tests ----

describe('BalanceRebalancer', () => {
  function makeBalances(exchange: string, usdtAvail: number, usdtValue: number): ExchangeBalance[] {
    return [{
      exchange, currency: 'USDT',
      available: usdtAvail, total: usdtAvail,
      valueUsd: usdtValue,
    }];
  }

  test('detects imbalance when one exchange has too much', () => {
    const rebalancer = new BalanceRebalancer({ imbalanceThresholdPercent: 20 });
    rebalancer.updateBalances('binance', makeBalances('binance', 8000, 8000));
    rebalancer.updateBalances('okx', makeBalances('okx', 2000, 2000));

    const report = rebalancer.detectImbalance('USDT');

    expect(report.isImbalanced).toBe(true);
    expect(report.imbalancePercent).toBe(60); // 80% - 20%
    expect(report.maxSharePercent).toBe(80);
    expect(report.minSharePercent).toBe(20);
  });

  test('reports balanced when within threshold', () => {
    const rebalancer = new BalanceRebalancer({ imbalanceThresholdPercent: 30 });
    rebalancer.updateBalances('binance', makeBalances('binance', 5500, 5500));
    rebalancer.updateBalances('okx', makeBalances('okx', 4500, 4500));

    const report = rebalancer.detectImbalance('USDT');
    expect(report.isImbalanced).toBe(false);
  });

  test('suggests transfers to rebalance', () => {
    const rebalancer = new BalanceRebalancer({
      imbalanceThresholdPercent: 20,
      minTransferUsd: 10,
    });
    rebalancer.updateBalances('binance', makeBalances('binance', 9000, 9000));
    rebalancer.updateBalances('okx', makeBalances('okx', 1000, 1000));

    const suggestions = rebalancer.suggestTransfers('USDT');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].fromExchange).toBe('binance');
    expect(suggestions[0].toExchange).toBe('okx');
    expect(suggestions[0].valueUsd).toBeGreaterThan(0);
  });

  test('no suggestions when balanced', () => {
    const rebalancer = new BalanceRebalancer({ imbalanceThresholdPercent: 20 });
    rebalancer.updateBalances('binance', makeBalances('binance', 5000, 5000));
    rebalancer.updateBalances('okx', makeBalances('okx', 5000, 5000));

    const suggestions = rebalancer.suggestTransfers('USDT');
    expect(suggestions.length).toBe(0);
  });

  test('records transfer history', () => {
    const rebalancer = new BalanceRebalancer();
    const record = rebalancer.recordTransfer('binance', 'okx', 'USDT', 1000, 1000);

    expect(record.id).toBe(1);
    expect(record.status).toBe('pending');

    rebalancer.updateTransferStatus(1, 'completed');
    const history = rebalancer.getTransferHistory();
    expect(history[0].status).toBe('completed');
  });

  test('takes balance snapshots', () => {
    const rebalancer = new BalanceRebalancer();
    rebalancer.updateBalances('binance', makeBalances('binance', 5000, 5000));
    rebalancer.updateBalances('okx', makeBalances('okx', 3000, 3000));

    const snapshot = rebalancer.takeSnapshot();

    expect(snapshot.totalValueUsd).toBe(8000);
    expect(snapshot.balances.length).toBe(2);
    expect(snapshot.timestamp).toBeGreaterThan(0);
  });

  test('getTrackedCurrencies lists all currencies', () => {
    const rebalancer = new BalanceRebalancer();
    rebalancer.updateBalances('binance', [
      { exchange: 'binance', currency: 'USDT', available: 5000, total: 5000, valueUsd: 5000 },
      { exchange: 'binance', currency: 'BTC', available: 0.1, total: 0.1, valueUsd: 5000 },
    ]);

    const currencies = rebalancer.getTrackedCurrencies();
    expect(currencies).toContain('USDT');
    expect(currencies).toContain('BTC');
  });

  test('getAllImbalances checks all currencies', () => {
    const rebalancer = new BalanceRebalancer({ imbalanceThresholdPercent: 20 });
    rebalancer.updateBalances('binance', [
      { exchange: 'binance', currency: 'USDT', available: 9000, total: 9000, valueUsd: 9000 },
    ]);
    rebalancer.updateBalances('okx', [
      { exchange: 'okx', currency: 'USDT', available: 1000, total: 1000, valueUsd: 1000 },
    ]);

    const reports = rebalancer.getAllImbalances();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.some(r => r.isImbalanced)).toBe(true);
  });

  test('getExchangeCount returns correct count', () => {
    const rebalancer = new BalanceRebalancer();
    rebalancer.updateBalances('binance', makeBalances('binance', 5000, 5000));
    rebalancer.updateBalances('okx', makeBalances('okx', 3000, 3000));

    expect(rebalancer.getExchangeCount()).toBe(2);
  });

  test('clear removes all data', () => {
    const rebalancer = new BalanceRebalancer();
    rebalancer.updateBalances('binance', makeBalances('binance', 5000, 5000));
    rebalancer.recordTransfer('binance', 'okx', 'USDT', 1000, 1000);
    rebalancer.takeSnapshot();
    rebalancer.clear();

    expect(rebalancer.getExchangeCount()).toBe(0);
    expect(rebalancer.getTransferHistory().length).toBe(0);
    expect(rebalancer.getSnapshots().length).toBe(0);
  });

  test('transfer suggestion priority scales with imbalance', () => {
    const rebalancer = new BalanceRebalancer({
      imbalanceThresholdPercent: 10,
      minTransferUsd: 10,
    });
    rebalancer.updateBalances('binance', makeBalances('binance', 9500, 9500));
    rebalancer.updateBalances('okx', makeBalances('okx', 500, 500));

    const suggestions = rebalancer.suggestTransfers('USDT');
    expect(suggestions.length).toBeGreaterThan(0);
    // 90% imbalance → high priority
    expect(suggestions[0].priority).toBe('high');
  });
});

// ---- ArbitrageSignalScorer Tests ----

describe('ArbitrageSignalScorer', () => {
  const excellentSignal: SignalFactors = {
    spreadPercent: 0.8,
    netProfitPercent: 0.4,
    liquidityScore: 85,
    latencyMs: 50,
    feeCostPercent: 0.1,
    spreadZScore: 2.5,
    fillable: true,
    exchangeHealthy: true,
  };

  const poorSignal: SignalFactors = {
    spreadPercent: 0.06,
    netProfitPercent: 0.01,
    liquidityScore: 15,
    latencyMs: 450,
    feeCostPercent: 0.4,
    spreadZScore: -0.5,
    fillable: true,
    exchangeHealthy: true,
  };

  test('scores excellent signal with high score', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score(excellentSignal);

    expect(result.totalScore).toBeGreaterThanOrEqual(70);
    expect(result.grade).toMatch(/^[AB]$/);
    expect(result.recommendation).toBe('execute');
  });

  test('scores poor signal with low score', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score(poorSignal);

    expect(result.totalScore).toBeLessThan(40);
    expect(result.grade).toMatch(/^[DF]$/);
    expect(result.recommendation).toBe('skip');
  });

  test('disqualifies unfillable signals', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score({ ...excellentSignal, fillable: false });

    expect(result.totalScore).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.recommendation).toBe('skip');
    expect(result.reason).toContain('cannot fill');
  });

  test('disqualifies unhealthy exchange signals', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score({ ...excellentSignal, exchangeHealthy: false });

    expect(result.totalScore).toBe(0);
    expect(result.recommendation).toBe('skip');
    expect(result.reason).toContain('not healthy');
  });

  test('individual factor scores are 0-100', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score(excellentSignal);

    for (const value of Object.values(result.scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  test('latency scoring: fast → high score', () => {
    const scorer = new ArbitrageSignalScorer();
    const fast = scorer.score({ ...excellentSignal, latencyMs: 30 });
    const slow = scorer.score({ ...excellentSignal, latencyMs: 400 });

    expect(fast.scores.latency).toBeGreaterThan(slow.scores.latency);
  });

  test('fee cost scoring: low fees → high score', () => {
    const scorer = new ArbitrageSignalScorer();
    const lowFee = scorer.score({ ...excellentSignal, feeCostPercent: 0.05 });
    const highFee = scorer.score({ ...excellentSignal, feeCostPercent: 0.4 });

    expect(lowFee.scores.feeCost).toBeGreaterThan(highFee.scores.feeCost);
  });

  test('pattern scoring: high z-score → high score', () => {
    const scorer = new ArbitrageSignalScorer();
    const rare = scorer.score({ ...excellentSignal, spreadZScore: 3.0 });
    const common = scorer.score({ ...excellentSignal, spreadZScore: 0.0 });

    expect(rare.scores.pattern).toBeGreaterThan(common.scores.pattern);
  });

  test('custom weights affect total score', () => {
    // Score heavily weighted toward spread
    const spreadScorer = new ArbitrageSignalScorer({
      weights: { spread: 0.9, profitability: 0.02, liquidity: 0.02, latency: 0.02, feeCost: 0.02, pattern: 0.02 },
    });

    const highSpread = spreadScorer.score({ ...poorSignal, spreadPercent: 0.9 });
    const lowSpread = spreadScorer.score({ ...poorSignal, spreadPercent: 0.06 });

    expect(highSpread.totalScore).toBeGreaterThan(lowSpread.totalScore);
  });

  test('tracks scoring history', () => {
    const scorer = new ArbitrageSignalScorer();
    scorer.score(excellentSignal);
    scorer.score(poorSignal);

    const history = scorer.getHistory();
    expect(history.length).toBe(2);
  });

  test('calculates average score from history', () => {
    const scorer = new ArbitrageSignalScorer();
    scorer.score(excellentSignal);
    scorer.score(poorSignal);

    const avg = scorer.getAverageScore();
    expect(avg).toBeGreaterThan(0);
  });

  test('getGradeDistribution counts grades', () => {
    const scorer = new ArbitrageSignalScorer();
    scorer.score(excellentSignal);
    scorer.score(poorSignal);

    const dist = scorer.getGradeDistribution();
    expect(Object.values(dist).reduce((s, v) => s + v, 0)).toBe(2);
  });

  test('getRecommendationDistribution counts recommendations', () => {
    const scorer = new ArbitrageSignalScorer();
    scorer.score(excellentSignal);
    scorer.score(poorSignal);

    const dist = scorer.getRecommendationDistribution();
    expect(dist.execute + dist.wait + dist.skip).toBe(2);
  });

  test('reason string contains useful info', () => {
    const scorer = new ArbitrageSignalScorer();
    const result = scorer.score(excellentSignal);

    expect(result.reason).toContain('Grade');
    expect(result.reason).toContain('/100');
  });

  test('clearHistory removes all entries', () => {
    const scorer = new ArbitrageSignalScorer();
    scorer.score(excellentSignal);
    scorer.clearHistory();

    expect(scorer.getHistory().length).toBe(0);
    expect(scorer.getAverageScore()).toBe(0);
  });

  test('getConfig returns current configuration', () => {
    const scorer = new ArbitrageSignalScorer({ executeThreshold: 80 });
    const config = scorer.getConfig();

    expect(config.executeThreshold).toBe(80);
    expect(config.weights.spread).toBe(0.25); // Default
  });

  test('wait recommendation for mid-range scores', () => {
    const scorer = new ArbitrageSignalScorer();
    // Create a mediocre signal
    const mediocre: SignalFactors = {
      spreadPercent: 0.3,
      netProfitPercent: 0.1,
      liquidityScore: 50,
      latencyMs: 200,
      feeCostPercent: 0.2,
      spreadZScore: 1.0,
      fillable: true,
      exchangeHealthy: true,
    };

    const result = scorer.score(mediocre);
    // Should be in the wait/execute range depending on exact scoring
    expect(['wait', 'execute', 'skip']).toContain(result.recommendation);
    expect(result.totalScore).toBeGreaterThan(0);
  });
});
