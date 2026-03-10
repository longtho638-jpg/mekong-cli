/**
 * Proxy Pool Manager — manages residential proxy rotation, health checks, and fallback.
 * Integrates with BrightData/Oxylabs via configurable API endpoints.
 */

export interface ProxyEntry {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
  latencyMs: number;
  successRate: number;
  lastChecked: number;
  sticky: boolean;
}

export interface ProxyPoolConfig {
  provider: 'brightdata' | 'oxylabs' | 'custom';
  apiTokenEnv: string;
  rotationIntervalSec: number;
  maxConcurrentProxies: number;
  healthCheckUrl: string;
  stickySession: boolean;
  fallbackToDirect: boolean;
}

export interface ProxyPoolState {
  proxies: ProxyEntry[];
  currentIndex: number;
  lastRotation: number;
  totalRequests: number;
  failedRequests: number;
}

/** Creates initial empty pool state */
export function createPoolState(): ProxyPoolState {
  return { proxies: [], currentIndex: 0, lastRotation: Date.now(), totalRequests: 0, failedRequests: 0 };
}

/** Fetches proxy list from provider (mock-friendly interface) */
export async function fetchProxies(
  config: ProxyPoolConfig,
  fetcher: (url: string, token: string) => Promise<ProxyEntry[]>
): Promise<ProxyEntry[]> {
  const token = process.env[config.apiTokenEnv] ?? '';
  const providerUrls: Record<string, string> = {
    brightdata: 'https://api.brightdata.com/proxies',
    oxylabs: 'https://api.oxylabs.io/v1/proxies',
    custom: '',
  };
  const url = providerUrls[config.provider] || '';
  if (!url || !token) return [];
  return fetcher(url, token);
}

/** Selects next proxy based on rotation policy */
export function getNextProxy(state: ProxyPoolState, config: ProxyPoolConfig): ProxyEntry | null {
  const healthy = state.proxies.filter((p) => p.successRate > 0.5 && p.latencyMs < 5000);
  if (healthy.length === 0) return config.fallbackToDirect ? null : null;

  // Sticky session: return same proxy if within rotation interval
  if (config.stickySession) {
    const elapsed = (Date.now() - state.lastRotation) / 1000;
    if (elapsed < config.rotationIntervalSec && state.currentIndex < healthy.length) {
      return healthy[state.currentIndex];
    }
  }

  // Round-robin rotation
  const idx = state.currentIndex % healthy.length;
  state.currentIndex = (idx + 1) % healthy.length;
  state.lastRotation = Date.now();
  return healthy[idx];
}

/** Checks if rotation is needed based on time elapsed */
export function shouldRotate(state: ProxyPoolState, config: ProxyPoolConfig): boolean {
  const elapsedSec = (Date.now() - state.lastRotation) / 1000;
  return elapsedSec >= config.rotationIntervalSec;
}

/** Updates proxy health after a request */
export function updateProxyHealth(
  state: ProxyPoolState,
  proxyHost: string,
  success: boolean,
  latencyMs: number
): void {
  state.totalRequests++;
  if (!success) state.failedRequests++;

  const proxy = state.proxies.find((p) => p.host === proxyHost);
  if (!proxy) return;

  // Exponential moving average for latency and success rate
  const alpha = 0.2;
  proxy.latencyMs = proxy.latencyMs * (1 - alpha) + latencyMs * alpha;
  proxy.successRate = proxy.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  proxy.lastChecked = Date.now();
}

/** Forces immediate rotation (e.g., after anti-bot detection) */
export function forceRotate(state: ProxyPoolState): void {
  state.currentIndex = (state.currentIndex + 1) % Math.max(state.proxies.length, 1);
  state.lastRotation = Date.now();
}

/** Returns pool health summary */
export function getPoolHealth(state: ProxyPoolState): {
  totalProxies: number;
  healthyProxies: number;
  avgLatencyMs: number;
  overallSuccessRate: number;
} {
  const healthy = state.proxies.filter((p) => p.successRate > 0.5);
  const avgLat = state.proxies.length > 0
    ? state.proxies.reduce((sum, p) => sum + p.latencyMs, 0) / state.proxies.length
    : 0;
  return {
    totalProxies: state.proxies.length,
    healthyProxies: healthy.length,
    avgLatencyMs: avgLat,
    overallSuccessRate: state.totalRequests > 0
      ? (state.totalRequests - state.failedRequests) / state.totalRequests
      : 1,
  };
}
