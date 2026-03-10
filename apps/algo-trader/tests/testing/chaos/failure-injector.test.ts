import { buildEnvironment } from '../../../src/testing/chaos/environment-builder';
import {
  injectFailure, resolveFailure, getActiveFailures, clearAllFailures,
  getInjectedLatency, getInjectedExchangeError, checkAndResolveExpired,
} from '../../../src/testing/chaos/failure-injector';

describe('failure-injector', () => {
  const env = buildEnvironment({ useDocker: false, images: { phase3: 'p3:latest', 'exchange-mock': 'ex:latest' } });

  beforeEach(() => {
    clearAllFailures();
    // Reset container states
    for (const c of env.containers.values()) c.status = 'running';
  });

  it('should inject process failure and crash container', () => {
    const failure = injectFailure(env, { type: 'process', target: 'phase3', duration: 10 });
    expect(failure.resolved).toBe(false);
    expect(env.containers.get('phase3')?.status).toBe('crashed');
  });

  it('should inject latency failure', () => {
    injectFailure(env, { type: 'latency', target: 'exchange-mock', duration: 5, delayMs: 500 });
    expect(getInjectedLatency('exchange-mock')).toBe(500);
    expect(getInjectedLatency('nonexistent')).toBe(0);
  });

  it('should inject exchange error', () => {
    injectFailure(env, { type: 'exchange-error', target: 'exchange-mock', duration: 5, statusCode: 503 });
    expect(getInjectedExchangeError('exchange-mock')).toBe(503);
    expect(getInjectedExchangeError('other')).toBeNull();
  });

  it('should resolve failure and restart container', () => {
    const failure = injectFailure(env, { type: 'process', target: 'phase3', duration: 10 });
    resolveFailure(env, failure);
    expect(failure.resolved).toBe(true);
    expect(env.containers.get('phase3')?.status).toBe('running');
  });

  it('should track active failures', () => {
    injectFailure(env, { type: 'latency', target: 'exchange-mock', duration: 60, delayMs: 100 });
    injectFailure(env, { type: 'packet-loss', target: 'exchange-mock', duration: 30, lossPercent: 20 });
    expect(getActiveFailures()).toHaveLength(2);
  });

  it('should clear all failures', () => {
    injectFailure(env, { type: 'latency', target: 'exchange-mock', duration: 60, delayMs: 100 });
    clearAllFailures();
    expect(getActiveFailures()).toHaveLength(0);
  });

  it('should auto-resolve expired failures', () => {
    const failure = injectFailure(env, { type: 'latency', target: 'exchange-mock', duration: 0, delayMs: 100 });
    // duration=0 means endAt = startedAt, should be expired immediately
    failure.endAt = Date.now() - 1000; // force expired
    const resolved = checkAndResolveExpired(env);
    expect(resolved).toHaveLength(1);
    expect(failure.resolved).toBe(true);
  });

  it('should handle blockchain-reorg type', () => {
    const failure = injectFailure(env, { type: 'blockchain-reorg', target: 'hardhat', duration: 5 });
    expect(failure.spec.type).toBe('blockchain-reorg');
    expect(failure.resolved).toBe(false);
  });
});
