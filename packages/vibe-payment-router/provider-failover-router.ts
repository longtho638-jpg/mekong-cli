/**
 * @agencyos/vibe-payment-router — Provider Failover Router
 *
 * Routes payment operations through multiple providers with automatic failover.
 * Extracted from backend/core/config/payment_config.py pattern.
 *
 * Usage:
 *   const router = createProviderRouter({
 *     providers: [
 *       { name: 'stripe', priority: 1, adapter: stripeAdapter },
 *       { name: 'polar', priority: 2, adapter: polarAdapter },
 *     ],
 *     maxRetries: 2,
 *   });
 *   const result = await router.createPayment(request);
 */

// ─── Types ──────────────────────────────────────────────────────

export type ProviderName = 'stripe' | 'polar' | 'payos' | 'vnpay' | 'momo' | string;
export type ProviderStatus = 'healthy' | 'degraded' | 'down';

export interface ProviderEntry {
  name: ProviderName;
  priority: number;
  /** Provider adapter — must have createPayment + isConfigured methods */
  adapter: {
    isConfigured(): boolean;
    createPayment(request: unknown): Promise<unknown>;
    [key: string]: unknown;
  };
  /** Override: force-disable this provider */
  enabled?: boolean;
}

export interface ProviderRouterConfig {
  providers: ProviderEntry[];
  maxRetries?: number;
  timeoutMs?: number;
  /** Callback when provider fails and router falls back */
  onFailover?: (failedProvider: string, nextProvider: string, error: Error) => void;
  /** Callback on successful routing */
  onSuccess?: (provider: string, durationMs: number) => void;
}

export interface RoutingResult<T = unknown> {
  success: boolean;
  provider: string;
  data?: T;
  error?: string;
  attempts: { provider: string; error?: string; durationMs: number }[];
}

// ─── Provider Health Tracker ────────────────────────────────────

interface ProviderHealth {
  status: ProviderStatus;
  lastError?: string;
  failCount: number;
  lastFailAt?: number;
  lastSuccessAt?: number;
}

// ─── Router Factory ─────────────────────────────────────────────

export function createProviderRouter(config: ProviderRouterConfig) {
  const { providers, maxRetries = 2, timeoutMs = 30_000, onFailover, onSuccess } = config;
  const healthMap = new Map<string, ProviderHealth>();

  // Initialize health tracking
  for (const p of providers) {
    healthMap.set(p.name, { status: 'healthy', failCount: 0 });
  }

  /** Get providers sorted by priority, filtered by availability */
  function getAvailableProviders(): ProviderEntry[] {
    return providers
      .filter(p => {
        if (p.enabled === false) return false;
        if (!p.adapter.isConfigured()) return false;
        const health = healthMap.get(p.name);
        return health?.status !== 'down';
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /** Record provider failure */
  function recordFailure(name: string, error: string) {
    const health = healthMap.get(name);
    if (!health) return;
    health.failCount++;
    health.lastError = error;
    health.lastFailAt = Date.now();
    // Mark as down after 3 consecutive failures
    if (health.failCount >= 3) health.status = 'down';
    else if (health.failCount >= 1) health.status = 'degraded';
  }

  /** Record provider success — reset failure counter */
  function recordSuccess(name: string) {
    const health = healthMap.get(name);
    if (!health) return;
    health.status = 'healthy';
    health.failCount = 0;
    health.lastSuccessAt = Date.now();
  }

  return {
    /**
     * Route an operation through available providers with failover.
     * Tries each provider in priority order until one succeeds.
     */
    async route<T>(operation: (adapter: ProviderEntry['adapter']) => Promise<T>): Promise<RoutingResult<T>> {
      const available = getAvailableProviders();
      const attempts: RoutingResult<T>['attempts'] = [];

      if (available.length === 0) {
        return { success: false, provider: 'none', error: 'No payment providers available', attempts };
      }

      for (let i = 0; i < Math.min(available.length, maxRetries + 1); i++) {
        const entry = available[i];
        const start = Date.now();

        try {
          const result = await Promise.race([
            operation(entry.adapter),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Provider ${entry.name} timed out (${timeoutMs}ms)`)), timeoutMs),
            ),
          ]);

          const duration = Date.now() - start;
          recordSuccess(entry.name);
          attempts.push({ provider: entry.name, durationMs: duration });
          onSuccess?.(entry.name, duration);

          return { success: true, provider: entry.name, data: result, attempts };
        } catch (err) {
          const duration = Date.now() - start;
          const errorMsg = err instanceof Error ? err.message : String(err);
          recordFailure(entry.name, errorMsg);
          attempts.push({ provider: entry.name, error: errorMsg, durationMs: duration });

          // Notify failover
          const nextProvider = available[i + 1];
          if (nextProvider && onFailover) {
            onFailover(entry.name, nextProvider.name, err instanceof Error ? err : new Error(errorMsg));
          }
        }
      }

      return {
        success: false,
        provider: 'none',
        error: `All providers failed after ${attempts.length} attempts`,
        attempts,
      };
    },

    /** Get current health status of all providers */
    getHealthStatus(): Record<string, ProviderHealth> {
      const result: Record<string, ProviderHealth> = {};
      for (const [name, health] of healthMap) {
        result[name] = { ...health };
      }
      return result;
    },

    /** Get list of available (configured + healthy) providers */
    getAvailableProviders(): string[] {
      return getAvailableProviders().map(p => p.name);
    },

    /** Reset health status for a provider (manual recovery) */
    resetProvider(name: string) {
      const health = healthMap.get(name);
      if (health) {
        health.status = 'healthy';
        health.failCount = 0;
        health.lastError = undefined;
      }
    },

    /** Check if any provider is available */
    hasAvailableProvider(): boolean {
      return getAvailableProviders().length > 0;
    },
  };
}
