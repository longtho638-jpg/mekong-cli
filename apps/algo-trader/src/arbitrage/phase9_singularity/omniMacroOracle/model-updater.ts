/**
 * ModelUpdater — periodically fine-tunes the LLM on new processed data.
 * Simulates LoRA / PEFT fine-tuning loop. In production: replace with
 * actual llama.cpp fine-tune CLI or Hugging Face PEFT adapter update.
 */

import { EventEmitter } from 'events';
import type { ProcessedHeadline } from './llm-processor';

export interface ModelUpdaterConfig {
  enabled: boolean;
  /** Interval in ms between scheduled update checks. */
  updateIntervalMs: number;
  /** Minimum new samples required to trigger an update. */
  minSamplesForUpdate: number;
  /** Simulated training duration in ms. */
  trainingDurationMs: number;
}

export interface UpdateResult {
  updateId: string;
  startedAt: number;
  completedAt: number;
  samplesUsed: number;
  /** Simulated loss improvement (delta). */
  lossImprovement: number;
  success: boolean;
}

const DEFAULT_CONFIG: ModelUpdaterConfig = {
  enabled: false,
  updateIntervalMs: 60_000,
  minSamplesForUpdate: 10,
  trainingDurationMs: 0,
};

export class ModelUpdater extends EventEmitter {
  private readonly cfg: ModelUpdaterConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private pendingSamples: ProcessedHeadline[] = [];
  private lastUpdate: UpdateResult | null = null;
  private updateCounter = 0;
  private isTraining = false;

  constructor(config: Partial<ModelUpdaterConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Start the periodic update scheduler. */
  scheduleUpdate(): void {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }
    if (this.timer) return;

    this.timer = setInterval(() => this.maybeRun(), this.cfg.updateIntervalMs);
    this.emit('scheduler:started', { intervalMs: this.cfg.updateIntervalMs });
  }

  /** Stop the scheduler. Does not abort an in-progress training run. */
  stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('scheduler:stopped');
  }

  /** Queue new processed headlines as training samples. */
  addSamples(headlines: ProcessedHeadline[]): void {
    this.pendingSamples.push(...headlines);
    this.emit('samples:added', { count: headlines.length, total: this.pendingSamples.length });
  }

  /**
   * Run a fine-tuning update immediately using pending samples.
   * Resolves when training completes (or fails).
   */
  async runUpdate(): Promise<UpdateResult> {
    if (this.isTraining) {
      const skipped: UpdateResult = {
        updateId: `skip-${Date.now()}`,
        startedAt: Date.now(),
        completedAt: Date.now(),
        samplesUsed: 0,
        lossImprovement: 0,
        success: false,
      };
      this.emit('update:skipped', { reason: 'training-in-progress' });
      return skipped;
    }

    const samples = this.pendingSamples.splice(0, this.pendingSamples.length);
    const updateId = `update-${++this.updateCounter}`;
    const startedAt = Date.now();

    this.isTraining = true;
    this.emit('update:started', { updateId, samplesUsed: samples.length });

    if (this.cfg.trainingDurationMs > 0) {
      await delay(this.cfg.trainingDurationMs);
    }

    // Simulate loss improvement proportional to sample count
    const lossImprovement = parseFloat(
      (Math.min(samples.length * 0.001, 0.05) + Math.random() * 0.005).toFixed(5),
    );

    const result: UpdateResult = {
      updateId,
      startedAt,
      completedAt: Date.now(),
      samplesUsed: samples.length,
      lossImprovement,
      success: true,
    };

    this.lastUpdate = result;
    this.isTraining = false;
    this.emit('update:complete', result);
    return result;
  }

  getLastUpdate(): UpdateResult | null {
    return this.lastUpdate;
  }

  getPendingSampleCount(): number {
    return this.pendingSamples.length;
  }

  isSchedulerRunning(): boolean {
    return this.timer !== null;
  }

  isCurrentlyTraining(): boolean {
    return this.isTraining;
  }

  private async maybeRun(): Promise<void> {
    if (this.pendingSamples.length >= this.cfg.minSamplesForUpdate) {
      await this.runUpdate();
    } else {
      this.emit('update:deferred', {
        pending: this.pendingSamples.length,
        required: this.cfg.minSamplesForUpdate,
      });
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
