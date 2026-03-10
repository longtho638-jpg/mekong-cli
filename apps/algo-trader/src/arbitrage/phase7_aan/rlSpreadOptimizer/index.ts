/**
 * RL Spread Optimizer (MARSO) — barrel exports and main loop.
 * Starts env-agent loop per configured pair.
 * SIMULATION MODE by default.
 */

import { EventEmitter } from 'events';
import { MarketEnv } from './market-env';
import { RLAgent } from './rl-agent';
import { PolicyExecutor } from './policy-executor';
import { RewardCalculator } from './reward-calculator';
import { TrainingOrchestrator, type TrainingConfig } from './training-orchestrator';

export interface RLSpreadOptimizerConfig {
  enabled: boolean;
  pairs: string[];
  modelPath: string;
  trainingIntervalHours: number;
  stepIntervalMs: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: RLSpreadOptimizerConfig = {
  enabled: false,
  pairs: ['BTC/USDT', 'ETH/USDT'],
  modelPath: './models/ppo_btc.json',
  trainingIntervalHours: 24,
  stepIntervalMs: 100,
  dryRun: true,
};

export class RLSpreadOptimizer extends EventEmitter {
  private readonly cfg: RLSpreadOptimizerConfig;
  private readonly envs = new Map<string, MarketEnv>();
  private readonly agents = new Map<string, RLAgent>();
  private readonly executors = new Map<string, PolicyExecutor>();
  private readonly rewardCalc: RewardCalculator;
  private readonly trainer: TrainingOrchestrator;
  private timers: ReturnType<typeof setInterval>[] = [];

  constructor(config: Partial<RLSpreadOptimizerConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.rewardCalc = new RewardCalculator();

    const trainCfg: Partial<TrainingConfig> = {
      pairs: this.cfg.pairs,
      trainingIntervalHours: this.cfg.trainingIntervalHours,
      modelOutputPath: this.cfg.modelPath,
      dryRun: this.cfg.dryRun,
    };
    this.trainer = new TrainingOrchestrator(trainCfg);
    this.trainer.on('run:complete', (r) => this.emit('training:complete', r));
  }

  async start(): Promise<void> {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }

    for (const pair of this.cfg.pairs) {
      const env = new MarketEnv({ pair, dryRun: this.cfg.dryRun });
      const agent = new RLAgent({ modelPath: this.cfg.modelPath });
      const executor = new PolicyExecutor({ pair, dryRun: this.cfg.dryRun });

      await agent.loadPolicy();
      env.reset();

      executor.on('order:dry', (orders) => this.emit('order:dry', { pair, orders }));
      executor.on('order:live', (orders) => this.emit('order:live', { pair, orders }));

      this.envs.set(pair, env);
      this.agents.set(pair, agent);
      this.executors.set(pair, executor);

      const timer = setInterval(() => void this.tick(pair), this.cfg.stepIntervalMs);
      this.timers.push(timer);
    }

    this.trainer.start();
    this.emit('started', { pairs: this.cfg.pairs });
  }

  stop(): void {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    this.trainer.stop();
    this.emit('stopped');
  }

  private async tick(pair: string): Promise<void> {
    const env = this.envs.get(pair);
    const agent = this.agents.get(pair);
    const executor = this.executors.get(pair);
    if (!env || !agent || !executor) return;

    const state = env.getState();
    const action = agent.selectAction(state);
    const { nextState, reward } = env.step(action);
    await executor.execute(action);

    this.emit('tick', { pair, state: nextState, reward });
  }

  getStats(): Record<string, { steps: number; executions: number }> {
    const stats: Record<string, { steps: number; executions: number }> = {};
    for (const pair of this.cfg.pairs) {
      stats[pair] = {
        steps: this.envs.get(pair)?.getStepCount() ?? 0,
        executions: this.executors.get(pair)?.getExecutionCount() ?? 0,
      };
    }
    return stats;
  }
}

// Barrel exports
export { MarketEnv } from './market-env';
export type { MarketState, SpreadAction, StepResult } from './market-env';
export { RLAgent } from './rl-agent';
export { PolicyExecutor } from './policy-executor';
export { RewardCalculator } from './reward-calculator';
export type { FillEvent, RewardComponents } from './reward-calculator';
export { TrainingOrchestrator } from './training-orchestrator';
export type { TrainingRun, EpisodeStats } from './training-orchestrator';
