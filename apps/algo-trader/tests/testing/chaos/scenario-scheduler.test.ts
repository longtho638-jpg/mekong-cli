import { buildEnvironment } from '../../../src/testing/chaos/environment-builder';
import { clearAllFailures } from '../../../src/testing/chaos/failure-injector';
import { runScenario, runAllScenarios, ChaosScenario } from '../../../src/testing/chaos/scenario-scheduler';

describe('scenario-scheduler', () => {
  const env = buildEnvironment({ useDocker: false, images: { phase3: 'p3:latest', 'exchange-mock': 'ex:latest' } });

  beforeEach(() => {
    clearAllFailures();
    for (const c of env.containers.values()) c.status = 'running';
  });

  it('should run a process-kill scenario and pass', () => {
    const scenario: ChaosScenario = {
      name: 'kill-phase3',
      failure: { type: 'process', target: 'phase3', duration: 30 },
      expected: { recoveryTimeSec: 10, dataLoss: false },
    };
    const result = runScenario(env, scenario);
    expect(result.status).toBe('passed');
    expect(result.actualRecoveryTimeSec).toBeLessThanOrEqual(10);
    expect(result.assertions.length).toBeGreaterThan(0);
  });

  it('should run a latency scenario and pass', () => {
    const scenario: ChaosScenario = {
      name: 'network-latency',
      failure: { type: 'latency', target: 'exchange-mock', delayMs: 500, duration: 60 },
      expected: { maxSlippageBps: 10 },
    };
    const result = runScenario(env, scenario);
    expect(result.status).toBe('passed');
  });

  it('should run exchange-error scenario with circuit breaker', () => {
    const scenario: ChaosScenario = {
      name: 'exchange-5xx',
      failure: { type: 'exchange-error', target: 'exchange-mock', statusCode: 503, duration: 15 },
      expected: { circuitBreakerTriggered: true },
    };
    const result = runScenario(env, scenario);
    expect(result.status).toBe('passed');
    expect(result.assertions.some((a) => a.name === 'Circuit Breaker')).toBe(true);
  });

  it('should run all scenarios sequentially', () => {
    const scenarios: ChaosScenario[] = [
      { name: 's1', failure: { type: 'process', target: 'phase3', duration: 5 }, expected: { recoveryTimeSec: 10 } },
      { name: 's2', failure: { type: 'latency', target: 'exchange-mock', delayMs: 100, duration: 3 }, expected: { maxSlippageBps: 20 } },
    ];
    const results = runAllScenarios(env, scenarios);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === 'passed')).toBe(true);
  });

  it('should include scenario metadata in result', () => {
    const scenario: ChaosScenario = {
      name: 'test-meta',
      failure: { type: 'packet-loss', target: 'exchange-mock', lossPercent: 30, duration: 10 },
      expected: { dataLoss: false },
    };
    const result = runScenario(env, scenario);
    expect(result.scenario.name).toBe('test-meta');
    expect(result.startedAt).toBeLessThanOrEqual(result.endedAt);
  });

  it('should handle empty scenarios list', () => {
    const results = runAllScenarios(env, []);
    expect(results).toHaveLength(0);
  });
});
