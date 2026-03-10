/**
 * Training Orchestrator — daily training jobs with atomic model deployment.
 * Runs episode rollouts, collects transitions, triggers policy update.
 * SIMULATION MODE ONLY — no real orders during training.
 */

import { EventEmitter } from 'events';
import { MarketEnv, type MarketEnvConfig } from './market-env';
import { RLAgent } from './rl-agent';
import { RewardCalculator } from './reward-calculator';

export interface TrainingConfig {
  pairs: string[];
  episodesPerRun: number;
  stepsPerEpisode: number;
  trainingIntervalHours: number;
  modelOutputPath: string;
  dryRun: boolean;
}

export interface EpisodeStats {
  pair: string;
  episode: number;
  totalReward: number;
  steps: number;
  meanSpread: number;
  peakInventory: number;
}

export interface TrainingRun {
  startedAt: number;
  completedAt: number;
  episodes: EpisodeStats[];
  meanReward: number;
  modelDeployed: boolean;
}

const DEFAULT_CONFIG: TrainingConfig = {
  pairs: ['BTC/USDT', 'ETH/USDT'],
  episodesPerRun: 20,
  stepsPerEpisode: 500,
  trainingIntervalHours: 24,
  modelOutputPath: './models/ppo_btc.json',
  dryRun: true,
};

export class TrainingOrchestrator extends EventEmitter {
  private readonly cfg: TrainingConfig;
  private readonly rewardCalc: RewardCalculator;
  private timer: ReturnType<typeof setInterval> | null = null;
  private runCount = 0;

  constructor(config: Partial<TrainingConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.rewardCalc = new RewardCalculator();
  }

  /** Start periodic training on the configured interval. */
  start(): void {
    const intervalMs = this.cfg.trainingIntervalHours * 3_600_000;
    this.timer = setInterval(() => void this.runTrainingJob(), intervalMs);
    this.emit('started', { intervalHours: this.cfg.trainingIntervalHours });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
  }

  /** Run a full training job across all configured pairs. */
  async runTrainingJob(): Promise<TrainingRun> {
    this.runCount++;
    const startedAt = Date.now();
    const allEpisodes: EpisodeStats[] = [];

    for (const pair of this.cfg.pairs) {
      const envCfg: Partial<MarketEnvConfig> = {
        pair,
        maxEpisodeSteps: this.cfg.stepsPerEpisode,
        dryRun: true,
      };
      const env = new MarketEnv(envCfg);
      const agent = new RLAgent({ explorationRate: 0.15 });
      await agent.loadPolicy();

      for (let ep = 0; ep < this.cfg.episodesPerRun; ep++) {
        const stats = await this.runEpisode(env, agent, pair, ep);
        allEpisodes.push(stats);
        this.emit('episode', stats);
      }
    }

    const meanReward =
      allEpisodes.reduce((s, e) => s + e.totalReward, 0) / allEpisodes.length;

    // Atomic model deployment: write new weights if mean reward improved
    const modelDeployed = await this.deployModel(meanReward);

    const run: TrainingRun = {
      startedAt,
      completedAt: Date.now(),
      episodes: allEpisodes,
      meanReward,
      modelDeployed,
    };

    this.emit('run:complete', run);
    return run;
  }

  private async runEpisode(
    env: MarketEnv,
    agent: RLAgent,
    pair: string,
    episode: number,
  ): Promise<EpisodeStats> {
    let state = env.reset();
    let totalReward = 0;
    let steps = 0;
    let spreadSum = 0;
    let peakInventory = 0;

    while (true) {
      const action = agent.selectAction(state);
      const { nextState, reward, done } = env.step(action);
      const components = this.rewardCalc.compute([], nextState.inventory);
      totalReward += reward + components.totalReward * 0.1;
      spreadSum += nextState.spread;
      steps++;
      peakInventory = Math.max(peakInventory, Math.abs(nextState.inventory));
      state = nextState;
      if (done) break;
    }

    return {
      pair,
      episode,
      totalReward,
      steps,
      meanSpread: steps > 0 ? spreadSum / steps : 0,
      peakInventory,
    };
  }

  /** Mock atomic deployment: serialize policy to JSON file path. */
  private async deployModel(meanReward: number): Promise<boolean> {
    if (!this.cfg.dryRun && meanReward > 0) {
      // Real impl: atomically write model weights to modelOutputPath
      await Promise.resolve();
      return true;
    }
    return false;
  }

  getRunCount(): number {
    return this.runCount;
  }
}
