/**
 * Environment — simulates exchange anti-bot detection scoring.
 * Detection score increases with request frequency, pattern regularity,
 * and lack of human-like noise. Provides reward signal to RL agent.
 */
import { ChameleonState, NoiseAction } from '../types';

export class Environment {
  private detectionScore = 0;
  private requestFrequency = 0;
  private patternRegularity = 0;
  private recentActions: NoiseAction[] = [];
  private threshold: number;
  private stepCount = 0;

  constructor(threshold = 0.8) {
    this.threshold = threshold;
  }

  /** Get current state observation for the RL agent */
  getState(): ChameleonState {
    return {
      detectionScore: this.detectionScore,
      recentActions: [...this.recentActions],
      requestFrequency: this.requestFrequency,
      patternRegularity: this.patternRegularity,
    };
  }

  /** Simulate one step: apply action, update detection score, return reward */
  step(action: NoiseAction): { state: ChameleonState; reward: number; flagged: boolean } {
    this.stepCount++;
    this.recentActions.push(action);
    if (this.recentActions.length > 10) this.recentActions.shift();

    // Simulate request frequency (increases naturally over time)
    this.requestFrequency = Math.min(1, this.requestFrequency + 0.02);

    // Pattern regularity: decreases when noise actions are taken
    if (action === 'doNothing') {
      this.patternRegularity = Math.min(1, this.patternRegularity + 0.05);
    } else {
      this.patternRegularity = Math.max(0, this.patternRegularity - 0.15);
    }

    // Detection score is a weighted combination
    this.detectionScore =
      0.4 * this.requestFrequency +
      0.4 * this.patternRegularity +
      0.2 * this.getActionEntropy();

    // Clamp to [0, 1]
    this.detectionScore = Math.max(0, Math.min(1, this.detectionScore));

    const flagged = this.detectionScore >= this.threshold;

    // Reward: positive when staying below threshold, negative when flagged
    // Small penalty for taking noise actions (cost of noise)
    let reward = flagged ? -10 : 1;
    if (action !== 'doNothing') {
      reward -= 0.5; // Small cost for noise actions
    }

    return { state: this.getState(), reward, flagged };
  }

  /** Entropy-based metric: low entropy (repetitive actions) = higher detection risk */
  private getActionEntropy(): number {
    if (this.recentActions.length === 0) return 0.5;

    const counts = new Map<string, number>();
    for (const a of this.recentActions) {
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }

    // If all same action → low entropy → high detection
    const total = this.recentActions.length;
    let entropy = 0;
    for (const count of counts.values()) {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    // Normalize: max entropy for 4 actions = log2(4) = 2
    const maxEntropy = Math.log2(4);
    const normalizedEntropy = entropy / maxEntropy;

    // Invert: low entropy → high detection risk
    return 1 - normalizedEntropy;
  }

  /** Reset environment to initial state */
  reset(): ChameleonState {
    this.detectionScore = 0;
    this.requestFrequency = 0;
    this.patternRegularity = 0;
    this.recentActions = [];
    this.stepCount = 0;
    return this.getState();
  }

  getStepCount(): number {
    return this.stepCount;
  }

  getThreshold(): number {
    return this.threshold;
  }
}
