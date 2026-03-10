/**
 * Tests for Live Trading Orchestrator & Ghost Protocol Manager.
 * All external services mocked.
 */
import { encrypt, decrypt, loadCredentials, isCredentialValid, rotateAccount, maskCredential } from '../../src/live/account-vault';
import type { AccountCredential, VaultConfig } from '../../src/live/account-vault';
import {
  createPoolState, getNextProxy, shouldRotate, updateProxyHealth,
  forceRotate, getPoolHealth,
} from '../../src/live/proxy-pool-manager';
import type { ProxyEntry, ProxyPoolConfig, ProxyPoolState } from '../../src/live/proxy-pool-manager';
import {
  applyOverrides, applyRiskProfile, generateJitter, escalateJitter, getCanaryConfig,
} from '../../src/live/ghost-configurator';
import type { GhostConfig } from '../../src/live/ghost-configurator';
import {
  createMonitorState, recordResponse, pauseExchange, isExchangePaused, resetEscalation,
} from '../../src/live/anti-bot-monitor';
import type { ExchangeResponse } from '../../src/live/anti-bot-monitor';
import {
  createComplianceLog, appendEntry, toCSV, filterByDateRange, getLogSummary,
} from '../../src/live/compliance-logger';
import type { TradeLogEntry } from '../../src/live/compliance-logger';
import {
  testConnectivity, testAuthentication, testGhostProtocol, testDryRunOrder,
  generateReadinessReport,
} from '../../src/live/canary-preparer';
import { loadLiveConfig, initializeOrchestrator, getOrchestratorStatus } from '../../src/live/index';
import * as fs from 'fs';
import * as path from 'path';

// --- Account Vault ---

describe('AccountVault', () => {
  test('encrypt/decrypt roundtrip', () => {
    const plaintext = 'my-secret-api-key-12345';
    const password = 'master-pass-xyz';
    const encrypted = encrypt(plaintext, password);
    expect(encrypted).not.toContain(plaintext);
    expect(encrypted.split(':')).toHaveLength(4);
    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  test('decrypt with wrong password throws', () => {
    const encrypted = encrypt('secret', 'correct-pass');
    expect(() => decrypt(encrypted, 'wrong-pass')).toThrow();
  });

  test('decrypt invalid format throws', () => {
    expect(() => decrypt('not:valid', 'pass')).toThrow('Invalid encrypted data format');
  });

  test('loadCredentials reads from env vars', () => {
    process.env.TEST_API_KEY = 'key123';
    process.env.TEST_SECRET = 'sec456';
    const config: VaultConfig = {
      accounts: {
        binance: [{ id: 'test', apiKeyEnv: 'TEST_API_KEY', secretEnv: 'TEST_SECRET', enabled: true }],
      },
    };
    const creds = loadCredentials(config);
    expect(creds).toHaveLength(1);
    expect(creds[0].apiKey).toBe('key123');
    expect(creds[0].exchange).toBe('binance');
    delete process.env.TEST_API_KEY;
    delete process.env.TEST_SECRET;
  });

  test('loadCredentials skips disabled accounts', () => {
    process.env.TEST_KEY = 'k';
    process.env.TEST_SEC = 's';
    const config: VaultConfig = {
      accounts: {
        okx: [{ id: 'off', apiKeyEnv: 'TEST_KEY', secretEnv: 'TEST_SEC', enabled: false }],
      },
    };
    expect(loadCredentials(config)).toHaveLength(0);
    delete process.env.TEST_KEY;
    delete process.env.TEST_SEC;
  });

  test('loadCredentials skips missing env vars', () => {
    const config: VaultConfig = {
      accounts: {
        binance: [{ id: 'x', apiKeyEnv: 'NONEXISTENT_KEY', secretEnv: 'NONEXISTENT_SEC', enabled: true }],
      },
    };
    expect(loadCredentials(config)).toHaveLength(0);
  });

  test('isCredentialValid checks enabled, expiry, and presence', () => {
    expect(isCredentialValid({ id: 'a', exchange: 'b', apiKey: 'k', secret: 's', enabled: true })).toBe(true);
    expect(isCredentialValid({ id: 'a', exchange: 'b', apiKey: 'k', secret: 's', enabled: false })).toBe(false);
    expect(isCredentialValid({ id: 'a', exchange: 'b', apiKey: '', secret: 's', enabled: true })).toBe(false);
    expect(isCredentialValid({
      id: 'a', exchange: 'b', apiKey: 'k', secret: 's', enabled: true,
      expiresAt: new Date(Date.now() - 1000),
    })).toBe(false);
    expect(isCredentialValid({
      id: 'a', exchange: 'b', apiKey: 'k', secret: 's', enabled: true,
      expiresAt: new Date(Date.now() + 100000),
    })).toBe(true);
  });

  test('rotateAccount returns different account', () => {
    const creds: AccountCredential[] = [
      { id: 'v1', exchange: 'binance', apiKey: 'k1', secret: 's1', enabled: true },
      { id: 'v2', exchange: 'binance', apiKey: 'k2', secret: 's2', enabled: true },
      { id: 'v3', exchange: 'okx', apiKey: 'k3', secret: 's3', enabled: true },
    ];
    const next = rotateAccount(creds, 'binance', 'v1');
    expect(next).not.toBeNull();
    expect(next!.id).toBe('v2');
  });

  test('rotateAccount returns null if no alternatives', () => {
    const creds: AccountCredential[] = [
      { id: 'v1', exchange: 'binance', apiKey: 'k1', secret: 's1', enabled: true },
    ];
    expect(rotateAccount(creds, 'binance', 'v1')).toBeNull();
  });

  test('maskCredential hides sensitive data', () => {
    const masked = maskCredential({ id: 'a', exchange: 'b', apiKey: 'abcdefgh', secret: 'xyz', enabled: true });
    expect(masked.apiKey).toBe('abcd****');
    expect(masked.secret).toBe('[REDACTED]');
  });
});

// --- Proxy Pool Manager ---

describe('ProxyPoolManager', () => {
  const makeProxy = (host: string, rate = 0.9, lat = 100): ProxyEntry => ({
    host, port: 8080, protocol: 'http', latencyMs: lat,
    successRate: rate, lastChecked: Date.now(), sticky: false,
  });

  const defaultPoolConfig: ProxyPoolConfig = {
    provider: 'brightdata', apiTokenEnv: 'TOKEN', rotationIntervalSec: 30,
    maxConcurrentProxies: 50, healthCheckUrl: 'http://test', stickySession: false,
    fallbackToDirect: true,
  };

  test('createPoolState returns empty state', () => {
    const state = createPoolState();
    expect(state.proxies).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
  });

  test('getNextProxy rotates through healthy proxies', () => {
    const state = createPoolState();
    state.proxies = [makeProxy('p1'), makeProxy('p2'), makeProxy('p3')];
    const first = getNextProxy(state, defaultPoolConfig);
    expect(first!.host).toBe('p1');
    const second = getNextProxy(state, defaultPoolConfig);
    expect(second!.host).toBe('p2');
  });

  test('getNextProxy skips unhealthy proxies', () => {
    const state = createPoolState();
    state.proxies = [makeProxy('bad', 0.3), makeProxy('good', 0.9)];
    const proxy = getNextProxy(state, defaultPoolConfig);
    expect(proxy!.host).toBe('good');
  });

  test('getNextProxy returns null when pool empty', () => {
    const state = createPoolState();
    expect(getNextProxy(state, defaultPoolConfig)).toBeNull();
  });

  test('shouldRotate checks time elapsed', () => {
    const state = createPoolState();
    state.lastRotation = Date.now() - 31000;
    expect(shouldRotate(state, defaultPoolConfig)).toBe(true);
    state.lastRotation = Date.now();
    expect(shouldRotate(state, defaultPoolConfig)).toBe(false);
  });

  test('updateProxyHealth applies EMA', () => {
    const state = createPoolState();
    state.proxies = [makeProxy('p1', 1.0, 100)];
    updateProxyHealth(state, 'p1', false, 500);
    expect(state.proxies[0].successRate).toBeLessThan(1);
    expect(state.proxies[0].latencyMs).toBeGreaterThan(100);
    expect(state.totalRequests).toBe(1);
    expect(state.failedRequests).toBe(1);
  });

  test('forceRotate advances index', () => {
    const state = createPoolState();
    state.proxies = [makeProxy('a'), makeProxy('b')];
    state.currentIndex = 0;
    forceRotate(state);
    expect(state.currentIndex).toBe(1);
  });

  test('getPoolHealth returns summary', () => {
    const state = createPoolState();
    state.proxies = [makeProxy('a', 0.9, 100), makeProxy('b', 0.3, 500)];
    state.totalRequests = 10;
    state.failedRequests = 2;
    const health = getPoolHealth(state);
    expect(health.totalProxies).toBe(2);
    expect(health.healthyProxies).toBe(1);
    expect(health.avgLatencyMs).toBe(300);
    expect(health.overallSuccessRate).toBe(0.8);
  });
});

// --- Ghost Configurator ---

describe('GhostConfigurator', () => {
  const baseGhost: GhostConfig = {
    jitterMeanMs: 8, jitterStdMs: 3, fingerprintRotation: 'perSession',
    webSocketShards: 3, chameleonActions: ['cancelRandom', 'tinyOrder'],
  };

  test('applyOverrides merges partial overrides', () => {
    const result = applyOverrides(baseGhost, { jitterMeanMs: 15 });
    expect(result.jitterMeanMs).toBe(15);
    expect(result.jitterStdMs).toBe(3); // unchanged
    expect(result.fingerprintRotation).toBe('perSession');
  });

  test('applyRiskProfile caps jitter for binance', () => {
    const wide = { ...baseGhost, jitterMeanMs: 50 };
    const result = applyRiskProfile(wide, 'binance');
    expect(result.jitterMeanMs).toBe(15); // binance max
    expect(result.fingerprintRotation).toBe('perRequest'); // high risk
  });

  test('applyRiskProfile removes disabled actions for okx', () => {
    const result = applyRiskProfile(baseGhost, 'okx');
    expect(result.chameleonActions).not.toContain('tinyOrder');
    expect(result.chameleonActions).toContain('cancelRandom');
  });

  test('applyRiskProfile ensures minimum shards', () => {
    const lowShards = { ...baseGhost, webSocketShards: 1 };
    const result = applyRiskProfile(lowShards, 'binance');
    expect(result.webSocketShards).toBeGreaterThanOrEqual(5);
  });

  test('applyRiskProfile returns unchanged for unknown exchange', () => {
    const result = applyRiskProfile(baseGhost, 'unknownexchange');
    expect(result).toEqual(baseGhost);
  });

  test('generateJitter produces non-negative values', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateJitter(8, 3)).toBeGreaterThanOrEqual(0);
    }
  });

  test('escalateJitter multiplies by factor', () => {
    const result = escalateJitter(baseGhost, 2);
    expect(result.jitterMeanMs).toBe(16);
    expect(result.jitterStdMs).toBe(6);
  });

  test('getCanaryConfig returns conservative settings', () => {
    const canary = getCanaryConfig(baseGhost);
    expect(canary.jitterMeanMs).toBeGreaterThan(baseGhost.jitterMeanMs);
    expect(canary.fingerprintRotation).toBe('perRequest');
    expect(canary.webSocketShards).toBeGreaterThanOrEqual(5);
  });
});

// --- Anti-Bot Monitor ---

describe('AntiBotMonitor', () => {
  const makeResponse = (overrides: Partial<ExchangeResponse> = {}): ExchangeResponse => ({
    exchange: 'binance', statusCode: 200, latencyMs: 50,
    timestamp: Date.now(), ...overrides,
  });

  test('no alert for normal response', () => {
    const state = createMonitorState();
    const alert = recordResponse(state, makeResponse());
    expect(alert).toBeNull();
  });

  test('alerts on 429 rate limit', () => {
    const state = createMonitorState();
    const alert = recordResponse(state, makeResponse({ statusCode: 429 }));
    expect(alert).not.toBeNull();
    expect(alert!.actions).toContain('rotateProxy');
  });

  test('alerts on 403 forbidden', () => {
    const state = createMonitorState();
    const alert = recordResponse(state, makeResponse({ statusCode: 403 }));
    expect(alert).not.toBeNull();
  });

  test('escalates after repeated rate limits', () => {
    const state = createMonitorState();
    for (let i = 0; i < 5; i++) {
      recordResponse(state, makeResponse({ statusCode: 429, timestamp: Date.now() + i }));
    }
    expect(state.escalationLevel['binance']).toBeGreaterThanOrEqual(1);
  });

  test('detects suspicious error messages', () => {
    const state = createMonitorState();
    const alert = recordResponse(state, makeResponse({
      errorMessage: 'Your request has been rejected',
    }));
    expect(alert).not.toBeNull();
    expect(alert!.reason).toContain('rejected');
  });

  test('detects slippage spike', () => {
    const state = createMonitorState();
    const alert = recordResponse(state, makeResponse({ slippageBps: 50 }));
    expect(alert).not.toBeNull();
    expect(alert!.reason).toContain('Slippage spike');
  });

  test('detects latency anomaly', () => {
    const state = createMonitorState();
    // Build baseline
    for (let i = 0; i < 10; i++) {
      recordResponse(state, makeResponse({ latencyMs: 50, timestamp: Date.now() + i }));
    }
    // Spike
    const alert = recordResponse(state, makeResponse({ latencyMs: 5000, timestamp: Date.now() + 100 }));
    expect(alert).not.toBeNull();
    expect(alert!.reason).toContain('Latency anomaly');
  });

  test('critical escalation includes pauseExchange and alert', () => {
    const state = createMonitorState();
    state.escalationLevel['binance'] = 2;
    state.rateLimitCounts['binance'] = 4;
    const alert = recordResponse(state, makeResponse({ statusCode: 429 }));
    expect(alert!.severity).toBe('critical');
    expect(alert!.actions).toContain('pauseExchange');
    expect(alert!.actions).toContain('alert');
  });

  test('pauseExchange and isExchangePaused', () => {
    const state = createMonitorState();
    pauseExchange(state, 'binance', 10);
    expect(isExchangePaused(state, 'binance')).toBe(true);
    expect(isExchangePaused(state, 'okx')).toBe(false);
  });

  test('paused exchange skips alerts', () => {
    const state = createMonitorState();
    pauseExchange(state, 'binance', 10);
    const alert = recordResponse(state, makeResponse({ statusCode: 429 }));
    expect(alert).toBeNull();
  });

  test('resetEscalation clears state', () => {
    const state = createMonitorState();
    state.escalationLevel['binance'] = 3;
    state.rateLimitCounts['binance'] = 10;
    resetEscalation(state, 'binance');
    expect(state.escalationLevel['binance']).toBe(0);
    expect(state.rateLimitCounts['binance']).toBe(0);
  });
});

// --- Compliance Logger ---

describe('ComplianceLogger', () => {
  const makeEntry = (overrides: Partial<TradeLogEntry> = {}): TradeLogEntry => ({
    timestamp: '2026-03-09T12:00:00Z', exchange: 'binance', symbol: 'BTC/USDT',
    side: 'buy', quantity: 0.001, price: 50000, fee: 0.05, feeCurrency: 'USDT',
    proxyUsed: 'proxy1', fingerprintId: 'fp-abc', orderId: 'ord-123',
    canaryMode: true, ...overrides,
  });

  test('createComplianceLog returns empty log', () => {
    const log = createComplianceLog();
    expect(log.entries).toHaveLength(0);
    expect(log.version).toBe('1.0.0');
  });

  test('appendEntry is immutable', () => {
    const log = createComplianceLog();
    const entry = makeEntry();
    const updated = appendEntry(log, entry);
    expect(updated.entries).toHaveLength(1);
    expect(log.entries).toHaveLength(0); // original unchanged
  });

  test('toCSV produces valid format', () => {
    let log = createComplianceLog();
    log = appendEntry(log, makeEntry());
    log = appendEntry(log, makeEntry({ side: 'sell', price: 51000 }));
    const csv = toCSV(log);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toContain('timestamp,exchange,symbol');
    expect(lines[1]).toContain('binance');
  });

  test('toCSV escapes commas and quotes', () => {
    let log = createComplianceLog();
    log = appendEntry(log, makeEntry({ antiBotEvent: 'rate,limit "detected"' }));
    const csv = toCSV(log);
    expect(csv).toContain('"rate,limit ""detected"""');
  });

  test('filterByDateRange filters correctly', () => {
    let log = createComplianceLog();
    log = appendEntry(log, makeEntry({ timestamp: '2026-03-01T00:00:00Z' }));
    log = appendEntry(log, makeEntry({ timestamp: '2026-03-05T00:00:00Z' }));
    log = appendEntry(log, makeEntry({ timestamp: '2026-03-10T00:00:00Z' }));
    const filtered = filterByDateRange(log, new Date('2026-03-04'), new Date('2026-03-06'));
    expect(filtered).toHaveLength(1);
  });

  test('getLogSummary calculates stats', () => {
    let log = createComplianceLog();
    log = appendEntry(log, makeEntry({ quantity: 1, price: 50000, fee: 25, antiBotEvent: 'rate limit' }));
    log = appendEntry(log, makeEntry({ exchange: 'okx', quantity: 2, price: 50000, fee: 50 }));
    const summary = getLogSummary(log);
    expect(summary.totalTrades).toBe(2);
    expect(summary.totalVolume).toBe(150000);
    expect(summary.totalFees).toBe(75);
    expect(summary.byExchange['binance']).toBe(1);
    expect(summary.byExchange['okx']).toBe(1);
    expect(summary.antiBotEvents).toBe(1);
  });
});

// --- Canary Preparer ---

describe('CanaryPreparer', () => {
  test('testConnectivity passes on success', async () => {
    const result = await testConnectivity('binance', async () => ({ ok: true, latencyMs: 50 }));
    expect(result.passed).toBe(true);
    expect(result.name).toBe('connectivity:binance');
  });

  test('testConnectivity fails on error', async () => {
    const result = await testConnectivity('binance', async () => { throw new Error('timeout'); });
    expect(result.passed).toBe(false);
    expect(result.details).toContain('timeout');
  });

  test('testAuthentication passes', async () => {
    const result = await testAuthentication('okx', async () => ({ authenticated: true, accountId: 'acc-1' }));
    expect(result.passed).toBe(true);
    expect(result.details).toContain('acc-1');
  });

  test('testGhostProtocol checks all signals', async () => {
    const result = await testGhostProtocol('binance', async () => ({
      proxyActive: true, fingerprintValid: true, noRateLimit: false,
    }));
    expect(result.passed).toBe(false);
    expect(result.details).toContain('rateLimit: DETECTED');
  });

  test('testDryRunOrder passes when cancelled', async () => {
    const result = await testDryRunOrder('binance', async () => ({ orderId: 'x', cancelled: true }));
    expect(result.passed).toBe(true);
  });

  test('testDryRunOrder fails when not cancelled', async () => {
    const result = await testDryRunOrder('binance', async () => ({ orderId: 'x', cancelled: false }));
    expect(result.passed).toBe(false);
    expect(result.details).toContain('manual intervention');
  });

  test('generateReadinessReport aggregates results', () => {
    const tests = [
      { name: 'a', passed: true, durationMs: 100, details: 'ok' },
      { name: 'b', passed: false, durationMs: 200, details: 'fail' },
      { name: 'c', passed: true, durationMs: 6000, details: 'slow' },
    ];
    const report = generateReadinessReport(tests);
    expect(report.overallReady).toBe(false);
    expect(report.warnings.length).toBeGreaterThanOrEqual(2);
  });

  test('generateReadinessReport all pass', () => {
    const tests = [
      { name: 'a', passed: true, durationMs: 100, details: 'ok' },
    ];
    const report = generateReadinessReport(tests);
    expect(report.overallReady).toBe(true);
    expect(report.warnings).toHaveLength(0);
  });
});

// --- Live Orchestrator Integration ---

describe('LiveOrchestrator', () => {
  const configPath = path.join(__dirname, 'test-live-config.json');

  beforeAll(() => {
    fs.writeFileSync(configPath, JSON.stringify({
      accounts: { binance: [{ id: 'v1', apiKeyEnv: 'LT_KEY', secretEnv: 'LT_SEC', enabled: true }] },
      proxyPool: { provider: 'brightdata', apiTokenEnv: 'T', rotationIntervalSec: 30 },
      ghostConfig: { jitterMeanMs: 10 },
      canaryMode: true,
    }));
  });

  afterAll(() => {
    try { fs.unlinkSync(configPath); } catch { /* noop */ }
  });

  test('loadLiveConfig reads file with defaults', () => {
    const config = loadLiveConfig(configPath);
    expect(config.canaryMode).toBe(true);
    expect(config.ghostConfig.jitterMeanMs).toBe(10);
    expect(config.ghostConfig.jitterStdMs).toBe(3); // default
    expect(config.proxyPool.fallbackToDirect).toBe(true); // default
  });

  test('initializeOrchestrator creates state', () => {
    process.env.LT_KEY = 'apikey';
    process.env.LT_SEC = 'secret';
    const config = loadLiveConfig(configPath);
    const state = initializeOrchestrator(config);
    expect(state.initialized).toBe(true);
    expect(state.canaryMode).toBe(true);
    expect(state.credentials).toHaveLength(1);
    // Canary mode applies conservative jitter
    expect(state.ghostConfig.jitterMeanMs).toBeGreaterThan(10);
    delete process.env.LT_KEY;
    delete process.env.LT_SEC;
  });

  test('getOrchestratorStatus returns safe summary', () => {
    process.env.LT_KEY = 'apikey123';
    process.env.LT_SEC = 'secret456';
    const config = loadLiveConfig(configPath);
    const state = initializeOrchestrator(config);
    const status = getOrchestratorStatus(state);
    expect(status.initialized).toBe(true);
    expect(status.canaryMode).toBe(true);
    // Credentials should be masked
    const accts = status.accounts as Record<string, string>[];
    expect(accts[0].secret).toBe('[REDACTED]');
    expect(accts[0].apiKey).toContain('****');
    delete process.env.LT_KEY;
    delete process.env.LT_SEC;
  });
});
