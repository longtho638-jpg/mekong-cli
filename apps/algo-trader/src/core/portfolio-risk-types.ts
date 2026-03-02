/**
 * portfolio-risk-types — Shared types and interfaces for portfolio risk management.
 * Extracted from PortfolioRiskManager for reuse and modularity.
 */

export interface PortfolioPosition {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  size: number;       // Units held
  side: 'long' | 'short';
  entryTime: number;
}

export interface PortfolioRiskConfig {
  maxPositions: number;           // Max concurrent open positions (default: 5)
  maxPortfolioRiskPercent: number; // Max % of portfolio at risk (default: 10)
  maxSinglePositionPercent: number; // Max % of portfolio in one position (default: 5)
  maxCorrelation: number;         // Max allowed correlation between new and existing (default: 0.7)
  kellyFraction: number;          // Fraction of Kelly to use (default: 0.25 = quarter Kelly)
  varConfidence: number;          // VaR confidence level (default: 0.95)
  varLookback: number;            // Number of returns for VaR calculation (default: 100)
  maxDrawdownPercent: number;     // Kill switch: max portfolio drawdown (default: 15)
}

export interface KellyResult {
  kellyPercent: number;     // Full Kelly %
  adjustedPercent: number;  // Kelly * fraction
  positionSize: number;     // USD value to allocate
}

export interface VaRResult {
  var95: number;            // 95% VaR ($ amount at risk)
  cvar95: number;           // Conditional VaR (expected loss beyond VaR)
  varPercent: number;       // VaR as % of portfolio
}

export interface PortfolioRiskAssessment {
  canOpenPosition: boolean;
  reason?: string;
  currentExposure: number;     // Total % of portfolio at risk
  positionCount: number;
  correlationRisk: number;     // 0-1: how correlated current positions are
  suggestedSize: KellyResult;
  var: VaRResult;
}

export const DEFAULT_PORTFOLIO_RISK_CONFIG: PortfolioRiskConfig = {
  maxPositions: 5,
  maxPortfolioRiskPercent: 10,
  maxSinglePositionPercent: 5,
  maxCorrelation: 0.7,
  kellyFraction: 0.25,
  varConfidence: 0.95,
  varLookback: 100,
  maxDrawdownPercent: 15,
};
