/**
 * Premium Backtest Engine — ROIaaS Phase 6
 *
 * Historical signal accuracy testing, strategy simulation on past Polymarket data,
 * PnL projection with tier-based gating.
 *
 * TIER RESTRICTIONS:
 * - FREE: 7-day lookback only, basic metrics
 * - PRO: Full history access, advanced metrics (Sharpe, Sortino, Calmar)
 * - ENTERPRISE: Custom strategies, walk-forward analysis, Monte Carlo simulation
 *
 * Features:
 * - Historical signal accuracy testing
 * - Strategy simulation on Polymarket-style binary options
 * - PnL projection with confidence intervals
 * - Tier-based data access gating
 */

import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

/**
 * Signal accuracy metrics
 */
export interface SignalAccuracyMetrics {
  totalSignals: number;
  correctSignals: number;
  accuracyRate: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
}

/**
 * PnL projection result
 */
export interface PnLProjection {
  expectedReturn: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  riskMetrics: {
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
    var95: number; // Value at Risk at 95%
  };
  projectionDays: number;
  initialCapital: number;
  projectedFinalCapital: number;
}

/**
 * Backtest result with tier-based detail levels
 */
export interface BacktestResult {
  // Basic metrics (all tiers)
  totalReturn: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;

  // PRO tier metrics
  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;

  // ENTERPRISE tier metrics
  walkForwardRobustness?: number;
  monteCarloRuinProbability?: number;

  // Metadata
  lookbackDays: number;
  tier: LicenseTier;
  timestamp: number;
}

/**
 * Polymarket-style binary option trade
 */
export interface BinaryOptionTrade {
  marketId: string;
  question: string;
  outcome: 'YES' | 'NO';
  entryPrice: number; // 0-100 cents
  exitPrice: number; // 0-100 cents
  stake: number;
  payout: number;
  profit: number;
  timestamp: number;
  resolved: boolean;
}

/**
 * Historical data point for Polymarket
 */
export interface PolymarketDataPoint {
  timestamp: number;
  yesPrice: number; // 0-100
  noPrice: number; // 0-100
  volume: number;
  openInterest: number;
}

/**
 * Premium Backtest Engine
 */
export class PremiumBacktestEngine {
  private licenseService: LicenseService;
  private readonly FREE_LOOKBACK_DAYS = 7;
  private readonly PRO_LOOKBACK_DAYS = 90;
  private readonly ENTERPRISE_LOOKBACK_DAYS = 365;

  constructor() {
    this.licenseService = LicenseService.getInstance();
  }

  /**
   * Get max lookback days for current tier
   */
  getMaxLookbackDays(): number {
    const tier = this.licenseService.getTier();
    switch (tier) {
      case LicenseTier.PRO:
        return this.PRO_LOOKBACK_DAYS;
      case LicenseTier.ENTERPRISE:
        return this.ENTERPRISE_LOOKBACK_DAYS;
      default:
        return this.FREE_LOOKBACK_DAYS;
    }
  }

  /**
   * Validate requested lookback against tier limits
   */
  validateLookback(requestedDays: number): void {
    const maxDays = this.getMaxLookbackDays();
    if (requestedDays > maxDays) {
      const tier = this.licenseService.getTier();
      throw new LicenseError(
        `Lookback period of ${requestedDays} days exceeds ${tier} tier limit of ${maxDays} days. Upgrade for longer history.`,
        tier === LicenseTier.FREE ? LicenseTier.PRO : LicenseTier.ENTERPRISE,
        'lookback_limit_exceeded'
      );
    }
  }

  /**
   * Run historical signal accuracy test
   *
   * @param signals - Array of historical signals with outcomes
   * @param lookbackDays - Requested lookback period
   * @returns Signal accuracy metrics
   */
  async testSignalAccuracy(
    signals: Array<{ timestamp: number; predicted: boolean; actual: boolean }>,
    lookbackDays: number = 30
  ): Promise<SignalAccuracyMetrics> {
    // Validate lookback
    this.validateLookback(lookbackDays);

    // Filter to lookback window
    const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const filteredSignals = signals.filter(s => s.timestamp >= cutoffTime);

    if (filteredSignals.length === 0) {
      return {
        totalSignals: 0,
        correctSignals: 0,
        accuracyRate: 0,
        falsePositives: 0,
        falseNegatives: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
      };
    }

    // Calculate metrics
    const truePositives = filteredSignals.filter(s => s.predicted && s.actual).length;
    const trueNegatives = filteredSignals.filter(s => !s.predicted && !s.actual).length;
    const falsePositives = filteredSignals.filter(s => s.predicted && !s.actual).length;
    const falseNegatives = filteredSignals.filter(s => !s.predicted && s.actual).length;

    const totalSignals = filteredSignals.length;
    const correctSignals = truePositives + trueNegatives;
    const accuracyRate = totalSignals > 0 ? correctSignals / totalSignals : 0;

    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;

    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

    const f1Score = precision + recall > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return {
      totalSignals,
      correctSignals,
      accuracyRate,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1Score,
    };
  }

  /**
   * Simulate strategy on historical Polymarket data
   *
   * @param data - Historical price data
   * @param strategy - Strategy function (returns YES/NO signal)
   * @param lookbackDays - Requested lookback period
   * @param initialCapital - Starting capital
   * @returns Backtest result with tier-based metrics
   */
  async simulateStrategy(
    data: PolymarketDataPoint[],
    strategy: (data: PolymarketDataPoint[]) => Promise<'YES' | 'NO' | null>,
    lookbackDays: number = 30,
    initialCapital: number = 10000
  ): Promise<BacktestResult> {
    // Validate lookback
    this.validateLookback(lookbackDays);

    const tier = this.licenseService.getTier();
    const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const filteredData = data.filter(d => d.timestamp >= cutoffTime);

    if (filteredData.length < 2) {
      return {
        totalReturn: 0,
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        lookbackDays,
        tier,
        timestamp: Date.now(),
      };
    }

    // Run simulation
    const trades: BinaryOptionTrade[] = [];
    let capital = initialCapital;
    let peakCapital = initialCapital;
    let maxDrawdown = 0;
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    for (let i = 1; i < filteredData.length; i++) {
      const prevData = filteredData[i - 1];
      const currData = filteredData[i];

      const signal = await strategy([prevData, currData]);
      if (!signal) continue;

      // Simulate binary option trade
      const entryPrice = signal === 'YES' ? prevData.yesPrice : prevData.noPrice;
      const exitPrice = signal === 'YES' ? currData.yesPrice : currData.noPrice;

      // Calculate profit/loss (simplified: stake = 100 units)
      const stake = 100;
      const priceChange = exitPrice - entryPrice;
      const profit = (priceChange / entryPrice) * stake;

      const trade: BinaryOptionTrade = {
        marketId: `sim_${i}`,
        question: 'Simulated Market',
        outcome: signal,
        entryPrice,
        exitPrice,
        stake,
        payout: stake + profit,
        profit,
        timestamp: currData.timestamp,
        resolved: true,
      };

      trades.push(trade);
      capital += profit;

      if (profit > 0) {
        wins++;
        totalProfit += profit;
      } else {
        losses++;
        totalLoss += Math.abs(profit);
      }

      // Track drawdown
      if (capital > peakCapital) {
        peakCapital = capital;
      }
      const drawdown = ((peakCapital - capital) / peakCapital) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const totalTrades = trades.length;
    const totalReturn = ((capital - initialCapital) / initialCapital) * 100;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Build result with tier-based metrics
    const result: BacktestResult = {
      totalReturn,
      totalTrades,
      winRate,
      profitFactor,
      maxDrawdown,
      lookbackDays,
      tier,
      timestamp: Date.now(),
    };

    // PRO tier: Add advanced metrics
    if (this.licenseService.hasTier(LicenseTier.PRO)) {
      result.sharpeRatio = this.calculateSharpeRatio(trades, lookbackDays);
      result.sortinoRatio = this.calculateSortinoRatio(trades, lookbackDays);
      result.calmarRatio = totalReturn / (maxDrawdown || 1);
    }

    // ENTERPRISE tier: Add robustness metrics
    if (this.licenseService.hasTier(LicenseTier.ENTERPRISE)) {
      result.walkForwardRobustness = this.calculateWalkForwardRobustness(trades);
      result.monteCarloRuinProbability = this.calculateMonteCarloRuinProbability(trades, initialCapital);
    }

    return result;
  }

  /**
   * Project PnL based on historical performance
   *
   * @param historicalTrades - Historical trade data
   * @param projectionDays - Days to project
   * @param initialCapital - Starting capital
   * @returns PnL projection with confidence intervals
   */
  async projectPnL(
    historicalTrades: BinaryOptionTrade[],
    projectionDays: number = 30,
    initialCapital: number = 10000
  ): Promise<PnLProjection> {
    if (historicalTrades.length < 10) {
      throw new Error('Insufficient historical data for PnL projection (need >= 10 trades)');
    }

    // Calculate historical metrics
    const returns = historicalTrades.map(t => t.profit / initialCapital);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    // Calculate max drawdown
    let peak = initialCapital;
    let maxDD = 0;
    let capital = initialCapital;
    for (const trade of historicalTrades) {
      capital += trade.profit;
      if (capital > peak) peak = capital;
      const dd = (peak - capital) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    // Sharpe ratio (annualized)
    const riskFreeRate = 0.02; // 2% annual
    const annualizedReturn = avgReturn * 252; // 252 trading days
    const annualizedVol = volatility * Math.sqrt(252);
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVol;

    // Project future PnL with Monte Carlo simulation
    const simulations = 1000;
    const finalValues: number[] = [];

    for (let sim = 0; sim < simulations; sim++) {
      let simCapital = initialCapital;
      for (let day = 0; day < projectionDays; day++) {
        // Random daily return based on historical distribution
        const dailyReturn = this.randomNormal(avgReturn, volatility);
        simCapital *= (1 + dailyReturn);
      }
      finalValues.push(simCapital);
    }

    // Calculate confidence intervals
    finalValues.sort((a, b) => a - b);
    const p5 = finalValues[Math.floor(simulations * 0.05)];
    const p95 = finalValues[Math.floor(simulations * 0.95)];
    const median = finalValues[Math.floor(simulations * 0.5)];

    // VaR at 95%
    const var95 = initialCapital - p5;

    return {
      expectedReturn: ((median - initialCapital) / initialCapital) * 100,
      confidenceInterval: {
        lower: ((p5 - initialCapital) / initialCapital) * 100,
        upper: ((p95 - initialCapital) / initialCapital) * 100,
        confidence: 90,
      },
      riskMetrics: {
        volatility: annualizedVol * 100,
        maxDrawdown: maxDD * 100,
        sharpeRatio,
        var95,
      },
      projectionDays,
      initialCapital,
      projectedFinalCapital: median,
    };
  }

  /**
   * Helper: Calculate Sharpe Ratio
   */
  private calculateSharpeRatio(trades: BinaryOptionTrade[], lookbackDays: number): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.profit / 100); // Normalize by stake
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualize
    const tradingDays = lookbackDays;
    const annualizedReturn = avgReturn * (252 / tradingDays);
    const annualizedStdDev = stdDev * Math.sqrt(252 / tradingDays);

    const riskFreeRate = 0.02;
    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
  }

  /**
   * Helper: Calculate Sortino Ratio (downside deviation only)
   */
  private calculateSortinoRatio(trades: BinaryOptionTrade[], lookbackDays: number): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.profit / 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Only consider negative returns for downside deviation
    const negativeReturns = returns.filter(r => r < avgReturn);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / negativeReturns.length
      : 0;

    const downsideDeviation = Math.sqrt(downsideVariance);
    if (downsideDeviation === 0) return 0;

    const tradingDays = lookbackDays;
    const annualizedReturn = avgReturn * (252 / tradingDays);
    const riskFreeRate = 0.02;

    return (annualizedReturn - riskFreeRate) / downsideDeviation;
  }

  /**
   * Helper: Calculate Walk-Forward Robustness Ratio
   */
  private calculateWalkForwardRobustness(trades: BinaryOptionTrade[]): number {
    if (trades.length < 20) return 0;

    // Split into train/test periods
    const midpoint = Math.floor(trades.length / 2);
    const trainTrades = trades.slice(0, midpoint);
    const testTrades = trades.slice(midpoint);

    const trainReturn = trainTrades.reduce((sum, t) => sum + t.profit, 0);
    const testReturn = testTrades.reduce((sum, t) => sum + t.profit, 0);

    // Robustness = test return / train return (should be close to 1)
    if (trainReturn === 0) return 0;
    return testReturn / trainReturn;
  }

  /**
   * Helper: Calculate Monte Carlo Ruin Probability
   */
  private calculateMonteCarloRuinProbability(trades: BinaryOptionTrade[], initialCapital: number): number {
    const simulations = 1000;
    const ruinThreshold = initialCapital * 0.5; // 50% loss = ruin
    let ruinCount = 0;

    const tradeReturns = trades.map(t => t.profit);

    for (let sim = 0; sim < simulations; sim++) {
      let simCapital = initialCapital;

      // Random sample trades with replacement
      for (let i = 0; i < trades.length; i++) {
        const randomTrade = tradeReturns[Math.floor(Math.random() * tradeReturns.length)];
        simCapital += randomTrade;

        if (simCapital < ruinThreshold) {
          ruinCount++;
          break;
        }
      }
    }

    return (ruinCount / simulations) * 100;
  }

  /**
   * Helper: Generate random normal distribution
   */
  private randomNormal(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }
}

// Export singleton instance
export const premiumBacktestEngine = new PremiumBacktestEngine();
