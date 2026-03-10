/**
 * Tests: liquidity-score-calculator.ts — score computation from features + prediction.
 */

import { LiquidityScoreCalculator } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/liquidity-score-calculator';
import type { FeatureVector } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/feature-extractor';
import type { ImbalancePrediction } from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/orderbook-imbalance-model';

const makeFeatures = (overrides: Partial<FeatureVector> = {}): FeatureVector => ({
  volumeImbalance: 0,
  bookSlope: 100,
  microPrice: 50_000,
  tradeFlow: 0,
  spread: 5,
  midPrice: 50_000,
  timestamp: Date.now(),
  ...overrides,
});

const makePrediction = (overrides: Partial<ImbalancePrediction> = {}): ImbalancePrediction => ({
  buyPressure: 0.5,
  sellPressure: 0.5,
  confidence: 0.8,
  latencyMs: 1,
  ...overrides,
});

describe('LiquidityScoreCalculator', () => {
  const calc = new LiquidityScoreCalculator({
    maxSpreadBps: 20,
    targetDepth: 100,
    weights: { spread: 0.35, depth: 0.35, imbalance: 0.30 },
  });

  it('returns score in [0, 1] range', () => {
    const score = calc.compute(makeFeatures(), makePrediction());
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(1);
  });

  it('returns lower score for wide spread', () => {
    const tight = calc.compute(makeFeatures({ spread: 1, midPrice: 50_000 }), makePrediction());
    const wide = calc.compute(makeFeatures({ spread: 100, midPrice: 50_000 }), makePrediction());
    expect(tight.score).toBeGreaterThan(wide.score);
  });

  it('spreadComponent is 0 when spread exceeds maxSpreadBps', () => {
    // spread of 200 on midPrice 1000 = 2000 bps >> maxSpreadBps 20
    const features = makeFeatures({ spread: 200, midPrice: 1000 });
    const result = calc.compute(features, makePrediction());
    expect(result.spreadComponent).toBe(0);
  });

  it('higher confidence prediction increases imbalance component', () => {
    const lowConf = calc.compute(makeFeatures(), makePrediction({ confidence: 0.1 }));
    const highConf = calc.compute(makeFeatures(), makePrediction({ confidence: 0.9 }));
    expect(highConf.imbalanceComponent).toBeGreaterThan(lowConf.imbalanceComponent);
  });

  it('balanced prediction (0.5/0.5) gives higher imbalance score than skewed', () => {
    const balanced = calc.compute(makeFeatures(), makePrediction({ buyPressure: 0.5, sellPressure: 0.5 }));
    const skewed = calc.compute(makeFeatures(), makePrediction({ buyPressure: 0.95, sellPressure: 0.05 }));
    expect(balanced.imbalanceComponent).toBeGreaterThan(skewed.imbalanceComponent);
  });

  it('exposes individual component scores', () => {
    const result = calc.compute(makeFeatures(), makePrediction());
    expect(result).toHaveProperty('spreadComponent');
    expect(result).toHaveProperty('depthComponent');
    expect(result).toHaveProperty('imbalanceComponent');
    expect(result).toHaveProperty('timestamp');
  });

  it('uses custom weights correctly', () => {
    const spreadOnly = new LiquidityScoreCalculator({
      maxSpreadBps: 20,
      targetDepth: 100,
      weights: { spread: 1.0, depth: 0, imbalance: 0 },
    });
    const result = spreadOnly.compute(makeFeatures({ spread: 0.5, midPrice: 50_000 }), makePrediction());
    // With only spread weight and near-zero spread, score should be high
    expect(result.score).toBeGreaterThan(0.9);
  });
});
