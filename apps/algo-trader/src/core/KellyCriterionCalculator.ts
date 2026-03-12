/**
 * KellyCriterionCalculator - Position sizing using Kelly Criterion
 *
 * Formula: f* = (bp - q) / b where:
 *   - p = win probability
 *   - q = 1 - p (loss probability)
 *   - b = win/loss ratio (payoff ratio)
 *
 * Supports fractional Kelly (quarter, half) for risk management.
 */

/**
 * Historical trade record for win/loss analysis
 */
export interface TradeRecord {
  pnl: number;        // Profit/loss in USD
  closedAt: number;   // Timestamp
}

/**
 * Kelly calculation configuration
 */
export interface KellyConfig {
  fraction?: number;      // Kelly fraction: 0.25=quarter, 0.5=half (default: 0.25)
  maxPercent?: number;    // Maximum position as % of portfolio (default: 25%)
  minTrades?: number;     // Minimum trades for reliable calculation (default: 20)
}

/**
 * Kelly calculation result
 */
export interface KellyResult {
  fullKelly: number;      // Full Kelly % (before fraction/cap)
  adjustedKelly: number;  // Adjusted Kelly % (after fraction + cap)
  positionSize: number;   // USD to allocate
  isReliable: boolean;    // Whether we have enough trade history
}

/**
 * Win/loss statistics
 */
export interface WinLossStats {
  winRate: number;        // Win probability (0-1)
  avgWinLossRatio: number; // Average win / average loss
  totalTrades: number;
  wins: number;
  losses: number;
  avgWin: number;
  avgLoss: number;
}

export class KellyCriterionCalculator {
  private portfolioValue: number;
  private tradeHistory: Map<string, TradeRecord[]> = new Map(); // strategy -> trades

  constructor(portfolioValue: number) {
    if (portfolioValue <= 0) {
      throw new Error("Portfolio value must be positive");
    }
    this.portfolioValue = portfolioValue;
  }

  /**
   * Update portfolio value
   */
  setPortfolioValue(value: number): void {
    if (value <= 0) {
      throw new Error("Portfolio value must be positive");
    }
    this.portfolioValue = value;
  }

  /**
   * Record a completed trade for analysis
   */
  recordTrade(strategyId: string, pnl: number): void {
    let trades = this.tradeHistory.get(strategyId);
    if (!trades) {
      trades = [];
      this.tradeHistory.set(strategyId, trades);
    }
    trades.push({ pnl, closedAt: Date.now() });
  }

  /**
   * Calculate win/loss statistics for a strategy
   */
  getWinLossStats(strategyId: string): WinLossStats {
    const trades = this.tradeHistory.get(strategyId) || [];
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);

    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
      : 0;

    const winRate = trades.length > 0 ? wins.length / trades.length : 0;
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      winRate,
      avgWinLossRatio,
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      avgWin,
      avgLoss,
    };
  }

  /**
   * Calculate Kelly criterion given win rate and win/loss ratio
   * Formula: f* = (bp - q) / b where b = avgWinLossRatio, p = winRate, q = 1-p
   *
   * Simplified for avgWinLossRatio: f* = p - (1-p)/b
   */
  calculateKelly(
    winRate: number,
    avgWinLossRatio: number,
    portfolioValue?: number,
    config?: KellyConfig
  ): KellyResult {
    if (winRate < 0 || winRate > 1) {
      throw new Error("Win rate must be between 0 and 1");
    }
    if (avgWinLossRatio < 0) {
      throw new Error("Win/loss ratio must be non-negative");
    }

    const value = portfolioValue ?? this.portfolioValue;
    const fraction = config?.fraction ?? 0.25;
    const maxPercent = (config?.maxPercent ?? 25) / 100;
    const minTrades = config?.minTrades ?? 20;

    // Check if we have enough data
    const stats = this.getAggregateStats();
    const isReliable = stats.totalTrades >= minTrades;

    // Kelly formula: f* = p - q/b where q = 1-p
    // This is equivalent to (bp - q) / b
    const p = winRate;
    const q = 1 - p;
    const b = avgWinLossRatio || 1; // Prevent division by zero

    const fullKelly = b > 0 ? p - q / b : 0;

    // Clamp to [0, 1] range
    const clampedKelly = Math.max(0, Math.min(1, fullKelly));

    // Apply fractional Kelly
    const fractionalKelly = clampedKelly * fraction;

    // Apply max position cap
    const cappedKelly = Math.min(fractionalKelly, maxPercent);

    return {
      fullKelly: clampedKelly * 100,      // As percentage
      adjustedKelly: cappedKelly * 100,   // As percentage (after fraction + cap)
      positionSize: value * cappedKelly,
      isReliable,
    };
  }

  /**
   * Calculate Kelly for a specific strategy using its historical performance
   */
  calculateKellyForStrategy(
    strategyId: string,
    config?: KellyConfig
  ): KellyResult {
    const stats = this.getWinLossStats(strategyId);

    // If no trades or unreliable data, return conservative position
    if (stats.totalTrades === 0) {
      const maxPercent = (config?.maxPercent ?? 25) / 100;
      const fraction = config?.fraction ?? 0.25;
      return {
        fullKelly: 0,
        adjustedKelly: 0,
        positionSize: 0,
        isReliable: false,
      };
    }

    return this.calculateKelly(
      stats.winRate,
      stats.avgWinLossRatio,
      undefined,
      config
    );
  }

  /**
   * Get aggregate statistics across all strategies
   */
  getAggregateStats(): WinLossStats {
    const allTrades: TradeRecord[] = [];
    const tradeArrays = Array.from(this.tradeHistory.values());
    for (const trades of tradeArrays) {
      allTrades.push(...trades);
    }

    const wins = allTrades.filter(t => t.pnl > 0);
    const losses = allTrades.filter(t => t.pnl <= 0);

    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
      : 0;

    const winRate = allTrades.length > 0 ? wins.length / allTrades.length : 0;
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      winRate,
      avgWinLossRatio,
      totalTrades: allTrades.length,
      wins: wins.length,
      losses: losses.length,
      avgWin,
      avgLoss,
    };
  }

  /**
   * Get recommended position size for a strategy
   */
  getPositionSize(strategyId: string, config?: KellyConfig): number {
    const result = this.calculateKellyForStrategy(strategyId, config);
    return result.positionSize;
  }

  /**
   * Clear trade history (for testing)
   */
  clearHistory(strategyId?: string): void {
    if (strategyId) {
      this.tradeHistory.delete(strategyId);
    } else {
      this.tradeHistory.clear();
    }
  }
}
