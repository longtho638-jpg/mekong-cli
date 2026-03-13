/**
 * Circuit Breaker — Automatic trading halt on drawdown limits.
 *
 * States:
 * - CLOSED: Normal trading, no restrictions
 * - WARNING: Drawdown approaching limit, alert emitted
 * - TRIPPED: Trading halted, manual reset required
 *
 * Configurable thresholds:
 * - hardLimit: Stop trading at -15% daily drawdown (default)
 * - softLimit: Alert at -10% drawdown (default)
 * - recoveryPct: Require +5% recovery before resuming (default)
 */

import { EventEmitter } from 'events';
import { CircuitBreakerState, CircuitTripEvent, CircuitResetEvent } from './types';
import { RiskEventEmitter } from '../core/risk-events';
import { logger } from '../utils/logger';

export type CircuitState = 'CLOSED' | 'WARNING' | 'TRIPPED';

export interface CircuitBreakerConfig {
  /** Circuit breaker identifier */
  breakerId: string;
  /** Hard stop limit (e.g., 0.15 = -15%) */
  hardLimit: number;
  /** Soft warning limit (e.g., 0.10 = -10%) */
  softLimit: number;
  /** Recovery percentage required before reset (e.g., 0.05 = +5%) */
  recoveryPct: number;
}

export interface CircuitBreakerMetrics {
  currentState: CircuitState;
  currentDrawdown: number;
  peakValue: number;
  tripCount: number;
  lastTripTime?: number;
  lastResetTime?: number;
  recoveryProgress: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  breakerId: 'main',
  hardLimit: 0.15,      // -15% hard stop
  softLimit: 0.10,      // -10% warning
  recoveryPct: 0.05,    // +5% recovery required
};

export class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private peakValue = 1000;  // Start at baseline
  private currentValue = 1000;
  private tripCount = 0;
  private lastTripTime?: number;
  private lastResetTime?: number;
  private recoveryStartValue?: number;

  private riskEmitter: RiskEventEmitter;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.riskEmitter = RiskEventEmitter.getInstance();
  }

  /**
   * Update current portfolio value and check circuit state
   */
  updateValue(currentValue: number): void {
    this.currentValue = currentValue;

    // Update peak if we have a new high
    if (currentValue > this.peakValue) {
      this.peakValue = currentValue;
    }

    const drawdown = this.calculateDrawdown();
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
   * Check if drawdown breaches thresholds
   */
  private checkThresholds(drawdown: number): void {
    // Already tripped - check recovery
    if (this.state === 'TRIPPED') {
      this.checkRecovery(drawdown);
      return;
    }

    // Hard limit - TRIP
    if (drawdown >= this.config.hardLimit) {
      this.trip('drawdown_limit', drawdown);
      return;
    }

    // Soft limit - WARNING
    if (drawdown >= this.config.softLimit && this.state !== 'WARNING') {
      this.state = 'WARNING';
      this.emitWarning(drawdown);
    }

    // Back to normal
    if (drawdown < this.config.softLimit && this.state === 'WARNING') {
      this.state = 'CLOSED';
    }
  }

  /**
   * Trip the circuit breaker - halt trading
   */
  private trip(reason: string, triggerValue: number): void {
    this.state = 'TRIPPED';
    this.tripCount++;
    this.lastTripTime = Date.now();
    this.recoveryStartValue = this.currentValue;

    logger.warn(
      `[CircuitBreaker] TRIPPED: ${reason} (drawdown: ${(triggerValue * 100).toFixed(2)}%)`
    );

    const event: CircuitTripEvent = {
      type: 'circuit:trip',
      severity: 'critical',
      message: `Circuit breaker tripped: ${reason}`,
      timestamp: Date.now(),
      metadata: {
        breakerId: this.config.breakerId,
        triggerValue,
        threshold: this.config.hardLimit,
      },
    };

    this.emit('trip', { reason, triggerValue });
    this.riskEmitter.emit(event).catch(err => {
      logger.error('[CircuitBreaker] Failed to emit trip event:', err);
    });
  }

  /**
   * Check if recovery threshold is met
   */
  private checkRecovery(currentDrawdown: number): void {
    if (!this.recoveryStartValue) return;

    const recoveryNeeded = this.recoveryStartValue * (1 + this.config.recoveryPct);
    const recoveryProgress = (this.currentValue - this.recoveryStartValue) / this.recoveryStartValue;

    if (this.currentValue >= recoveryNeeded) {
      this.reset();
    } else {
      this.emit('recovery-progress', {
        current: this.currentValue,
        target: recoveryNeeded,
        progress: recoveryProgress,
      });
    }
  }

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset(): void {
    if (this.state !== 'TRIPPED') {
      logger.warn('[CircuitBreaker] Reset called but breaker not tripped');
      return;
    }

    const downtimeMs = Date.now() - (this.lastTripTime || Date.now());

    this.state = 'CLOSED';
    this.lastResetTime = Date.now();
    this.recoveryStartValue = undefined;

    logger.info('[CircuitBreaker] RESET - Trading resumed');

    const event: CircuitResetEvent = {
      type: 'circuit:reset',
      severity: 'warning',
      message: 'Circuit breaker reset - trading resumed',
      timestamp: Date.now(),
      metadata: {
        breakerId: this.config.breakerId,
        downtimeMs,
      },
    };

    this.emit('reset', { downtimeMs });
    this.riskEmitter.emit(event).catch(err => {
      logger.error('[CircuitBreaker] Failed to emit reset event:', err);
    });
  }

  /**
   * Emit warning event
   */
  private emitWarning(drawdown: number): void {
    logger.warn(
      `[CircuitBreaker] WARNING: Drawdown ${(drawdown * 100).toFixed(2)}% approaching limit`
    );

    this.emit('warning', { drawdown, threshold: this.config.softLimit });
  }

  /**
   * Check if trading is allowed
   */
  canTrade(): boolean {
    return this.state !== 'TRIPPED';
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const recoveryNeeded = this.recoveryStartValue
      ? this.recoveryStartValue * (1 + this.config.recoveryPct)
      : this.peakValue;

    const recoveryProgress = this.recoveryStartValue
      ? (this.currentValue - this.recoveryStartValue) / this.recoveryStartValue
      : 0;

    return {
      currentState: this.state,
      currentDrawdown: this.calculateDrawdown(),
      peakValue: this.peakValue,
      tripCount: this.tripCount,
      lastTripTime: this.lastTripTime,
      lastResetTime: this.lastResetTime,
      recoveryProgress,
    };
  }

  /**
   * Manual trip override
   */
  manualTrip(reason: string): void {
    this.trip(`manual_${reason}`, this.calculateDrawdown());
  }

  /**
   * Manual reset override
   */
  manualReset(): void {
    this.reset();
  }
}
