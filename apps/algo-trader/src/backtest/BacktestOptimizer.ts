/**
 * Backtest Optimizer — Grid search over strategy parameters.
 * Runs multiple backtests with different parameter combinations,
 * ranks results by Sharpe ratio + risk-adjusted metrics.
 */

import { IDataProvider } from '../interfaces/IDataProvider';
import { IStrategy } from '../interfaces/IStrategy';
import { BacktestRunner, BacktestConfig, BacktestResult } from './BacktestRunner';
import { logger } from '../utils/logger';

export interface ParameterRange {
  name: string;
  values: number[];
}

export interface OptimizationResult {
  params: Record<string, number>;
  result: BacktestResult;
  score: number; // Composite score for ranking
}

export type SearchMode = 'grid' | 'random';

type StrategyFactory = (params: Record<string, number>) => IStrategy;

export class BacktestOptimizer {
  private dataProvider: IDataProvider;
  private backtestConfig: BacktestConfig;
  private initialBalance: number;
  private days: number;

  constructor(
    dataProvider: IDataProvider,
    initialBalance = 10000,
    days = 30,
    backtestConfig?: BacktestConfig
  ) {
    this.dataProvider = dataProvider;
    this.initialBalance = initialBalance;
    this.days = days;
    this.backtestConfig = backtestConfig ?? {};
  }

  /**
   * Run optimization over parameter ranges.
   * @param strategyFactory Function that creates a strategy from parameter values
   * @param paramRanges Array of parameter ranges to search
   * @param mode 'grid' (cartesian product) or 'random' (sampled trials). Default: 'grid'
   * @param maxTrials Max trials for random mode (ignored in grid mode). Default: 50
   * @returns Sorted optimization results (best first)
   */
  async optimize(
    strategyFactory: StrategyFactory,
    paramRanges: ParameterRange[],
    mode: SearchMode = 'grid',
    maxTrials = 50,
  ): Promise<OptimizationResult[]> {
    if (mode === 'random') {
      return this.optimizeRandom(strategyFactory, paramRanges, maxTrials);
    }

    const combinations = this.generateCombinations(paramRanges);
    logger.info(`[Optimizer] Starting grid search: ${combinations.length} parameter combinations`);

    const results: OptimizationResult[] = [];

    for (let i = 0; i < combinations.length; i++) {
      const params = combinations[i];
      const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');

      try {
        const strategy = strategyFactory(params);
        const runner = new BacktestRunner(
          strategy, this.dataProvider, this.initialBalance, this.backtestConfig
        );
        const result = await runner.run(this.days, true);
        const score = this.calculateScore(result);

        results.push({ params, result, score });

        if ((i + 1) % 10 === 0 || i === combinations.length - 1) {
          logger.info(`[Optimizer] Progress: ${i + 1}/${combinations.length} (current: ${paramStr} → score=${score.toFixed(4)})`);
        }
      } catch (error) {
        logger.warn(`[Optimizer] Failed for ${paramStr}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    results.sort((a, b) => b.score - a.score);
    this.printTopResults(results);
    return results;
  }

  /**
   * Run random search optimization: sample `maxTrials` random param combinations.
   * More efficient than grid search when the search space is large.
   */
  async optimizeRandom(
    strategyFactory: StrategyFactory,
    paramRanges: ParameterRange[],
    maxTrials = 50,
  ): Promise<OptimizationResult[]> {
    logger.info(`[Optimizer] Starting random search: ${maxTrials} trials over ${paramRanges.length} param ranges`);

    const results: OptimizationResult[] = [];

    for (let i = 0; i < maxTrials; i++) {
      const params = this.sampleRandomParams(paramRanges);
      const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');

      try {
        const strategy = strategyFactory(params);
        const runner = new BacktestRunner(
          strategy, this.dataProvider, this.initialBalance, this.backtestConfig
        );
        const result = await runner.run(this.days, true);
        const score = this.calculateScore(result);

        results.push({ params, result, score });

        if ((i + 1) % 10 === 0 || i === maxTrials - 1) {
          logger.info(`[Optimizer] Progress: ${i + 1}/${maxTrials} (current: ${paramStr} → score=${score.toFixed(4)})`);
        }
      } catch (error) {
        logger.warn(`[Optimizer] Failed for ${paramStr}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    results.sort((a, b) => b.score - a.score);
    this.printTopResults(results);
    return results;
  }

  /**
   * Composite score: weighted combination of Sharpe, return, and drawdown.
   * Sharpe ratio is primary (risk-adjusted), with penalties for drawdown.
   */
  private calculateScore(result: BacktestResult): number {
    if (result.totalTrades < 3) return -Infinity; // Too few trades = unreliable

    const sharpeScore = result.sharpeRatio * 0.4;
    const returnScore = Math.min(result.totalReturn, 100) / 100 * 0.3; // Cap at 100% to avoid outliers
    const drawdownPenalty = result.maxDrawdown / 100 * 0.2;
    const winRateScore = result.winRate / 100 * 0.1;

    return sharpeScore + returnScore - drawdownPenalty + winRateScore;
  }

  /** Sample one random value per parameter range */
  private sampleRandomParams(ranges: ParameterRange[]): Record<string, number> {
    const params: Record<string, number> = {};
    for (const range of ranges) {
      params[range.name] = range.values[Math.floor(Math.random() * range.values.length)];
    }
    return params;
  }

  /** Generate all combinations from parameter ranges (cartesian product) */
  private generateCombinations(ranges: ParameterRange[]): Record<string, number>[] {
    if (ranges.length === 0) return [{}];

    const [first, ...rest] = ranges;
    const restCombinations = this.generateCombinations(rest);
    const results: Record<string, number>[] = [];

    for (const value of first.values) {
      for (const combo of restCombinations) {
        results.push({ [first.name]: value, ...combo });
      }
    }

    return results;
  }

  private printTopResults(results: OptimizationResult[], top = 5) {
    const show = results.slice(0, Math.min(top, results.length));
    logger.info(`\n--- Top ${show.length} Parameter Sets ---`);

    for (let i = 0; i < show.length; i++) {
      const { params, result, score } = show[i];
      const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');
      logger.info(
        `#${i + 1}: [${paramStr}] → Return: ${result.totalReturn.toFixed(2)}%, ` +
        `Sharpe: ${result.sharpeRatio.toFixed(3)}, MaxDD: ${result.maxDrawdown.toFixed(2)}%, ` +
        `WinRate: ${result.winRate.toFixed(1)}%, Trades: ${result.totalTrades}, Score: ${score.toFixed(4)}`
      );
    }

    logger.info('----------------------------\n');
  }
}
