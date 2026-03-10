/**
 * HealthMonitor — polls exchange health and market data, trains the AnomalyDetector,
 * and emits CRITICAL_COLLAPSE when collapse probability exceeds threshold.
 * Pure TypeScript fallback (no WASM dependency). SIMULATION MODE ONLY.
 */

import { EventEmitter } from 'events';
import { AnomalyDetector } from './anomaly-detector';
import type { MarketSnapshot } from './anomaly-detector';
import { logger } from '../../../utils/logger';

export interface HealthMonitorConfig {
  pollIntervalMs: number;
  collapseThreshold: number; // [0,1] — emit CRITICAL_COLLAPSE above this
  trainingWindowSize: number; // number of snapshots to train on
}

export interface HealthStatus {
  collapseProbability: number;
  lastCheckAt: string | null;
  snapshotCount: number;
  anomalyDetectorTrained: boolean;
}

const DEFAULT_CONFIG: HealthMonitorConfig = {
  pollIntervalMs: 30_000,
  collapseThreshold: 0.99,
  trainingWindowSize: 100,
};

export class HealthMonitor extends EventEmitter {
  private detector: AnomalyDetector;
  private config: HealthMonitorConfig;
  private history: MarketSnapshot[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastProbability = 0;
  private lastCheckAt: string | null = null;

  constructor(config: Partial<HealthMonitorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detector = new AnomalyDetector();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info('[CapitalFortress] HealthMonitor starting (SIMULATION MODE)');
    this.timer = setInterval(() => this.poll(), this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.running = false;
    logger.info('[CapitalFortress] HealthMonitor stopped');
  }

  /**
   * Process an incoming market snapshot (call externally or from poll).
   * Trains detector once window is full, then scores and emits if critical.
   */
  processSnapshot(snapshot: MarketSnapshot): number {
    this.history.push(snapshot);
    if (this.history.length > this.config.trainingWindowSize * 2) {
      this.history = this.history.slice(-this.config.trainingWindowSize * 2);
    }

    if (this.history.length >= this.config.trainingWindowSize) {
      this.detector.train(this.history.slice(-this.config.trainingWindowSize));
    }

    const probability = this.detector.score(snapshot);
    this.lastProbability = probability;
    this.lastCheckAt = new Date().toISOString();

    this.emit('health:snapshot', { snapshot, probability, at: this.lastCheckAt });

    if (probability >= this.config.collapseThreshold) {
      logger.warn(`[CapitalFortress] Collapse probability ${probability.toFixed(4)} >= threshold — emitting CRITICAL_COLLAPSE`);
      this.emit('CRITICAL_COLLAPSE', probability);
    }

    return probability;
  }

  /** Simulate a poll cycle with synthetic data (sim mode). */
  private poll(): void {
    const snapshot: MarketSnapshot = {
      price: 40000 + (Math.random() - 0.5) * 2000,
      volume: 500 + Math.random() * 1000,
      spreadBps: 1 + Math.random() * 5,
      fillRate: 0.9 + Math.random() * 0.1,
      latencyMs: 30 + Math.random() * 100,
    };
    this.processSnapshot(snapshot);
  }

  getStatus(): HealthStatus {
    return {
      collapseProbability: this.lastProbability,
      lastCheckAt: this.lastCheckAt,
      snapshotCount: this.history.length,
      anomalyDetectorTrained: this.detector.isTrained(),
    };
  }

  isRunning(): boolean { return this.running; }
}
