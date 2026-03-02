import { ICandle } from '../interfaces/ICandle';
import { QLearningStrategy, Action } from './tabular-q-learning-rl-trading-strategy';

export interface TrainingResult {
  episodes: number;
  statesExplored: number;
  finalEpsilon: number;
  avgReward: number;
  trainingTimeMs: number;
}

/** Minimum candles needed per episode to compute indicators */
const MIN_CANDLES_PER_EPISODE = 50;

/**
 * Trains a QLearningStrategy by simulating episodes through candle history.
 * Each episode iterates the full candle window, updating Q-values via
 * temporal-difference learning.
 */
export class QLearningEpisodeTrainer {
  /**
   * Run training loop over candle history for the given number of episodes.
   * Mutates the strategy's Q-table in-place.
   */
  train(strategy: QLearningStrategy, candles: ICandle[], episodes: number): TrainingResult {
    if (candles.length < MIN_CANDLES_PER_EPISODE) {
      throw new Error(`Need at least ${MIN_CANDLES_PER_EPISODE} candles to train, got ${candles.length}`);
    }

    const start = Date.now();
    let totalReward = 0;

    strategy.trainingMode = true;

    for (let ep = 0; ep < episodes; ep++) {
      // Reset agent state for each episode
      strategy.resetState();
      let episodeReward = 0;

      for (let i = MIN_CANDLES_PER_EPISODE; i < candles.length; i++) {
        const window = candles.slice(0, i + 1);

        // Current state before action
        const state = strategy.discretizeState(window);
        const action = strategy.selectAction(state);

        // Simulate action outcome
        const currentClose = candles[i].close;
        const prevClose = candles[i - 1].close;
        const pnlReturn = this.computePnl(action, strategy.isLong, currentClose, prevClose);

        // Apply action to agent state
        this.applyAction(action, strategy, currentClose);

        // Next state
        const nextWindow = i + 1 < candles.length ? candles.slice(0, i + 2) : window;
        const nextState = strategy.discretizeState(nextWindow);

        // Reward
        const reward = strategy.computeReward(pnlReturn);
        episodeReward += reward;

        // Q-update
        strategy.updateQ(state, action, reward, nextState);
      }

      totalReward += episodeReward;
      strategy.decayEpsilon();
    }

    strategy.trainingMode = false;

    return {
      episodes,
      statesExplored: strategy.getStatesExplored(),
      finalEpsilon: strategy.getEpsilon(),
      avgReward: episodes > 0 ? totalReward / episodes : 0,
      trainingTimeMs: Date.now() - start,
    };
  }

  /** Compute PnL return for the chosen action given current position. */
  private computePnl(
    action: Action,
    isLong: boolean,
    currentClose: number,
    prevClose: number,
  ): number {
    if (action === Action.HOLD && isLong) {
      // Hold a long: unrealised PnL
      return (currentClose - prevClose) / prevClose;
    }
    if (action === Action.BUY && !isLong) {
      // Entry — no immediate PnL
      return 0;
    }
    if (action === Action.SELL && isLong) {
      // Exit long
      return (currentClose - prevClose) / prevClose;
    }
    // HOLD while flat or invalid action
    return 0;
  }

  /** Apply the chosen action to update agent position state. */
  private applyAction(action: Action, strategy: QLearningStrategy, close: number): void {
    if (action === Action.BUY && !strategy.isLong) {
      strategy.isLong = true;
      strategy.barsHeld = 1;
    } else if (action === Action.SELL && strategy.isLong) {
      strategy.isLong = false;
      strategy.barsHeld = 0;
    } else if (strategy.isLong) {
      strategy.barsHeld++;
    }
    // Suppress unused warning
    void close;
  }
}
