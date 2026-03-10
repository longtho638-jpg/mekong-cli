/**
 * Tests: alpha-signal-generator.ts — signal emission and threshold logic.
 */

import { AlphaSignalGenerator } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/alpha-signal-generator';
import type { FeatureVector } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/feature-extractor';
import type { ImbalancePrediction } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/orderbook-imbalance-model';
import type { LiquidityScore } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/liquidity-score-calculator';

const makeFeatures = (mid = 50_000, spread = 5): FeatureVector => ({
  volumeImbalance: 0.3,
  bookSlope: 100,
  microPrice: mid,
  tradeFlow: 0.2,
  spread,
  midPrice: mid,
  timestamp: Date.now(),
});

const makePrediction = (buy: number, sell: number, conf = 0.8): ImbalancePrediction => ({
  buyPressure: buy,
  sellPressure: sell,
  confidence: conf,
  latencyMs: 1,
});

const makeScore = (score = 0.7): LiquidityScore => ({
  score,
  spreadComponent: 0.8,
  depthComponent: 0.7,
  imbalanceComponent: 0.6,
  timestamp: Date.now(),
});

describe('AlphaSignalGenerator', () => {
  it('does not emit signal when imbalance is below threshold', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.7, dryRun: true });
    const signals: unknown[] = [];
    gen.on('signal:dry', (s) => signals.push(s));

    // imbalance = 0.6 - 0.4 = 0.2, below threshold 0.7
    const result = gen.evaluate(makeFeatures(), makePrediction(0.6, 0.4), makeScore());
    expect(result).toBeNull();
    expect(signals).toHaveLength(0);
  });

  it('does not emit signal when liquidity score is too low', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, minLiquidityScore: 0.6, dryRun: true });
    const signals: unknown[] = [];
    gen.on('signal:dry', (s) => signals.push(s));

    const result = gen.evaluate(makeFeatures(), makePrediction(0.9, 0.1), makeScore(0.3));
    expect(result).toBeNull();
    expect(signals).toHaveLength(0);
  });

  it('emits signal:dry when conditions are met in dry-run mode', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, dryRun: true });
    const signals: unknown[] = [];
    gen.on('signal:dry', (s) => signals.push(s));

    const result = gen.evaluate(makeFeatures(), makePrediction(0.85, 0.15), makeScore(0.7));
    expect(result).not.toBeNull();
    expect(signals).toHaveLength(1);
  });

  it('emits buy signal when buy pressure dominates', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, dryRun: true });
    const result = gen.evaluate(makeFeatures(), makePrediction(0.9, 0.1), makeScore(0.7));
    expect(result?.side).toBe('buy');
  });

  it('emits sell signal when sell pressure dominates', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, dryRun: true });
    const result = gen.evaluate(makeFeatures(), makePrediction(0.1, 0.9), makeScore(0.7));
    expect(result?.side).toBe('sell');
  });

  it('increments signal count on each emission', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, dryRun: true });
    expect(gen.getSignalCount()).toBe(0);
    gen.evaluate(makeFeatures(), makePrediction(0.9, 0.1), makeScore(0.7));
    gen.evaluate(makeFeatures(), makePrediction(0.1, 0.9), makeScore(0.7));
    expect(gen.getSignalCount()).toBe(2);
  });

  it('signal has valid limitPrice and size fields', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, baseOrderSize: 0.1, dryRun: true });
    const result = gen.evaluate(makeFeatures(50_000), makePrediction(0.9, 0.1), makeScore(0.8));
    expect(result?.limitPrice).toBeGreaterThan(0);
    expect(result?.size).toBeGreaterThan(0);
    expect(result?.confidence).toBeGreaterThan(0);
  });

  it('does not emit signal:dry event in live mode (emits signal instead)', () => {
    const gen = new AlphaSignalGenerator({ imbalanceThreshold: 0.5, dryRun: false });
    const drySignals: unknown[] = [];
    const liveSignals: unknown[] = [];
    gen.on('signal:dry', (s) => drySignals.push(s));
    gen.on('signal', (s) => liveSignals.push(s));

    gen.evaluate(makeFeatures(), makePrediction(0.9, 0.1), makeScore(0.7));
    expect(drySignals).toHaveLength(0);
    expect(liveSignals).toHaveLength(1);
  });
});
