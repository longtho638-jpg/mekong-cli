/**
 * RiskManager Agent — computes VaR, max drawdown, concentration risk,
 * then proposes allocation caps per strategy.
 * SIMULATION MODE ONLY.
 */

export interface RiskMetrics {
  varPercent: number;       // Value at Risk as % of portfolio
  maxDrawdown: number;      // Max drawdown as fraction [0,1]
  concentrationHHI: number; // Herfindahl-Hirschman Index [0,1]
}

export interface AllocationProposal {
  strategyId: string;
  capAdjustment: number; // ± fraction, e.g. -0.05 = reduce cap by 5%
  agentId: 'riskManager';
}

/**
 * Computes allocation cap proposals based on risk metrics.
 * High VaR → reduce cap; high concentration → spread allocations.
 */
export class RiskManagerAgent {
  private readonly agentId = 'riskManager' as const;

  /**
   * Evaluate risk metrics and propose allocation adjustments.
   * @param metrics - Portfolio risk metrics
   * @param strategyIds - Active strategy IDs
   */
  propose(metrics: RiskMetrics, strategyIds: string[]): AllocationProposal[] {
    const { varPercent, maxDrawdown, concentrationHHI } = metrics;

    // Scale: VaR > 5% is dangerous, drawdown > 20% is dangerous
    const varPenalty = Math.min(varPercent / 5, 1) * -0.05;
    const ddPenalty = Math.min(maxDrawdown / 0.2, 1) * -0.03;
    const hhiPenalty = Math.min(concentrationHHI / 0.5, 1) * -0.02;

    const totalAdjustment = Math.max(varPenalty + ddPenalty + hhiPenalty, -0.1);

    return strategyIds.map((strategyId) => ({
      strategyId,
      capAdjustment: totalAdjustment,
      agentId: this.agentId,
    }));
  }

  getId(): string {
    return this.agentId;
  }
}
