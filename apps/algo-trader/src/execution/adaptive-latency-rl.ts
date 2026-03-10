import { EventEmitter } from 'events';

// ── Types ──────────────────────────────────────────────────────────────────

export type LatencyAction = 'early_send' | 'normal' | 'delayed_send' | 'skip';

const ACTIONS: LatencyAction[] = ['early_send', 'normal', 'delayed_send', 'skip'];
const NUM_ACTIONS = 4;
const NUM_STATES = 27; // 3 × 3 × 3

export interface LatencyState {
  latencyBin: 0 | 1 | 2;        // 0=low, 1=med, 2=high
  spreadVelocityBin: 0 | 1 | 2; // 0=contracting, 1=stable, 2=expanding
  fillRateBin: 0 | 1 | 2;       // 0=poor, 1=moderate, 2=good
}

export interface LatencyRLConfig {
  learningRate?: number;
  discountFactor?: number;
  explorationRate?: number;
  explorationDecay?: number;
  minExploration?: number;
  latencyThresholds?: [number, number]; // ms, default [100, 300]
  fillRateThresholds?: [number, number]; // ratio, default [0.5, 0.8]
}

export interface ActionResult {
  action: LatencyAction;
  state: LatencyState;
  stateIndex: number;
  wasExploration: boolean;
}

// ── Timing offsets per action (ms) ────────────────────────────────────────

const TIMING_OFFSETS: Record<LatencyAction, number> = {
  early_send:   -50,
  normal:         0,
  delayed_send: +100,
  skip:           0, // N/A — caller should not execute
};

// ── AdaptiveLatencyRL ──────────────────────────────────────────────────────

export class AdaptiveLatencyRL extends EventEmitter {
  private qTable: number[][]; // [NUM_STATES][NUM_ACTIONS]
  private cfg: Required<LatencyRLConfig>;

  constructor(config: LatencyRLConfig = {}) {
    super();
    this.cfg = {
      learningRate:       config.learningRate       ?? 0.1,
      discountFactor:     config.discountFactor     ?? 0.95,
      explorationRate:    config.explorationRate    ?? 0.2,
      explorationDecay:   config.explorationDecay   ?? 0.995,
      minExploration:     config.minExploration     ?? 0.05,
      latencyThresholds:  config.latencyThresholds  ?? [100, 300],
      fillRateThresholds: config.fillRateThresholds ?? [0.5, 0.8],
    };
    this.qTable = this.initQTable();
  }

  // ── State encoding ───────────────────────────────────────────────────────

  computeState(avgLatencyMs: number, spreadVelocity: number, fillRate: number): LatencyState {
    const [latLo, latHi] = this.cfg.latencyThresholds;
    const [fillLo, fillHi] = this.cfg.fillRateThresholds;

    const latencyBin = (avgLatencyMs < latLo ? 0 : avgLatencyMs < latHi ? 1 : 2) as 0 | 1 | 2;
    const spreadVelocityBin = (spreadVelocity < 0 ? 0 : spreadVelocity === 0 ? 1 : 2) as 0 | 1 | 2;
    const fillRateBin = (fillRate < fillLo ? 0 : fillRate < fillHi ? 1 : 2) as 0 | 1 | 2;

    return { latencyBin, spreadVelocityBin, fillRateBin };
  }

  stateToIndex(state: LatencyState): number {
    return state.latencyBin * 9 + state.spreadVelocityBin * 3 + state.fillRateBin;
  }

  // ── Action selection (epsilon-greedy) ───────────────────────────────────

  selectAction(state: LatencyState): ActionResult {
    const stateIndex = this.stateToIndex(state);
    const explore = Math.random() < this.cfg.explorationRate;

    let actionIndex: number;
    if (explore) {
      actionIndex = Math.floor(Math.random() * NUM_ACTIONS);
    } else {
      const qValues = this.qTable[stateIndex];
      actionIndex = qValues.indexOf(Math.max(...qValues));
    }

    const action = ACTIONS[actionIndex];
    const result: ActionResult = { action, state, stateIndex, wasExploration: explore };

    this.emit('action:selected', result);
    return result;
  }

  // ── Q-learning update ────────────────────────────────────────────────────

  receiveReward(
    stateIndex: number,
    action: LatencyAction,
    reward: number,
    nextState: LatencyState,
  ): void {
    const actionIndex = ACTIONS.indexOf(action);
    const nextStateIndex = this.stateToIndex(nextState);
    const maxNextQ = Math.max(...this.qTable[nextStateIndex]);
    const { learningRate: α, discountFactor: γ } = this.cfg;

    const current = this.qTable[stateIndex][actionIndex];
    this.qTable[stateIndex][actionIndex] = current + α * (reward + γ * maxNextQ - current);

    // Decay exploration after each update
    this.cfg.explorationRate = Math.max(
      this.cfg.minExploration,
      this.cfg.explorationRate * this.cfg.explorationDecay,
    );

    this.emit('reward:received', { stateIndex, action, reward });
  }

  // ── Utility ──────────────────────────────────────────────────────────────

  getTimingOffsetMs(action: LatencyAction): number {
    return TIMING_OFFSETS[action];
  }

  getQTable(): number[][] {
    return this.qTable.map(row => [...row]);
  }

  getExplorationRate(): number {
    return this.cfg.explorationRate;
  }

  reset(): void {
    this.cfg.explorationRate = 0.2;
    this.qTable = this.initQTable();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private initQTable(): number[][] {
    return Array.from({ length: NUM_STATES }, () => new Array(NUM_ACTIONS).fill(0));
  }
}
