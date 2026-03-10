/**
 * Parameter Optimizer for Historical Backtesting
 * Grid search over strategy parameters to find optimal configuration
 */

import { BacktestMetricsReport } from './metrics-collector';

export interface OptimizationResult {
  bestParams: Record<string, unknown>;
  bestMetric: number;
  allResults: Array<{ params: Record<string, unknown>; metric: number }>;
}

type TargetMetric = 'sharpeRatio' | 'totalPnl' | 'winRate';

export class ParameterOptimizer {
  constructor(private targetMetric: TargetMetric = 'sharpeRatio') {}

  async gridSearch(
    paramGrid: Record<string, unknown[]>,
    runBacktest: (params: Record<string, unknown>) => Promise<BacktestMetricsReport>,
  ): Promise<OptimizationResult> {
    const combinations = this.buildCombinations(paramGrid);
    const results: Array<{ params: Record<string, unknown>; metric: number }> = [];

    for (const params of combinations) {
      const report = await runBacktest(params);
      const metric = this.extractMetric(report);
      results.push({ params, metric });
    }

    results.sort((a, b) => b.metric - a.metric);

    const best = results[0] ?? { params: {}, metric: 0 };
    return {
      bestParams: best.params,
      bestMetric: best.metric,
      allResults: results,
    };
  }

  private buildCombinations(
    paramGrid: Record<string, unknown[]>,
  ): Record<string, unknown>[] {
    const keys = Object.keys(paramGrid);
    if (keys.length === 0) return [{}];

    let combinations: Record<string, unknown>[] = [{}];

    for (const key of keys) {
      const values = paramGrid[key];
      const next: Record<string, unknown>[] = [];
      for (const existing of combinations) {
        for (const value of values) {
          next.push({ ...existing, [key]: value });
        }
      }
      combinations = next;
    }

    return combinations;
  }

  private extractMetric(report: BacktestMetricsReport): number {
    const value = report[this.targetMetric];
    return isFinite(value) ? value : 0;
  }
}
