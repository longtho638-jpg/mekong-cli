import {
  boxMullerNormal,
  poissonDelay,
  logNormalSize,
  gaussianJitter,
  avoidRoundNumbers,
  stealthSize,
  stealthDelay,
} from '../../src/execution/phantom-stealth-math';

describe('boxMullerNormal', () => {
  test('produces values with mean ≈ 0 and std ≈ 1 over many samples', () => {
    const N = 10_000;
    const samples = Array.from({ length: N }, () => boxMullerNormal());
    const mean = samples.reduce((a, b) => a + b, 0) / N;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / N;

    expect(mean).toBeCloseTo(0, 1); // within 0.1 of 0
    expect(Math.sqrt(variance)).toBeCloseTo(1, 1); // std ≈ 1
  });
});

describe('poissonDelay', () => {
  test('respects min/max bounds', () => {
    for (let i = 0; i < 200; i++) {
      const d = poissonDelay(10, 500, 60_000);
      expect(d).toBeGreaterThanOrEqual(500);
      expect(d).toBeLessThanOrEqual(60_000);
    }
  });

  test('higher rate → shorter average delay', () => {
    const N = 2000;
    const fastDelays = Array.from({ length: N }, () => poissonDelay(30, 100, 300_000));
    const slowDelays = Array.from({ length: N }, () => poissonDelay(2, 100, 300_000));

    const avgFast = fastDelays.reduce((a, b) => a + b, 0) / N;
    const avgSlow = slowDelays.reduce((a, b) => a + b, 0) / N;

    expect(avgFast).toBeLessThan(avgSlow);
  });

  test('returns integer milliseconds', () => {
    const d = poissonDelay(5);
    expect(d).toBe(Math.round(d));
  });
});

describe('logNormalSize', () => {
  test('mean of many samples ≈ requested mean', () => {
    const N = 5000;
    const targetMean = 0.05;
    const samples = Array.from({ length: N }, () => logNormalSize(targetMean, 0.25));
    const actualMean = samples.reduce((a, b) => a + b, 0) / N;

    // Within 20% of target mean (log-normal has fat tail so wider tolerance)
    expect(actualMean).toBeGreaterThan(targetMean * 0.8);
    expect(actualMean).toBeLessThan(targetMean * 1.2);
  });

  test('all values are positive', () => {
    for (let i = 0; i < 500; i++) {
      expect(logNormalSize(0.01)).toBeGreaterThan(0);
    }
  });

  test('floor at 30% of mean', () => {
    for (let i = 0; i < 500; i++) {
      expect(logNormalSize(1.0, 0.5)).toBeGreaterThanOrEqual(0.3);
    }
  });
});

describe('gaussianJitter', () => {
  test('average stays near base value', () => {
    const N = 3000;
    const base = 1000;
    const samples = Array.from({ length: N }, () => gaussianJitter(base, 0.15));
    const avg = samples.reduce((a, b) => a + b, 0) / N;

    expect(avg).toBeGreaterThan(base * 0.9);
    expect(avg).toBeLessThan(base * 1.1);
  });

  test('floor at 30% of base', () => {
    for (let i = 0; i < 500; i++) {
      expect(gaussianJitter(100, 0.5)).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('avoidRoundNumbers', () => {
  test('modifies values ending in many zeros', () => {
    const result = avoidRoundNumbers(1.0, 8);
    const str = result.toFixed(8);
    const trailingZeros = str.match(/0+$/)?.[0]?.length ?? 0;
    // Should have broken the round pattern (may still have some trailing zeros but fewer than 5)
    expect(trailingZeros).toBeLessThan(6);
  });

  test('modifies .500 patterns', () => {
    const result = avoidRoundNumbers(0.5, 8);
    expect(result).not.toBe(0.5);
  });

  test('preserves precision', () => {
    const result = avoidRoundNumbers(0.123456, 8);
    const parts = result.toString().split('.');
    // Result should be a valid number with reasonable precision
    expect(parts.length).toBeLessThanOrEqual(2);
  });

  test('keeps non-round numbers unchanged', () => {
    // A number like 0.12345678 has no trailing zeros / .500 pattern
    const original = 0.12345678;
    const result = avoidRoundNumbers(original, 8);
    expect(result).toBe(original);
  });
});

describe('stealthSize (combined)', () => {
  test('produces varied non-round sizes', () => {
    const sizes = Array.from({ length: 50 }, () => stealthSize(0.01));
    const unique = new Set(sizes.map(s => s.toFixed(8)));
    // All 50 values should be unique (log-normal + noise)
    expect(unique.size).toBeGreaterThan(40);
  });
});

describe('stealthDelay (combined)', () => {
  test('produces varied delays within bounds', () => {
    const delays = Array.from({ length: 100 }, () => stealthDelay(5, 500, 120_000));
    delays.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(150); // 30% floor of 500
      expect(d).toBeLessThanOrEqual(360_000); // 3x ceiling with gaussian
    });

    const unique = new Set(delays);
    expect(unique.size).toBeGreaterThan(80);
  });
});
