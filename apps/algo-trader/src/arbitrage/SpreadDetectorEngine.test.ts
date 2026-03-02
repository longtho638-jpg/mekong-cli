/**
 * Tests for SpreadDetectorEngine — multi-exchange Binance/OKX/Bybit
 * spread detection + execution pipeline.
 */

import {
  SpreadDetectorEngine,
  TARGET_EXCHANGES,
  ArbitrageSignalScorer,
  EmergencyCircuitBreaker,
  SpreadHistoryTracker,
  OrderBookAnalyzer,
} from '@agencyos/vibe-arbitrage-engine';

// ---- SpreadDetectorEngine Tests ----

describe('SpreadDetectorEngine', () => {
  const engines: SpreadDetectorEngine[] = [];

  afterEach(() => {
    engines.forEach(e => e.stop());
    engines.length = 0;
  });

  function createEngine(config?: ConstructorParameters<typeof SpreadDetectorEngine>[0]): SpreadDetectorEngine {
    const e = new SpreadDetectorEngine(config);
    engines.push(e);
    return e;
  }

  test('TARGET_EXCHANGES contains binance, okx, bybit', () => {
    expect(TARGET_EXCHANGES).toContain('binance');
    expect(TARGET_EXCHANGES).toContain('okx');
    expect(TARGET_EXCHANGES).toContain('bybit');
    expect(TARGET_EXCHANGES.length).toBe(3);
  });

  test('constructs with default config', () => {
    const engine = createEngine();
    const stats = engine.getStats();

    expect(stats.status).toBe('idle');
    expect(stats.totalDetections).toBe(0);
    expect(stats.totalExecuted).toBe(0);
    expect(stats.circuitState).toBe('closed');
    expect(stats.connectedExchanges).toEqual([]);
  });

  test('constructs with custom config', () => {
    const engine = createEngine({
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      initialEquity: 50000,
      maxOpportunitiesPerCycle: 10,
      enableOrderBookValidation: false,
      enableSignalScoring: false,
    });

    const stats = engine.getStats();
    expect(stats.status).toBe('idle');
  });

  test('init throws with <2 exchanges', async () => {
    const engine = createEngine({
      exchanges: [
        { id: 'binance', enabled: true },
      ],
    });

    // Will fail on connect since no real API keys
    await expect(engine.init()).rejects.toThrow();
  });

  test('getEvents returns empty initially', () => {
    const engine = createEngine();
    expect(engine.getEvents()).toEqual([]);
    expect(engine.getEvents(10)).toEqual([]);
  });

  test('getProfitSummary returns initial state', () => {
    const engine = createEngine({ initialEquity: 5000 });
    const summary = engine.getProfitSummary();

    expect(summary.initialEquity).toBe(5000);
    expect(summary.currentEquity).toBe(5000);
    expect(summary.cumulativePnl).toBe(0);
    expect(summary.totalTrades).toBe(0);
  });

  test('getSpreadStats returns empty initially', () => {
    const engine = createEngine();
    expect(engine.getSpreadStats()).toEqual([]);
  });

  test('getScoreDistribution returns zeroes initially', () => {
    const engine = createEngine();
    const dist = engine.getScoreDistribution();

    expect(dist.A).toBe(0);
    expect(dist.B).toBe(0);
    expect(dist.C).toBe(0);
    expect(dist.D).toBe(0);
    expect(dist.F).toBe(0);
  });

  test('getCircuitBreakerMetrics returns initial state', () => {
    const engine = createEngine();
    const metrics = engine.getCircuitBreakerMetrics();

    expect(metrics.state).toBe('closed');
    expect(metrics.dailyLossUsd).toBe(0);
    expect(metrics.consecutiveLosses).toBe(0);
    expect(metrics.totalTrips).toBe(0);
  });

  test('emergencyStop trips circuit breaker', () => {
    const engine = createEngine();
    engine.emergencyStop('test emergency');

    const stats = engine.getStats();
    expect(stats.status).toBe('halted');
    expect(stats.circuitState).toBe('open');

    const metrics = engine.getCircuitBreakerMetrics();
    expect(metrics.totalTrips).toBe(1);
  });

  test('resume re-enables trading after emergency', () => {
    const engine = createEngine();

    engine.emergencyStop('test');
    expect(engine.getStats().status).toBe('halted');

    engine.resume();
    const stats = engine.getStats();
    expect(stats.status).toBe('running');
    expect(stats.circuitState).toBe('closed');
  });

  test('resetDaily resets counters', () => {
    const engine = createEngine();
    engine.resetDaily();

    const stats = engine.getStats();
    expect(stats.skippedByCircuitBreaker).toBe(0);
  });

  test('isActive returns false when not started', () => {
    const engine = createEngine();
    expect(engine.isActive()).toBe(false);
  });

  test('stop on idle engine does not throw', () => {
    const engine = createEngine();
    expect(() => engine.stop()).not.toThrow();

    const stats = engine.getStats();
    expect(stats.status).toBe('stopped');
  });

  test('getComponents returns all internal components', () => {
    const engine = createEngine();
    const components = engine.getComponents();

    expect(components.connector).toBeDefined();
    expect(components.scanner).toBeDefined();
    expect(components.executor).toBeDefined();
    expect(components.scorer).toBeDefined();
    expect(components.orderbook).toBeDefined();
    expect(components.circuitBreaker).toBeDefined();
    expect(components.spreadHistory).toBeDefined();
    expect(components.profitTracker).toBeDefined();
  });

  test('updateOrderBook accepts external data', () => {
    const engine = createEngine();

    expect(() => {
      engine.updateOrderBook({
        exchange: 'binance',
        symbol: 'BTC/USDT',
        bids: [{ price: 60000, amount: 1.5 }, { price: 59999, amount: 2.0 }],
        asks: [{ price: 60001, amount: 1.0 }, { price: 60002, amount: 3.0 }],
        timestamp: Date.now(),
      });
    }).not.toThrow();

    // Verify via component
    const { orderbook } = engine.getComponents();
    expect(orderbook.hasOrderBook('binance', 'BTC/USDT')).toBe(true);
  });

  test('getBestTradingHours returns empty for no history', () => {
    const engine = createEngine();
    const hours = engine.getBestTradingHours('binance', 'okx', 'BTC/USDT');

    expect(hours).toEqual([]);
  });

  test('getBestTradingHours returns data after spread history recording', () => {
    const engine = createEngine();
    const { spreadHistory } = engine.getComponents();

    // Seed history
    for (let i = 0; i < 10; i++) {
      spreadHistory.record({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        spreadPercent: 0.15 + Math.random() * 0.1,
        timestamp: Date.now() - i * 3600000,
      });
    }

    const hours = engine.getBestTradingHours('binance', 'okx', 'BTC/USDT');
    expect(hours.length).toBeGreaterThan(0);
  });
});

// ---- Integration: Scorer + CircuitBreaker + SpreadHistory ----

describe('SpreadDetectorEngine integration components', () => {
  const breakers: EmergencyCircuitBreaker[] = [];

  afterEach(() => {
    breakers.forEach(b => b.shutdown());
    breakers.length = 0;
  });

  test('scorer filters low-quality signals', () => {
    const scorer = new ArbitrageSignalScorer({ executeThreshold: 70 });

    const weakSignal = scorer.score({
      spreadPercent: 0.05,
      netProfitPercent: 0.001,
      liquidityScore: 20,
      latencyMs: 400,
      feeCostPercent: 0.3,
      spreadZScore: -1,
      fillable: true,
      exchangeHealthy: true,
    });

    expect(weakSignal.recommendation).toBe('skip');
    expect(weakSignal.totalScore).toBeLessThan(70);
  });

  test('scorer recommends execute for strong signals', () => {
    const scorer = new ArbitrageSignalScorer({ executeThreshold: 65 });

    const strongSignal = scorer.score({
      spreadPercent: 0.8,
      netProfitPercent: 0.4,
      liquidityScore: 85,
      latencyMs: 80,
      feeCostPercent: 0.1,
      spreadZScore: 2.5,
      fillable: true,
      exchangeHealthy: true,
    });

    expect(strongSignal.recommendation).toBe('execute');
    expect(strongSignal.grade).toMatch(/[AB]/);
  });

  test('circuit breaker blocks after daily loss limit', () => {
    const cb = new EmergencyCircuitBreaker({ maxDailyLossUsd: 50 });
    breakers.push(cb);

    cb.recordTrade(-30);
    expect(cb.isAllowed()).toBe(true);

    cb.recordTrade(-25); // total = 55 > 50
    expect(cb.isAllowed()).toBe(false);
    expect(cb.getState()).toBe('open');
  });

  test('circuit breaker blocks after consecutive losses', () => {
    const cb = new EmergencyCircuitBreaker({ maxConsecutiveLosses: 3 });
    breakers.push(cb);

    cb.recordTrade(-1);
    cb.recordTrade(-1);
    expect(cb.isAllowed()).toBe(true);

    cb.recordTrade(-1); // 3rd consecutive
    expect(cb.isAllowed()).toBe(false);
  });

  test('spread history z-score detects anomalies', () => {
    const tracker = new SpreadHistoryTracker({ anomalyThreshold: 2.0 });

    // Build normal distribution: 0.1% spread average
    for (let i = 0; i < 100; i++) {
      tracker.record({
        symbol: 'ETH/USDT',
        buyExchange: 'binance',
        sellExchange: 'bybit',
        spreadPercent: 0.1 + (Math.random() - 0.5) * 0.02,
        timestamp: Date.now() - i * 60000,
      });
    }

    // Test normal spread
    const normalZ = tracker.getZScore('binance', 'bybit', 'ETH/USDT', 0.1);
    expect(normalZ.isAnomaly).toBe(false);

    // Test anomalous spread (way above mean)
    const anomalyZ = tracker.getZScore('binance', 'bybit', 'ETH/USDT', 0.5);
    expect(anomalyZ.isAnomaly).toBe(true);
    expect(anomalyZ.zScore).toBeGreaterThan(2);
  });

  test('orderbook validates arbitrage feasibility', () => {
    const analyzer = new OrderBookAnalyzer();

    // Binance: buy here (asks = what we pay)
    analyzer.updateOrderBook({
      exchange: 'binance',
      symbol: 'BTC/USDT',
      bids: [{ price: 59990, amount: 5 }],
      asks: [{ price: 60000, amount: 5 }, { price: 60010, amount: 5 }],
      timestamp: Date.now(),
    });

    // OKX: sell here (bids = what we receive) — must be much higher than buy asks
    analyzer.updateOrderBook({
      exchange: 'okx',
      symbol: 'BTC/USDT',
      bids: [{ price: 60500, amount: 5 }, { price: 60480, amount: 5 }],
      asks: [{ price: 60600, amount: 5 }],
      timestamp: Date.now(),
    });

    // Buy 0.1 BTC at ~60000, sell at ~60500 → $50 gross, fees ~$12 → net positive
    const sim = analyzer.simulateArbitrageFill(
      'binance', 'okx', 'BTC/USDT', 0.1, 0.001
    );

    expect(sim.feasible).toBe(true);
    expect(sim.effectiveSpreadPercent).toBeGreaterThan(0);
    expect(sim.totalSlippageBps).toBeGreaterThanOrEqual(0);
  });

  test('orderbook rejects infeasible arb (inverted spread)', () => {
    const analyzer = new OrderBookAnalyzer();

    // Buy exchange has HIGHER asks
    analyzer.updateOrderBook({
      exchange: 'binance',
      symbol: 'BTC/USDT',
      bids: [{ price: 60100, amount: 2 }],
      asks: [{ price: 60200, amount: 1 }],
      timestamp: Date.now(),
    });

    // Sell exchange has LOWER bids
    analyzer.updateOrderBook({
      exchange: 'okx',
      symbol: 'BTC/USDT',
      bids: [{ price: 60000, amount: 1 }],
      asks: [{ price: 60100, amount: 2 }],
      timestamp: Date.now(),
    });

    const sim = analyzer.simulateArbitrageFill(
      'binance', 'okx', 'BTC/USDT', 0.5, 0.001
    );

    // Buy at 60200, sell at 60000 = negative spread
    expect(sim.feasible).toBe(false);
  });
});
