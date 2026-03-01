/**
 * KellyPositionSizer — Optimal position sizing via Kelly criterion.
 * Computes fraction of equity to risk based on historical win rate and payoff ratio.
 *
 * Kelly formula: f* = (p * b - q) / b
 *   where p = win probability, q = 1 - p, b = avg win / avg loss
 *
 * Features:
 * - Fractional Kelly (default 0.5x) for conservative sizing
 * - Min/max position bounds for safety
 * - Sliding window over recent trades for adaptivity
 * - Regime-aware adjustment multipliers
 */

import { MarketRegime } from './regime-detector';

export interface KellyConfig {
  fractionMultiplier: number;  // Kelly fraction (0.5 = half-Kelly, default)
  minPositionUsd: number;      // Floor position size (default: 50)
  maxPositionUsd: number;      // Ceiling position size (default: 5000)
  windowSize: number;          // Lookback trades for stats (default: 50)
  minTradesRequired: number;   // Min trades before Kelly kicks in (default: 10)
  regimeMultipliers: Record<MarketRegime, number>;
}

export interface KellyResult {
  kellyFraction: number;     // Raw Kelly f* (0-1)
  adjustedFraction: number;  // After fractional multiplier + regime
  positionSizeUsd: number;   // Final $ size
  winRate: number;            // Current win rate
  payoffRatio: number;        // Avg win / avg loss
  edgePercent: number;        // Expected edge per trade %
  regime: MarketRegime;
  tradesAnalyzed: number;
}

export interface TradeOutcome {
  profitUsd: number;
  timestamp: number;
}

const DEFAULT_CONFIG: KellyConfig = {
  fractionMultiplier: 0.5,
  minPositionUsd: 50,
  maxPositionUsd: 5000,
  windowSize: 50,
  minTradesRequired: 10,
  regimeMultipliers: {
    'trending': 1.2,
    'mean-reverting': 1.0,
    'volatile': 0.6,
    'quiet': 0.8,
  },
};

export class KellyPositionSizer {
  private config: KellyConfig;
  private trades: TradeOutcome[] = [];

  constructor(config?: Partial<KellyConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      regimeMultipliers: {
        ...DEFAULT_CONFIG.regimeMultipliers,
        ...config?.regimeMultipliers,
      },
    };
  }

  /** Record a completed trade outcome. */
  recordTrade(profitUsd: number): void {
    this.trades.push({ profitUsd, timestamp: Date.now() });
    if (this.trades.length > this.config.windowSize * 2) {
      this.trades = this.trades.slice(-this.config.windowSize * 2);
    }
  }

  /**
   * Calculate optimal position size for given equity and regime.
   * Returns default min position if insufficient trade history.
   */
  calculate(equityUsd: number, regime: MarketRegime = 'quiet'): KellyResult {
    const recentTrades = this.trades.slice(-this.config.windowSize);
    const tradesAnalyzed = recentTrades.length;

    // Not enough data — use minimum position
    if (tradesAnalyzed < this.config.minTradesRequired) {
      return {
        kellyFraction: 0,
        adjustedFraction: 0,
        positionSizeUsd: this.config.minPositionUsd,
        winRate: 0,
        payoffRatio: 0,
        edgePercent: 0,
        regime,
        tradesAnalyzed,
      };
    }

    const wins = recentTrades.filter(t => t.profitUsd > 0);
    const losses = recentTrades.filter(t => t.profitUsd <= 0);

    const winRate = wins.length / tradesAnalyzed;
    const lossRate = 1 - winRate;

    const avgWin = wins.length > 0
      ? wins.reduce((s, t) => s + t.profitUsd, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + t.profitUsd, 0) / losses.length)
      : 1; // Prevent division by zero

    const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Kelly formula: f* = (p * b - q) / b
    let kellyFraction = payoffRatio > 0
      ? (winRate * payoffRatio - lossRate) / payoffRatio
      : 0;

    // Clamp to [0, 1]
    kellyFraction = Math.max(0, Math.min(1, kellyFraction));

    // Apply fractional multiplier (half-Kelly default)
    let adjustedFraction = kellyFraction * this.config.fractionMultiplier;

    // Apply regime multiplier
    const regimeMult = this.config.regimeMultipliers[regime] ?? 1;
    adjustedFraction *= regimeMult;

    // Clamp again
    adjustedFraction = Math.max(0, Math.min(1, adjustedFraction));

    // Position size in USD
    let positionSizeUsd = equityUsd * adjustedFraction;
    positionSizeUsd = Math.max(this.config.minPositionUsd, Math.min(this.config.maxPositionUsd, positionSizeUsd));

    // Edge: expected value per $1 risked
    const edgePercent = (winRate * avgWin - lossRate * avgLoss) / (avgLoss || 1) * 100;

    return {
      kellyFraction,
      adjustedFraction,
      positionSizeUsd,
      winRate,
      payoffRatio,
      edgePercent,
      regime,
      tradesAnalyzed,
    };
  }

  /** Get trade history count. */
  getTradeCount(): number { return this.trades.length; }

  /** Reset all trade history. */
  reset(): void { this.trades = []; }
}
