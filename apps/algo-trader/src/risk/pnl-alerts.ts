/**
 * PnL Alerts — Alert engine for PnL thresholds.
 *
 * Configurable thresholds (warn at -5%, critical at -10%).
 * Integrates with risk-events emitter.
 * Throttles alerts to prevent spam.
 */

import { RiskEventEmitter } from '../core/risk-events';
import { AlertEvent, AlertSeverity, PnLAlertEvent } from '../risk/types';
import { PnLTracker, StrategyPnL } from './pnl-tracker';
import { logger } from '../utils/logger';

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  /** Warn threshold (as decimal, e.g. -0.05 = -5%) */
  warn: number;
  /** Critical threshold (as decimal, e.g. -0.10 = -10%) */
  critical: number;
}

/**
 * Alert configuration per period
 */
export interface AlertConfig {
  /** Daily PnL thresholds */
  daily: AlertThreshold;
  /** Total PnL thresholds */
  total: AlertThreshold;
  /** Per-strategy thresholds */
  perStrategy: boolean;
}

/**
 * Alert state for throttling
 */
interface AlertState {
  /** Last alert timestamp */
  lastAlert: number;
  /** Alert count in current window */
  count: number;
  /** Severity level of last alert */
  lastSeverity: AlertSeverity;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AlertConfig = {
  daily: { warn: -0.05, critical: -0.10 },
  total: { warn: -0.05, critical: -0.10 },
  perStrategy: true,
};

/**
 * PnL Alert Engine
 */
export class PnLAlerts {
  private tracker: PnLTracker;
  private eventEmitter: RiskEventEmitter;
  private config: AlertConfig;
  private alertState: Map<string, AlertState> = new Map();

  /** Throttle window (ms) */
  private readonly throttleWindow = 5 * 60 * 1000; // 5 minutes
  /** Max alerts per window */
  private readonly maxAlertsPerWindow = 3;

  constructor(tracker: PnLTracker, config?: Partial<AlertConfig>) {
    this.tracker = tracker;
    this.eventEmitter = RiskEventEmitter.getInstance();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.setupMonitoring();
  }

  /**
   * Setup periodic monitoring
   */
  private setupMonitoring(): void {
    // Check thresholds every 30 seconds
    const checkInterval = setInterval(() => this.checkThresholds(), 30000);
    checkInterval.unref(); // Don't prevent process exit
  }

  /**
   * Check PnL thresholds
   */
  private checkThresholds(): void {
    const dailyPnl = this.tracker.getDailyPnL();
    const totalPnl = this.tracker.getTotalPnL();

    // Check daily PnL
    this.checkThreshold('daily', dailyPnl, this.config.daily);

    // Check total PnL
    this.checkThreshold('total', totalPnl, this.config.total);

    // Check per-strategy if enabled
    if (this.config.perStrategy) {
      const strategies = this.tracker.getAllStrategyPnL();
      for (const strategy of strategies) {
        this.checkThreshold(
          `strategy:${strategy.strategy}`,
          strategy.totalPnl,
          this.config.total,
          strategy,
        );
      }
    }
  }

  /**
   * Check threshold for a specific metric
   */
  private checkThreshold(
    key: string,
    value: number,
    threshold: AlertThreshold,
    strategy?: StrategyPnL,
  ): void {
    // Calculate percentage (assume baseline of 1000 for percentage calculation)
    const baseline = 1000;
    const pctChange = value / baseline;

    // Determine severity
    let severity: AlertSeverity | null = null;
    let message = '';

    if (pctChange <= threshold.critical) {
      severity = 'critical';
      message = strategy
        ? `${strategy.strategy} critical loss: ${value.toFixed(2)} (${(pctChange * 100).toFixed(2)}%)`
        : `Critical PnL loss: ${value.toFixed(2)} (${(pctChange * 100).toFixed(2)}%)`;
    } else if (pctChange <= threshold.warn) {
      severity = 'warning';
      message = strategy
        ? `${strategy.strategy} warning: ${value.toFixed(2)} (${(pctChange * 100).toFixed(2)}%)`
        : `PnL warning: ${value.toFixed(2)} (${(pctChange * 100).toFixed(2)}%)`;
    }

    // No threshold breached
    if (!severity) {
      this.alertState.delete(key);
      return;
    }

    // Check throttle
    if (this.isThrottled(key, severity)) {
      logger.debug(`[PnLAlerts] Throttled: ${key}`);
      return;
    }

    // Emit alert
    this.emitAlert(key, severity, message, value, threshold);
  }

  /**
   * Check if alert is throttled
   */
  private isThrottled(key: string, severity: AlertSeverity): boolean {
    const state = this.alertState.get(key);
    const now = Date.now();

    if (!state) return false;

    // Reset if window expired
    if (now - state.lastAlert > this.throttleWindow) {
      this.alertState.delete(key);
      return false;
    }

    // Block if max alerts reached
    if (state.count >= this.maxAlertsPerWindow) {
      return true;
    }

    // Don't repeat same severity
    if (state.lastSeverity === severity) {
      return true;
    }

    return false;
  }

  /**
   * Emit alert event
   */
  private emitAlert(
    key: string,
    severity: AlertSeverity,
    message: string,
    value: number,
    threshold: AlertThreshold,
  ): void {
    // Update state
    const state = this.alertState.get(key) || { lastAlert: 0, count: 0, lastSeverity: 'info' };
    state.lastAlert = Date.now();
    state.count++;
    state.lastSeverity = severity;
    this.alertState.set(key, state);

    // Create alert event
    const event: PnLAlertEvent = {
      type: 'pnl:alert',
      severity,
      message,
      timestamp: Date.now(),
      metadata: {
        currentPnl: value,
        threshold: severity === 'critical' ? threshold.critical : threshold.warn,
        period: key.startsWith('strategy:') ? 'total' : 'daily',
      },
    };

    // Emit via event bus
    this.eventEmitter.emit(event);

    // Log
    logger.warn(`[PnLAlerts] ${severity.toUpperCase()}: ${message}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('[PnLAlerts] Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Get alert state
   */
  getAlertState(): Map<string, AlertState> {
    return new Map(this.alertState);
  }

  /**
   * Reset alert state (for testing)
   */
  reset(): void {
    this.alertState.clear();
  }
}
