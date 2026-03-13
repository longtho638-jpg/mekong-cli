/**
 * Drawdown Tracker — Track drawdown from high-water mark.
 *
 * Features:
 * - Calculate drawdown: (currentValue - peakValue) / peakValue
 * - Update high-water mark on new peaks
 * - Rolling drawdown windows (1h, 24h, custom)
 * - Emit events on threshold breaches
 *
 * Emits events:
 * - drawdown:warning - Soft limit breached
 * - circuit:trip - Hard limit breached
 */

import { EventEmitter } from 'events';
import { DrawdownWarningEvent } from './types';
import { RiskEventEmitter } from '../core/risk-events';
import { logger } from '../utils/logger';

export interface DrawdownSnapshot {
  timestamp: number;
  value: number;
  peak: number;
  drawdown: number;
}

export interface RollingWindowStats {
  windowMs: number;
  startValue: number;
  peakValue: number;
  currentValue: number;
  drawdown: number;
  sampleCount: number;
}

export interface DrawdownTrackerConfig {
  /** Initial portfolio value */
  initialValue: number;
  /** Warning threshold (e.g., 0.10 = -10%) */
  warningThreshold: number;
  /** Critical threshold (e.g., 0.15 = -15%) */
  criticalThreshold: number;
  /** Enable rolling window tracking */
  enableRollingWindows: boolean;
  /** Rolling window durations in ms */
  windowDurations: number[];
}

const DEFAULT_CONFIG: DrawdownTrackerConfig = {
  initialValue: 10000,
  warningThreshold: 0.10,    // -10% warning
  criticalThreshold: 0.15,   // -15% critical
  enableRollingWindows: true,
  windowDurations: [
    3600000,     // 1 hour
    86400000,    // 24 hours
  ],
};

interface WindowState {
  duration: number;
  startTime: number;
  startValue: number;
  peakValue: number;
  samples: DrawdownSnapshot[];
}

export class DrawdownTracker extends EventEmitter {
  private config: DrawdownTrackerConfig;
  private currentValue: number;
  private peakValue: number;
  private allTimeHigh: number;
  private history: DrawdownSnapshot[] = [];
  private windows: Map<number, WindowState> = new Map();
  private breachLog: Set<string> = new Set();

  private riskEmitter: RiskEventEmitter;

  constructor(config: Partial<DrawdownTrackerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentValue = this.config.initialValue;
    this.peakValue = this.config.initialValue;
    this.allTimeHigh = this.config.initialValue;
    this.riskEmitter = RiskEventEmitter.getInstance();

    // Initialize rolling windows
    if (this.config.enableRollingWindows) {
      this.initWindows();
    }
  }

  /**
   * Initialize rolling window states
   */
  private initWindows(): void {
    for (const duration of this.config.windowDurations) {
      this.windows.set(duration, {
        duration,
        startTime: Date.now(),
        startValue: this.currentValue,
        peakValue: this.currentValue,
        samples: [],
      });
    }
  }

  /**
   * Update current value and recalculate drawdowns
   */
  updateValue(value: number): void {
    this.currentValue = value;

    // Update peak if new high
    if (value > this.peakValue) {
      this.peakValue = value;
    }

    // Update all-time high
    if (value > this.allTimeHigh) {
      this.allTimeHigh = value;
    }

    // Calculate drawdown
    const drawdown = this.calculateDrawdown();

    // Record snapshot
    const snapshot: DrawdownSnapshot = {
      timestamp: Date.now(),
      value,
      peak: this.peakValue,
      drawdown,
    };
    this.history.push(snapshot);

    // Update rolling windows
    this.updateWindows(snapshot);

    // Check thresholds
    this.checkThresholds(drawdown);
  }

  /**
   * Calculate current drawdown from peak
   */
  calculateDrawdown(): number {
    if (this.peakValue <= 0) return 0;
    return (this.peakValue - this.currentValue) / this.peakValue;
  }

  /**
   * Update rolling window statistics
   */
  private updateWindows(snapshot: DrawdownSnapshot): void {
    for (const window of this.windows.values()) {
      // Reset window if expired
      if (Date.now() - window.startTime > window.duration) {
        window.startTime = Date.now();
        window.startValue = this.currentValue;
        window.peakValue = this.currentValue;
        window.samples = [];
      }

      // Update peak
      if (snapshot.value > window.peakValue) {
        window.peakValue = snapshot.value;
      }

      // Store sample
      window.samples.push(snapshot);

      // Emit window update
      const stats = this.getWindowStats(window.duration);
      this.emit('window-update', { window: stats });
    }
  }

  /**
   * Get statistics for a specific rolling window
   */
  getWindowStats(durationMs: number): RollingWindowStats | undefined {
    const window = this.windows.get(durationMs);
    if (!window) return undefined;

    const currentPeak = window.peakValue;
    const drawdown = (currentPeak - this.currentValue) / currentPeak;

    return {
      windowMs: durationMs,
      startValue: window.startValue,
      peakValue: window.peakValue,
      currentValue: this.currentValue,
      drawdown,
      sampleCount: window.samples.length,
    };
  }

  /**
   * Get all rolling window stats
   */
  getAllWindowStats(): RollingWindowStats[] {
    const stats: RollingWindowStats[] = [];
    for (const duration of this.config.windowDurations) {
      const stats_ = this.getWindowStats(duration);
      if (stats_) stats.push(stats_);
    }
    return stats;
  }

  /**
   * Check drawdown thresholds and emit events
   */
  private checkThresholds(drawdown: number): void {
    const warningKey = `warning_${Date.now() - (Date.now() % 60000)}`; // Per-minute dedup
    const criticalKey = `critical_${Date.now() - (Date.now() % 60000)}`;

    // Critical threshold - trigger circuit trip
    if (drawdown >= this.config.criticalThreshold) {
      if (!this.breachLog.has(criticalKey)) {
        this.breachLog.add(criticalKey);
        this.emitCritical(drawdown);
      }
      return;
    }

    // Warning threshold
    if (drawdown >= this.config.warningThreshold) {
      if (!this.breachLog.has(warningKey)) {
        this.breachLog.add(warningKey);
        this.emitWarning(drawdown);
      }
    }
  }

  /**
   * Emit warning event
   */
  private emitWarning(drawdown: number): void {
    logger.warn(
      `[DrawdownTracker] WARNING: Drawdown ${(drawdown * 100).toFixed(2)}%`
    );

    const event: DrawdownWarningEvent = {
      type: 'drawdown:warning',
      severity: 'warning',
      message: `Drawdown reached ${(drawdown * 100).toFixed(2)}%`,
      timestamp: Date.now(),
      metadata: {
        currentDrawdown: drawdown,
        threshold: this.config.warningThreshold,
        peakValue: this.peakValue,
      },
    };

    this.emit('warning', { drawdown, peakValue: this.peakValue });
    this.riskEmitter.emit(event).catch(err => {
      logger.error('[DrawdownTracker] Failed to emit warning event:', err);
    });
  }

  /**
   * Emit critical event (circuit trip)
   */
  private emitCritical(drawdown: number): void {
    logger.error(
      `[DrawdownTracker] CRITICAL: Drawdown ${(drawdown * 100).toFixed(2)}% - CIRCUIT TRIP`
    );

    this.emit('critical', { drawdown, peakValue: this.peakValue });
  }

  /**
   * Get current drawdown metrics
   */
  getMetrics(): {
    currentValue: number;
    peakValue: number;
    allTimeHigh: number;
    drawdown: number;
    drawdownPct: number;
    fromAth: number;
    fromAthPct: number;
    historyLength: number;
  } {
    const drawdown = this.calculateDrawdown();
    const fromAth = this.allTimeHigh - this.currentValue;

    return {
      currentValue: this.currentValue,
      peakValue: this.peakValue,
      allTimeHigh: this.allTimeHigh,
      drawdown,
      drawdownPct: drawdown * 100,
      fromAth,
      fromAthPct: ((this.allTimeHigh - this.currentValue) / this.allTimeHigh) * 100,
      historyLength: this.history.length,
    };
  }

  /**
   * Get recent drawdown history
   */
  getHistory(limit = 100): DrawdownSnapshot[] {
    return this.history.slice(-limit);
  }

  /**
   * Reset tracker to initial state
   */
  reset(initialValue?: number): void {
    const value = initialValue ?? this.config.initialValue;
    this.currentValue = value;
    this.peakValue = value;
    this.allTimeHigh = value;
    this.history = [];
    this.breachLog.clear();

    this.initWindows();

    logger.info(`[DrawdownTracker] Reset to initial value: ${value}`);
    this.emit('reset', { value });
  }

  /**
   * Set value from external source (e.g., portfolio manager)
   */
  setValue(value: number): void {
    this.updateValue(value);
  }

  /**
   * Get time since peak
   */
  getTimeSincePeak(): number {
    // Find last snapshot where value equals peak (reverse iteration)
    for (let i = this.history.length - 1; i >= 0; i--) {
      const s = this.history[i];
      if (s.value === s.peak) {
        return Date.now() - s.timestamp;
      }
    }
    return 0;
  }
}
