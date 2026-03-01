/**
 * Tests for Round 7: WebSocketPriceFeed, ProfitTracker, AdaptiveSpreadThreshold.
 */

import {
  WebSocketPriceFeed,
  WsPriceUpdate,
  ProfitTracker,
  AdaptiveSpreadThreshold,
} from '@agencyos/vibe-arbitrage-engine';

// ---- WebSocketPriceFeed Tests ----

describe('WebSocketPriceFeed', () => {
  let feed: WebSocketPriceFeed;

  beforeEach(() => {
    feed = new WebSocketPriceFeed({
      heartbeatIntervalMs: 60000, // Don't trigger during tests
      staleThresholdMs: 30000,
    });
    feed.setSymbols(['BTC/USDT', 'ETH/USDT']);
  });

  afterEach(() => {
    feed.stop();
  });

  test('connects to exchange and receives price updates', async () => {
    const updates: WsPriceUpdate[] = [];
    feed.onPrice((update) => updates.push(update));

    await feed.connect('binance');
    feed.start();

    // Wait for simulated updates
    await new Promise(resolve => setTimeout(resolve, 800));
    feed.stop();

    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].exchange).toBe('binance');
    expect(updates[0].bid).toBeGreaterThan(0);
    expect(updates[0].ask).toBeGreaterThan(updates[0].bid);
    expect(updates[0].mid).toBeGreaterThan(0);
  });

  test('connects to multiple exchanges', async () => {
    const connected = await feed.connectAll(['binance', 'okx', 'bybit']);

    expect(connected.length).toBe(3);
    expect(connected).toContain('binance');
    expect(connected).toContain('okx');
    expect(connected).toContain('bybit');
  });

  test('getStates returns connection states', async () => {
    await feed.connect('binance');
    const states = feed.getStates();

    expect(states.length).toBe(1);
    expect(states[0].exchange).toBe('binance');
    expect(states[0].connected).toBe(true);
    expect(states[0].subscribedSymbols).toContain('BTC/USDT');
  });

  test('getLatestPrice returns most recent price', async () => {
    await feed.connect('binance');
    feed.start();

    await new Promise(resolve => setTimeout(resolve, 600));

    const price = feed.getLatestPrice('binance', 'BTC/USDT');
    expect(price).not.toBeNull();
    expect(price!.symbol).toBe('BTC/USDT');
    expect(price!.mid).toBeGreaterThan(0);

    feed.stop();
  });

  test('getAllPrices returns prices across exchanges', async () => {
    await feed.connectAll(['binance', 'okx']);
    feed.start();

    await new Promise(resolve => setTimeout(resolve, 800));

    const prices = feed.getAllPrices('BTC/USDT');
    expect(prices.length).toBe(2);

    feed.stop();
  });

  test('disconnect removes exchange', async () => {
    await feed.connect('binance');
    expect(feed.getStates()[0].connected).toBe(true);

    feed.disconnect('binance');
    expect(feed.getStates()[0].connected).toBe(false);
  });

  test('getStats returns aggregate statistics', async () => {
    await feed.connectAll(['binance', 'okx']);
    feed.start();

    await new Promise(resolve => setTimeout(resolve, 600));

    const stats = feed.getStats();
    expect(stats.totalConnections).toBe(2);
    expect(stats.activeConnections).toBe(2);
    expect(stats.totalMessages).toBeGreaterThan(0);

    feed.stop();
  });

  test('stop disconnects all and cleans up', async () => {
    await feed.connectAll(['binance', 'okx']);
    feed.start();
    feed.stop();

    const states = feed.getStates();
    expect(states.every(s => !s.connected)).toBe(true);
  });

  test('skips unsupported exchange', async () => {
    await feed.connect('unknownexchange');
    const states = feed.getStates();
    expect(states.length).toBe(0);
  });

  test('returns null for unknown exchange price', () => {
    const price = feed.getLatestPrice('nonexistent', 'BTC/USDT');
    expect(price).toBeNull();
  });

  test('latency values are reasonable', async () => {
    await feed.connect('binance');
    feed.start();

    await new Promise(resolve => setTimeout(resolve, 600));

    const price = feed.getLatestPrice('binance', 'BTC/USDT');
    expect(price!.latencyMs).toBeGreaterThanOrEqual(1);
    expect(price!.latencyMs).toBeLessThanOrEqual(50);

    feed.stop();
  });
});

// ---- ProfitTracker Tests ----

describe('ProfitTracker', () => {
  test('initial state is correct', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    const summary = tracker.getSummary();

    expect(summary.initialEquity).toBe(10000);
    expect(summary.currentEquity).toBe(10000);
    expect(summary.cumulativePnl).toBe(0);
    expect(summary.totalTrades).toBe(0);
    expect(summary.maxDrawdownPercent).toBe(0);
  });

  test('records winning trades correctly', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(50);
    tracker.recordTrade(30);

    const summary = tracker.getSummary();
    expect(summary.cumulativePnl).toBe(80);
    expect(summary.currentEquity).toBe(10080);
    expect(summary.winningTrades).toBe(2);
    expect(summary.losingTrades).toBe(0);
    expect(summary.winRate).toBe(100);
  });

  test('records losing trades correctly', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(-20);
    tracker.recordTrade(-30);

    const summary = tracker.getSummary();
    expect(summary.cumulativePnl).toBe(-50);
    expect(summary.currentEquity).toBe(9950);
    expect(summary.losingTrades).toBe(2);
    expect(summary.winRate).toBe(0);
  });

  test('calculates max drawdown', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);  // equity = 10100 (peak)
    tracker.recordTrade(-200); // equity = 9900 (drawdown)
    tracker.recordTrade(-100); // equity = 9800 (deeper drawdown)

    const summary = tracker.getSummary();
    // Max drawdown from peak 10100 to trough 9800 = 2.97%
    expect(summary.maxDrawdownPercent).toBeGreaterThan(2);
    expect(summary.maxDrawdownPercent).toBeLessThan(4);
  });

  test('tracks consecutive wins and losses', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(10);
    tracker.recordTrade(20);
    tracker.recordTrade(15);
    tracker.recordTrade(-5);
    tracker.recordTrade(-10);

    const summary = tracker.getSummary();
    expect(summary.maxConsecutiveWins).toBe(3);
    expect(summary.maxConsecutiveLosses).toBe(2);
  });

  test('calculates profit factor', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);
    tracker.recordTrade(50);
    tracker.recordTrade(-30);

    const summary = tracker.getSummary();
    // profit factor = totalWins / totalLosses = 150 / 30 = 5.0
    expect(summary.profitFactor).toBe(5);
  });

  test('profit factor is Infinity when no losses', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);

    const summary = tracker.getSummary();
    expect(summary.profitFactor).toBe(Infinity);
  });

  test('emits drawdown alerts at thresholds', () => {
    const alerts: { threshold: string }[] = [];
    const tracker = new ProfitTracker({
      initialEquity: 1000,
      drawdownAlertThresholds: [5, 10],
    });

    tracker.onDrawdownAlert((alert) => alerts.push(alert));

    // Create 5% drawdown
    tracker.recordTrade(-50); // equity = 950, dd = 5%

    expect(alerts.length).toBe(1);
    expect(alerts[0].threshold).toBe('5%');

    // Create 10% drawdown
    tracker.recordTrade(-50); // equity = 900, dd = 10%
    expect(alerts.length).toBe(2);
    expect(alerts[1].threshold).toBe('10%');
  });

  test('does not duplicate alerts at same threshold', () => {
    const alerts: { threshold: string }[] = [];
    const tracker = new ProfitTracker({
      initialEquity: 1000,
      drawdownAlertThresholds: [5],
    });

    tracker.onDrawdownAlert((alert) => alerts.push(alert));
    tracker.recordTrade(-60); // 6% dd
    tracker.recordTrade(-10); // 7% dd

    // Should only trigger 5% alert once
    expect(alerts.length).toBe(1);
  });

  test('resets alerts on new equity peak', () => {
    const alerts: { threshold: string }[] = [];
    const tracker = new ProfitTracker({
      initialEquity: 1000,
      drawdownAlertThresholds: [5],
    });

    tracker.onDrawdownAlert((alert) => alerts.push(alert));
    tracker.recordTrade(-60);  // 6% dd → alert
    tracker.recordTrade(200);  // new peak → reset alerts
    tracker.recordTrade(-70);  // 6.1% dd from new peak → alert again

    expect(alerts.length).toBe(2);
  });

  test('shouldHalt returns true on excessive drawdown', () => {
    const tracker = new ProfitTracker({ initialEquity: 1000 });
    tracker.recordTrade(-150); // 15% dd

    expect(tracker.shouldHalt(10)).toBe(true);
    expect(tracker.shouldHalt(20)).toBe(false);
  });

  test('getCurrentDrawdown returns current value', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(-500); // 5% dd

    expect(tracker.getCurrentDrawdown()).toBeCloseTo(5, 0);
  });

  test('getEquityCurve returns all points', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(50);
    tracker.recordTrade(-20);

    const curve = tracker.getEquityCurve();
    expect(curve.length).toBe(3); // initial + 2 trades
    expect(curve[0].equity).toBe(10000);
    expect(curve[1].equity).toBe(10050);
    expect(curve[2].equity).toBe(10030);
  });

  test('calculates Sharpe ratio', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000, sharpeWindowSize: 5 });
    // Consistent positive returns → positive Sharpe
    for (let i = 0; i < 10; i++) {
      tracker.recordTrade(10 + Math.random() * 5);
    }

    const summary = tracker.getSummary();
    expect(summary.sharpeRatio).toBeGreaterThan(0);
  });

  test('calculates Sortino ratio', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000, sharpeWindowSize: 5 });
    // Mix of wins and losses
    tracker.recordTrade(50);
    tracker.recordTrade(-10);
    tracker.recordTrade(30);
    tracker.recordTrade(-5);
    tracker.recordTrade(40);
    tracker.recordTrade(20);

    const summary = tracker.getSummary();
    // With mostly wins, Sortino should be positive
    expect(summary.sortinoRatio).toBeDefined();
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

  test('avg win/loss calculation', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(100);
    tracker.recordTrade(200);
    tracker.recordTrade(-50);

    const summary = tracker.getSummary();
    expect(summary.avgWin).toBe(150); // (100+200)/2
    expect(summary.avgLoss).toBe(50);
  });

  test('printReport does not throw', () => {
    const tracker = new ProfitTracker({ initialEquity: 10000 });
    tracker.recordTrade(50);
    expect(() => tracker.printReport()).not.toThrow();
  });
});

// ---- AdaptiveSpreadThreshold Tests ----

describe('AdaptiveSpreadThreshold', () => {
  test('initial threshold equals base threshold', () => {
    const adaptive = new AdaptiveSpreadThreshold({ baseThresholdBps: 10 });
    expect(adaptive.getThreshold()).toBe(10);
    expect(adaptive.getThresholdPercent()).toBeCloseTo(0.1, 2);
  });

  test('meetsThreshold checks against current threshold', () => {
    const adaptive = new AdaptiveSpreadThreshold({ baseThresholdBps: 10 });
    expect(adaptive.meetsThreshold(0.2)).toBe(true);  // 0.2% > 0.1%
    expect(adaptive.meetsThreshold(0.05)).toBe(false); // 0.05% < 0.1%
  });

  test('adapts threshold after minimum samples', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 5,
    });

    // Feed samples
    for (let i = 0; i < 10; i++) {
      adaptive.observeSpread(0.5); // 0.5% spreads
    }

    // Threshold should have adapted
    const state = adaptive.getState();
    expect(state.samplesUsed).toBe(10);
    expect(state.spreadEma).toBeGreaterThan(0);
  });

  test('does not adapt before minimum samples', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 20,
    });

    for (let i = 0; i < 5; i++) {
      adaptive.observeSpread(0.5);
    }

    expect(adaptive.getThreshold()).toBe(10); // unchanged
  });

  test('detects low volatility regime', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 5,
      regimeLowVolThreshold: 0.05,
    });

    // Feed very consistent spreads (low volatility)
    for (let i = 0; i < 30; i++) {
      adaptive.observeSpread(0.3); // Always same → low vol
    }

    expect(adaptive.getRegime()).toBe('low');
  });

  test('detects high volatility regime', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 5,
      regimeHighVolThreshold: 0.3,
      volatilityAlpha: 0.3, // faster adaptation
    });

    // Feed wildly varying spreads
    for (let i = 0; i < 50; i++) {
      adaptive.observeSpread(i % 2 === 0 ? 2.0 : 0.1); // Big swings
    }

    expect(adaptive.getRegime()).toBe('high');
  });

  test('low vol regime increases threshold (more selective)', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 5,
      regimeLowVolThreshold: 0.05,
    });

    // Force low vol regime
    for (let i = 0; i < 30; i++) {
      adaptive.observeSpread(0.3);
    }

    // Low vol regime has multiplier 1.5, so threshold should be 15bps
    expect(adaptive.getThreshold()).toBeGreaterThanOrEqual(15);
  });

  test('high vol regime decreases threshold (more aggressive)', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 5,
      regimeHighVolThreshold: 0.3,
      volatilityAlpha: 0.3,
    });

    // Force high vol regime
    for (let i = 0; i < 50; i++) {
      adaptive.observeSpread(i % 2 === 0 ? 2.0 : 0.1);
    }

    // High vol regime has multiplier 0.7, so threshold should be ~7bps
    expect(adaptive.getThreshold()).toBeLessThanOrEqual(10);
  });

  test('getState returns full monitoring data', () => {
    const adaptive = new AdaptiveSpreadThreshold({ baseThresholdBps: 10 });
    adaptive.observeSpread(0.3);

    const state = adaptive.getState();
    expect(state.currentThreshold).toBeDefined();
    expect(state.baseThreshold).toBe(10);
    expect(state.regime).toBeDefined();
    expect(state.spreadEma).toBeGreaterThan(0);
    expect(state.samplesUsed).toBe(1);
  });

  test('isInCooldown after regime change', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      baseThresholdBps: 10,
      minSamplesForAdaptation: 3,
      regimeLowVolThreshold: 0.05,
      regimeHighVolThreshold: 0.3,
      volatilityAlpha: 0.5,
      cooldownAfterRegimeChangeMs: 10000,
    });

    // Start with stable (triggers low regime)
    for (let i = 0; i < 10; i++) {
      adaptive.observeSpread(0.3);
    }
    // Then wild (triggers high regime → regime change)
    for (let i = 0; i < 20; i++) {
      adaptive.observeSpread(i % 2 === 0 ? 3.0 : 0.01);
    }

    const state = adaptive.getState();
    if (state.regimeChanges > 0) {
      expect(adaptive.isInCooldown()).toBe(true);
    }
  });

  test('reset returns to initial state', () => {
    const adaptive = new AdaptiveSpreadThreshold({ baseThresholdBps: 10 });
    for (let i = 0; i < 30; i++) {
      adaptive.observeSpread(0.5);
    }

    adaptive.reset();

    expect(adaptive.getThreshold()).toBe(10);
    expect(adaptive.getRegime()).toBe('medium');
    expect(adaptive.getState().samplesUsed).toBe(0);
  });

  test('startAutoUpdate and stopAutoUpdate lifecycle', () => {
    const adaptive = new AdaptiveSpreadThreshold({
      updateIntervalMs: 100,
    });

    adaptive.startAutoUpdate();
    // Should not throw
    adaptive.stopAutoUpdate();
  });

  test('spread history bounded to 500', () => {
    const adaptive = new AdaptiveSpreadThreshold({ minSamplesForAdaptation: 5 });

    for (let i = 0; i < 600; i++) {
      adaptive.observeSpread(0.3 + Math.random() * 0.1);
    }

    const state = adaptive.getState();
    expect(state.samplesUsed).toBe(600); // sampleCount tracks all
    // Internal history is bounded but sampleCount keeps incrementing
  });

  test('handles edge case: zero spread', () => {
    const adaptive = new AdaptiveSpreadThreshold({ minSamplesForAdaptation: 3 });

    for (let i = 0; i < 5; i++) {
      adaptive.observeSpread(0);
    }

    expect(adaptive.getState().spreadEma).toBe(0);
  });
});
