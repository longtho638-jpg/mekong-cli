/**
 * Market Environment — Gym-like RL environment for spread optimization.
 * State: spread, depth, volatility, inventory.
 * Action: spread adjustment + size multiplier.
 * Reward: PnL - inventory penalty.
 */

export interface MarketState {
  spread: number;          // current bid-ask spread (bps)
  depth: number;           // available depth at top levels (base units)
  volatility: number;      // recent price volatility (std dev, bps)
  inventory: number;       // net inventory in base currency (can be negative)
  midPrice: number;
  timestamp: number;
}

export interface SpreadAction {
  /** Spread adjustment in bps: negative = tighten, positive = widen */
  spreadDeltaBps: number;
  /** Size multiplier applied to base order size [0.1, 3.0] */
  sizeMultiplier: number;
}

export interface StepResult {
  nextState: MarketState;
  reward: number;
  done: boolean;
  info: {
    pnl: number;
    inventoryPenalty: number;
    fillProb: number;
  };
}

export interface MarketEnvConfig {
  pair: string;
  maxInventory: number;      // absolute inventory cap in base units
  inventoryPenaltyFactor: number;
  targetSpreadBps: number;   // baseline spread
  maxEpisodeSteps: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: MarketEnvConfig = {
  pair: 'BTC/USDT',
  maxInventory: 1.0,
  inventoryPenaltyFactor: 0.5,
  targetSpreadBps: 5,
  maxEpisodeSteps: 1000,
  dryRun: true,
};

export class MarketEnv {
  private readonly cfg: MarketEnvConfig;
  private state: MarketState;
  private stepCount = 0;

  constructor(config: Partial<MarketEnvConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.state = this.buildInitialState();
  }

  private buildInitialState(): MarketState {
    return {
      spread: this.cfg.targetSpreadBps,
      depth: 50,
      volatility: 10,
      inventory: 0,
      midPrice: 50_000,
      timestamp: Date.now(),
    };
  }

  /** Reset environment to initial state. */
  reset(): MarketState {
    this.state = this.buildInitialState();
    this.stepCount = 0;
    return { ...this.state };
  }

  /**
   * Apply action and advance one step.
   * Simulates fill probability based on spread and volatility.
   */
  step(action: SpreadAction): StepResult {
    this.stepCount++;

    const newSpread = Math.max(
      1,
      this.state.spread + action.spreadDeltaBps,
    );

    // Fill probability inversely proportional to spread relative to volatility
    const fillProb = Math.max(0, 1 - newSpread / (this.state.volatility * 2 + 1e-9));

    // Simulate a fill: random side based on fill probability
    const filled = Math.random() < fillProb;
    const fillSide = Math.random() > 0.5 ? 1 : -1; // +1 buy fill, -1 sell fill
    const fillSize = filled ? action.sizeMultiplier * 0.01 : 0;

    const newInventory = this.state.inventory + fillSide * fillSize;

    // PnL: half-spread captured per fill (simplified for deterministic testing)
    const halfSpread = (newSpread / 10_000) * this.state.midPrice;
    const pnl = filled ? halfSpread * fillSize : 0;

    // Inventory penalty - based on inventory BEFORE this step for deterministic behavior
    const inventoryPenalty =
      this.cfg.inventoryPenaltyFactor *
      Math.pow(Math.abs(this.state.inventory) / this.cfg.maxInventory, 2);

    // Reward: PnL minus inventory penalty
    const reward = pnl - inventoryPenalty;

    // Evolve volatility with small random walk
    const newVolatility = Math.max(1, this.state.volatility + (Math.random() - 0.5) * 2);

    this.state = {
      spread: newSpread,
      depth: Math.max(1, this.state.depth + (Math.random() - 0.5) * 5),
      volatility: newVolatility,
      inventory: Math.max(-this.cfg.maxInventory, Math.min(this.cfg.maxInventory, newInventory)),
      midPrice: this.state.midPrice * (1 + (Math.random() - 0.5) * 0.0001),
      timestamp: Date.now(),
    };

    const done =
      this.stepCount >= this.cfg.maxEpisodeSteps ||
      Math.abs(this.state.inventory) >= this.cfg.maxInventory;

    return {
      nextState: { ...this.state },
      reward,
      done,
      info: { pnl, inventoryPenalty, fillProb },
    };
  }

  getState(): MarketState {
    return { ...this.state };
  }

  getStepCount(): number {
    return this.stepCount;
  }

  getConfig(): MarketEnvConfig {
    return { ...this.cfg };
  }
}
