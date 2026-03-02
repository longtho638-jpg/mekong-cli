/**
 * portfolio-var-kelly-calculator — VaR (Value at Risk) and Kelly Criterion calculations.
 * Extracted from PortfolioRiskManager for focused, testable math modules.
 */

import { KellyResult, VaRResult, PortfolioRiskConfig } from './portfolio-risk-types';

/**
 * Kelly Criterion position sizing.
 * f* = (bp - q) / b where b = avg_win/avg_loss, p = win_rate, q = 1-p
 */
export function calculateKelly(
  winRate: number,
  avgWinLossRatio: number,
  portfolioValue: number,
  kellyFraction: number,
): KellyResult {
  const p = Math.max(0, Math.min(1, winRate));
  const q = 1 - p;
  const b = Math.max(0.01, avgWinLossRatio);

  const kellyPercent = ((b * p - q) / b) * 100;

  // Clamp: negative Kelly means don't bet
  const clampedKelly = Math.max(0, Math.min(100, kellyPercent));
  const adjustedPercent = clampedKelly * kellyFraction;
  const positionSize = portfolioValue * (adjustedPercent / 100);

  return { kellyPercent: clampedKelly, adjustedPercent, positionSize };
}

/**
 * Historical simulation VaR (Value at Risk) and CVaR.
 * Requires at least 10 return data points; returns zeros otherwise.
 */
export function calculateVaR(
  returnHistory: number[],
  portfolioValue: number,
  config: Pick<PortfolioRiskConfig, 'varConfidence'>,
): VaRResult {
  if (returnHistory.length < 10) {
    return { var95: 0, cvar95: 0, varPercent: 0 };
  }

  const returns = [...returnHistory].sort((a, b) => a - b);
  const idx = Math.floor(returns.length * (1 - config.varConfidence));
  const varReturn = returns[Math.max(0, idx)];
  const var95 = Math.abs(varReturn) * portfolioValue;

  // CVaR: average of losses worse than VaR
  const tail = returns.slice(0, Math.max(1, idx));
  const cvarReturn = tail.reduce((s, r) => s + r, 0) / tail.length;
  const cvar95 = Math.abs(cvarReturn) * portfolioValue;

  return {
    var95,
    cvar95,
    varPercent: Math.abs(varReturn) * 100,
  };
}

/**
 * Calculate correlation risk for a potential new position.
 * Conservative default — full implementation would compare return series.
 */
export function calculateCorrelationRisk(
  newPriceHistory: number[] | undefined,
  existingPositionCount: number,
): number {
  if (!newPriceHistory || newPriceHistory.length < 10 || existingPositionCount === 0) {
    return 0;
  }
  // Conservative default — full implementation would compare return series
  return 0.3;
}
