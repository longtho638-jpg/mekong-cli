/**
 * StakeManager — updates agent stake weights based on proposal accuracy.
 * Accurate proposals (led to Sharpe improvement) gain stake; poor ones lose.
 * SIMULATION MODE ONLY.
 */

export interface ProposalOutcome {
  agentId: string;
  strategyId: string;
  proposedAdjustment: number;
  actualSharpeDelta: number; // positive = improvement
}

export interface AgentStake {
  agentId: string;
  stake: number; // [0.01, 10.0] — minimum stake prevents total exclusion
}

const MIN_STAKE = 0.01;
const MAX_STAKE = 10.0;
const LEARNING_RATE = 0.1;

/**
 * Maintains and updates per-agent stake based on outcome feedback.
 */
export class StakeManager {
  private stakes: Map<string, number>;

  constructor(initialAgentIds: string[]) {
    this.stakes = new Map(initialAgentIds.map((id) => [id, 1.0]));
  }

  /**
   * Update stakes based on whether proposals led to portfolio improvement.
   * @param outcomes - Feedback on recent proposals
   */
  updateStakes(outcomes: ProposalOutcome[]): void {
    for (const outcome of outcomes) {
      const current = this.stakes.get(outcome.agentId) ?? 1.0;
      // Reward if Sharpe improved and proposal was positive, or vice versa
      const aligned =
        (outcome.actualSharpeDelta > 0 && outcome.proposedAdjustment > 0) ||
        (outcome.actualSharpeDelta < 0 && outcome.proposedAdjustment < 0);

      const delta = aligned
        ? LEARNING_RATE * Math.abs(outcome.actualSharpeDelta)
        : -LEARNING_RATE * Math.abs(outcome.actualSharpeDelta);

      const updated = Math.min(Math.max(current + delta, MIN_STAKE), MAX_STAKE);
      this.stakes.set(outcome.agentId, updated);
    }
  }

  /** Return all agent stakes as array for ConsensusEngine. */
  getWeights(): Array<{ agentId: string; weight: number }> {
    return [...this.stakes.entries()].map(([agentId, weight]) => ({ agentId, weight }));
  }

  /** Get stake for a single agent. */
  getStake(agentId: string): number {
    return this.stakes.get(agentId) ?? 1.0;
  }

  /** Add a new agent with default stake. */
  addAgent(agentId: string, initialStake = 1.0): void {
    if (!this.stakes.has(agentId)) {
      this.stakes.set(agentId, Math.min(Math.max(initialStake, MIN_STAKE), MAX_STAKE));
    }
  }
}
