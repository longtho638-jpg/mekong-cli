/**
 * AntiBotSentinel — Main entry point
 * Assembles all components and manages the sentinel lifecycle
 */

import {
  AntiBotConfig,
  DEFAULT_ANTIBOT_CONFIG,
} from './antibot-config-types';
import { Coordinator } from './coordinator';
import { DashboardIntegration } from './dashboard-integration';
import { DataCollector } from './data-collector';
import { PatternDetector } from './pattern-detector';
import { ResponseEngine } from './response-engine';

export {
  type AntiBotConfig,
  DEFAULT_ANTIBOT_CONFIG,
} from './antibot-config-types';
export type {
  ActionRecord,
  DefensiveAction,
  DetectionResult,
  DetectionType,
  ExchangeEvent,
  ExchangeHealth,
  ThreatSeverity,
} from './antibot-config-types';
export { CircularBuffer, DataCollector } from './data-collector';
export { PatternDetector } from './pattern-detector';
export { ResponseEngine } from './response-engine';
export { Coordinator } from './coordinator';
export type { CoordinatorStatus } from './coordinator';
export { DashboardIntegration } from './dashboard-integration';
export type {
  DashboardMessage,
  OverrideCommand,
  OverrideRequest,
} from './dashboard-integration';

/** AntiBotSentinel — Assembled system facade */
export class AntiBotSentinel {
  readonly collector: DataCollector;
  readonly detector: PatternDetector;
  readonly engine: ResponseEngine;
  readonly coordinator: Coordinator;
  readonly dashboard: DashboardIntegration;
  private readonly config: AntiBotConfig;

  constructor(config: Partial<AntiBotConfig> = {}) {
    this.config = { ...DEFAULT_ANTIBOT_CONFIG, ...config };

    this.collector = new DataCollector(
      this.config.exchanges,
      1000
    );
    this.detector = new PatternDetector(this.config.detection);
    this.engine = new ResponseEngine(this.config);
    this.coordinator = new Coordinator(
      this.config,
      this.collector,
      this.detector,
      this.engine
    );
    this.dashboard = new DashboardIntegration(this.coordinator);
  }

  /** Start the sentinel monitoring loop */
  start(intervalMs: number = 1000): void {
    this.coordinator.start(intervalMs);
    this.dashboard.startHealthBroadcast(5000);
  }

  /** Stop the sentinel */
  stop(): void {
    this.coordinator.stop();
    this.dashboard.stopHealthBroadcast();
  }

  /** Check if sentinel is running */
  isRunning(): boolean {
    return this.coordinator.isRunning();
  }

  /** Get full system status */
  getStatus() {
    return this.coordinator.getStatus();
  }

  /** Get config */
  getConfig(): AntiBotConfig {
    return { ...this.config };
  }

  /** Cleanup all resources */
  destroy(): void {
    this.stop();
    this.dashboard.destroy();
    this.collector.clear();
    this.engine.clear();
  }
}
