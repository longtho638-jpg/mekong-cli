/**
 * Adaptive Circuit Breaker v2 — Per-exchange, per-pair circuit breaker
 * with adaptive thresholds based on recent error rates and latency.
 *
 * States: CLOSED (normal) → OPEN (tripped) → HALF_OPEN (probing)
 * Adapts thresholds: if errors spike, breaker trips faster next time.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export type BreakerState = 'closed' | 'open' | 'half_open';

export interface BreakerConfig {
  /** Errors in window to trip. Default 5. */
  failureThreshold: number;
  /** Window for counting failures (ms). Default 60s. */
  failureWindowMs: number;
  /** Time to wait before probing (ms). Default 30s. */
  recoveryTimeoutMs: number;
  /** Successes in half_open to close. Default 2. */
  successThreshold: number;
  /** Max latency (ms) before counting as slow failure. Default 5000. */
  latencyThresholdMs: number;
  /** Adaptive: multiply recovery timeout after repeated trips. Default 1.5. */
  backoffMultiplier: number;
  /** Max recovery timeout (ms). Default 5min. */
  maxRecoveryTimeoutMs: number;
}

export interface BreakerStatus {
  key: string;
  state: BreakerState;
  failures: number;
  successes: number;
  tripCount: number;
  lastTrippedAt?: number;
  currentRecoveryMs: number;
}

interface BreakerInstance {
  state: BreakerState;
  failures: number[];         // timestamps of recent failures
  halfOpenSuccesses: number;
  tripCount: number;
  lastTrippedAt?: number;
  recoveryTimer?: ReturnType<typeof setTimeout>;
  currentRecoveryMs: number;
}

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 5,
  failureWindowMs: 60_000,
  recoveryTimeoutMs: 30_000,
  successThreshold: 2,
  latencyThresholdMs: 5_000,
  backoffMultiplier: 1.5,
  maxRecoveryTimeoutMs: 300_000,
};

export class AdaptiveCircuitBreaker extends EventEmitter {
  private breakers = new Map<string, BreakerInstance>();
  private config: BreakerConfig;

  constructor(config?: Partial<BreakerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Build key from exchange + pair. E.g. "binance:BTC/USDT" */
  static key(exchange: string, pair?: string): string {
    return pair ? `${exchange}:${pair}` : exchange;
  }

  /** Check if requests are allowed for this key */
  isAllowed(key: string): boolean {
    const b = this.breakers.get(key);
    if (!b) return true; // no breaker = no failures = allowed
    return b.state !== 'open';
  }

  /** Record a successful operation */
  recordSuccess(key: string): void {
    const b = this.getOrCreate(key);
    if (b.state === 'half_open') {
      b.halfOpenSuccesses++;
      if (b.halfOpenSuccesses >= this.config.successThreshold) {
        this.transition(key, b, 'closed');
      }
    }
    // In closed state, successes are a no-op (failures tracked by window)
  }

  /** Record a failed operation */
  recordFailure(key: string): void {
    const b = this.getOrCreate(key);

    if (b.state === 'half_open') {
      // Any failure in half_open → trip again
      this.trip(key, b);
      return;
    }

    if (b.state === 'open') return; // already tripped

    // Closed: add failure, prune window, check threshold
    const now = Date.now();
    b.failures.push(now);
    b.failures = b.failures.filter(t => (now - t) < this.config.failureWindowMs);

    if (b.failures.length >= this.config.failureThreshold) {
      this.trip(key, b);
    }
  }

  /** Record latency — if above threshold, counts as failure */
  recordLatency(key: string, latencyMs: number): void {
    if (latencyMs > this.config.latencyThresholdMs) {
      this.recordFailure(key);
    } else {
      this.recordSuccess(key);
    }
  }

  /** Get status for a specific breaker */
  getStatus(key: string): BreakerStatus {
    const b = this.breakers.get(key);
    if (!b) {
      return { key, state: 'closed', failures: 0, successes: 0, tripCount: 0, currentRecoveryMs: this.config.recoveryTimeoutMs };
    }
    const now = Date.now();
    const recentFailures = b.failures.filter(t => (now - t) < this.config.failureWindowMs);
    return {
      key,
      state: b.state,
      failures: recentFailures.length,
      successes: b.halfOpenSuccesses,
      tripCount: b.tripCount,
      lastTrippedAt: b.lastTrippedAt,
      currentRecoveryMs: b.currentRecoveryMs,
    };
  }

  /** Get status of all breakers */
  getAllStatus(): BreakerStatus[] {
    return Array.from(this.breakers.keys()).map(k => this.getStatus(k));
  }

  /** Get all currently tripped breakers */
  getTripped(): string[] {
    return Array.from(this.breakers.entries())
      .filter(([, b]) => b.state === 'open')
      .map(([k]) => k);
  }

  /** Manually reset a breaker to closed */
  reset(key: string): void {
    const b = this.breakers.get(key);
    if (b) {
      if (b.recoveryTimer) clearTimeout(b.recoveryTimer);
      this.transition(key, b, 'closed');
      b.tripCount = 0;
      b.currentRecoveryMs = this.config.recoveryTimeoutMs;
    }
  }

  /** Clean up all timers */
  destroy(): void {
    for (const [, b] of this.breakers) {
      if (b.recoveryTimer) clearTimeout(b.recoveryTimer);
    }
    this.breakers.clear();
    this.removeAllListeners();
  }

  private getOrCreate(key: string): BreakerInstance {
    let b = this.breakers.get(key);
    if (!b) {
      b = {
        state: 'closed',
        failures: [],
        halfOpenSuccesses: 0,
        tripCount: 0,
        currentRecoveryMs: this.config.recoveryTimeoutMs,
      };
      this.breakers.set(key, b);
    }
    return b;
  }

  private trip(key: string, b: BreakerInstance): void {
    b.tripCount++;
    b.lastTrippedAt = Date.now();

    // Adaptive: increase recovery time with each consecutive trip
    if (b.tripCount > 1) {
      b.currentRecoveryMs = Math.min(
        b.currentRecoveryMs * this.config.backoffMultiplier,
        this.config.maxRecoveryTimeoutMs,
      );
    }

    this.transition(key, b, 'open');

    // Schedule transition to half_open
    b.recoveryTimer = setTimeout(() => {
      if (b.state === 'open') {
        this.transition(key, b, 'half_open');
      }
    }, b.currentRecoveryMs);
    b.recoveryTimer.unref();

    logger.warn(`[CircuitBreaker] TRIPPED: ${key} (trip #${b.tripCount}, recovery ${b.currentRecoveryMs}ms)`);
  }

  private transition(key: string, b: BreakerInstance, newState: BreakerState): void {
    const oldState = b.state;
    if (oldState === newState) return;

    b.state = newState;
    if (newState === 'closed') {
      b.failures = [];
      b.halfOpenSuccesses = 0;
    }
    if (newState === 'half_open') {
      b.halfOpenSuccesses = 0;
    }

    this.emit('state:change', { key, oldState, newState, tripCount: b.tripCount });
    logger.info(`[CircuitBreaker] ${key}: ${oldState} → ${newState}`);
  }
}
