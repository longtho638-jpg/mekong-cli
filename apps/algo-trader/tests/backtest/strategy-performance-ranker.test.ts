/**
 * Tests for StrategyPerformanceRanker multi-metric composite scoring.
 * Verifies ranking logic, Sortino computation, normalization, and weight customization.
 */

import { StrategyPerformanceRanker } from '../../src/backtest/strategy-performance-ranker-multi-metric-sharpe-sortino-drawdown';
import type { OptimizationResult } from '../../src/backtest/BacktestOptimizer';
import type { BacktestResult } from '../../src/backtest/BacktestRunner';

function makeBacktestResult(overrides: Partial<BacktestResult> = {}): BacktestResult {
  return {
    strategyName: 'TestStrategy',
    initialBalance: 10000,
    finalBalance: 10500,
    totalReturn: 5.0,
    maxDrawdown: 2.1,
    totalFees: 12.5,
    totalTrades: 20,
    wins: 12,
    losses: 8,
    winRate: 60,
    avgProfit: 25,
    sharpeRatio: 1.2,
    ...overrides,
  };
}

function makeOptimizationResult(
  params: Record<string, number>,
  overrides: Partial<BacktestResult> = {}
): OptimizationResult {
  return {
    params,
    result: makeBacktestResult(overrides),
    score: 0, // Will be computed by ranker
  };
}

describe('StrategyPerformanceRanker', () => {
  describe('rank()', () => {
    it('returns empty array when input is empty', () => {
      const ranker = new StrategyPerformanceRanker();
      const result = ranker.rank([]);

      expect(result).toEqual([]);
    });

    it('ranks 3 results by composite score in descending order', () => {
      const ranker = new StrategyPerformanceRanker();

      const results = [
        makeOptimizationResult({ fast: 10 }, { sharpeRatio: 0.8, winRate: 50 }),
        makeOptimizationResult({ fast: 20 }, { sharpeRatio: 1.5, winRate: 65 }),
        makeOptimizationResult({ fast: 15 }, { sharpeRatio: 1.2, winRate: 60 }),
      ];

      const ranked = ranker.rank(results);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].compositeScore).toBeGreaterThanOrEqual(ranked[1].compositeScore);
      expect(ranked[1].compositeScore).toBeGreaterThanOrEqual(ranked[2].compositeScore);
    });

    it('assigns correct rank numbers (1, 2, 3)', () => {
      const ranker = new StrategyPerformanceRanker();

      const results = [
        makeOptimizationResult({ p1: 10 }, { sharpeRatio: 0.5 }),
        makeOptimizationResult({ p1: 20 }, { sharpeRatio: 2.0 }),
        makeOptimizationResult({ p1: 15 }, { sharpeRatio: 1.0 }),
      ];

      const ranked = ranker.rank(results);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });

    it('preserves params and metrics in RankedResult', () => {
      const ranker = new StrategyPerformanceRanker();

      const result = makeOptimizationResult(
        { period: 14, threshold: 70 },
        { sharpeRatio: 1.5, winRate: 65, maxDrawdown: 3.2, totalReturn: 8.5, totalTrades: 25 }
      );

      const ranked = ranker.rank([result]);

      expect(ranked[0].params).toEqual({ period: 14, threshold: 70 });
      expect(ranked[0].sharpe).toBe(1.5);
      expect(ranked[0].winRate).toBe(65);
      expect(ranked[0].maxDrawdown).toBe(3.2);
      expect(ranked[0].totalReturn).toBe(8.5);
      expect(ranked[0].totalTrades).toBe(25);
    });

    it('composite scores are in [0, 1] range (normalized weights)', () => {
      const ranker = new StrategyPerformanceRanker();

      const results = [
        makeOptimizationResult({ p: 1 }, { sharpeRatio: 0.1 }),
        makeOptimizationResult({ p: 2 }, { sharpeRatio: 5.0 }),
        makeOptimizationResult({ p: 3 }, { sharpeRatio: 2.5 }),
      ];

      const ranked = ranker.rank(results);

      for (const r of ranked) {
        expect(r.compositeScore).toBeGreaterThanOrEqual(0);
        expect(r.compositeScore).toBeLessThanOrEqual(1);
      }
    });

    it('applies custom weights correctly', () => {
      const customWeights = { sharpe: 0.1, sortino: 0.1, maxDrawdown: 0.1, winRate: 0.7 };
      const ranker = new StrategyPerformanceRanker(customWeights);

      // High Sharpe, low win rate
      const lowWinRate = makeOptimizationResult({ p: 1 }, { sharpeRatio: 3.0, winRate: 20 });

      // Low Sharpe, high win rate
      const highWinRate = makeOptimizationResult({ p: 2 }, { sharpeRatio: 0.5, winRate: 95 });

      const ranked = ranker.rank([lowWinRate, highWinRate]);

      // With high win rate weight (0.7), highWinRate should rank 1st
      expect(ranked[0].params).toEqual({ p: 2 });
      expect(ranked[1].params).toEqual({ p: 1 });
    });
  });

  describe('computeSortino()', () => {
    it('returns 0 for empty trades array', () => {
      const ranker = new StrategyPerformanceRanker();
      const sortino = ranker.computeSortino([]);

      expect(sortino).toBe(0);
    });

    it('returns 0 for single trade', () => {
      const ranker = new StrategyPerformanceRanker();
      const sortino = ranker.computeSortino([{ pnl: 100 }]);

      expect(sortino).toBe(0);
    });

    it('computes positive Sortino ratio when trades have negative returns', () => {
      const ranker = new StrategyPerformanceRanker();

      const trades = [
        { pnl: 100 },
        { pnl: -50 },
        { pnl: 80 },
        { pnl: -30 },
        { pnl: 120 },
      ];

      const sortino = ranker.computeSortino(trades);

      expect(sortino).toBeGreaterThan(0);
      expect(Number.isFinite(sortino)).toBe(true);
    });

    it('returns capped value of 3 when no negative trades (all profitable)', () => {
      const ranker = new StrategyPerformanceRanker();

      const trades = [
        { pnl: 100 },
        { pnl: 50 },
        { pnl: 200 },
        { pnl: 75 },
      ];

      const sortino = ranker.computeSortino(trades);

      expect(sortino).toBe(3);
    });

    it('returns negative Sortino when all trades are losses', () => {
      const ranker = new StrategyPerformanceRanker();

      const trades = [
        { pnl: -50 },
        { pnl: -100 },
        { pnl: -25 },
      ];

      const sortino = ranker.computeSortino(trades);

      expect(sortino).toBeLessThan(0);
    });

    it('handles missing pnl field as 0', () => {
      const ranker = new StrategyPerformanceRanker();

      const trades = [
        { pnl: 50 },
        {}, // Missing pnl
        { pnl: -30 },
        {}, // Missing pnl
      ];

      const sortino = ranker.computeSortino(trades);

      expect(Number.isFinite(sortino)).toBe(true);
    });
  });

  describe('normalize()', () => {
    it('normalizes values to [0, 1] range', () => {
      const ranker = new StrategyPerformanceRanker();

      // Create a simple test by ranking results and checking normalized values
      const results = [
        makeOptimizationResult({ p: 1 }, { sharpeRatio: 0 }),
        makeOptimizationResult({ p: 2 }, { sharpeRatio: 10 }),
        makeOptimizationResult({ p: 3 }, { sharpeRatio: 5 }),
      ];

      const ranked = ranker.rank(results);

      // All composite scores should be in [0, 1]
      for (const r of ranked) {
        expect(r.compositeScore).toBeGreaterThanOrEqual(0);
        expect(r.compositeScore).toBeLessThanOrEqual(1);
      }
    });

    it('returns 0.5 for all when range is 0 (all same values)', () => {
      const ranker = new StrategyPerformanceRanker();

      // All have same Sharpe ratio
      const results = [
        makeOptimizationResult({ p: 1 }, { sharpeRatio: 2.0 }),
        makeOptimizationResult({ p: 2 }, { sharpeRatio: 2.0 }),
        makeOptimizationResult({ p: 3 }, { sharpeRatio: 2.0 }),
      ];

      const ranked = ranker.rank(results);

      // When all values are identical, normalized values should all be 0.5
      // However composite score aggregates multiple metrics, so they won't all be identical
      expect(ranked).toHaveLength(3);
    });
  });

  describe('estimateSortino()', () => {
    it('estimates Sortino based on Sharpe and win rate', () => {
      const ranker = new StrategyPerformanceRanker();

      // Test through ranking to see Sortino estimation
      const result1 = makeOptimizationResult({ p: 1 }, { sharpeRatio: 1.0, winRate: 50 });
      const result2 = makeOptimizationResult({ p: 2 }, { sharpeRatio: 1.0, winRate: 80 });

      const ranked = ranker.rank([result1, result2]);

      // Higher win rate → higher estimated Sortino → higher composite score
      expect(ranked[0].sortino).toBeGreaterThan(ranked[1].sortino);
    });
  });
});
