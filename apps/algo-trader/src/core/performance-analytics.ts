/**
 * PerformanceAnalytics - Risk-adjusted return metrics
 *
 * Calculates:
 * - Sharpe ratio: (mean_return - risk_free) / std_dev
 * - Sortino ratio: downside deviation only
 * - Calmar ratio: annual_return / max_drawdown
 * - Configurable lookback periods (7d, 30d, 90d)
 *
 * @module core
 */

export interface ReturnSeries {
  timestamps: number[];
  returns: number[];
  values: number[];
}

export interface AnalyticsConfig {
  riskFreeRate: number;        // Annual risk-free rate (default: 0.05 = 5%)
  tradingDaysPerYear: number;  // Default: 252
  lookbackPeriods: number[];   // Days to analyze: [7, 30, 90]
}

export interface PerformanceMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  downsideDeviation: number;
  maxDrawdown: number;
  avgDrawdown: number;
  skewness: number;
  kurtosis: number;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  riskFreeRate: 0.05,
  tradingDaysPerYear: 252,
  lookbackPeriods: [7, 30, 90],
};

export class PerformanceAnalytics {
  private config: AnalyticsConfig;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate all performance metrics from return series
   */
  calculateMetrics(series: ReturnSeries): PerformanceMetrics {
    if (series.returns.length < 2) {
      return this.emptyMetrics();
    }

    const sharpeRatio = this.calculateSharpe(series.returns);
    const sortinoRatio = this.calculateSortino(series.returns);
    const maxDrawdown = this.calculateMaxDrawdown(series.values);
    const totalReturn = this.calculateTotalReturn(series.values);
    const annualizedReturn = this.annualize(totalReturn, series.timestamps);
    const calmarRatio = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      totalReturn: totalReturn * 100,
      annualizedReturn: annualizedReturn * 100,
      volatility: this.calculateVolatility(series.returns) * 100,
      downsideDeviation: this.calculateDownsideDeviation(series.returns) * 100,
      maxDrawdown: maxDrawdown * 100,
      avgDrawdown: this.calculateAvgDrawdown(series.values) * 100,
      skewness: this.calculateSkewness(series.returns),
      kurtosis: this.calculateKurtosis(series.returns),
    };
  }

  /**
   * Sharpe ratio: (mean_return - risk_free) / std_dev
   * Annualized using sqrt(trading_days)
   */
  calculateSharpe(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = this.mean(returns);
    const std = this.std(returns);
    const dailyRiskFree = this.config.riskFreeRate / this.config.tradingDaysPerYear;

    if (std === 0) return 0;

    const dailySharpe = (mean - dailyRiskFree) / std;
    return dailySharpe * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Sortino ratio: (mean_return - risk_free) / downside_deviation
   * Only considers negative returns
   */
  calculateSortino(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = this.mean(returns);
    const downsideReturns = returns.filter(r => r < 0);
    const dailyRiskFree = this.config.riskFreeRate / this.config.tradingDaysPerYear;

    if (downsideReturns.length === 0) return mean > 0 ? 3 : 0;

    const downsideDev = this.calculateDownsideDeviation(returns);
    if (downsideDev === 0) return 0;

    const dailySortino = (mean - dailyRiskFree) / downsideDev;
    return dailySortino * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Calmar ratio: annual_return / max_drawdown
   * Measures return per unit of drawdown
   */
  calculateCalmar(returns: number[], values: number[]): number {
    if (values.length < 2) return 0;

    const totalReturn = this.calculateTotalReturn(values);
    const maxDrawdown = this.calculateMaxDrawdown(values);

    if (maxDrawdown === 0) return 0;

    const annualized = this.annualize(totalReturn, this.generateTimestamps(returns.length));
    return annualized / Math.abs(maxDrawdown);
  }

  /**
   * Maximum drawdown from peak
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
   * Average drawdown across all drawdown periods
   */
  calculateAvgDrawdown(values: number[]): number {
    if (values.length < 2) return 0;

    const drawdowns: number[] = [];
    let peak = values[0];

    for (const value of values) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > 0) drawdowns.push(drawdown);
    }

    return drawdowns.length > 0 ? this.mean(drawdowns) : 0;
  }

  /**
   * Calculate downside deviation (only negative returns)
   */
  calculateDownsideDeviation(returns: number[]): number {
    const downsideReturns = returns.filter(r => r < 0);
    if (downsideReturns.length === 0) return 0;

    const sumSquares = downsideReturns.reduce((s, r) => s + r * r, 0);
    return Math.sqrt(sumSquares / returns.length);
  }

  /**
   * Annualized volatility
   */
  calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    return this.std(returns) * Math.sqrt(this.config.tradingDaysPerYear);
  }

  /**
   * Total return: (final - initial) / initial
   */
  calculateTotalReturn(values: number[]): number {
    if (values.length < 2) return 0;
    return (values[values.length - 1] - values[0]) / values[0];
  }

  /**
   * Skewness: asymmetry of return distribution
   */
  calculateSkewness(returns: number[]): number {
    if (returns.length < 3) return 0;

    const mean = this.mean(returns);
    const std = this.std(returns);
    if (std === 0) return 0;

    const n = returns.length;
    const sumCubed = returns.reduce((s, r) => s + Math.pow((r - mean) / std, 3), 0);

    return (n / ((n - 1) * (n - 2))) * sumCubed;
  }

  /**
   * Kurtosis: tail heaviness of return distribution
   */
  calculateKurtosis(returns: number[]): number {
    if (returns.length < 4) return 0;

    const mean = this.mean(returns);
    const std = this.std(returns);
    if (std === 0) return 0;

    const n = returns.length;
    const sumQuartic = returns.reduce((s, r) => s + Math.pow((r - mean) / std, 4), 0);

    const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumQuartic;
    const adjustment = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));

    return kurtosis - adjustment;
  }

  /**
   * Get metrics for specific lookback period
   */
  getMetricsForPeriod(series: ReturnSeries, days: number): PerformanceMetrics {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const indices = series.timestamps.map((t, i) => t >= cutoff ? i : -1).filter(i => i !== -1);

    if (indices.length < 2) return this.emptyMetrics();

    const slicedSeries: ReturnSeries = {
      timestamps: indices.map(i => series.timestamps[i]),
      returns: indices.map(i => series.returns[i]),
      values: indices.map(i => series.values[i]),
    };

    return this.calculateMetrics(slicedSeries);
  }

  /**
   * Annualize return based on time period
   */
  private annualize(totalReturn: number, timestamps: number[]): number {
    if (timestamps.length < 2) return 0;

    const days = (timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24);
    if (days === 0) return 0;

    const years = days / this.config.tradingDaysPerYear;
    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  /**
   * Generate timestamps for returns array
   */
  private generateTimestamps(length: number): number[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return Array.from({ length }, (_, i) => now - (length - i - 1) * dayMs);
  }

  /**
   * Mean of array
   */
  private mean(values: number[]): number {
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  /**
   * Standard deviation
   */
  private std(values: number[]): number {
    const mean = this.mean(values);
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Empty metrics for edge cases
   */
  private emptyMetrics(): PerformanceMetrics {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      downsideDeviation: 0,
      maxDrawdown: 0,
      avgDrawdown: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }
}
