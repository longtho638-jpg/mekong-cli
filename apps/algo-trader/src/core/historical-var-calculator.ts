/**
 * Historical Value-at-Risk calculator using quantile-based simulation.
 * No distribution assumptions — sort returns and take quantiles.
 */

export interface VaRInput {
  dailyReturns: number[]; // Array of daily PnL returns (as fractions, e.g. -0.02)
  confidence: number;     // e.g., 0.95 for 95% VaR
  portfolioValue: number; // Current total portfolio value in USD
}

export interface VaRResult {
  var95: number;     // VaR at 95% confidence (absolute USD loss)
  var99: number;     // VaR at 99% confidence (absolute USD loss)
  cvar95: number;    // Conditional VaR / Expected Shortfall at 95%
  maxLoss: number;   // Worst historical return (as absolute USD loss)
  windowDays: number; // Number of days used in calculation
}

export class HistoricalVaRCalculator {
  /**
   * Calculate VaR from daily PnL returns using historical simulation.
   */
  calculate(input: VaRInput): VaRResult {
    const { dailyReturns, portfolioValue } = input;

    if (dailyReturns.length === 0) {
      return { var95: 0, var99: 0, cvar95: 0, maxLoss: 0, windowDays: 0 };
    }

    const sorted = [...dailyReturns].sort((a, b) => a - b);
    const n = sorted.length;

    const q05 = this.quantile(sorted, 0.05);
    const q01 = this.quantile(sorted, 0.01);

    const var95 = Math.abs(q05 * portfolioValue);
    const var99 = Math.abs(q01 * portfolioValue);

    // CVaR(95%): mean of returns strictly below the 5th-percentile cutoff
    const cutoff = q05;
    const tailReturns = sorted.filter(r => r < cutoff);
    const cvar95 = tailReturns.length > 0
      ? Math.abs((tailReturns.reduce((s, r) => s + r, 0) / tailReturns.length) * portfolioValue)
      : var95;

    const maxLoss = Math.abs(sorted[0] * portfolioValue);

    return { var95, var99, cvar95, maxLoss, windowDays: n };
  }

  /** Compute quantile q ∈ [0,1] from a sorted ascending array. */
  private quantile(sorted: number[], q: number): number {
    if (sorted.length === 1) return sorted[0];
    const idx = q * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }
}
