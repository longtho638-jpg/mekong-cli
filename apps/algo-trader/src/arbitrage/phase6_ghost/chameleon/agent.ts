/**
 * RL Agent — Q-learning agent that learns when to emit noise actions
 * to stay below the exchange's anti-bot detection threshold.
 */
import { ChameleonState, ChameleonConfig, NoiseAction } from '../types';

/** Discretize detection score into buckets for Q-table */
function discretizeState(state: ChameleonState): string {
  const scoreBucket = Math.floor(state.detectionScore * 10); // 0-10
  const freqBucket = Math.floor(state.requestFrequency * 5); // 0-5
  const regBucket = Math.floor(state.patternRegularity * 5); // 0-5
  return `${scoreBucket}:${freqBucket}:${regBucket}`;
}

export class QLearningAgent {
  private qTable: Map<string, Map<NoiseAction, number>> = new Map();
  private config: ChameleonConfig;
  private totalReward = 0;
  private episodeCount = 0;

  constructor(config: ChameleonConfig) {
    this.config = config;
  }

  /** Select action using epsilon-greedy policy */
  selectAction(state: ChameleonState): NoiseAction {
    const stateKey = discretizeState(state);

    // Exploration
    if (Math.random() < this.config.explorationRate) {
      const actions = this.config.noiseActions;
      return actions[Math.floor(Math.random() * actions.length)];
    }

    // Exploitation: pick best Q-value
    const qValues = this.getQValues(stateKey);
    let bestAction: NoiseAction = 'doNothing';
    let bestValue = -Infinity;

    for (const action of this.config.noiseActions) {
      const value = qValues.get(action) ?? 0;
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /** Update Q-value after observing reward and next state */
  update(
    state: ChameleonState,
    action: NoiseAction,
    reward: number,
    nextState: ChameleonState,
  ): void {
    const stateKey = discretizeState(state);
    const nextStateKey = discretizeState(nextState);
    const { learningRate, discountFactor } = this.config;

    const qValues = this.getQValues(stateKey);
    const currentQ = qValues.get(action) ?? 0;

    // Max Q-value for next state
    const nextQValues = this.getQValues(nextStateKey);
    let maxNextQ = -Infinity;
    for (const a of this.config.noiseActions) {
      const v = nextQValues.get(a) ?? 0;
      if (v > maxNextQ) maxNextQ = v;
    }
    if (maxNextQ === -Infinity) maxNextQ = 0;

    // Q-learning update
    const newQ = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);
    qValues.set(action, newQ);

    this.totalReward += reward;
  }

  private getQValues(stateKey: string): Map<NoiseAction, number> {
    let qValues = this.qTable.get(stateKey);
    if (!qValues) {
      qValues = new Map();
      this.qTable.set(stateKey, qValues);
    }
    return qValues;
  }

  /** Run a training episode */
  train(
    envStep: (action: NoiseAction) => { state: ChameleonState; reward: number; flagged: boolean },
    envReset: () => ChameleonState,
    maxSteps = 100,
  ): { totalReward: number; flaggedCount: number } {
    let state = envReset();
    let episodeReward = 0;
    let flaggedCount = 0;

    for (let step = 0; step < maxSteps; step++) {
      const action = this.selectAction(state);
      const result = envStep(action);

      this.update(state, action, result.reward, result.state);
      episodeReward += result.reward;
      if (result.flagged) flaggedCount++;

      state = result.state;
    }

    this.episodeCount++;
    return { totalReward: episodeReward, flaggedCount };
  }

  getTotalReward(): number {
    return this.totalReward;
  }

  getEpisodeCount(): number {
    return this.episodeCount;
  }

  getQTableSize(): number {
    return this.qTable.size;
  }
}

/**
 * Rule-based fallback agent — simple heuristic noise generator
 */
export class RuleBasedAgent {
  private config: ChameleonConfig;
  private actionIndex = 0;

  constructor(config: ChameleonConfig) {
    this.config = config;
  }

  /** Select action based on detection score thresholds */
  selectAction(state: ChameleonState): NoiseAction {
    const { detectionScore } = state;

    if (detectionScore > 0.7) {
      // High risk: emit noise
      this.actionIndex = (this.actionIndex + 1) % 3;
      const noiseActions: NoiseAction[] = ['cancel', 'tinyOrder', 'guiCheck'];
      return noiseActions[this.actionIndex];
    }

    if (detectionScore > 0.4) {
      // Medium risk: occasional noise
      return Math.random() < 0.3 ? 'cancel' : 'doNothing';
    }

    // Low risk: do nothing
    return 'doNothing';
  }
}
