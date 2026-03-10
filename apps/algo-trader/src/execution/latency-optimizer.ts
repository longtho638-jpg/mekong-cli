/**
 * Latency Optimizer — Monitor and optimize execution latency
 *
 * Features:
 * - Per-exchange latency tracking
 * - Historical latency analysis
 * - Optimal routing decisions
 * - Connection health monitoring
 * - Failover triggers
 *
 * PRO FEATURE: Advanced latency analytics require PRO license
 */

import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

export interface LatencyStats {
  exchange: string;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  sampleCount: number;
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
}

export interface LatencySample {
  exchange: string;
  latencyMs: number;
  timestamp: number;
  operation: 'ping' | 'order' | 'cancel' | 'fetch';
}

interface ExchangeHealth {
  consecutiveErrors: number;
  lastSuccess: number;
  latencyHistory: number[];
}

const HEALTH_THRESHOLDS = {
  DEGRADED_LATENCY_MS: 500, // p95 > 500ms = degraded
  UNHEALTHY_LATENCY_MS: 1000, // p95 > 1000ms = unhealthy
  MAX_CONSECUTIVE_ERRORS: 5,
  HEALTHY_WINDOW_MS: 60000, // 1 minute
};

export class LatencyOptimizer {
  private licenseService: LicenseService;
  private samples: Map<string, LatencySample[]>; // exchange -> samples
  private health: Map<string, ExchangeHealth>;
  private maxSamplesPerExchange: number;

  constructor(maxSamplesPerExchange = 1000) {
    this.licenseService = LicenseService.getInstance();
    this.samples = new Map();
    this.health = new Map();
    this.maxSamplesPerExchange = maxSamplesPerExchange;
  }

  /**
   * Record a latency sample
   */
  recordLatency(exchange: string, latencyMs: number, operation: 'ping' | 'order' | 'cancel' | 'fetch' = 'ping'): void {
    const exchangeSamples = this.samples.get(exchange) || [];

    exchangeSamples.push({
      exchange,
      latencyMs,
      timestamp: Date.now(),
      operation,
    });

    // Keep only recent samples
    if (exchangeSamples.length > this.maxSamplesPerExchange) {
      exchangeSamples.shift();
    }

    this.samples.set(exchange, exchangeSamples);

    // Update health
    this.updateHealth(exchange, latencyMs, true);
  }

  /**
   * Record a failed operation
   */
  recordError(exchange: string): void {
    this.updateHealth(exchange, 0, false);
  }

  /**
   * Get latency stats for an exchange
   * PRO FEATURE: Detailed percentiles require PRO license
   */
  getStats(exchange: string): LatencyStats | null {
    const exchangeSamples = this.samples.get(exchange);
    if (!exchangeSamples || exchangeSamples.length === 0) {
      return null;
    }

    const latencies = exchangeSamples.map(s => s.latencyMs).sort((a, b) => a - b);
    const count = latencies.length;

    // Check for PRO license before computing detailed stats
    const isPro = this.licenseService.hasTier(LicenseTier.PRO);

    const avg = latencies.reduce((a, b) => a + b, 0) / count;
    const min = latencies[0];
    const max = latencies[count - 1];

    // Percentiles (PRO feature)
    let p50 = avg;
    let p95 = max;
    let p99 = max;

    if (isPro) {
      p50 = latencies[Math.floor(count * 0.5)];
      p95 = latencies[Math.floor(count * 0.95)];
      p99 = latencies[Math.floor(count * 0.99)];
    }

    // Determine health
    let health: LatencyStats['health'] = 'HEALTHY';
    if (p95 >= HEALTH_THRESHOLDS.UNHEALTHY_LATENCY_MS) {
      health = 'UNHEALTHY';
    } else if (p95 >= HEALTH_THRESHOLDS.DEGRADED_LATENCY_MS) {
      health = 'DEGRADED';
    }

    return {
      exchange,
      avgLatencyMs: avg,
      minLatencyMs: min,
      maxLatencyMs: max,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      sampleCount: count,
      health,
    };
  }

  /**
   * Get all exchange stats
   */
  getAllStats(): Map<string, LatencyStats> {
    const stats = new Map<string, LatencyStats>();

    for (const exchange of this.samples.keys()) {
      const stat = this.getStats(exchange);
      if (stat) {
        stats.set(exchange, stat);
      }
    }

    return stats;
  }

  /**
   * Get best exchange by latency
   */
  getBestExchange(exchanges: string[]): string | null {
    let best: string | null = null;
    let bestLatency = Infinity;

    for (const exchange of exchanges) {
      const stats = this.getStats(exchange);
      if (!stats || stats.health === 'UNHEALTHY') continue;

      if (stats.avgLatencyMs < bestLatency) {
        bestLatency = stats.avgLatencyMs;
        best = exchange;
      }
    }

    return best;
  }

  /**
   * Check if exchange is healthy
   */
  isHealthy(exchange: string): boolean {
    const exchangeHealth = this.health.get(exchange);
    if (!exchangeHealth) return true;

    // Check consecutive errors
    if (exchangeHealth.consecutiveErrors >= HEALTH_THRESHOLDS.MAX_CONSECUTIVE_ERRORS) {
      return false;
    }

    // Check recent latency
    const stats = this.getStats(exchange);
    if (!stats || stats.health === 'UNHEALTHY') {
      return false;
    }

    return true;
  }

  /**
   * Get healthy exchanges
   */
  getHealthyExchanges(): string[] {
    const healthy: string[] = [];

    for (const exchange of this.samples.keys()) {
      if (this.isHealthy(exchange)) {
        healthy.push(exchange);
      }
    }

    return healthy;
  }

  /**
   * Should failover to backup exchange?
   */
  shouldFailover(currentExchange: string): boolean {
    const isHealthy = this.isHealthy(currentExchange);

    if (!isHealthy) {
      logger.warn('[LatencyOptimizer] Should failover from unhealthy exchange', {
        exchange: currentExchange,
      });
      return true;
    }

    return false;
  }

  /**
   * Get backup exchange
   */
  getBackupExchange(currentExchange: string): string | null {
    const healthy = this.getHealthyExchanges();
    const backup = healthy.find(e => e !== currentExchange);
    return backup ?? null;
  }

  /**
   * Update exchange health
   */
  private updateHealth(exchange: string, latencyMs: number, success: boolean): void {
    let exchangeHealth = this.health.get(exchange);

    if (!exchangeHealth) {
      exchangeHealth = {
        consecutiveErrors: 0,
        lastSuccess: Date.now(),
        latencyHistory: [],
      };
    }

    if (success) {
      exchangeHealth.consecutiveErrors = 0;
      exchangeHealth.lastSuccess = Date.now();
      exchangeHealth.latencyHistory.push(latencyMs);

      // Keep only recent history
      if (exchangeHealth.latencyHistory.length > 100) {
        exchangeHealth.latencyHistory.shift();
      }
    } else {
      exchangeHealth.consecutiveErrors++;
    }

    this.health.set(exchange, exchangeHealth);

    // Log health changes
    if (exchangeHealth.consecutiveErrors >= HEALTH_THRESHOLDS.MAX_CONSECUTIVE_ERRORS) {
      logger.error('[LatencyOptimizer] Exchange marked unhealthy', {
        exchange,
        consecutiveErrors: exchangeHealth.consecutiveErrors,
      });
    }
  }

  /**
   * Get latency history for analysis
   */
  getHistory(exchange: string, limit = 100): LatencySample[] {
    const exchangeSamples = this.samples.get(exchange) || [];
    return exchangeSamples.slice(-limit);
  }

  /**
   * Clear all data (for testing)
   */
  reset(): void {
    this.samples.clear();
    this.health.clear();
  }

  /**
   * Get health summary
   */
  getHealthSummary(): Map<string, { healthy: boolean; errors: number; lastSuccess: number }> {
    const summary = new Map<string, { healthy: boolean; errors: number; lastSuccess: number }>();

    for (const [exchange, h] of this.health) {
      summary.set(exchange, {
        healthy: h.consecutiveErrors < HEALTH_THRESHOLDS.MAX_CONSECUTIVE_ERRORS,
        errors: h.consecutiveErrors,
        lastSuccess: h.lastSuccess,
      });
    }

    return summary;
  }
}

// Singleton instance
let instance: LatencyOptimizer | null = null;

export function getLatencyOptimizer(): LatencyOptimizer {
  if (!instance) {
    instance = new LatencyOptimizer();
  }
  return instance;
}
