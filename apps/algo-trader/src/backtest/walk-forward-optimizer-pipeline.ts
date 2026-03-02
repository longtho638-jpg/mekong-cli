/**
 * Walk-Forward Optimizer Pipeline.
 * Combines BacktestOptimizer (optimize on train data) + BacktestEngine (validate on test data)
 * per window, sliding forward.
 */

import { BacktestOptimizer, ParameterRange, SearchMode } from './BacktestOptimizer';
import { BacktestEngine, EngineResult } from './BacktestEngine';
import { BacktestConfig } from './BacktestRunner';
import { IStrategy } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { IDataProvider } from '../interfaces/IDataProvider';
import { logger } from '../utils/logger';

export interface WalkForwardPipelineConfig {
  windows: number;        // default: 5
  trainRatio: number;     // default: 0.7
  searchMode: SearchMode; // default: 'random'
  maxTrials: number;      // default: 30
  initialBalance: number; // default: 10000
  backtestConfig?: BacktestConfig;
}

export interface WalkForwardWindowResult {
  windowIdx: number;
  trainRange: { start: number; end: number };
  testRange: { start: number; end: number };
  bestParams: Record<string, number>;
  inSampleSharpe: number;
  inSampleReturn: number;
  outOfSampleSharpe: number;
  outOfSampleReturn: number;
  degradation: number; // OOS Sharpe / IS Sharpe (capped at 0 if IS=0)
}

export interface WalkForwardPipelineResult {
  windows: WalkForwardWindowResult[];
  avgDegradation: number;
  overfit: boolean;         // avgDegradation < 0.5
  avgOosSharpe: number;
  avgOosReturn: number;
  consistencyScore: number; // % of windows where OOS return > 0
  totalWindows: number;
}

/** Minimal IDataProvider backed by a candle array */
class ArrayDataProvider implements IDataProvider {
  constructor(private readonly candles: ICandle[]) {}

  async init(): Promise<void> { /* no-op */ }
  subscribe(_callback: (candle: ICandle) => void): void { /* no-op */ }
  async start(): Promise<void> { /* no-op */ }
  async stop(): Promise<void> { /* no-op */ }

  async getHistory(limit: number): Promise<ICandle[]> {
    return this.candles.slice(-limit);
  }
}

const DEFAULTS: WalkForwardPipelineConfig = {
  windows: 5,
  trainRatio: 0.7,
  searchMode: 'random',
  maxTrials: 30,
  initialBalance: 10000,
};

export class WalkForwardOptimizerPipeline {
  private readonly config: WalkForwardPipelineConfig;

  constructor(config?: Partial<WalkForwardPipelineConfig>) {
    this.config = { ...DEFAULTS, ...config };
  }

  async run(
    strategyFactory: (params: Record<string, number>) => IStrategy,
    paramRanges: ParameterRange[],
    candles: ICandle[]
  ): Promise<WalkForwardPipelineResult> {
    const { windows, trainRatio, searchMode, maxTrials, initialBalance, backtestConfig } = this.config;

    const windowSize = Math.floor(candles.length / windows);

    if (windowSize < 400) {
      logger.warn(
        `[WalkForwardPipeline] Window size ${windowSize} too small. Need >= 400 candles per window.`
      );
      return {
        windows: [],
        avgDegradation: 0,
        overfit: true,
        avgOosSharpe: 0,
        avgOosReturn: 0,
        consistencyScore: 0,
        totalWindows: 0,
      };
    }

    logger.info(
      `[WalkForwardPipeline] Starting: ${windows} windows, windowSize=${windowSize}, ` +
      `trainRatio=${trainRatio}, searchMode=${searchMode}, maxTrials=${maxTrials}`
    );

    const engine = new BacktestEngine(backtestConfig);
    const windowResults: WalkForwardWindowResult[] = [];

    for (let w = 0; w < windows; w++) {
      const start = w * windowSize;
      const end = Math.min(start + windowSize, candles.length);
      const splitIdx = start + Math.floor((end - start) * trainRatio);

      const trainCandles = candles.slice(start, splitIdx);
      const testCandles = candles.slice(splitIdx, end);

      logger.info(
        `[WalkForwardPipeline] Window ${w + 1}/${windows}: ` +
        `train=[${start}-${splitIdx}] (${trainCandles.length} candles), ` +
        `test=[${splitIdx}-${end}] (${testCandles.length} candles)`
      );

      // Optimize on train data
      const trainProvider = new ArrayDataProvider(trainCandles);
      const optimizer = new BacktestOptimizer(
        trainProvider,
        initialBalance,
        Math.ceil(trainCandles.length / (24 * 60)), // approximate days from candle count
        backtestConfig
      );

      const optResults = await optimizer.optimize(
        strategyFactory,
        paramRanges,
        searchMode,
        maxTrials
      );

      if (optResults.length === 0) {
        logger.warn(`[WalkForwardPipeline] Window ${w + 1}: no valid optimization results, skipping.`);
        continue;
      }

      const best = optResults[0];
      const inSampleSharpe = best.result.sharpeRatio;
      const inSampleReturn = best.result.totalReturn;

      // Validate best params on test data
      const testStrategy = strategyFactory(best.params);
      let oosResult: EngineResult;
      try {
        oosResult = await engine.runDetailed(testStrategy, testCandles, initialBalance);
      } catch (err) {
        logger.warn(`[WalkForwardPipeline] Window ${w + 1}: OOS validation failed: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }

      const degradation = inSampleSharpe !== 0
        ? Math.max(0, oosResult.sharpeRatio / inSampleSharpe)
        : 0;

      windowResults.push({
        windowIdx: w,
        trainRange: { start, end: splitIdx },
        testRange: { start: splitIdx, end },
        bestParams: best.params,
        inSampleSharpe,
        inSampleReturn,
        outOfSampleSharpe: oosResult.sharpeRatio,
        outOfSampleReturn: oosResult.totalReturn,
        degradation,
      });

      logger.info(
        `[WalkForwardPipeline] Window ${w + 1} done: ` +
        `IS Sharpe=${inSampleSharpe.toFixed(3)}, OOS Sharpe=${oosResult.sharpeRatio.toFixed(3)}, ` +
        `degradation=${degradation.toFixed(3)}`
      );
    }

    return this.aggregateResults(windowResults);
  }

  private aggregateResults(windowResults: WalkForwardWindowResult[]): WalkForwardPipelineResult {
    const total = windowResults.length;

    if (total === 0) {
      return {
        windows: [],
        avgDegradation: 0,
        overfit: true,
        avgOosSharpe: 0,
        avgOosReturn: 0,
        consistencyScore: 0,
        totalWindows: 0,
      };
    }

    const avgDegradation = windowResults.reduce((s, w) => s + w.degradation, 0) / total;
    const avgOosSharpe = windowResults.reduce((s, w) => s + w.outOfSampleSharpe, 0) / total;
    const avgOosReturn = windowResults.reduce((s, w) => s + w.outOfSampleReturn, 0) / total;
    const positiveWindows = windowResults.filter(w => w.outOfSampleReturn > 0).length;
    const consistencyScore = (positiveWindows / total) * 100;

    logger.info(
      `[WalkForwardPipeline] Aggregate: avgDegradation=${avgDegradation.toFixed(3)}, ` +
      `avgOosSharpe=${avgOosSharpe.toFixed(3)}, avgOosReturn=${avgOosReturn.toFixed(2)}%, ` +
      `consistency=${consistencyScore.toFixed(1)}%, overfit=${avgDegradation < 0.5}`
    );

    return {
      windows: windowResults,
      avgDegradation,
      overfit: avgDegradation < 0.5,
      avgOosSharpe,
      avgOosReturn,
      consistencyScore,
      totalWindows: total,
    };
  }
}
