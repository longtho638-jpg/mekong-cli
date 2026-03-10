/**
 * Canary Preparer — validates system readiness before live trading.
 * Runs connectivity, auth, Ghost Protocol, and dry-run order tests.
 */

export interface CanaryTestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export interface ReadinessReport {
  timestamp: string;
  overallReady: boolean;
  tests: CanaryTestResult[];
  warnings: string[];
}

export interface CanaryConfig {
  exchanges: string[];
  testSymbol: string;
  minQuantityUsd: number;
  timeoutMs: number;
}

const DEFAULT_CANARY: CanaryConfig = {
  exchanges: ['binance'],
  testSymbol: 'BTC/USDT',
  minQuantityUsd: 1,
  timeoutMs: 10000,
};

/** Runs connectivity test to exchange API */
export async function testConnectivity(
  exchange: string,
  pingFn: (exchange: string) => Promise<{ ok: boolean; latencyMs: number }>
): Promise<CanaryTestResult> {
  const start = Date.now();
  try {
    const result = await pingFn(exchange);
    return {
      name: `connectivity:${exchange}`,
      passed: result.ok,
      durationMs: result.latencyMs,
      details: result.ok ? `Connected in ${result.latencyMs}ms` : 'Connection failed',
    };
  } catch (err: unknown) {
    return {
      name: `connectivity:${exchange}`,
      passed: false,
      durationMs: Date.now() - start,
      details: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Runs authentication test */
export async function testAuthentication(
  exchange: string,
  authFn: (exchange: string) => Promise<{ authenticated: boolean; accountId: string }>
): Promise<CanaryTestResult> {
  const start = Date.now();
  try {
    const result = await authFn(exchange);
    return {
      name: `auth:${exchange}`,
      passed: result.authenticated,
      durationMs: Date.now() - start,
      details: result.authenticated ? `Authenticated as ${result.accountId}` : 'Auth failed',
    };
  } catch (err: unknown) {
    return {
      name: `auth:${exchange}`,
      passed: false,
      durationMs: Date.now() - start,
      details: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Runs Ghost Protocol validation (proxy, fingerprint, no rate limits) */
export async function testGhostProtocol(
  exchange: string,
  ghostFn: (exchange: string) => Promise<{ proxyActive: boolean; fingerprintValid: boolean; noRateLimit: boolean }>
): Promise<CanaryTestResult> {
  const start = Date.now();
  try {
    const result = await ghostFn(exchange);
    const allPassed = result.proxyActive && result.fingerprintValid && result.noRateLimit;
    const details = [
      `proxy: ${result.proxyActive ? 'OK' : 'FAIL'}`,
      `fingerprint: ${result.fingerprintValid ? 'OK' : 'FAIL'}`,
      `rateLimit: ${result.noRateLimit ? 'OK' : 'DETECTED'}`,
    ].join(', ');
    return {
      name: `ghost:${exchange}`,
      passed: allPassed,
      durationMs: Date.now() - start,
      details,
    };
  } catch (err: unknown) {
    return {
      name: `ghost:${exchange}`,
      passed: false,
      durationMs: Date.now() - start,
      details: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Runs dry-run order test (place minimal order then cancel) */
export async function testDryRunOrder(
  exchange: string,
  orderFn: (exchange: string, symbol: string, qty: number) => Promise<{ orderId: string; cancelled: boolean }>
): Promise<CanaryTestResult> {
  const start = Date.now();
  try {
    const result = await orderFn(exchange, 'BTC/USDT', 0.00001);
    return {
      name: `dryOrder:${exchange}`,
      passed: result.cancelled,
      durationMs: Date.now() - start,
      details: result.cancelled
        ? `Order ${result.orderId} placed and cancelled`
        : `Order ${result.orderId} NOT cancelled — manual intervention needed`,
    };
  } catch (err: unknown) {
    return {
      name: `dryOrder:${exchange}`,
      passed: false,
      durationMs: Date.now() - start,
      details: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Generates full readiness report */
export function generateReadinessReport(tests: CanaryTestResult[]): ReadinessReport {
  const warnings: string[] = [];
  const failedTests = tests.filter((t) => !t.passed);

  if (failedTests.length > 0) {
    warnings.push(`${failedTests.length} test(s) failed: ${failedTests.map((t) => t.name).join(', ')}`);
  }

  const slowTests = tests.filter((t) => t.durationMs > 5000);
  if (slowTests.length > 0) {
    warnings.push(`${slowTests.length} test(s) slow (>5s): ${slowTests.map((t) => `${t.name}:${t.durationMs}ms`).join(', ')}`);
  }

  return {
    timestamp: new Date().toISOString(),
    overallReady: failedTests.length === 0,
    tests,
    warnings,
  };
}
