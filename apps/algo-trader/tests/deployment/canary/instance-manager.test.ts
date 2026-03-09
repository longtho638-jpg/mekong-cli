import { InstanceManager } from '../../../src/deployment/canary/instance-manager';
import { DEFAULT_CANARY_CONFIG } from '../../../src/deployment/canary/canary-config-types';
import { MetricPoint } from '../../../src/deployment/canary/instance-manager';

const makeMetric = (overrides: Partial<MetricPoint> = {}): MetricPoint => ({
  timestamp: Date.now(),
  sharpe: 1.5,
  slippageBps: 2,
  errorRate: 0.001,
  antiBotFlags: 0,
  fillRate: 0.98,
  latencyMs: 50,
  ...overrides,
});

describe('InstanceManager', () => {
  let manager: InstanceManager;

  beforeEach(() => {
    manager = new InstanceManager(DEFAULT_CANARY_CONFIG);
  });

  it('initializes both instances as stopped', () => {
    const { baseline, canary } = manager.getStatus();
    expect(baseline.status).toBe('stopped');
    expect(canary.status).toBe('stopped');
    expect(baseline.role).toBe('baseline');
    expect(canary.role).toBe('canary');
  });

  it('starts baseline and sets status to running', async () => {
    await manager.startBaseline();
    const { baseline } = manager.getStatus();
    expect(baseline.status).toBe('running');
    expect(baseline.startTime).not.toBeNull();
  });

  it('starts canary and sets status to running', async () => {
    await manager.startCanary();
    const { canary } = manager.getStatus();
    expect(canary.status).toBe('running');
    expect(canary.startTime).not.toBeNull();
  });

  it('stops baseline and clears startTime', async () => {
    await manager.startBaseline();
    await manager.stopInstance('baseline');
    const { baseline } = manager.getStatus();
    expect(baseline.status).toBe('stopped');
    expect(baseline.startTime).toBeNull();
  });

  it('stops canary and clears startTime', async () => {
    await manager.startCanary();
    await manager.stopInstance('canary');
    const { canary } = manager.getStatus();
    expect(canary.status).toBe('stopped');
    expect(canary.startTime).toBeNull();
  });

  it('records and retrieves metrics for baseline', () => {
    const m = makeMetric({ sharpe: 2.0 });
    manager.recordMetric('baseline', m);
    const metrics = manager.getMetrics('baseline');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].sharpe).toBe(2.0);
  });

  it('records and retrieves metrics for canary', () => {
    const m = makeMetric({ errorRate: 0.05 });
    manager.recordMetric('canary', m);
    const metrics = manager.getMetrics('canary');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].errorRate).toBe(0.05);
  });

  it('restarts canary: clears metrics and sets running', async () => {
    await manager.startCanary();
    manager.recordMetric('canary', makeMetric());
    await manager.restartCanary();
    const { canary } = manager.getStatus();
    expect(canary.status).toBe('running');
    expect(manager.getMetrics('canary')).toHaveLength(0);
  });
});
