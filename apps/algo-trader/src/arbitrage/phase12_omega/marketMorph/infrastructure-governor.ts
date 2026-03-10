/**
 * Infrastructure Governor — adjusts DEX fees, validator commission, and
 * liquidity allocations based on observed market conditions.
 *
 * Rules (simple threshold-based):
 *   - High volume  (> highVolThreshold) → lower DEX fee (floor: minFeeBps)
 *   - Low volume   (< lowVolThreshold)  → raise DEX fee  (cap: maxFeeBps)
 *   - High IL      (> ilThresholdPct)   → reduce LP allocation
 *   - High rewards (> rewardThresholdEth) → increase validator commission
 *   - Low rewards  (≤ rewardThresholdEth) → decrease validator commission
 */

export interface GovernorConfig {
  /** Minimum DEX swap fee in bps. Default: 5. */
  minFeeBps: number;
  /** Maximum DEX swap fee in bps. Default: 100. */
  maxFeeBps: number;
  /** Volume (USD/day) above which fees are lowered. Default: 500_000. */
  highVolThresholdUsd: number;
  /** Volume (USD/day) below which fees are raised. Default: 50_000. */
  lowVolThresholdUsd: number;
  /** IL % above which LP allocation is reduced. Default: 4. */
  ilThresholdPct: number;
  /** Validator daily reward (ETH) above which commission is raised. Default: 0.005. */
  rewardThresholdEth: number;
  /** Fee step size in bps per adjustment. Default: 5. */
  feeStepBps: number;
  /** Commission step size (0–1). Default: 0.01. */
  commissionStep: number;
}

export interface MarketSnapshot {
  volumeUsd24h: number;
  avgIlPct: number;
  validatorRewardsEth24h: number;
  currentFeeBps: number;
  currentCommissionRate: number;
  currentLpAllocationPct: number;
}

export interface GovernanceDecision {
  newFeeBps: number;
  newCommissionRate: number;
  newLpAllocationPct: number;
  actions: string[];
  snapshot: MarketSnapshot;
  decidedAt: number;
}

const DEFAULT_CONFIG: GovernorConfig = {
  minFeeBps: 5,
  maxFeeBps: 100,
  highVolThresholdUsd: 500_000,
  lowVolThresholdUsd: 50_000,
  ilThresholdPct: 4,
  rewardThresholdEth: 0.005,
  feeStepBps: 5,
  commissionStep: 0.01,
};

export class InfrastructureGovernor {
  private readonly cfg: GovernorConfig;
  private decisions: GovernanceDecision[] = [];

  constructor(config: Partial<GovernorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate market snapshot and produce governance decisions.
   * Returns GovernanceDecision with updated parameters and action log.
   */
  evaluate(snapshot: MarketSnapshot): GovernanceDecision {
    const actions: string[] = [];

    // ── DEX Fee Adjustment ───────────────────────────────────────────────────
    let newFeeBps = snapshot.currentFeeBps;
    if (snapshot.volumeUsd24h > this.cfg.highVolThresholdUsd) {
      newFeeBps = Math.max(this.cfg.minFeeBps, newFeeBps - this.cfg.feeStepBps);
      actions.push(`dex_fee_lowered: ${snapshot.currentFeeBps}→${newFeeBps} bps (high volume)`);
    } else if (snapshot.volumeUsd24h < this.cfg.lowVolThresholdUsd) {
      newFeeBps = Math.min(this.cfg.maxFeeBps, newFeeBps + this.cfg.feeStepBps);
      actions.push(`dex_fee_raised: ${snapshot.currentFeeBps}→${newFeeBps} bps (low volume)`);
    } else {
      actions.push('dex_fee_unchanged: volume in normal range');
    }

    // ── LP Allocation Adjustment ─────────────────────────────────────────────
    let newLpAllocationPct = snapshot.currentLpAllocationPct;
    if (snapshot.avgIlPct > this.cfg.ilThresholdPct) {
      newLpAllocationPct = Math.max(0, newLpAllocationPct - 10);
      actions.push(`lp_allocation_reduced: ${snapshot.currentLpAllocationPct}→${newLpAllocationPct}% (high IL)`);
    } else {
      actions.push('lp_allocation_unchanged: IL within tolerance');
    }

    // ── Validator Commission Adjustment ──────────────────────────────────────
    let newCommissionRate = snapshot.currentCommissionRate;
    if (snapshot.validatorRewardsEth24h > this.cfg.rewardThresholdEth) {
      newCommissionRate = Math.min(0.2, parseFloat((newCommissionRate + this.cfg.commissionStep).toFixed(4)));
      actions.push(`commission_raised: ${snapshot.currentCommissionRate}→${newCommissionRate} (high rewards)`);
    } else {
      newCommissionRate = Math.max(0, parseFloat((newCommissionRate - this.cfg.commissionStep).toFixed(4)));
      actions.push(`commission_lowered: ${snapshot.currentCommissionRate}→${newCommissionRate} (low rewards)`);
    }

    const decision: GovernanceDecision = {
      newFeeBps,
      newCommissionRate,
      newLpAllocationPct,
      actions,
      snapshot,
      decidedAt: Date.now(),
    };

    this.decisions.push(decision);
    return { ...decision, actions: [...actions] };
  }

  getDecisions(): GovernanceDecision[] {
    return this.decisions.map((d) => ({ ...d, actions: [...d.actions] }));
  }

  clearDecisions(): void {
    this.decisions.length = 0;
  }

  getConfig(): GovernorConfig {
    return { ...this.cfg };
  }
}
