/**
 * BacktestEngine — Advanced backtesting framework.
 * Walk-forward analysis, equity curve tracking, Monte Carlo simulation.
 * Builds on BacktestRunner with portfolio-level and robustness features.
 *
 * PREMIUM FEATURES (require PRO/ENTERPRISE license):
 * - Walk-forward analysis
 * - Monte Carlo simulation
 * - Advanced metrics (Sharpe, Sortino, Calmar)
 * - Premium historical data access
 */

import { IStrategy, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { BacktestConfig } from './BacktestRunner';
import { logger } from '../utils/logger';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';
import {
  EquityPoint,
  DetailedTrade,
  WalkForwardWindow,
  WalkForwardResult,
  MonteCarloResult,
  EngineResult,
} from './backtest-engine-result-types';
import {
  closeTrade,
  applySlippage,
  shuffleArray,
  buildEngineResult,
  emptyEngineResult,
} from './backtest-engine-metrics-and-statistics-calculator';

export type {
  EquityPoint,
  DetailedTrade,
  WalkForwardWindow,
  WalkForwardResult,
  MonteCarloResult,
  EngineResult,
};

export class BacktestEngine {
  private feeRate: number;
  private riskPercentage: number;
  private slippageBps: number;
  private licenseService: LicenseService;

  constructor(config?: BacktestConfig) {
    this.feeRate = config?.feeRate ?? 0.001;
    this.riskPercentage = config?.riskPercentage ?? 2;
    this.slippageBps = config?.slippageBps ?? 5;
    this.licenseService = LicenseService.getInstance();
  }

  /**
   * Run a detailed backtest with equity curve and advanced metrics.
   * FREE TIER: Basic backtest only (no advanced metrics)
   * PRO TIER: Full metrics including Sharpe, Sortino, Calmar
   */
  async runDetailed(
    strategy: IStrategy,
    candles: ICandle[],
    initialBalance = 10000
  ): Promise<EngineResult> {
    // Gate premium data access
    if (candles.length > 10000 && !this.licenseService.hasTier(LicenseTier.PRO)) {
      throw new LicenseError(
        'Premium historical data (>10k candles) requires PRO license',
        LicenseTier.PRO,
        'premium_data'
      );
    }

    let balance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdown = 0;
    const trades: DetailedTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    let openPos: { price: number; time: number; size: number; mae: number; mfe: number } | null = null;

    const warmup = Math.min(200, Math.floor(candles.length * 0.1));
    if (candles.length <= warmup) {
      return emptyEngineResult(strategy.name, initialBalance);
    }

    await strategy.init(candles.slice(0, warmup));

    for (let i = warmup; i < candles.length; i++) {
      const candle = candles[i];

      // Track MAE/MFE for open positions
      if (openPos) {
        openPos.mae = Math.min(openPos.mae, candle.low);
        openPos.mfe = Math.max(openPos.mfe, candle.high);
      }

      const signal = await strategy.onCandle(candle);

      if (signal) {
        if (signal.type === SignalType.BUY && !openPos) {
          const fillPrice = applySlippage(candle.close, 'buy', this.slippageBps);
          const riskAmount = balance * (this.riskPercentage / 100);
          const size = riskAmount / fillPrice;
          if (size > 0) {
            balance -= size * fillPrice * this.feeRate;
            openPos = { price: fillPrice, time: candle.timestamp, size, mae: candle.low, mfe: candle.high };
          }
        } else if (signal.type === SignalType.SELL && openPos) {
          const exitPrice = applySlippage(candle.close, 'sell', this.slippageBps);
          const trade = closeTrade(openPos, exitPrice, candle.timestamp, this.feeRate);
          trades.push(trade);
          balance += trade.profit;
          openPos = null;
        }
      }

      // Track equity
      if (balance > peakBalance) peakBalance = balance;
      const dd = peakBalance > 0 ? ((peakBalance - balance) / peakBalance) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;

      // Sample equity curve (every 100 candles to keep output manageable)
      if (i % 100 === 0 || i === candles.length - 1) {
        equityCurve.push({ timestamp: candle.timestamp, equity: balance, drawdown: dd });
      }
    }

    return buildEngineResult(strategy.name, initialBalance, balance, maxDrawdown, trades, equityCurve);
  }

  /**
   * Walk-forward analysis: split data into train/test windows,
   * run backtest on each, measure out-of-sample robustness.
   *
   * PREMIUM FEATURE: Requires PRO license.
   */
  async walkForward(
    strategyFactory: () => IStrategy,
    candles: ICandle[],
    windows = 5,
    trainRatio = 0.7,
    initialBalance = 10000
  ): Promise<WalkForwardResult> {
    // Gate premium feature
    this.licenseService.requireTier(LicenseTier.PRO, 'walk_forward_analysis');

    const totalCandles = candles.length;
    const windowSize = Math.floor(totalCandles / windows);

    if (windowSize < 400) {
      logger.warn(`[WalkForward] Window size ${windowSize} too small. Need >= 400 candles per window.`);
      return { windows: [], aggregateTestReturn: 0, aggregateTestSharpe: 0, robustnessRatio: 0, overfit: true };
    }

    const results: WalkForwardWindow[] = [];
    let totalTestReturn = 0;
    let totalTrainSharpe = 0;
    let totalTestSharpe = 0;

    for (let w = 0; w < windows; w++) {
      const start = w * windowSize;
      const end = Math.min(start + windowSize, totalCandles);
      const splitIdx = start + Math.floor((end - start) * trainRatio);

      const trainData = candles.slice(start, splitIdx);
      const testData = candles.slice(splitIdx, end);

      const trainStrategy = strategyFactory();
      const trainResult = await this.runDetailed(trainStrategy, trainData, initialBalance);

      const testStrategy = strategyFactory();
      const testResult = await this.runDetailed(testStrategy, testData, initialBalance);

      results.push({
        trainStart: start,
        trainEnd: splitIdx,
        testStart: splitIdx,
        testEnd: end,
        trainResult,
        testResult,
      });

      totalTestReturn += testResult.totalReturn;
      totalTrainSharpe += trainResult.sharpeRatio;
      totalTestSharpe += testResult.sharpeRatio;
    }

    const avgTrainSharpe = totalTrainSharpe / windows;
    const avgTestSharpe = totalTestSharpe / windows;
    const robustnessRatio = avgTrainSharpe !== 0 ? avgTestSharpe / avgTrainSharpe : 0;
    const overfit = robustnessRatio < 0.5;

    return {
      windows: results,
      aggregateTestReturn: totalTestReturn / windows,
      aggregateTestSharpe: avgTestSharpe,
      robustnessRatio,
      overfit,
    };
  }

  /**
   * Monte Carlo simulation: shuffle trades to test strategy robustness.
   * Answers "would this strategy still work if trades happened in a different order?"
   *
   * PREMIUM FEATURE: Requires PRO license.
   */
  monteCarlo(trades: DetailedTrade[], initialBalance: number, simulations = 1000): MonteCarloResult {
    // Gate premium feature
    this.licenseService.requireTier(LicenseTier.PRO, 'monte_carlo_simulation');

    if (trades.length === 0) {
      return { medianReturn: 0, p5Return: 0, p95Return: 0, medianDrawdown: 0, p95Drawdown: 0, ruinProbability: 0 };
    }

    const finalReturns: number[] = [];
    const maxDrawdowns: number[] = [];

    for (let sim = 0; sim < simulations; sim++) {
      const shuffled = shuffleArray([...trades]);
      let balance = initialBalance;
      let peak = initialBalance;
      let maxDD = 0;

      for (const trade of shuffled) {
        balance += trade.profit;
        if (balance > peak) peak = balance;
        const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
        if (dd > maxDD) maxDD = dd;
      }

      finalReturns.push(((balance - initialBalance) / initialBalance) * 100);
      maxDrawdowns.push(maxDD);
    }

    finalReturns.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const ruinCount = finalReturns.filter(r => r < -50).length;

    return {
      medianReturn: finalReturns[Math.floor(simulations / 2)],
      p5Return: finalReturns[Math.floor(simulations * 0.05)],
      p95Return: finalReturns[Math.floor(simulations * 0.95)],
      medianDrawdown: maxDrawdowns[Math.floor(simulations / 2)],
      p95Drawdown: maxDrawdowns[Math.floor(simulations * 0.95)],
      ruinProbability: (ruinCount / simulations) * 100,
    };
  }
}
