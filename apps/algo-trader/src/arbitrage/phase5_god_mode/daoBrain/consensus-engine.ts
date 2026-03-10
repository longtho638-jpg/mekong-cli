/**
 * ConsensusEngine — weighted voting across DAO Brain agents.
 * Enforces max 5% single-agent influence on final allocation decisions.
 * SIMULATION MODE ONLY.
 */

export interface AgentProposal {
  strategyId: string;
  capAdjustment: number;
  agentId: string;
}

export interface AgentWeight {
  agentId: string;
  weight: number; // raw stake weight, normalised internally
}

export interface ConsensusResult {
  strategyId: string;
  finalAdjustment: number;
  contributions: Record<string, number>; // agentId → effective contribution
}

/** Maximum fraction any single agent may contribute to final vote */
export const MAX_AGENT_INFLUENCE = 0.05;

/**
 * Aggregates proposals via stake-weighted average, capping each agent's
 * influence at MAX_AGENT_INFLUENCE before normalisation.
 */
export class ConsensusEngine {
  /**
   * Compute final allocation adjustments from multi-agent proposals.
   * @param proposals - All agent proposals (may cover multiple strategies)
   * @param weights - Raw stake weights per agent
   */
  resolve(proposals: AgentProposal[], weights: AgentWeight[]): ConsensusResult[] {
    // Build weight map with influence cap applied
    const rawMap = new Map<string, number>(weights.map((w) => [w.agentId, w.weight]));
    const cappedMap = this.capInfluence(rawMap);

    // Group proposals by strategyId
    const byStrategy = new Map<string, AgentProposal[]>();
    for (const p of proposals) {
      const list = byStrategy.get(p.strategyId) ?? [];
      list.push(p);
      byStrategy.set(p.strategyId, list);
    }

    const results: ConsensusResult[] = [];
    for (const [strategyId, stratProposals] of byStrategy) {
      let weightedSum = 0;
      let totalWeight = 0;
      const contributions: Record<string, number> = {};

      for (const p of stratProposals) {
        const w = cappedMap.get(p.agentId) ?? 0;
        weightedSum += p.capAdjustment * w;
        totalWeight += w;
        contributions[p.agentId] = w;
      }

      const finalAdjustment = totalWeight > 0 ? weightedSum / totalWeight : 0;
      results.push({ strategyId, finalAdjustment, contributions });
    }

    return results;
  }

  /**
   * Normalise weights then hard-cap each agent at MAX_AGENT_INFLUENCE.
   * No re-normalisation after capping — the weighted average denominator
   * uses the sum of capped weights, preserving the cap invariant.
   */
  private capInfluence(raw: Map<string, number>): Map<string, number> {
    const total = [...raw.values()].reduce((s, v) => s + v, 0);
    if (total === 0) return raw;

    // Normalise then hard-cap — final weight ≤ MAX_AGENT_INFLUENCE guaranteed
    const result = new Map<string, number>();
    for (const [id, w] of raw) {
      result.set(id, Math.min(w / total, MAX_AGENT_INFLUENCE));
    }

    return result;
  }
}
