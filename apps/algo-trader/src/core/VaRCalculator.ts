/**
 * Value at Risk (VaR) and Conditional Value at Risk (CVaR) Calculator
 * Implements various VaR calculation methods for portfolio risk assessment
 */

export interface VarCalculationParams {
  portfolioValue: number;
  confidenceLevel: number; // e.g., 0.95 for 95% confidence
  lookbackDays: number; // Historical data lookback period
  method: 'historical' | 'variance-covariance' | 'monte-carlo';
}

export interface VarResult {
  var: number; // Value at Risk
  cvar: number; // Conditional Value at Risk (Expected Shortfall)
  confidenceLevel: number;
  portfolioValue: number;
}

export interface HistoricalDataPoint {
  date: Date;
  portfolioValue: number;
  returns: number; // Daily return as decimal (e.g., 0.02 for 2%)
}

export class VaRCalculator {
  /**
   * Calculate Value at Risk (VaR) and Conditional Value at Risk (CVaR)
   * @param data Historical portfolio data points
   * @param params Calculation parameters
   * @returns VaR and CVaR values
   */
  static calculateVar(data: HistoricalDataPoint[], params: VarCalculationParams): VarResult {
    if (data.length < params.lookbackDays) {
      throw new Error(`Insufficient data: need at least ${params.lookbackDays} data points, got ${data.length}`);
    }

    // Get the most recent lookbackDays of data
    const recentData = data.slice(-params.lookbackDays);

    // Sort returns by value (ascending) to find percentiles
    const sortedReturns = [...recentData]
      .map(point => point.returns)
      .sort((a, b) => a - b);

    let varValue: number;
    switch (params.method) {
      case 'historical':
        varValue = this.calculateHistoricalVar(sortedReturns, params.confidenceLevel);
        break;
      case 'variance-covariance':
        varValue = this.calculateParametricVar(recentData, params.confidenceLevel);
        break;
      case 'monte-carlo':
        varValue = this.calculateMonteCarloVar(recentData, params.confidenceLevel);
        break;
      default:
        throw new Error(`Unsupported VaR method: ${params.method}`);
    }

    // Calculate CVaR (Expected Shortfall) - average of losses exceeding VaR
    const cvarValue = this.calculateCVar(sortedReturns, params.confidenceLevel, varValue);

    return {
      var: Math.abs(varValue) * params.portfolioValue, // Convert to monetary value
      cvar: Math.abs(cvarValue) * params.portfolioValue, // Convert to monetary value
      confidenceLevel: params.confidenceLevel,
      portfolioValue: params.portfolioValue
    };
  }

  /**
   * Historical VaR - uses historical returns distribution directly
   */
  private static calculateHistoricalVar(sortedReturns: number[], confidenceLevel: number): number {
    // Calculate the index for the confidence level
    const alphaIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);

    // Return the VaR (loss value, so negative return)
    return sortedReturns[alphaIndex];
  }

  /**
   * Parametric VaR (Variance-Covariance) - assumes normal distribution
   */
  private static calculateParametricVar(data: HistoricalDataPoint[], confidenceLevel: number): number {
    // Calculate mean and standard deviation of returns
    const returns = data.map(d => d.returns);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    // Calculate VaR using normal distribution quantile
    // Using approximation for normal distribution quantile
    const zScore = this.normalQuantile(1 - confidenceLevel);
    return mean + zScore * stdDev;
  }

  /**
   * Monte Carlo VaR - simulates potential future scenarios
   */
  private static calculateMonteCarloVar(data: HistoricalDataPoint[], confidenceLevel: number): number {
    // For simplicity, we'll use a parametric Monte Carlo based on historical statistics
    // In practice, this would involve more complex simulation

    const returns = data.map(d => d.returns);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    // Generate random samples and calculate VaR
    const sampleSize = 10000;
    const simulatedReturns: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      // Box-Muller transform to generate normal random variables
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      // Generate return using historical mean and std dev
      simulatedReturns.push(mean + z * stdDev);
    }

    // Sort and find the appropriate percentile
    simulatedReturns.sort((a, b) => a - b);
    const alphaIndex = Math.floor((1 - confidenceLevel) * simulatedReturns.length);

    return simulatedReturns[alphaIndex];
  }

  /**
   * Calculate Conditional Value at Risk (CVaR/Expected Shortfall)
   */
  private static calculateCVar(sortedReturns: number[], confidenceLevel: number, varReturn: number): number {
    // Find all returns worse than VaR
    const threshold = varReturn; // The VaR return value
    const tailLosses = sortedReturns.filter(r => r <= threshold);

    if (tailLosses.length === 0) {
      // If no values are worse than VaR, return VaR itself
      return varReturn;
    }

    // CVaR is the average of all values worse than VaR
    const avgTailLoss = tailLosses.reduce((sum, r) => sum + r, 0) / tailLosses.length;
    return avgTailLoss;
  }

  /**
   * Approximate normal distribution quantile (inverse CDF)
   * Using Beasley-Springer-Moro algorithm
   */
  private static normalQuantile(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1 (exclusive)');
    }

    if (p === 0.5) return 0;

    const split = 0.42;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
               1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
               6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
               -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
               3.754408661907416e+00];

    let x, y;
    if (p < split) {
      const q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    return x;
  }
}