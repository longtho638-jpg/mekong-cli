/**
 * Sharpe Calculator — Live risk-adjusted return metrics.
 *
 * Calculates Sharpe, Sortino, and Calmar ratios for real-time trading.
 * Uses configurable risk-free rate (default: 4.5% APY).
 *
 * @module risk
 */

export interface SharpeConfig {
  /** Annual risk-free rate (default: 0.045 = 4.5% APY) */
  riskFreeRate?: number;
  /** Trading days per year (default: 252) */
  tradingDaysPerYear?: number;
  /** Annualization factor for hourly data (default: 8760 hours) */
  hoursPerYear?: number;
}

export interface SharpeResult {
  /** Sharpe ratio (annualized) */
  sharpeRatio: number;
  /** Sortino ratio (annualized, downside deviation) */
  sortinoRatio: number;
  /** Calmar ratio (annualual return / max drawdown) */
  calmarRatio: number;
  /** Annualized return (as decimal) */
  annualizedReturn: number;
  /** Annualized volatility (as decimal) */
  volatility: number;
  /** Maximum drawdown (as decimal) */
  maxDrawdown: number;
  /** Downside deviation (as decimal) */
  downsideDeviation: number;
}

const DEFAULT_CONFIG: Required<SharpeConfig> = {
  riskFreeRate: 0.045, // 4.5% APY
  tradingDaysPerYear: 252,
  hoursPerYear: 8760,
};

/**
 * Live Sharpe Ratio Calculator for real-time trading metrics.
 * Optimized for streaming return data with minimal memory footprint.
 */
export class SharpeCalculator {
  private config: Required<SharpeConfig>;

  constructor(config?: SharpeConfig) {
    this.config = {
      riskFreeRate: config?.riskFreeRate ?? DEFAULT_CONFIG.riskFreeRate,
      tradingDaysPerYear: config?.tradingDaysPerYear ?? DEFAULT_CONFIG.tradingDaysPerYear,
      hoursPerYear: config?.hoursPerYear ?? DEFAULT_CONFIG.hoursPerYear,
    };
  }

  /**
   * Calculate all Sharpe metrics from return series.
   * @param returns - Array of returns (as decimals, e.g., 0.01 = 1%)
   * @param values - Optional portfolio values for drawdown calculation
   * @returns Complete Sharpe metrics
   */
  calculate(returns: number[], values?: number[]): SharpeResult {
    if (returns.length < 2) {
      return this.emptyResult();
    }

    const sharpeRatio = this.calculateSharpe(returns);
    const sortinoRatio = this.calculateSortino(returns);
    const maxDrawdown = values ? this.calculateMaxDrawdown(values) : this.estimateDrawdown(returns);
    const annualizedReturn = this.annualizeReturn(returns);
    const calmarRatio = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      annualizedReturn,
      volatility: this.calculateVolatility(returns),
      maxDrawdown,
      downsideDeviation: this.calculateDownsideDeviation(returns),
    };
  }

  /**
   * Calculate Sharpe ratio: (mean_return - risk_free) / std_dev
   * Annualized using sqrt(trading_days_per_year)
   */
  calculateSharpe(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = this.mean(returns);
    const std = this.std(returns);
    const periodRiskFree = this.config.riskFreeRate! / this.config.tradingDaysPerYear;

    if (std === 0) return 0;

    const periodSharpe = (mean - periodRiskFree) / std;
    return periodSharpe * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Calculate Sortino ratio: (mean_return - risk_free) / downside_deviation
   * Only considers negative returns (downside risk)
   */
  calculateSortino(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = this.mean(returns);
    const downsideReturns = returns.filter(r => r < 0);
    const periodRiskFree = this.config.riskFreeRate! / this.config.tradingDaysPerYear;

    // If no negative returns, return high Sortino if mean is positive
    if (downsideReturns.length === 0) {
      return mean > 0 ? 3 : 0;
    }

    const downsideDev = this.calculateDownsideDeviation(returns);
    if (downsideDev === 0) return 0;

    const periodSortino = (mean - periodRiskFree) / downsideDev;
    return periodSortino * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Calculate Calmar ratio: annualized_return / max_drawdown
   * Measures return per unit of drawdown risk
   */
  calculateCalmar(returns: number[], values: number[]): number {
    if (values.length < 2) return 0;

    const maxDrawdown = this.calculateMaxDrawdown(values);
    if (maxDrawdown === 0) return 0;

    const annualizedReturn = this.annualizeReturn(returns);
    return annualizedReturn / Math.abs(maxDrawdown);
  }

  /**
   * Calculate maximum drawdown from portfolio values.
   * @param values - Portfolio equity curve
   * @returns Maximum drawdown as decimal (e.g., 0.15 = 15% drawdown)
   */
  calculateMaxDrawdown(values: number[]): number {
    if (values.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = values[0];

    for (const value of values) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  /**
   * Calculate downside deviation (semi-deviation).
   * Only considers negative returns.
   */
  calculateDownsideDeviation(returns: number[]): number {
    const downsideReturns = returns.filter(r => r < 0);
    if (downsideReturns.length === 0) return 0;

    const sumSquares = downsideReturns.reduce((sum, r) => sum + r * r, 0);
    return Math.sqrt(sumSquares / returns.length);
  }

  /**
   * Calculate annualized volatility.
   */
  calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    return this.std(returns) * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Annualize return from periodic returns.
   * Assumes daily returns; adjusts for actual time period if timestamps available.
   */
  annualizeReturn(returns: number[]): number {
    if (returns.length < 2) return 0;

    // Geometric mean for compounding
    const compoundedReturn = returns.reduce((prod, r) => prod * (1 + r), 1) - 1;
    const periodFraction = returns.length / this.config.tradingDaysPerYear;

    if (periodFraction === 0) return 0;

    return Math.pow(1 + compoundedReturn, 1 / periodFraction) - 1;
  }

  /**
   * Estimate drawdown from returns (when values not available).
   * Uses cumulative return decline approximation.
   */
  private estimateDrawdown(returns: number[]): number {
    let peak = 1;
    let cumulative = 1;
    let maxDrawdown = 0;

    for (const ret of returns) {
      cumulative *= (1 + ret);
      if (cumulative > peak) peak = cumulative;
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  /**
   * Mean of array
   */
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Standard deviation (sample)
   */
  private std(values: number[]): number {
    const mean = this.mean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Empty result for edge cases
   */
  private emptyResult(): SharpeResult {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      annualizedReturn: 0,
      volatility: 0,
      maxDrawdown: 0,
      downsideDeviation: 0,
    };
  }
}
