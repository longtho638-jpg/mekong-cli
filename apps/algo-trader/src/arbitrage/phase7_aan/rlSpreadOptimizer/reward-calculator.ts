/**
 * Reward Calculator — computes RL reward from fills, slippage, and inventory.
 * Separates reward computation from the environment for testability.
 */

export interface FillEvent {
  side: 'buy' | 'sell';
  price: number;
  size: number;
  /** Execution price vs quoted price (positive = worse). */
  slippageBps: number;
  timestamp: number;
}

export interface RewardComponents {
  fillPnl: number;
  slippagePenalty: number;
  inventoryPenalty: number;
  totalReward: number;
}

export interface RewardConfig {
  /** Per-unit reward for each fill (scaled by size). */
  fillRewardPerUnit: number;
  /** Penalty multiplier for slippage. */
  slippagePenaltyFactor: number;
  /** Penalty multiplier for holding inventory. */
  inventoryPenaltyFactor: number;
  /** Max inventory before max penalty applies. */
  maxInventory: number;
}

const DEFAULT_CONFIG: RewardConfig = {
  fillRewardPerUnit: 1.0,
  slippagePenaltyFactor: 2.0,
  inventoryPenaltyFactor: 0.5,
  maxInventory: 1.0,
};

export class RewardCalculator {
  private readonly cfg: RewardConfig;

  constructor(config: Partial<RewardConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compute reward from a batch of fills and current net inventory.
   */
  compute(fills: FillEvent[], netInventory: number): RewardComponents {
    let fillPnl = 0;
    let slippagePenalty = 0;

    for (const fill of fills) {
      fillPnl += this.cfg.fillRewardPerUnit * fill.size;
      slippagePenalty += this.cfg.slippagePenaltyFactor * (fill.slippageBps / 10_000) * fill.price * fill.size;
    }

    const inventoryRatio = Math.abs(netInventory) / this.cfg.maxInventory;
    const inventoryPenalty = this.cfg.inventoryPenaltyFactor * Math.pow(inventoryRatio, 2);

    const totalReward = fillPnl - slippagePenalty - inventoryPenalty;

    return { fillPnl, slippagePenalty, inventoryPenalty, totalReward };
  }

  /**
   * Compute shaped reward adding urgency penalty when inventory is near limit.
   */
  computeShaped(fills: FillEvent[], netInventory: number, spreadBps: number): number {
    const base = this.compute(fills, netInventory);
    // Penalise very wide spreads to encourage competitive quoting
    const spreadPenalty = Math.max(0, (spreadBps - 10) / 100);
    return base.totalReward - spreadPenalty;
  }
}
