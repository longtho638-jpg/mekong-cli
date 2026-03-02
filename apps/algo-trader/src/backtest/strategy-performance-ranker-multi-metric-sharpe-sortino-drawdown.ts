/**
 * Strategy Performance Ranker — multi-metric composite scoring.
 * Ranks optimization results by weighted combination of Sharpe, Sortino,
 * max drawdown, and win rate. Uses min-max normalization.
 */

import { OptimizationResult } from './BacktestOptimizer';

export interface RankerWeights {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
}

export interface RankedResult {
  rank: number;
  params: Record<string, number>;
  compositeScore: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  totalReturn: number;
  totalTrades: number;
}

const DEFAULT_WEIGHTS: RankerWeights = {
  sharpe: 0.4,
  sortino: 0.3,
  maxDrawdown: 0.2,
  winRate: 0.1,
};

export class StrategyPerformanceRanker {
  private weights: RankerWeights;

  constructor(weights?: Partial<RankerWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  rank(results: OptimizationResult[]): RankedResult[] {
    if (results.length === 0) return [];

    const enriched = results.map(r => ({
      params: r.params,
      sharpe: r.result.sharpeRatio,
      sortino: this.estimateSortino(r.result),
      maxDrawdown: r.result.maxDrawdown,
      winRate: r.result.winRate,
      totalReturn: r.result.totalReturn,
      totalTrades: r.result.totalTrades,
    }));

    const sharpes = this.normalize(enriched.map(e => e.sharpe));
    const sortinos = this.normalize(enriched.map(e => e.sortino));
    const drawdowns = this.normalize(enriched.map(e => -e.maxDrawdown)); // Invert: lower DD = better
    const winRates = this.normalize(enriched.map(e => e.winRate));

    const scored = enriched.map((e, i) => ({
      ...e,
      compositeScore:
        this.weights.sharpe * sharpes[i] +
        this.weights.sortino * sortinos[i] +
        this.weights.maxDrawdown * drawdowns[i] +
        this.weights.winRate * winRates[i],
    }));

    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    return scored.map((s, i) => ({ rank: i + 1, ...s }));
  }

  /** Estimate Sortino from available BacktestResult fields */
  private estimateSortino(result: { sharpeRatio: number; winRate: number }): number {
    // Sortino ≈ Sharpe * (1 + winFactor*0.5): higher winRate → less downside → higher Sortino
    const winFactor = Math.max(0.5, result.winRate / 100);
    return result.sharpeRatio * (1 + winFactor * 0.5);
  }

  /** Sortino ratio = mean return / downside std deviation */
  computeSortino(trades: Array<{ pnl?: number }>): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnl ?? 0);
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);

    if (downsideReturns.length === 0) return mean > 0 ? 3 : 0; // Cap at 3 if no downside

    const downsideVariance = downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length;
    const downsideStd = Math.sqrt(downsideVariance);

    return downsideStd > 0 ? mean / downsideStd : 0;
  }

  /** Min-max normalization to [0, 1] */
  private normalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return values.map(() => 0.5);
    return values.map(v => (v - min) / range);
  }
}
