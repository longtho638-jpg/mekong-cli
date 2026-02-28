/**
 * ProfitTracker — Real-time equity curve, drawdown monitoring, and performance metrics.
 * Tracks cumulative P&L, calculates max drawdown, rolling Sharpe ratio,
 * peak equity, recovery time. Emits alerts on drawdown thresholds.
 *
 * Integrates with ArbitrageOrchestrator to provide live performance monitoring.
 */

import { logger } from '../utils/logger';

export interface EquityPoint {
  timestamp: number;
  equity: number;           // Current equity value (initial + cumulative P&L)
  pnl: number;              // P&L for this trade
  cumulativePnl: number;    // Running total P&L
  drawdownPercent: number;  // Current drawdown from peak (negative = drawdown)
  tradeId: number;
}

export interface DrawdownAlert {
  timestamp: number;
  drawdownPercent: number;
  peakEquity: number;
  currentEquity: number;
  threshold: string;        // Which threshold triggered (e.g., "5%", "10%")
}

export interface PerformanceSummary {
  initialEquity: number;
  currentEquity: number;
  cumulativePnl: number;
  cumulativePnlPercent: number;
  maxDrawdownPercent: number;
  maxDrawdownUsd: number;
  peakEquity: number;
  troughEquity: number;
  sharpeRatio: number;
  sortinoRatio: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  recoveryFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  uptimeMs: number;
}

export interface ProfitTrackerConfig {
  initialEquity: number;              // Starting equity (default: 10000)
  drawdownAlertThresholds: number[];  // Drawdown % levels that trigger alerts (default: [5, 10, 20])
  sharpeWindowSize: number;           // Rolling window for Sharpe calculation (default: 30 trades)
  riskFreeRate: number;               // Annual risk-free rate for Sharpe (default: 0.05)
  maxEquityPoints: number;            // Max equity points to keep (default: 10000)
}

const DEFAULT_CONFIG: ProfitTrackerConfig = {
  initialEquity: 10000,
  drawdownAlertThresholds: [5, 10, 20],
  sharpeWindowSize: 30,
  riskFreeRate: 0.05,
  maxEquityPoints: 10000,
};

export class ProfitTracker {
  private config: ProfitTrackerConfig;
  private equityCurve: EquityPoint[] = [];
  private alerts: DrawdownAlert[] = [];
  private alertListeners: ((alert: DrawdownAlert) => void)[] = [];
  private triggeredThresholds: Set<number> = new Set(); // Avoid duplicate alerts

  private currentEquity: number;
  private peakEquity: number;
  private troughEquity: number;
  private cumulativePnl = 0;
  private tradeCount = 0;
  private winCount = 0;
  private lossCount = 0;
  private totalWinAmount = 0;
  private totalLossAmount = 0;
  private maxConsecutiveWins = 0;
  private maxConsecutiveLosses = 0;
  private currentStreak = 0; // positive = wins, negative = losses
  private maxDrawdownPercent = 0;
  private startTime: number;

  constructor(config?: Partial<ProfitTrackerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentEquity = this.config.initialEquity;
    this.peakEquity = this.config.initialEquity;
    this.troughEquity = this.config.initialEquity;
    this.startTime = Date.now();

    // Record initial point
    this.equityCurve.push({
      timestamp: this.startTime,
      equity: this.config.initialEquity,
      pnl: 0,
      cumulativePnl: 0,
      drawdownPercent: 0,
      tradeId: 0,
    });
  }

  /**
   * Register a drawdown alert listener.
   */
  onDrawdownAlert(callback: (alert: DrawdownAlert) => void): void {
    this.alertListeners.push(callback);
  }

  /**
   * Record a trade result (P&L in USD).
   */
  recordTrade(pnl: number): void {
    this.tradeCount++;
    this.cumulativePnl += pnl;
    this.currentEquity = this.config.initialEquity + this.cumulativePnl;

    // Win/loss tracking
    if (pnl > 0) {
      this.winCount++;
      this.totalWinAmount += pnl;
      this.currentStreak = this.currentStreak > 0 ? this.currentStreak + 1 : 1;
      this.maxConsecutiveWins = Math.max(this.maxConsecutiveWins, this.currentStreak);
    } else if (pnl < 0) {
      this.lossCount++;
      this.totalLossAmount += Math.abs(pnl);
      this.currentStreak = this.currentStreak < 0 ? this.currentStreak - 1 : -1;
      this.maxConsecutiveLosses = Math.max(this.maxConsecutiveLosses, Math.abs(this.currentStreak));
    }

    // Peak/trough tracking
    if (this.currentEquity > this.peakEquity) {
      this.peakEquity = this.currentEquity;
      this.triggeredThresholds.clear(); // Reset alerts on new peak
    }
    if (this.currentEquity < this.troughEquity) {
      this.troughEquity = this.currentEquity;
    }

    // Drawdown calculation
    const drawdownPercent = this.peakEquity > 0
      ? ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100
      : 0;

    if (drawdownPercent > this.maxDrawdownPercent) {
      this.maxDrawdownPercent = drawdownPercent;
    }

    // Record equity point
    const point: EquityPoint = {
      timestamp: Date.now(),
      equity: this.currentEquity,
      pnl,
      cumulativePnl: this.cumulativePnl,
      drawdownPercent,
      tradeId: this.tradeCount,
    };
    this.equityCurve.push(point);

    // Trim equity curve
    if (this.equityCurve.length > this.config.maxEquityPoints) {
      this.equityCurve.splice(0, this.equityCurve.length - this.config.maxEquityPoints);
    }

    // Check drawdown alerts
    this.checkDrawdownAlerts(drawdownPercent);
  }

  /**
   * Get current performance summary.
   */
  getSummary(): PerformanceSummary {
    const returns = this.getReturns();
    const sharpe = this.calculateSharpe(returns);
    const sortino = this.calculateSortino(returns);
    const maxDdUsd = this.peakEquity - this.troughEquity;

    return {
      initialEquity: this.config.initialEquity,
      currentEquity: this.currentEquity,
      cumulativePnl: this.cumulativePnl,
      cumulativePnlPercent: (this.cumulativePnl / this.config.initialEquity) * 100,
      maxDrawdownPercent: this.maxDrawdownPercent,
      maxDrawdownUsd: maxDdUsd,
      peakEquity: this.peakEquity,
      troughEquity: this.troughEquity,
      sharpeRatio: sharpe,
      sortinoRatio: sortino,
      totalTrades: this.tradeCount,
      winningTrades: this.winCount,
      losingTrades: this.lossCount,
      winRate: this.tradeCount > 0 ? (this.winCount / this.tradeCount) * 100 : 0,
      avgWin: this.winCount > 0 ? this.totalWinAmount / this.winCount : 0,
      avgLoss: this.lossCount > 0 ? this.totalLossAmount / this.lossCount : 0,
      profitFactor: this.totalLossAmount > 0 ? this.totalWinAmount / this.totalLossAmount : (this.totalWinAmount > 0 ? Infinity : 0),
      recoveryFactor: maxDdUsd > 0 ? this.cumulativePnl / maxDdUsd : 0,
      maxConsecutiveWins: this.maxConsecutiveWins,
      maxConsecutiveLosses: this.maxConsecutiveLosses,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  /**
   * Get equity curve data.
   */
  getEquityCurve(): EquityPoint[] {
    return [...this.equityCurve];
  }

  /**
   * Get all drawdown alerts.
   */
  getAlerts(): DrawdownAlert[] {
    return [...this.alerts];
  }

  /**
   * Get current drawdown percentage.
   */
  getCurrentDrawdown(): number {
    return this.peakEquity > 0
      ? ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100
      : 0;
  }

  /**
   * Check if trading should be halted due to excessive drawdown.
   */
  shouldHalt(maxDrawdownPercent: number): boolean {
    return this.getCurrentDrawdown() >= maxDrawdownPercent;
  }

  /**
   * Print formatted performance report.
   */
  printReport(): void {
    const s = this.getSummary();
    logger.info('\n╔══════════════════════════════════════╗');
    logger.info('║      📊 PROFIT TRACKER REPORT        ║');
    logger.info('╠══════════════════════════════════════╣');
    logger.info(`║ Equity:     $${s.currentEquity.toFixed(2).padEnd(22)}║`);
    logger.info(`║ P&L:        $${s.cumulativePnl.toFixed(2).padEnd(22)}║`);
    logger.info(`║ P&L %:      ${s.cumulativePnlPercent.toFixed(2).padEnd(22)}%║`);
    logger.info(`║ Max DD:     ${s.maxDrawdownPercent.toFixed(2).padEnd(22)}%║`);
    logger.info(`║ Sharpe:     ${s.sharpeRatio.toFixed(2).padEnd(23)}║`);
    logger.info(`║ Sortino:    ${s.sortinoRatio.toFixed(2).padEnd(23)}║`);
    logger.info(`║ Win Rate:   ${s.winRate.toFixed(1).padEnd(22)}%║`);
    logger.info(`║ Trades:     ${String(s.totalTrades).padEnd(23)}║`);
    logger.info(`║ Profit F:   ${(s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)).padEnd(23)}║`);
    logger.info('╚══════════════════════════════════════╝\n');
  }

  /** Reset tracker to initial state */
  reset(): void {
    this.equityCurve = [];
    this.alerts = [];
    this.triggeredThresholds.clear();
    this.currentEquity = this.config.initialEquity;
    this.peakEquity = this.config.initialEquity;
    this.troughEquity = this.config.initialEquity;
    this.cumulativePnl = 0;
    this.tradeCount = 0;
    this.winCount = 0;
    this.lossCount = 0;
    this.totalWinAmount = 0;
    this.totalLossAmount = 0;
    this.maxConsecutiveWins = 0;
    this.maxConsecutiveLosses = 0;
    this.currentStreak = 0;
    this.maxDrawdownPercent = 0;
    this.startTime = Date.now();
  }

  /**
   * Check and emit drawdown alerts.
   */
  private checkDrawdownAlerts(currentDrawdown: number): void {
    for (const threshold of this.config.drawdownAlertThresholds) {
      if (currentDrawdown >= threshold && !this.triggeredThresholds.has(threshold)) {
        this.triggeredThresholds.add(threshold);

        const alert: DrawdownAlert = {
          timestamp: Date.now(),
          drawdownPercent: currentDrawdown,
          peakEquity: this.peakEquity,
          currentEquity: this.currentEquity,
          threshold: `${threshold}%`,
        };

        this.alerts.push(alert);
        logger.warn(`[ProfitTracker] ⚠️ DRAWDOWN ALERT: ${currentDrawdown.toFixed(2)}% (threshold: ${threshold}%)`);

        for (const listener of this.alertListeners) {
          try {
            listener(alert);
          } catch (err) {
            logger.error(`[ProfitTracker] Alert listener error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }
  }

  /**
   * Calculate per-trade returns for Sharpe/Sortino.
   */
  private getReturns(): number[] {
    const points = this.equityCurve.slice(-this.config.sharpeWindowSize - 1);
    if (points.length < 2) return [];

    const returns: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].equity;
      if (prev > 0) {
        returns.push((points[i].equity - prev) / prev);
      }
    }
    return returns;
  }

  /**
   * Calculate annualized Sharpe ratio from returns.
   */
  private calculateSharpe(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    const stddev = Math.sqrt(variance);

    if (stddev === 0) return 0;

    // Annualize (assume ~250 trading days, ~10 trades/day)
    const tradesPerYear = 2500;
    const annualizedReturn = mean * tradesPerYear;
    const annualizedStddev = stddev * Math.sqrt(tradesPerYear);

    return (annualizedReturn - this.config.riskFreeRate) / annualizedStddev;
  }

  /**
   * Calculate Sortino ratio (only penalizes downside volatility).
   */
  private calculateSortino(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);

    if (downsideReturns.length === 0) return mean > 0 ? Infinity : 0;

    const downsideVariance = downsideReturns.reduce((s, r) => s + r ** 2, 0) / downsideReturns.length;
    const downsideStddev = Math.sqrt(downsideVariance);

    if (downsideStddev === 0) return 0;

    const tradesPerYear = 2500;
    const annualizedReturn = mean * tradesPerYear;
    const annualizedDownside = downsideStddev * Math.sqrt(tradesPerYear);

    return (annualizedReturn - this.config.riskFreeRate) / annualizedDownside;
  }
}
