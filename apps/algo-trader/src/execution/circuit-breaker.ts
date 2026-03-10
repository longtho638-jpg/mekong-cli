/**
 * Circuit Breaker — Auto-halt on abnormal conditions
 */

import { LicenseService, LicenseTier } from '../lib/raas-gate';

export interface CircuitBreakerConfig {
  maxDrawdownPercent?: number;
  maxErrorRate?: number;
  maxLossesInRow?: number;
  cooldownMs?: number;
  maxLatencyMs?: number;        // Edge case 4: Latency threshold
  staleDataThresholdMs?: number; // Edge case 1: Stale price data
  apiVersion?: string;           // Edge case 2: API versioning
}

export interface CircuitBreakerState {
  isHalted: boolean;
  haltedAt?: number;
  reason?: string;
  consecutiveLosses: number;
  totalTrades: number;
  totalLosses: number;
  errorCount: number;
  latencyViolations: number;     // Edge case 4: Latency tracking
  staleDataCount: number;        // Edge case 1: Stale data tracking
  lastDataTimestamp?: number;    // Edge case 1: Last data timestamp
}

export type CircuitBreakerStateLegacy = 'OPEN' | 'CLOSED' | 'HALF_OPEN';

export class CircuitBreaker {
  protected state: CircuitBreakerState = {
    isHalted: false,
    consecutiveLosses: 0,
    totalTrades: 0,
    totalLosses: 0,
    errorCount: 0,
    latencyViolations: 0,
    staleDataCount: 0,
  };
  protected config: Required<CircuitBreakerConfig>;
  private globalCircuitBreaker?: GlobalCircuitBreaker; // Edge case 3

  constructor(config?: CircuitBreakerConfig) {
    this.config = {
      maxDrawdownPercent: config?.maxDrawdownPercent ?? 5,
      maxErrorRate: config?.maxErrorRate ?? 0.1,
      maxLossesInRow: config?.maxLossesInRow ?? 3,
      cooldownMs: config?.cooldownMs ?? 300000,
      maxLatencyMs: config?.maxLatencyMs ?? 5000,
      staleDataThresholdMs: config?.staleDataThresholdMs ?? 60000,
      apiVersion: config?.apiVersion ?? 'v1',
    };
  }

  // Edge case 3: Global circuit breaker setter
  setGlobalCircuitBreaker(gcb: GlobalCircuitBreaker): void {
    this.globalCircuitBreaker = gcb;
  }

  recordTrade(pnl: number): void {
    if (this.state.isHalted) return;
    this.state.totalTrades += 1;
    if (pnl < 0) {
      this.state.totalLosses += 1;
      this.state.consecutiveLosses += 1;
      if (this.state.consecutiveLosses >= this.config.maxLossesInRow) {
        this.halt('Max consecutive losses reached');
      }
    } else {
      this.state.consecutiveLosses = 0;
    }
    const lossRate = this.state.totalLosses / this.state.totalTrades;
    if (lossRate > this.config.maxErrorRate && this.state.totalTrades >= 10) {
      this.halt('Max loss rate exceeded');
    }
  }

  recordError(error: string): void {
    this.state.errorCount += 1;
    if (this.state.errorCount >= 5) {
      this.halt('Max error count reached');
    }
  }

  protected halt(reason: string): void {
    this.state.isHalted = true;
    this.state.haltedAt = Date.now();
    this.state.reason = reason;
  }

  canTrade(): boolean {
    if (!this.state.isHalted) return true;
    if (!this.state.haltedAt) return false;
    const elapsed = Date.now() - this.state.haltedAt;
    if (elapsed >= this.config.cooldownMs) {
      this.reset();
    }
    return !this.state.isHalted;
  }

  // Edge case 1: Stale price data detection
  recordDataTimestamp(timestamp: number): void {
    const age = Date.now() - timestamp;
    this.state.lastDataTimestamp = timestamp;
    if (age > this.config.staleDataThresholdMs) {
      this.state.staleDataCount += 1;
      if (this.state.staleDataCount >= 3) {
        this.halt('Stale price data detected (3 consecutive)');
      }
    } else {
      this.state.staleDataCount = 0;
    }
  }

  // Edge case 4: Latency monitoring
  recordLatency(latencyMs: number): void {
    if (latencyMs > this.config.maxLatencyMs) {
      this.state.latencyViolations += 1;
      if (this.state.latencyViolations >= 5) {
        this.halt('High latency threshold exceeded (5 violations)');
      }
    } else {
      this.state.latencyViolations = 0;
    }
  }

  // Edge case 2: API version check
  checkApiVersion(currentVersion: string): boolean {
    const required = this.config.apiVersion;
    if (!currentVersion.startsWith(required)) {
      this.recordError(`API version mismatch: expected ${required}, got ${currentVersion}`);
      return false;
    }
    return true;
  }

  // Check global circuit breaker (Edge case 3)
  checkGlobalCircuit(): boolean {
    if (this.globalCircuitBreaker && !this.globalCircuitBreaker.canTrade()) {
      return false;
    }
    return true;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      isHalted: false,
      consecutiveLosses: 0,
      totalTrades: 0,
      totalLosses: 0,
      errorCount: 0,
      latencyViolations: 0,
      staleDataCount: 0,
    };
  }
}

export class CircuitBreakerLegacy extends CircuitBreaker {
  private licenseService = LicenseService.getInstance();

  execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canTrade()) throw new Error('Circuit breaker is open');
    return fn();
  }

  getMetrics(): {
    state: CircuitBreakerStateLegacy;
    consecutiveLosses: number;
    totalTrades: number;
    failureCount: number;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
  } {
    const s = this.getState();
    return {
      state: s.isHalted ? 'OPEN' : 'CLOSED',
      consecutiveLosses: s.consecutiveLosses,
      totalTrades: s.totalTrades,
      failureCount: s.errorCount,
      totalRequests: s.totalTrades,
      totalFailures: s.totalLosses,
      totalSuccesses: s.totalTrades - s.totalLosses,
    };
  }
}

/**
 * Edge case 3: Global Circuit Breaker for cascading failures
 * Monitors multiple exchanges and triggers system-wide halt if too many fail
 */
export class GlobalCircuitBreaker {
  private exchangeBreakers: Map<string, CircuitBreaker> = new Map();
  private state: { isHalted: boolean; haltedAt?: number; reason?: string } = {
    isHalted: false,
  };
  private config: { failureThreshold: number; cooldownMs: number };

  constructor(failureThreshold = 2, cooldownMs = 300000) {
    this.config = { failureThreshold, cooldownMs };
  }

  registerExchange(name: string, breaker: CircuitBreaker): void {
    this.exchangeBreakers.set(name, breaker);
    breaker.setGlobalCircuitBreaker(this);
  }

  canTrade(): boolean {
    if (!this.state.isHalted) {
      // Check if too many exchanges are halted
      let haltedCount = 0;
      for (const [name, breaker] of this.exchangeBreakers) {
        if (!breaker.canTrade()) {
          haltedCount++;
        }
      }
      if (haltedCount >= this.config.failureThreshold) {
        this.halt(`Cascading failure: ${haltedCount} exchanges halted`);
        return false;
      }
      return true;
    }
    // Check cooldown
    if (this.state.haltedAt && Date.now() - this.state.haltedAt >= this.config.cooldownMs) {
      this.state.isHalted = false;
      return true;
    }
    return false;
  }

  private halt(reason: string): void {
    this.state.isHalted = true;
    this.state.haltedAt = Date.now();
    this.state.reason = reason;
  }

  getState(): { isHalted: boolean; haltedAt?: number; reason?: string; haltedExchanges: string[] } {
    const haltedExchanges: string[] = [];
    for (const [name, breaker] of this.exchangeBreakers) {
      if (!breaker.canTrade()) {
        haltedExchanges.push(name);
      }
    }
    return {
      ...this.state,
      haltedExchanges,
    };
  }
}
