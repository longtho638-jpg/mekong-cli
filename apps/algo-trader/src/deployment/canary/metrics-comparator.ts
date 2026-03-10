/**
 * Metrics Comparator - Compares baseline vs canary metrics.
 * Uses Welford's online algorithm for variance + Welch's t-test.
 */
import { MetricsThresholdConfig } from './canary-config-types';
import { MetricPoint } from './instance-manager';

export interface ComparisonResult {
  metric: string;
  baselineMean: number;
  canaryMean: number;
  pValue: number;
  significant: boolean;
  degraded: boolean;
}

export interface WelfordState {
  count: number;
  mean: number;
  m2: number;
}

/** Metrics where lower is better */
const LOWER_IS_BETTER = new Set(['slippageBps', 'errorRate', 'antiBotFlags', 'latencyMs']);

export class MetricsComparator {
  private thresholds: MetricsThresholdConfig;

  constructor(thresholds: MetricsThresholdConfig) {
    this.thresholds = thresholds;
  }

  compareMetrics(baselineMetrics: MetricPoint[], canaryMetrics: MetricPoint[]): ComparisonResult[] {
    if (baselineMetrics.length < 2 || canaryMetrics.length < 2) return [];

    const keys: (keyof MetricPoint)[] = ['sharpe', 'slippageBps', 'errorRate', 'antiBotFlags', 'fillRate', 'latencyMs'];
    const results: ComparisonResult[] = [];

    for (const key of keys) {
      const bVals = baselineMetrics.map(m => m[key] as number);
      const cVals = canaryMetrics.map(m => m[key] as number);

      const bState = bVals.reduce((s, v) => MetricsComparator.welfordUpdate(s, v), { count: 0, mean: 0, m2: 0 });
      const cState = cVals.reduce((s, v) => MetricsComparator.welfordUpdate(s, v), { count: 0, mean: 0, m2: 0 });

      const bVar = MetricsComparator.welfordVariance(bState);
      const cVar = MetricsComparator.welfordVariance(cState);

      const t = MetricsComparator.tTest(bState.mean, bVar, bState.count, cState.mean, cVar, cState.count);
      const df = Math.max(1, bState.count + cState.count - 2);
      const pValue = MetricsComparator.pValueFromT(t, df);

      const significant = pValue < (1 - this.thresholds.confidenceLevel);

      // Degraded = canary is significantly worse
      let degraded = false;
      if (significant) {
        if (LOWER_IS_BETTER.has(key)) {
          degraded = cState.mean > bState.mean;
        } else {
          degraded = cState.mean < bState.mean;
        }
      }

      results.push({
        metric: key,
        baselineMean: bState.mean,
        canaryMean: cState.mean,
        pValue,
        significant,
        degraded,
      });
    }

    return results;
  }

  static welfordUpdate(state: WelfordState, value: number): WelfordState {
    const count = state.count + 1;
    const delta = value - state.mean;
    const mean = state.mean + delta / count;
    const delta2 = value - mean;
    const m2 = state.m2 + delta * delta2;
    return { count, mean, m2 };
  }

  static welfordVariance(state: WelfordState): number {
    if (state.count < 2) return 0;
    return state.m2 / (state.count - 1);
  }

  /** Welch's two-sample t-statistic */
  static tTest(mean1: number, var1: number, n1: number, mean2: number, var2: number, n2: number): number {
    const se = Math.sqrt(var1 / n1 + var2 / n2);
    if (se === 0) return 0;
    return Math.abs(mean1 - mean2) / se;
  }

  /**
   * Approximate two-tailed p-value from t and degrees of freedom.
   * Uses normal approximation for df >= 30, simple lookup table for small df.
   */
  static pValueFromT(t: number, df: number): number {
    if (df >= 30) {
      // Normal approximation: 2 * (1 - Phi(|t|))
      return 2 * (1 - MetricsComparator.normalCDF(t));
    }
    // Simple lookup for small df (conservative)
    const table: Record<number, number> = {
      1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015,
      10: 1.812, 15: 1.753, 20: 1.725, 25: 1.708, 29: 1.699,
    };
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    const closestDf = keys.reduce((prev, cur) => Math.abs(cur - df) < Math.abs(prev - df) ? cur : prev);
    const criticalT = table[closestDf];
    return t > criticalT ? 0.04 : 0.10; // rough approximation
  }

  /** Standard normal CDF approximation (Abramowitz & Stegun 26.2.17) */
  private static normalCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    return 1 - poly * Math.exp(-x * x);
  }

  isDegraded(results: ComparisonResult[]): boolean {
    return results.some(r => r.degraded);
  }
}
