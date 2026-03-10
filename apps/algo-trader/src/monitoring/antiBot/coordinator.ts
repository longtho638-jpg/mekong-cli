/**
 * Coordinator — Main loop orchestrating detection and response
 * Periodically analyzes recent events, triggers defensive actions,
 * and exposes real-time metrics via EventEmitter
 */

import { EventEmitter } from 'events';
import {
  AntiBotConfig,
  DetectionResult,
  ExchangeHealth,
} from './antibot-config-types';
import { DataCollector } from './data-collector';
import { PatternDetector } from './pattern-detector';
import { ResponseEngine } from './response-engine';

/** Coordinator status */
export interface CoordinatorStatus {
  running: boolean;
  startedAt: number | null;
  cycleCount: number;
  totalDetections: number;
  totalActions: number;
  exchangeHealth: Record<string, ExchangeHealth>;
}

/**
 * Coordinator — Orchestrates the AntiBotSentinel lifecycle
 */
export class Coordinator extends EventEmitter {
  private readonly collector: DataCollector;
  private readonly detector: PatternDetector;
  private readonly engine: ResponseEngine;
  private readonly config: AntiBotConfig;

  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private startedAt: number | null = null;
  private cycleCount = 0;
  private totalDetections = 0;
  private totalActions = 0;

  /** Detection history per exchange for health scoring */
  private readonly detectionHistory: Map<string, DetectionResult[]> = new Map();
  private readonly maxDetectionHistory = 100;

  constructor(
    config: AntiBotConfig,
    collector: DataCollector,
    detector: PatternDetector,
    engine: ResponseEngine
  ) {
    super();
    this.config = config;
    this.collector = collector;
    this.detector = detector;
    this.engine = engine;
  }

  /** Start the monitoring loop */
  start(intervalMs: number = 1000): void {
    if (this.running) return;

    this.running = true;
    this.startedAt = Date.now();
    this.cycleCount = 0;

    this.intervalHandle = setInterval(() => this.runCycle(), intervalMs);
    this.emit('started', { timestamp: this.startedAt });
  }

  /** Stop the monitoring loop */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.emit('stopped', { timestamp: Date.now() });
  }

  /** Run a single detection cycle */
  runCycle(): void {
    this.cycleCount++;
    const windowMs = this.config.dataRetentionSeconds * 1000;

    for (const exchange of this.config.exchanges) {
      const events = this.collector.getRecentEvents(exchange, windowMs);
      const detections = this.detector.analyze(exchange, events);

      for (const detection of detections) {
        this.totalDetections++;
        this.recordDetection(exchange, detection);
        this.emit('detection', detection);

        const actions = this.engine.respond(detection);
        this.totalActions += actions.length;

        for (const action of actions) {
          this.emit('action', action);
        }
      }
    }

    this.emit('cycle', {
      cycleNumber: this.cycleCount,
      timestamp: Date.now(),
    });
  }

  /** Get health score for an exchange (0-100) */
  getExchangeHealth(exchange: string): ExchangeHealth {
    const detections = this.detectionHistory.get(exchange) || [];
    const activeDefenses = this.engine.getActiveDefenses(exchange);

    // Score: start at 100, deduct per recent detection
    const recentWindow = 300_000; // 5 minutes
    const now = Date.now();
    const recentDetections = detections.filter(
      (d) => d.timestamp >= now - recentWindow
    );

    let score = 100;
    for (const d of recentDetections) {
      score -= d.severity === 'CRITICAL' ? 15 : 5;
    }
    score = Math.max(0, Math.min(100, score));

    return {
      exchange,
      score,
      lastUpdated: now,
      activeDefenses,
      recentDetections: recentDetections.slice(-10),
    };
  }

  /** Get health for all exchanges */
  getAllExchangeHealth(): Record<string, ExchangeHealth> {
    const result: Record<string, ExchangeHealth> = {};
    for (const exchange of this.config.exchanges) {
      result[exchange] = this.getExchangeHealth(exchange);
    }
    return result;
  }

  /** Get coordinator status */
  getStatus(): CoordinatorStatus {
    return {
      running: this.running,
      startedAt: this.startedAt,
      cycleCount: this.cycleCount,
      totalDetections: this.totalDetections,
      totalActions: this.totalActions,
      exchangeHealth: this.getAllExchangeHealth(),
    };
  }

  /** Check if coordinator is running */
  isRunning(): boolean {
    return this.running;
  }

  /** Record detection in history */
  private recordDetection(
    exchange: string,
    detection: DetectionResult
  ): void {
    let history = this.detectionHistory.get(exchange);
    if (!history) {
      history = [];
      this.detectionHistory.set(exchange, history);
    }
    history.push(detection);
    if (history.length > this.maxDetectionHistory) {
      history.splice(0, history.length - this.maxDetectionHistory);
    }
  }
}
