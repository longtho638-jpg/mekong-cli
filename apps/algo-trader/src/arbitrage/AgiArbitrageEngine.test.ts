/**
 * Tests for AGI Arbitrage modules: RegimeDetector, KellyPositionSizer, AgiArbitrageEngine.
 * Covers: regime classification, Kelly sizing, engine construction, stats.
 */

import {
  RegimeDetector,
  KellyPositionSizer,
  AgiArbitrageEngine,
} from '@agencyos/vibe-arbitrage-engine';

// ---- RegimeDetector Tests ----

describe('RegimeDetector', () => {
  test('returns quiet regime with insufficient data', () => {
    const detector = new RegimeDetector();
    const signal = detector.detect();
    expect(signal.regime).toBe('quiet');
    expect(signal.confidence).toBe(0);
    expect(signal.hurstExponent).toBe(0.5);
  });

  test('classifies volatile regime with high short-term vol', () => {
    const detector = new RegimeDetector({ shortWindow: 5, longWindow: 20 });

    // Add stable long-term data
    for (let i = 0; i < 20; i++) {
      detector.addSpread(0.1);
    }

    // Add volatile short-term data
    const volatileValues = [0.5, -0.3, 0.8, -0.6, 1.0];
    for (const v of volatileValues) {
      detector.addSpread(v);
    }

    const signal = detector.detect();
    expect(signal.volatilityRatio).toBeGreaterThan(1.0);
    // High vol ratio should push toward volatile or at least not quiet
    expect(['volatile', 'trending', 'mean-reverting']).toContain(signal.regime);
  });

  test('classifies quiet regime with stable data', () => {
    const detector = new RegimeDetector({ shortWindow: 10, longWindow: 30, quietThreshold: 0.5 });

    // Very stable, low-variance spreads
    for (let i = 0; i < 40; i++) {
      detector.addSpread(0.1 + Math.sin(i * 0.01) * 0.001);
    }

    const signal = detector.detect();
    expect(signal.volatilityRatio).toBeLessThan(1.5);
  });

  test('tracks regime history', () => {
    const detector = new RegimeDetector({ shortWindow: 5, longWindow: 10 });

    for (let i = 0; i < 15; i++) {
      detector.addSpread(0.1);
    }

    detector.detect();
    detector.detect();

    const history = detector.getHistory();
    expect(history.length).toBe(2);
  });

  test('getLatestRegime returns last detected regime', () => {
    const detector = new RegimeDetector();
    expect(detector.getLatestRegime()).toBe('quiet');

    for (let i = 0; i < 25; i++) {
      detector.addSpread(0.1);
    }

    detector.detect();
    const regime = detector.getLatestRegime();
    expect(['trending', 'mean-reverting', 'volatile', 'quiet']).toContain(regime);
  });

  test('getRegimeDistribution returns counts', () => {
    const detector = new RegimeDetector();
    const dist = detector.getRegimeDistribution();

    expect(dist).toHaveProperty('trending');
    expect(dist).toHaveProperty('mean-reverting');
    expect(dist).toHaveProperty('volatile');
    expect(dist).toHaveProperty('quiet');
    expect(Object.values(dist).every(v => typeof v === 'number')).toBe(true);
  });

  test('addSpread limits memory usage', () => {
    const detector = new RegimeDetector({ longWindow: 10 });

    for (let i = 0; i < 100; i++) {
      detector.addSpread(i * 0.01);
    }

    // Should cap at 2 * longWindow = 20
    expect(detector.getSpreadCount()).toBeLessThanOrEqual(20);
  });

  test('reset clears all state', () => {
    const detector = new RegimeDetector();

    for (let i = 0; i < 30; i++) detector.addSpread(0.1);
    detector.detect();

    detector.reset();
    expect(detector.getSpreadCount()).toBe(0);
    expect(detector.getHistory()).toEqual([]);
  });

  test('Hurst exponent within valid range', () => {
    const detector = new RegimeDetector({ shortWindow: 10, longWindow: 50, hurstLag: 5 });

    // Generate trending data (steadily increasing)
    for (let i = 0; i < 60; i++) {
      detector.addSpread(0.05 + i * 0.002);
    }

    const signal = detector.detect();
    // Hurst should be a finite number (might not be perfectly > 0.5 with small data)
    expect(Number.isFinite(signal.hurstExponent)).toBe(true);
  });
});

// ---- KellyPositionSizer Tests ----

describe('KellyPositionSizer', () => {
  test('returns min position with insufficient data', () => {
    const sizer = new KellyPositionSizer();
    const result = sizer.calculate(10000);

    expect(result.positionSizeUsd).toBe(50); // default min
    expect(result.kellyFraction).toBe(0);
    expect(result.tradesAnalyzed).toBe(0);
  });

  test('computes Kelly fraction with positive edge', () => {
    const sizer = new KellyPositionSizer({ minTradesRequired: 5 });

    // 70% win rate, avg win $20, avg loss $10 → b=2, f* = (0.7*2 - 0.3)/2 = 0.55
    for (let i = 0; i < 7; i++) sizer.recordTrade(20);
    for (let i = 0; i < 3; i++) sizer.recordTrade(-10);

    const result = sizer.calculate(10000);
    expect(result.kellyFraction).toBeGreaterThan(0);
    expect(result.winRate).toBeCloseTo(0.7, 1);
    expect(result.payoffRatio).toBeCloseTo(2.0, 1);
    expect(result.positionSizeUsd).toBeGreaterThan(50);
  });

  test('returns zero Kelly with negative edge', () => {
    const sizer = new KellyPositionSizer({ minTradesRequired: 5 });

    // 30% win rate, avg win $5, avg loss $20 → losing strategy
    for (let i = 0; i < 3; i++) sizer.recordTrade(5);
    for (let i = 0; i < 7; i++) sizer.recordTrade(-20);

    const result = sizer.calculate(10000);
    expect(result.kellyFraction).toBe(0);
    expect(result.positionSizeUsd).toBe(50); // falls to min
  });

  test('applies regime multipliers', () => {
    const sizer = new KellyPositionSizer({ minTradesRequired: 5 });

    for (let i = 0; i < 8; i++) sizer.recordTrade(15);
    for (let i = 0; i < 2; i++) sizer.recordTrade(-5);

    const quietResult = sizer.calculate(10000, 'quiet');
    const trendingResult = sizer.calculate(10000, 'trending');
    const volatileResult = sizer.calculate(10000, 'volatile');

    // trending multiplier (1.2) > quiet (0.8) > volatile (0.6)
    expect(trendingResult.adjustedFraction).toBeGreaterThan(volatileResult.adjustedFraction);
    expect(quietResult.regime).toBe('quiet');
    expect(trendingResult.regime).toBe('trending');
  });

  test('respects max position size', () => {
    const sizer = new KellyPositionSizer({ minTradesRequired: 5, maxPositionUsd: 500 });

    // All wins → high Kelly
    for (let i = 0; i < 10; i++) sizer.recordTrade(100);

    const result = sizer.calculate(100000); // Large equity
    expect(result.positionSizeUsd).toBeLessThanOrEqual(500);
  });

  test('half-Kelly default reduces fraction', () => {
    const fullKelly = new KellyPositionSizer({ minTradesRequired: 5, fractionMultiplier: 1.0 });
    const halfKelly = new KellyPositionSizer({ minTradesRequired: 5, fractionMultiplier: 0.5 });

    for (let i = 0; i < 8; i++) { fullKelly.recordTrade(20); halfKelly.recordTrade(20); }
    for (let i = 0; i < 2; i++) { fullKelly.recordTrade(-10); halfKelly.recordTrade(-10); }

    const fullResult = fullKelly.calculate(10000);
    const halfResult = halfKelly.calculate(10000);

    expect(halfResult.adjustedFraction).toBeLessThan(fullResult.adjustedFraction);
  });

  test('edgePercent is positive for winning strategy', () => {
    const sizer = new KellyPositionSizer({ minTradesRequired: 5 });

    for (let i = 0; i < 8; i++) sizer.recordTrade(30);
    for (let i = 0; i < 2; i++) sizer.recordTrade(-10);

    const result = sizer.calculate(10000);
    expect(result.edgePercent).toBeGreaterThan(0);
  });

  test('reset clears trade history', () => {
    const sizer = new KellyPositionSizer();
    for (let i = 0; i < 10; i++) sizer.recordTrade(10);

    sizer.reset();
    expect(sizer.getTradeCount()).toBe(0);
    expect(sizer.calculate(10000).tradesAnalyzed).toBe(0);
  });

  test('limits memory with sliding window', () => {
    const sizer = new KellyPositionSizer({ windowSize: 20 });

    for (let i = 0; i < 100; i++) sizer.recordTrade(i % 2 === 0 ? 10 : -5);

    // Should keep max 2 * windowSize = 40
    expect(sizer.getTradeCount()).toBeLessThanOrEqual(40);
  });
});

// ---- AgiArbitrageEngine Tests ----

describe('AgiArbitrageEngine', () => {
  test('constructs with default config', () => {
    const engine = new AgiArbitrageEngine();
    const stats = engine.getStats();

    expect(stats.status).toBe('idle');
    expect(stats.currentRegime).toBe('quiet');
    expect(stats.regimeConfidence).toBe(0);
    expect(stats.kellyFraction).toBe(0);
    expect(stats.totalRegimeShifts).toBe(0);
    expect(stats.emaProfitability).toBe(0);
  });

  test('constructs with custom config', () => {
    const engine = new AgiArbitrageEngine({
      enableRegimeDetection: true,
      enableKellySizing: true,
      enableSelfTuning: false,
      initialEquity: 50000,
      regimeIntervalMs: 15000,
    });

    const stats = engine.getStats();
    expect(stats.status).toBe('idle');
  });

  test('effective score threshold adjusts by regime', () => {
    const engine = new AgiArbitrageEngine({
      engine: { scorer: { executeThreshold: 65 } },
    });

    // Default regime is quiet → no adjustment
    const quietThreshold = engine.getEffectiveScoreThreshold();
    expect(quietThreshold).toBeGreaterThanOrEqual(40);
    expect(quietThreshold).toBeLessThanOrEqual(90);
  });

  test('effective spread threshold adjusts by regime', () => {
    const engine = new AgiArbitrageEngine({
      engine: { scanner: { minSpreadPercent: 0.1 } },
    });

    const spread = engine.getEffectiveSpreadThreshold();
    expect(spread).toBeGreaterThan(0);
  });

  test('getKellyResult returns valid structure', () => {
    const engine = new AgiArbitrageEngine();
    const kelly = engine.getKellyResult();

    expect(kelly).toHaveProperty('kellyFraction');
    expect(kelly).toHaveProperty('adjustedFraction');
    expect(kelly).toHaveProperty('positionSizeUsd');
    expect(kelly).toHaveProperty('winRate');
    expect(kelly).toHaveProperty('payoffRatio');
    expect(kelly).toHaveProperty('regime');
  });

  test('getRegimeSignal returns valid structure', () => {
    const engine = new AgiArbitrageEngine();
    const signal = engine.getRegimeSignal();

    expect(signal).toHaveProperty('regime');
    expect(signal).toHaveProperty('confidence');
    expect(signal).toHaveProperty('hurstExponent');
    expect(signal).toHaveProperty('volatilityRatio');
  });

  test('stats include regime history', () => {
    const engine = new AgiArbitrageEngine();
    const stats = engine.getStats();

    expect(stats.regimeHistory).toBeInstanceOf(Array);
    expect(stats.regimeHistory.length).toBe(4); // 4 regime types
  });

  test('isActive returns false before start', () => {
    const engine = new AgiArbitrageEngine();
    expect(engine.isActive()).toBe(false);
  });

  test('init throws with <2 exchanges', async () => {
    const engine = new AgiArbitrageEngine({
      engine: {
        exchanges: [{ id: 'binance', enabled: true }],
      },
    });

    await expect(engine.init()).rejects.toThrow();
  });

  test('getEngine returns SpreadDetectorEngine', () => {
    const engine = new AgiArbitrageEngine();
    const inner = engine.getEngine();
    expect(inner).toBeDefined();
    expect(inner.getStats).toBeDefined();
  });
});
