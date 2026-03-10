/**
 * Executioner Agent — monitors exchange health metrics (slippage, fill rate,
 * latency) and proposes reducing allocation to degraded venues.
 * SIMULATION MODE ONLY.
 */

export interface ExchangeHealth {
  exchangeId: string;
  avgSlippageBps: number; // basis points
  fillRate: number;       // [0,1]
  avgLatencyMs: number;
}

export interface ExecutionerProposal {
  strategyId: string;
  capAdjustment: number;
  agentId: 'executioner';
}

/**
 * Maps exchange health to allocation adjustments per strategy.
 * High slippage / low fill rate / high latency → reduce allocation.
 */
export class ExecutionerAgent {
  private readonly agentId = 'executioner' as const;

  /**
   * Evaluate exchange health and produce per-strategy proposals.
   * @param healthMap - Map of strategyId → exchange health metrics
   */
  propose(healthMap: Map<string, ExchangeHealth>): ExecutionerProposal[] {
    const proposals: ExecutionerProposal[] = [];

    for (const [strategyId, health] of healthMap) {
      // slippage > 10 bps is bad, latency > 200ms is bad, fillRate < 0.9 is bad
      const slippagePenalty = Math.min(health.avgSlippageBps / 10, 1) * -0.04;
      const latencyPenalty = Math.min(health.avgLatencyMs / 200, 1) * -0.03;
      const fillPenalty = Math.min(Math.max(0.9 - health.fillRate, 0) / 0.3, 1) * -0.03;
      const adjustment = Math.max(slippagePenalty + latencyPenalty + fillPenalty, -0.10);

      proposals.push({ strategyId, capAdjustment: adjustment, agentId: this.agentId });
    }

    return proposals;
  }

  getId(): string {
    return this.agentId;
  }
}
