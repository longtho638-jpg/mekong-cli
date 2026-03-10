/**
 * MacroEconomist Agent — consumes macro indicators (interest rates, inflation,
 * VIX) and proposes risk-off or risk-on allocation adjustments.
 * SIMULATION MODE ONLY.
 */

export interface MacroData {
  interestRatePct: number; // e.g. 5.25
  inflationPct: number;    // e.g. 3.1
  vix: number;             // e.g. 18.5
}

export interface MacroProposal {
  strategyId: string;
  capAdjustment: number;
  agentId: 'macroEconomist';
}

/**
 * High VIX or high inflation → risk-off (reduce). Low VIX → risk-on (increase).
 */
export class MacroEconomistAgent {
  private readonly agentId = 'macroEconomist' as const;

  /**
   * Compute macro-driven allocation adjustment applied uniformly to all strategies.
   * @param data - Latest macro indicators
   * @param strategyIds - Active strategy IDs
   */
  propose(data: MacroData, strategyIds: string[]): MacroProposal[] {
    const vixPenalty = Math.min(Math.max(data.vix - 20, 0) / 30, 1) * -0.05;
    const inflationPenalty = Math.min(Math.max(data.inflationPct - 3.0, 0) / 5, 1) * -0.03;
    const rateBonus = Math.min(Math.max(5.0 - data.interestRatePct, 0) / 5, 1) * 0.02;

    const adjustment = Math.max(Math.min(vixPenalty + inflationPenalty + rateBonus, 0.05), -0.08);

    return strategyIds.map((strategyId) => ({
      strategyId,
      capAdjustment: adjustment,
      agentId: this.agentId,
    }));
  }

  getId(): string {
    return this.agentId;
  }
}
