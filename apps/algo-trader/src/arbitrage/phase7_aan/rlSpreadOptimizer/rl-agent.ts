/**
 * RL Agent — rule-based mock PPO/DQN policy.
 * Selects spread adjustment + size multiplier actions based on market state.
 * Real impl: load policy network weights and run forward pass.
 */

import type { MarketState, SpreadAction } from './market-env';

export interface AgentConfig {
  /** Path to serialized policy model (JSON weights). */
  modelPath: string;
  /** Exploration rate for epsilon-greedy action selection [0,1]. */
  explorationRate: number;
  /** Max spread delta in bps per step. */
  maxSpreadDeltaBps: number;
  /** Allowed size multiplier range. */
  sizeMultiplierRange: [number, number];
}

const DEFAULT_CONFIG: AgentConfig = {
  modelPath: './models/ppo_btc.json',
  explorationRate: 0.1,
  maxSpreadDeltaBps: 3,
  sizeMultiplierRange: [0.1, 3.0],
};

/** State flattened to numeric vector for policy input. */
function stateToVector(state: MarketState): number[] {
  return [
    state.spread / 100,           // normalise bps to ~[0,1]
    state.depth / 100,
    state.volatility / 100,
    state.inventory,              // already in [-1,1] range
  ];
}

/** Rule-based policy: tighten spread when low volatility + balanced inventory. */
function rulesPolicy(state: MarketState, maxDelta: number): SpreadAction {
  const inventoryAbs = Math.abs(state.inventory);
  const volatilityHigh = state.volatility > 15;
  const inventorySkewed = inventoryAbs > 0.5;

  let spreadDeltaBps: number;
  let sizeMultiplier: number;

  if (volatilityHigh || inventorySkewed) {
    // Widen spread to reduce risk; shrink size
    spreadDeltaBps = maxDelta * (0.5 + 0.5 * (state.volatility / 50));
    sizeMultiplier = Math.max(0.1, 1.0 - inventoryAbs);
  } else {
    // Tighten spread to attract flow; normal size
    spreadDeltaBps = -maxDelta * (1 - state.volatility / 30);
    sizeMultiplier = 1.0 + (1 - inventoryAbs) * 0.5;
  }

  return { spreadDeltaBps, sizeMultiplier };
}

export class RLAgent {
  private readonly cfg: AgentConfig;
  private stepCount = 0;

  constructor(config: Partial<AgentConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load policy model (mock: no-op in simulation).
   * Real impl: parse JSON weights into typed policy network.
   */
  async loadPolicy(): Promise<void> {
    await Promise.resolve(); // simulate async load
  }

  /**
   * Select action given current market state.
   * Uses epsilon-greedy: with probability explorationRate, pick random action.
   */
  selectAction(state: MarketState): SpreadAction {
    this.stepCount++;
    const [minSize, maxSize] = this.cfg.sizeMultiplierRange;

    if (Math.random() < this.cfg.explorationRate) {
      // Random exploration
      return {
        spreadDeltaBps: (Math.random() * 2 - 1) * this.cfg.maxSpreadDeltaBps,
        sizeMultiplier: minSize + Math.random() * (maxSize - minSize),
      };
    }

    const action = rulesPolicy(state, this.cfg.maxSpreadDeltaBps);

    // Clamp outputs
    action.spreadDeltaBps = Math.max(
      -this.cfg.maxSpreadDeltaBps,
      Math.min(this.cfg.maxSpreadDeltaBps, action.spreadDeltaBps),
    );
    action.sizeMultiplier = Math.max(minSize, Math.min(maxSize, action.sizeMultiplier));

    return action;
  }

  /** Encode state to feature vector (exposed for testing). */
  encodeState(state: MarketState): number[] {
    return stateToVector(state);
  }

  getStepCount(): number {
    return this.stepCount;
  }
}
