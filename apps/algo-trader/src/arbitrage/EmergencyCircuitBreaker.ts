/**
 * EmergencyCircuitBreaker — Safety kill switch for arbitrage engine.
 * Monitors: daily P&L loss, rapid consecutive losses, exchange anomalies.
 * When triggered: blocks all new trades, logs alert, auto-resets after cooldown.
 *
 * States: CLOSED (normal) → OPEN (tripped, blocking) → HALF_OPEN (testing) → CLOSED
 */

import { logger } from '../utils/logger';

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface TripEvent {
  timestamp: number;
  reason: string;
  trigger: 'daily_loss' | 'loss_streak' | 'rapid_loss' | 'manual' | 'exchange_anomaly';
  details: Record<string, number | string>;
}

export interface CircuitBreakerConfig {
  maxDailyLossUsd: number;          // Trip when daily loss exceeds (default: 100)
  maxConsecutiveLosses: number;     // Trip after N consecutive losses (default: 5)
  rapidLossWindowMs: number;        // Window for rapid loss detection (default: 60000 = 1min)
  rapidLossCount: number;           // Trip if N losses in rapid window (default: 3)
  cooldownMs: number;               // Auto-reset after this (default: 300000 = 5min)
  halfOpenMaxTrades: number;        // Trades allowed in half-open before closing (default: 2)
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  maxDailyLossUsd: 100,
  maxConsecutiveLosses: 5,
  rapidLossWindowMs: 60000,
  rapidLossCount: 3,
  cooldownMs: 300000,
  halfOpenMaxTrades: 2,
};

export class EmergencyCircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'closed';
  private dailyLossUsd = 0;
  private consecutiveLosses = 0;
  private recentLosses: number[] = [];   // Timestamps of recent losses
  private tripHistory: TripEvent[] = [];
  private lastTripTime = 0;
  private halfOpenTradeCount = 0;
  private cooldownTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if trading is allowed (circuit is closed or half-open with capacity).
   */
  isAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'half_open') {
      return this.halfOpenTradeCount < this.config.halfOpenMaxTrades;
    }
    return false; // open → blocked
  }

  /**
   * Record a trade result. Returns true if circuit trips.
   */
  recordTrade(profitUsd: number): boolean {
    if (this.state === 'half_open') {
      this.halfOpenTradeCount++;

      if (profitUsd < 0) {
        // Loss in half-open → re-trip
        this.trip('loss_streak', `Loss in half-open state: $${profitUsd.toFixed(2)}`, { profitUsd });
        return true;
      }

      // If we survived halfOpenMaxTrades, close the circuit
      if (this.halfOpenTradeCount >= this.config.halfOpenMaxTrades) {
        this.close();
      }
      return false;
    }

    // Track P&L
    if (profitUsd < 0) {
      this.dailyLossUsd += Math.abs(profitUsd);
      this.consecutiveLosses++;
      this.recentLosses.push(Date.now());

      // Check daily loss limit
      if (this.dailyLossUsd >= this.config.maxDailyLossUsd) {
        this.trip('daily_loss', `Daily loss $${this.dailyLossUsd.toFixed(2)} >= $${this.config.maxDailyLossUsd}`, {
          dailyLoss: this.dailyLossUsd,
          limit: this.config.maxDailyLossUsd,
        });
        return true;
      }

      // Check consecutive losses
      if (this.consecutiveLosses >= this.config.maxConsecutiveLosses) {
        this.trip('loss_streak', `${this.consecutiveLosses} consecutive losses`, {
          count: this.consecutiveLosses,
          limit: this.config.maxConsecutiveLosses,
        });
        return true;
      }

      // Check rapid losses
      const now = Date.now();
      const recentWindow = this.recentLosses.filter(t => now - t <= this.config.rapidLossWindowMs);
      this.recentLosses = recentWindow;
      if (recentWindow.length >= this.config.rapidLossCount) {
        this.trip('rapid_loss', `${recentWindow.length} losses in ${this.config.rapidLossWindowMs}ms`, {
          count: recentWindow.length,
          windowMs: this.config.rapidLossWindowMs,
        });
        return true;
      }
    } else {
      this.consecutiveLosses = 0; // Reset on win
    }

    return false;
  }

  /**
   * Manually trip the circuit breaker.
   */
  manualTrip(reason: string): void {
    this.trip('manual', reason, {});
  }

  /**
   * Record an exchange anomaly (e.g., unexpected disconnect, price spike).
   */
  recordExchangeAnomaly(exchange: string, description: string): boolean {
    this.trip('exchange_anomaly', `${exchange}: ${description}`, { exchange });
    return true;
  }

  /**
   * Get current circuit state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get trip history.
   */
  getTripHistory(): TripEvent[] {
    return [...this.tripHistory];
  }

  /**
   * Get current metrics.
   */
  getMetrics(): {
    state: CircuitState;
    dailyLossUsd: number;
    consecutiveLosses: number;
    totalTrips: number;
    lastTripTime: number;
  } {
    return {
      state: this.state,
      dailyLossUsd: this.dailyLossUsd,
      consecutiveLosses: this.consecutiveLosses,
      totalTrips: this.tripHistory.length,
      lastTripTime: this.lastTripTime,
    };
  }

  /**
   * Reset daily counters (call at start of each trading day).
   */
  resetDaily(): void {
    this.dailyLossUsd = 0;
    this.consecutiveLosses = 0;
    this.recentLosses = [];
    if (this.state === 'open') {
      this.close();
    }
    logger.info('[CircuitBreaker] Daily reset');
  }

  /**
   * Force close the circuit (re-enable trading).
   */
  forceClose(): void {
    this.close();
    logger.info('[CircuitBreaker] Force closed by operator');
  }

  /**
   * Shutdown — clear timers.
   */
  shutdown(): void {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  private trip(trigger: TripEvent['trigger'], reason: string, details: Record<string, number | string>): void {
    this.state = 'open';
    this.lastTripTime = Date.now();

    const event: TripEvent = {
      timestamp: Date.now(),
      reason,
      trigger,
      details,
    };

    this.tripHistory.push(event);
    logger.warn(`[CircuitBreaker] 🔴 TRIPPED: ${reason}`);

    // Schedule auto-reset to half-open
    this.scheduleCooldown();
  }

  private scheduleCooldown(): void {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }

    this.cooldownTimer = setTimeout(() => {
      if (this.state === 'open') {
        this.state = 'half_open';
        this.halfOpenTradeCount = 0;
        logger.info('[CircuitBreaker] 🟡 Half-open: testing with limited trades');
      }
    }, this.config.cooldownMs);
  }

  private close(): void {
    this.state = 'closed';
    this.halfOpenTradeCount = 0;
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    logger.info('[CircuitBreaker] 🟢 Circuit CLOSED — trading resumed');
  }
}
