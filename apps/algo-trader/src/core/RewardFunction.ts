/**
 * OpenClaw-RL Reward Function
 * P&L-based reward calculator for reinforcement learning strategy evaluation.
 * Rewards profitable trades, penalizes losses, drawdown, and excessive holding.
 */

export interface TradeRecord {
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  entryTime: number;
  exitTime: number;
  fees: number;
  side: 'buy' | 'sell';
}

export interface RewardConfig {
  profitWeight: number;       // Weight for raw P&L reward (default: 1.0)
  drawdownPenalty: number;    // Penalty multiplier for drawdown (default: 2.0)
  holdingCostPerHour: number; // Cost per hour of holding position (default: 0.0001)
  winStreakBonus: number;     // Bonus per consecutive win (default: 0.1)
  riskFreeRate: number;       // Annual risk-free rate for Sharpe calc (default: 0.05)
  maxPositionPenalty: number; // Penalty if position exceeds safe threshold (default: 1.5)
}

export interface RewardResult {
  totalReward: number;
  components: {
    pnlReward: number;       // Raw P&L component
    drawdownPenalty: number;  // Drawdown penalty component
    holdingCost: number;      // Time-based holding cost
    sharpeReward: number;     // Risk-adjusted return component
    streakBonus: number;      // Win streak bonus
  };
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
  };
}

const DEFAULT_CONFIG: RewardConfig = {
  profitWeight: 1.0,
  drawdownPenalty: 2.0,
  holdingCostPerHour: 0.0001,
  winStreakBonus: 0.1,
  riskFreeRate: 0.05,
  maxPositionPenalty: 1.5,
};

export class RewardFunction {
  private config: RewardConfig;
  private trades: TradeRecord[] = [];
  private peakEquity = 0;
  private currentEquity = 0;

  constructor(initialEquity: number, config?: Partial<RewardConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.peakEquity = initialEquity;
    this.currentEquity = initialEquity;
  }

  /**
   * Calculate reward for a single completed trade
   */
  calculateTradeReward(trade: TradeRecord): number {
    const pnl = this.getNetPnL(trade);
    const holdingHours = (trade.exitTime - trade.entryTime) / (1000 * 60 * 60);

    // P&L reward: normalized by position value
    const positionValue = trade.entryPrice * trade.positionSize;
    const pnlReward = positionValue > 0
      ? (pnl / positionValue) * this.config.profitWeight
      : 0;

    // Holding cost: penalize long positions
    const holdingCost = holdingHours * this.config.holdingCostPerHour;

    this.trades.push(trade);
    this.currentEquity += pnl;

    // Update peak for drawdown tracking
    if (this.currentEquity > this.peakEquity) {
      this.peakEquity = this.currentEquity;
    }

    return pnlReward - holdingCost;
  }

  /**
   * Calculate comprehensive reward for a batch of trades (episode end)
   */
  calculateEpisodeReward(): RewardResult {
    if (this.trades.length === 0) {
      return this.emptyResult();
    }

    const returns = this.trades.map(t => {
      const posVal = t.entryPrice * t.positionSize;
      return posVal > 0 ? this.getNetPnL(t) / posVal : 0;
    });

    // P&L reward: sum of normalized returns
    const pnlReward = returns.reduce((s, r) => s + r, 0) * this.config.profitWeight;

    // Drawdown penalty
    const maxDD = this.calculateMaxDrawdown();
    const ddPenalty = maxDD * this.config.drawdownPenalty;

    // Holding cost: total hours across all trades
    const totalHoldingHours = this.trades.reduce((s, t) =>
      s + (t.exitTime - t.entryTime) / (1000 * 60 * 60), 0);
    const holdingCost = totalHoldingHours * this.config.holdingCostPerHour;

    // Sharpe ratio reward
    const sharpe = this.calculateSharpeRatio(returns);
    const sharpeReward = Math.max(0, sharpe * 0.5); // Only reward positive Sharpe

    // Win streak bonus
    const streak = this.longestWinStreak();
    const streakBonus = streak * this.config.winStreakBonus;

    const totalReward = pnlReward - ddPenalty - holdingCost + sharpeReward + streakBonus;

    const wins = this.trades.filter(t => this.getNetPnL(t) > 0);
    const losses = this.trades.filter(t => this.getNetPnL(t) < 0);
    const grossProfit = wins.reduce((s, t) => s + this.getNetPnL(t), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + this.getNetPnL(t), 0));

    return {
      totalReward,
      components: {
        pnlReward,
        drawdownPenalty: -ddPenalty,
        holdingCost: -holdingCost,
        sharpeReward,
        streakBonus,
      },
      metrics: {
        sharpeRatio: sharpe,
        maxDrawdown: maxDD,
        winRate: this.trades.length > 0 ? wins.length / this.trades.length : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
        totalTrades: this.trades.length,
      },
    };
  }

  /** Net P&L after fees */
  private getNetPnL(trade: TradeRecord): number {
    const gross = (trade.exitPrice - trade.entryPrice) * trade.positionSize;
    return gross - trade.fees;
  }

  /** Max drawdown as fraction (0-1) from equity curve */
  private calculateMaxDrawdown(): number {
    let peak = this.peakEquity;
    let maxDD = 0;
    let equity = peak;

    for (const trade of this.trades) {
      equity += this.getNetPnL(trade);
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? (peak - equity) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }

    return maxDD;
  }

  /** Annualized Sharpe ratio from trade returns */
  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Approximate annualization: assume ~252 trading days
    const annualizedReturn = mean * 252;
    const annualizedStd = stdDev * Math.sqrt(252);

    return (annualizedReturn - this.config.riskFreeRate) / annualizedStd;
  }

  /** Longest consecutive winning streak */
  private longestWinStreak(): number {
    let maxStreak = 0;
    let current = 0;
    for (const trade of this.trades) {
      if (this.getNetPnL(trade) > 0) {
        current++;
        if (current > maxStreak) maxStreak = current;
      } else {
        current = 0;
      }
    }
    return maxStreak;
  }

  private emptyResult(): RewardResult {
    return {
      totalReward: 0,
      components: { pnlReward: 0, drawdownPenalty: 0, holdingCost: 0, sharpeReward: 0, streakBonus: 0 },
      metrics: { sharpeRatio: 0, maxDrawdown: 0, winRate: 0, profitFactor: 0, totalTrades: 0 },
    };
  }

  /** Reset for new episode */
  reset(initialEquity: number) {
    this.trades = [];
    this.peakEquity = initialEquity;
    this.currentEquity = initialEquity;
  }
}
