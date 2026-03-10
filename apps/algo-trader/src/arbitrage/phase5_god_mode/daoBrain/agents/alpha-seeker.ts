/**
 * AlphaSeeker Agent — evaluates strategy performance metrics (Sharpe, win rate,
 * profit factor) and proposes allocation increases for top strategies.
 * SIMULATION MODE ONLY.
 */

export interface StrategyPerformance {
  strategyId: string;
  sharpeRatio: number;
  winRate: number;      // [0,1]
  profitFactor: number; // gross profit / gross loss
}

export interface AlphaProposal {
  strategyId: string;
  capAdjustment: number;
  agentId: 'alphaSeeker';
}

/**
 * Proposes allocation increases to high-performing strategies.
 * Sharpe > 1.5, winRate > 0.55, PF > 1.5 = eligible for boost.
 */
export class AlphaSeekerAgent {
  private readonly agentId = 'alphaSeeker' as const;

  /**
   * Score each strategy and propose cap adjustments.
   * @param performances - Array of strategy performance snapshots
   */
  propose(performances: StrategyPerformance[]): AlphaProposal[] {
    return performances.map((perf) => {
      const sharpeBonus = Math.min(Math.max(perf.sharpeRatio - 1.0, 0) / 2, 1) * 0.04;
      const winBonus = Math.min(Math.max(perf.winRate - 0.5, 0) / 0.2, 1) * 0.03;
      const pfBonus = Math.min(Math.max(perf.profitFactor - 1.0, 0) / 1.5, 1) * 0.03;
      const adjustment = Math.min(sharpeBonus + winBonus + pfBonus, 0.10);

      return {
        strategyId: perf.strategyId,
        capAdjustment: adjustment,
        agentId: this.agentId,
      };
    });
  }

  getId(): string {
    return this.agentId;
  }
}
