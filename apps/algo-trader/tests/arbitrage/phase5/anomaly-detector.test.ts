/**
 * Tests: AnomalyDetector — Isolation Forest threshold and scoring behaviour.
 */

import { AnomalyDetector } from '../../../src/arbitrage/phase5_god_mode/capitalFortress/anomaly-detector';
import type { MarketSnapshot } from '../../../src/arbitrage/phase5_god_mode/capitalFortress/anomaly-detector';

function normalSnapshot(override: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    price: 40000,
    volume: 800,
    spreadBps: 2,
    fillRate: 0.97,
    latencyMs: 45,
    ...override,
  };
}

function buildTrainingSet(n: number): MarketSnapshot[] {
  return Array.from({ length: n }, (_, i) => ({
    price: 40000 + (i % 10) * 10,
    volume: 800 + (i % 5) * 20,
    spreadBps: 2 + (i % 3) * 0.5,
    fillRate: 0.95 + (i % 4) * 0.01,
    latencyMs: 40 + (i % 8) * 5,
  }));
}

describe('AnomalyDetector — untrained state', () => {
  test('isTrained returns false before training', () => {
    const detector = new AnomalyDetector();
    expect(detector.isTrained()).toBe(false);
  });

  test('score returns 0 when untrained', () => {
    const detector = new AnomalyDetector();
    expect(detector.score(normalSnapshot())).toBe(0);
  });
});

describe('AnomalyDetector — training', () => {
  test('isTrained returns true after sufficient data', () => {
    const detector = new AnomalyDetector();
    detector.train(buildTrainingSet(50));
    expect(detector.isTrained()).toBe(true);
  });

  test('does not train on fewer than 2 samples', () => {
    const detector = new AnomalyDetector();
    detector.train([normalSnapshot()]);
    expect(detector.isTrained()).toBe(false);
  });
});

describe('AnomalyDetector — scoring', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
    detector.train(buildTrainingSet(100));
  });

  test('score returns value in [0, 1]', () => {
    const score = detector.score(normalSnapshot());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('normal snapshot scores lower than extreme anomaly (on average)', () => {
    const normalScores = Array.from({ length: 10 }, () => detector.score(normalSnapshot()));
    const anomalyScores = Array.from({ length: 10 }, () =>
      detector.score(normalSnapshot({
        price: 1_000_000,   // extreme outlier
        volume: 0.001,
        latencyMs: 99999,
        spreadBps: 9999,
        fillRate: 0,
      }))
    );
    const avgNormal = normalScores.reduce((s, v) => s + v, 0) / normalScores.length;
    const avgAnomaly = anomalyScores.reduce((s, v) => s + v, 0) / anomalyScores.length;
    // Anomalies should generally score higher (closer to 1)
    expect(avgAnomaly).toBeGreaterThanOrEqual(avgNormal);
  });

  test('score is deterministic for same detector state', () => {
    const point = normalSnapshot({ price: 42000 });
    const s1 = detector.score(point);
    const s2 = detector.score(point);
    expect(s1).toBe(s2);
  });
});
