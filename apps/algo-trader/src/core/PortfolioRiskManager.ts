/**
 * PortfolioRiskManager — Portfolio-level risk management.
 * Kelly Criterion sizing, correlation matrix, VaR, exposure limits.
 * Extends RiskManager concept to multi-asset portfolio management.
 */

// Re-export all types and defaults for backward compatibility
export type { PortfolioPosition, PortfolioRiskConfig, KellyResult, VaRResult, PortfolioRiskAssessment } from './portfolio-risk-types';
export { DEFAULT_PORTFOLIO_RISK_CONFIG } from './portfolio-risk-types';

import { PortfolioPosition, PortfolioRiskConfig, KellyResult, VaRResult, PortfolioRiskAssessment, DEFAULT_PORTFOLIO_RISK_CONFIG } from './portfolio-risk-types';

import {
  calculateKelly,
  calculateVaR,
  calculateCorrelationRisk,
} from './portfolio-var-kelly-calculator';

export class PortfolioRiskManager {
  private config: PortfolioRiskConfig;
  private positions: PortfolioPosition[] = [];
  private portfolioValue: number;
  private peakValue: number;
  private returnHistory: number[] = [];

  constructor(initialValue: number, config?: Partial<PortfolioRiskConfig>) {
    this.config = { ...DEFAULT_PORTFOLIO_RISK_CONFIG, ...config };
    this.portfolioValue = initialValue;
    this.peakValue = initialValue;
  }

  /**
   * Assess whether a new position can be opened + recommended size.
   */
  assessNewPosition(
    symbol: string,
    currentPrice: number,
    winRate: number,
    avgWinLossRatio: number,
    priceHistory?: number[]
  ): PortfolioRiskAssessment {
    const existingPos = this.positions.find(p => p.symbol === symbol);
    if (existingPos) {
      existingPos.currentPrice = currentPrice;
    }

    const positionCount = this.positions.length;
    const currentExposure = this.calculateExposure();
    const correlationRisk = calculateCorrelationRisk(priceHistory, this.positions.length);
    const kelly = this.calculateKelly(winRate, avgWinLossRatio);
    const varResult = this.calculateVaR();

    if (positionCount >= this.config.maxPositions) {
      return {
        canOpenPosition: false,
        reason: `max_positions_${this.config.maxPositions}_reached`,
        currentExposure, positionCount, correlationRisk,
        suggestedSize: kelly, var: varResult,
      };
    }

    if (currentExposure >= this.config.maxPortfolioRiskPercent) {
      return {
        canOpenPosition: false,
        reason: `exposure_${currentExposure.toFixed(1)}%_exceeds_${this.config.maxPortfolioRiskPercent}%`,
        currentExposure, positionCount, correlationRisk,
        suggestedSize: kelly, var: varResult,
      };
    }

    if (correlationRisk > this.config.maxCorrelation && positionCount > 0) {
      return {
        canOpenPosition: false,
        reason: `high_correlation_${correlationRisk.toFixed(2)}_exceeds_${this.config.maxCorrelation}`,
        currentExposure, positionCount, correlationRisk,
        suggestedSize: kelly, var: varResult,
      };
    }

    const currentDrawdown = this.getCurrentDrawdown();
    if (currentDrawdown >= this.config.maxDrawdownPercent) {
      return {
        canOpenPosition: false,
        reason: `drawdown_${currentDrawdown.toFixed(1)}%_exceeds_${this.config.maxDrawdownPercent}%`,
        currentExposure, positionCount, correlationRisk,
        suggestedSize: kelly, var: varResult,
      };
    }

    // Cap suggested size at single position limit
    const maxPositionValue = this.portfolioValue * (this.config.maxSinglePositionPercent / 100);
    if (kelly.positionSize > maxPositionValue) {
      kelly.positionSize = maxPositionValue;
      kelly.adjustedPercent = this.config.maxSinglePositionPercent;
    }

    return {
      canOpenPosition: true,
      currentExposure, positionCount, correlationRisk,
      suggestedSize: kelly, var: varResult,
    };
  }

  /** Kelly Criterion position sizing — delegates to pure calculator */
  calculateKelly(winRate: number, avgWinLossRatio: number): KellyResult {
    return calculateKelly(winRate, avgWinLossRatio, this.portfolioValue, this.config.kellyFraction);
  }

  /** Historical simulation VaR — delegates to pure calculator */
  calculateVaR(): VaRResult {
    return calculateVaR(this.returnHistory, this.portfolioValue, this.config);
  }

  /** Add a position to the portfolio */
  addPosition(position: PortfolioPosition): void {
    this.positions.push(position);
  }

  /** Remove a closed position and update portfolio value */
  closePosition(symbol: string, exitPrice: number): number {
    const idx = this.positions.findIndex(p => p.symbol === symbol);
    if (idx === -1) return 0;

    const pos = this.positions[idx];
    const pnl = pos.side === 'long'
      ? (exitPrice - pos.entryPrice) * pos.size
      : (pos.entryPrice - exitPrice) * pos.size;

    this.positions.splice(idx, 1);
    this.portfolioValue += pnl;

    const posValue = pos.entryPrice * pos.size;
    if (posValue > 0) {
      this.returnHistory.push(pnl / posValue);
      if (this.returnHistory.length > this.config.varLookback) {
        this.returnHistory.shift();
      }
    }

    if (this.portfolioValue > this.peakValue) {
      this.peakValue = this.portfolioValue;
    }

    return pnl;
  }

  /** Update current prices for all positions */
  updatePrices(prices: Record<string, number>): void {
    for (const pos of this.positions) {
      if (prices[pos.symbol] !== undefined) {
        pos.currentPrice = prices[pos.symbol];
      }
    }
  }

  /** Total portfolio exposure as % of portfolio value */
  calculateExposure(): number {
    if (this.portfolioValue <= 0) return 0;
    const totalExposure = this.positions.reduce((sum, pos) => {
      return sum + pos.currentPrice * pos.size;
    }, 0);
    return (totalExposure / this.portfolioValue) * 100;
  }

  /** Current drawdown from peak */
  getCurrentDrawdown(): number {
    if (this.peakValue <= 0) return 0;
    return ((this.peakValue - this.portfolioValue) / this.peakValue) * 100;
  }

  /** Get all open positions */
  getPositions(): PortfolioPosition[] {
    return [...this.positions];
  }

  /** Get portfolio value */
  getPortfolioValue(): number {
    return this.portfolioValue;
  }

  /** Reset portfolio state */
  reset(initialValue: number): void {
    this.positions = [];
    this.portfolioValue = initialValue;
    this.peakValue = initialValue;
    this.returnHistory = [];
  }
}
