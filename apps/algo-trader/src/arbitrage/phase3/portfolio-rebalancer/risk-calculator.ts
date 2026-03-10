/**
 * RiskCalculator — computes delta, max drawdown, and Sharpe ratio estimates
 * for each asset in a portfolio snapshot given simulated price changes.
 */

import { logger } from '../../../utils/logger';
import type { PortfolioSnapshot } from './exposure-aggregator';

export interface RiskMetrics {
  asset: string;
  delta: number;
  gamma?: number;
  vega?: number;
  maxDrawdownPct: number;
  sharpeRatio?: number;
}

export class RiskCalculator {
  /**
   * Compute risk metrics for each unique asset in the snapshot.
   * Delta = signed sensitivity to price movement:
   *   spot     → +valueUsd  (long exposure)
   *   perp     → -valueUsd  (assume short hedge)
   *   lending  → +valueUsd * 0.5 (partial exposure via collateral)
   */
  computeRisk(
    snapshot: PortfolioSnapshot,
    priceChanges: Map<string, number>,
  ): RiskMetrics[] {
    // Aggregate delta per asset
    const deltaMap = new Map<string, number>();
    const valueMap = new Map<string, number>();

    for (const exp of snapshot.exposures) {
      const existing = deltaMap.get(exp.asset) ?? 0;
      const existingVal = valueMap.get(exp.asset) ?? 0;

      let delta: number;
      switch (exp.type) {
        case 'spot':    delta = exp.valueUsd; break;
        case 'perp':    delta = -exp.valueUsd; break;
        case 'lending': delta = exp.valueUsd * 0.5; break;
        default:        delta = exp.valueUsd;
      }

      deltaMap.set(exp.asset, existing + delta);
      valueMap.set(exp.asset, existingVal + exp.valueUsd);
    }

    const results: RiskMetrics[] = [];

    for (const [asset, delta] of deltaMap) {
      const priceChange = priceChanges.get(asset) ?? 0;
      const totalValue = valueMap.get(asset) ?? 0;

      // Max drawdown estimate: abs(delta) * worst-case move (2x observed change)
      const maxDrawdownPct = totalValue > 0
        ? (Math.abs(delta) * Math.abs(priceChange) * 2) / totalValue
        : 0;

      // Simplified Sharpe: return / risk (assume 0.05 daily vol baseline)
      const expectedReturn = delta * priceChange;
      const vol = Math.max(0.05, Math.abs(priceChange));
      const sharpeRatio = vol > 0 ? expectedReturn / (totalValue * vol) : 0;

      logger.debug(`[RiskCalculator] ${asset} delta=${delta.toFixed(2)} drawdown=${(maxDrawdownPct * 100).toFixed(1)}%`);

      results.push({
        asset,
        delta,
        maxDrawdownPct,
        sharpeRatio,
      });
    }

    return results;
  }
}
