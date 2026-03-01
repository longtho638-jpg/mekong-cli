/**
 * LiteLLM-inspired Unified Exchange Router with Fallback.
 * One API interface → multiple exchanges with automatic failover,
 * rate limiting, and budget tracking per strategy.
 */

import { logger } from '../utils/logger';

// --- Types ---

export interface ExchangeEndpoint {
  id: string; // e.g. 'binance', 'okx', 'bybit'
  weight: number; // Load balancing weight (0-100)
  healthy: boolean;
  consecutiveFailures: number;
  lastFailure?: number;
  rateLimit: { maxPerMinute: number; currentCount: number; windowStart: number };
}

export interface BudgetConfig {
  /** Max notional volume per strategy per day (USD) */
  maxDailyNotional: number;
  /** Max fee spend per strategy per day (USD) */
  maxDailyFees: number;
}

export interface StrategyBudget {
  strategy: string;
  dailyNotional: number;
  dailyFees: number;
  lastReset: number;
  config: BudgetConfig;
}

export interface RouteResult {
  exchangeId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  latency: number;
  fallbackUsed: boolean;
}

// --- Exchange Router ---

export class ExchangeRouter {
  private endpoints: ExchangeEndpoint[] = [];
  private budgets = new Map<string, StrategyBudget>();
  private maxConsecutiveFailures: number;
  private cooldownMs: number;

  constructor(options?: {
    defaultBudget?: BudgetConfig;
    maxConsecutiveFailures?: number;
    cooldownMs?: number;
  }) {
    this.maxConsecutiveFailures = options?.maxConsecutiveFailures ?? 3;
    this.cooldownMs = options?.cooldownMs ?? 60000; // 1 minute cooldown
  }

  /** Register an exchange endpoint */
  addEndpoint(id: string, weight = 50, maxRpm = 60): void {
    this.endpoints.push({
      id,
      weight,
      healthy: true,
      consecutiveFailures: 0,
      rateLimit: { maxPerMinute: maxRpm, currentCount: 0, windowStart: Date.now() },
    });
  }

  /** Set budget for a strategy */
  setBudget(strategy: string, config: BudgetConfig): void {
    this.budgets.set(strategy, {
      strategy,
      dailyNotional: 0,
      dailyFees: 0,
      lastReset: Date.now(),
      config,
    });
  }

  /** Route a request with automatic failover */
  async route<T>(
    strategy: string,
    operation: (exchangeId: string) => Promise<T>,
    notionalValue = 0,
    feeEstimate = 0
  ): Promise<RouteResult> {
    // Budget check
    if (!this.checkBudget(strategy, notionalValue, feeEstimate)) {
      return {
        exchangeId: '',
        success: false,
        error: `Budget exceeded for strategy: ${strategy}`,
        latency: 0,
        fallbackUsed: false,
      };
    }

    // Get available endpoints sorted by weight
    const available = this.getAvailableEndpoints();
    if (available.length === 0) {
      return {
        exchangeId: '',
        success: false,
        error: 'No healthy exchanges available',
        latency: 0,
        fallbackUsed: false,
      };
    }

    let fallbackUsed = false;

    for (let i = 0; i < available.length; i++) {
      const endpoint = available[i];
      if (i > 0) fallbackUsed = true;

      // Rate limit check
      if (!this.checkRateLimit(endpoint)) {
        logger.warn(`[Router] Rate limited: ${endpoint.id}`);
        continue;
      }

      const startTime = Date.now();
      try {
        this.incrementRateLimit(endpoint);
        const data = await operation(endpoint.id);
        const latency = Date.now() - startTime;

        // Success — reset failure counter
        endpoint.consecutiveFailures = 0;
        endpoint.healthy = true;

        // Track budget
        this.trackSpend(strategy, notionalValue, feeEstimate);

        return { exchangeId: endpoint.id, success: true, data, latency, fallbackUsed };
      } catch (err) {
        const latency = Date.now() - startTime;
        endpoint.consecutiveFailures++;
        endpoint.lastFailure = Date.now();

        if (endpoint.consecutiveFailures >= this.maxConsecutiveFailures) {
          endpoint.healthy = false;
          logger.warn(`[Router] Exchange marked unhealthy: ${endpoint.id} (${endpoint.consecutiveFailures} failures)`);
        }

        logger.warn(`[Router] Failed on ${endpoint.id} (${latency}ms): ${err instanceof Error ? err.message : String(err)}`);

        // Try next endpoint (fallback)
        if (i === available.length - 1) {
          return {
            exchangeId: endpoint.id,
            success: false,
            error: err instanceof Error ? err.message : String(err),
            latency,
            fallbackUsed,
          };
        }
      }
    }

    return { exchangeId: '', success: false, error: 'All exchanges failed', latency: 0, fallbackUsed: true };
  }

  /** Get health status of all endpoints */
  getHealth(): { id: string; healthy: boolean; failures: number }[] {
    return this.endpoints.map(e => ({
      id: e.id,
      healthy: e.healthy,
      failures: e.consecutiveFailures,
    }));
  }

  /** Get budget status for a strategy */
  getBudgetStatus(strategy: string): StrategyBudget | undefined {
    return this.budgets.get(strategy);
  }

  /** Manually mark an exchange as healthy */
  markHealthy(exchangeId: string): void {
    const ep = this.endpoints.find(e => e.id === exchangeId);
    if (ep) {
      ep.healthy = true;
      ep.consecutiveFailures = 0;
    }
  }

  /** Get endpoint count */
  get size(): number {
    return this.endpoints.length;
  }

  private getAvailableEndpoints(): ExchangeEndpoint[] {
    const now = Date.now();
    return this.endpoints
      .filter(e => {
        if (e.healthy) return true;
        // Auto-recover after cooldown
        if (e.lastFailure && (now - e.lastFailure) > this.cooldownMs) {
          e.healthy = true;
          e.consecutiveFailures = 0;
          return true;
        }
        return false;
      })
      .sort((a, b) => b.weight - a.weight);
  }

  private checkRateLimit(endpoint: ExchangeEndpoint): boolean {
    const now = Date.now();
    if (now - endpoint.rateLimit.windowStart > 60000) {
      endpoint.rateLimit.currentCount = 0;
      endpoint.rateLimit.windowStart = now;
    }
    return endpoint.rateLimit.currentCount < endpoint.rateLimit.maxPerMinute;
  }

  private incrementRateLimit(endpoint: ExchangeEndpoint): void {
    endpoint.rateLimit.currentCount++;
  }

  private checkBudget(strategy: string, notional: number, fee: number): boolean {
    const budget = this.budgets.get(strategy);
    if (!budget) return true; // No budget = no limit

    // Reset daily budget if needed
    const now = Date.now();
    if (now - budget.lastReset > 86400000) { // 24h
      budget.dailyNotional = 0;
      budget.dailyFees = 0;
      budget.lastReset = now;
    }

    if (budget.dailyNotional + notional > budget.config.maxDailyNotional) return false;
    if (budget.dailyFees + fee > budget.config.maxDailyFees) return false;
    return true;
  }

  private trackSpend(strategy: string, notional: number, fee: number): void {
    const budget = this.budgets.get(strategy);
    if (!budget) return;
    budget.dailyNotional += notional;
    budget.dailyFees += fee;
  }
}
