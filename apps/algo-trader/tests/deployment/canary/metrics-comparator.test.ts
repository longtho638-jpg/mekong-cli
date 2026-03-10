import { MetricsComparator, WelfordState } from '../../../src/deployment/canary/metrics-comparator';
import { MetricPoint } from '../../../src/deployment/canary/instance-manager';
import { DEFAULT_CANARY_CONFIG } from '../../../src/deployment/canary/canary-config-types';

const makeMetric = (overrides: Partial<MetricPoint> = {}): MetricPoint => ({
  timestamp: Date.now(),
  sharpe: 1.5,
  slippageBps: 2,
  errorRate: 0.001,
  antiBotFlags: 0,
  fillRate: 0.98,
  latencyMs: 50,
  ...overrides,
});

const makeMetrics = (n: number, overrides: Partial<MetricPoint> = {}): MetricPoint[] =>
  Array.from({ length: n }, (_, i) => makeMetric({ timestamp: i * 1000, ...overrides }));

describe('MetricsComparator', () => {
  const comparator = new MetricsComparator(DEFAULT_CANARY_CONFIG.metrics);

  describe('welfordUpdate', () => {
    it('computes correct mean for a series', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const state = values.reduce(
        (s, v) => MetricsComparator.welfordUpdate(s, v),
        { count: 0, mean: 0, m2: 0 } as WelfordState,
      );
      expect(state.mean).toBeCloseTo(5.0);
      expect(state.count).toBe(8);
    });

    it('handles single value', () => {
      const s = MetricsComparator.welfordUpdate({ count: 0, mean: 0, m2: 0 }, 7);
      expect(s.mean).toBe(7);
      expect(s.count).toBe(1);
    });
  });

  describe('welfordVariance', () => {
    it('returns known sample variance for [2,4,4,4,5,5,7,9]', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const state = values.reduce(
        (s, v) => MetricsComparator.welfordUpdate(s, v),
        { count: 0, mean: 0, m2: 0 } as WelfordState,
      );
      // sample variance (n-1 denominator) = 4.571...
      expect(MetricsComparator.welfordVariance(state)).toBeCloseTo(4.571);
    });

    it('returns 0 for count < 2', () => {
      expect(MetricsComparator.welfordVariance({ count: 1, mean: 5, m2: 0 })).toBe(0);
    });
  });

  describe('tTest', () => {
    it('returns 0 when means are equal', () => {
      expect(MetricsComparator.tTest(5, 1, 10, 5, 1, 10)).toBe(0);
    });

    it('returns positive value for different means', () => {
      const t = MetricsComparator.tTest(5, 1, 20, 6, 1, 20);
      expect(t).toBeGreaterThan(0);
    });

    it('returns 0 when standard error is zero', () => {
      expect(MetricsComparator.tTest(5, 0, 10, 6, 0, 10)).toBe(0);
    });
  });

  describe('pValueFromT', () => {
    it('returns value between 0 and 1', () => {
      const p = MetricsComparator.pValueFromT(2.0, 50);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    });

    it('larger t gives smaller p-value (large df)', () => {
      const p1 = MetricsComparator.pValueFromT(1.0, 100);
      const p2 = MetricsComparator.pValueFromT(4.0, 100);
      expect(p2).toBeLessThan(p1);
    });

    it('handles small df', () => {
      const p = MetricsComparator.pValueFromT(3.0, 5);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  describe('compareMetrics', () => {
    it('returns empty array when insufficient data', () => {
      const result = comparator.compareMetrics([makeMetric()], [makeMetric()]);
      expect(result).toHaveLength(0);
    });

    it('detects degraded canary slippage', () => {
      // Use varied values so within-group variance > 0 for t-test to fire
      const baseline = Array.from({ length: 20 }, (_, i) =>
        makeMetric({ slippageBps: 2 + (i % 3) * 0.1, timestamp: i * 1000 }),
      );
      const canary = Array.from({ length: 20 }, (_, i) =>
        makeMetric({ slippageBps: 20 + (i % 3) * 0.1, timestamp: i * 1000 }),
      );
      const results = comparator.compareMetrics(baseline, canary);
      const slippageResult = results.find(r => r.metric === 'slippageBps');
      expect(slippageResult).toBeDefined();
      expect(slippageResult?.canaryMean).toBeGreaterThan(slippageResult?.baselineMean ?? 0);
      expect(slippageResult?.degraded).toBe(true);
    });

    it('does not flag equal metrics as degraded', () => {
      const baseline = makeMetrics(20);
      const canary = makeMetrics(20);
      const results = comparator.compareMetrics(baseline, canary);
      expect(results.every(r => !r.degraded)).toBe(true);
    });

    it('returns comparison results for all tracked metrics', () => {
      const baseline = makeMetrics(10);
      const canary = makeMetrics(10);
      const results = comparator.compareMetrics(baseline, canary);
      const metricNames = results.map(r => r.metric);
      expect(metricNames).toContain('sharpe');
      expect(metricNames).toContain('slippageBps');
      expect(metricNames).toContain('errorRate');
    });
  });

  describe('isDegraded', () => {
    it('returns true if any result is degraded', () => {
      const results = [
        { metric: 'sharpe', baselineMean: 1.5, canaryMean: 1.5, pValue: 0.5, significant: false, degraded: false },
        { metric: 'slippageBps', baselineMean: 2, canaryMean: 10, pValue: 0.01, significant: true, degraded: true },
      ];
      expect(comparator.isDegraded(results)).toBe(true);
    });

    it('returns false when no results are degraded', () => {
      const results = [
        { metric: 'sharpe', baselineMean: 1.5, canaryMean: 1.6, pValue: 0.5, significant: false, degraded: false },
      ];
      expect(comparator.isDegraded(results)).toBe(false);
    });
  });
});
