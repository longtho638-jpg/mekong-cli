import * as fs from 'fs';
import { CanaryDeploymentController } from '../../../src/deployment/canary/index';
import { DEFAULT_CANARY_CONFIG } from '../../../src/deployment/canary/canary-config-types';
import { MetricPoint } from '../../../src/deployment/canary/instance-manager';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

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

describe('CanaryDeploymentController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('initializes with default config when no path given', () => {
    const ctrl = new CanaryDeploymentController();
    expect(ctrl.isRunning()).toBe(false);
  });

  it('loadConfig returns defaults when file missing', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const ctrl = new CanaryDeploymentController();
    const cfg = await ctrl.loadConfig('/no/such/file.json');
    expect(cfg.dashboardPort).toBe(DEFAULT_CANARY_CONFIG.dashboardPort);
  });

  it('loadConfig parses file when present', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ ...DEFAULT_CANARY_CONFIG, dashboardPort: 9999 }));
    const ctrl = new CanaryDeploymentController();
    const cfg = await ctrl.loadConfig('/some/config.json');
    expect(cfg.dashboardPort).toBe(9999);
  });

  it('start sets running=true and stop sets running=false', async () => {
    const ctrl = new CanaryDeploymentController();
    await ctrl.start();
    expect(ctrl.isRunning()).toBe(true);
    await ctrl.stop();
    expect(ctrl.isRunning()).toBe(false);
  });

  it('start is idempotent', async () => {
    const ctrl = new CanaryDeploymentController();
    await ctrl.start();
    await ctrl.start(); // should not throw
    expect(ctrl.isRunning()).toBe(true);
    await ctrl.stop();
  });

  it('evaluationCycle does nothing with insufficient metrics', async () => {
    const ctrl = new CanaryDeploymentController();
    await ctrl.start();
    await expect(ctrl.evaluationCycle()).resolves.not.toThrow();
    await ctrl.stop();
  });

  it('getDashboard returns a valid state', async () => {
    const ctrl = new CanaryDeploymentController();
    await ctrl.start();
    const dash = ctrl.getDashboard();
    const state = dash.getState();
    expect(state.status).toBeDefined();
    expect(typeof state.trafficSplit).toBe('number');
    await ctrl.stop();
  });

  it('evaluationCycle triggers rollback on degraded canary', async () => {
    const ctrl = new CanaryDeploymentController();
    await ctrl.start();

    // Inject degraded metrics: canary has much worse slippage
    const im = (ctrl as unknown as { instanceManager: { recordMetric: (role: string, m: MetricPoint) => void } }).instanceManager;
    for (let i = 0; i < 20; i++) {
      im.recordMetric('baseline', makeMetric({ slippageBps: 2, timestamp: i * 1000 }));
      im.recordMetric('canary', makeMetric({ slippageBps: 30, timestamp: i * 1000 }));
    }

    await ctrl.evaluationCycle();

    const state = ctrl.getDashboard().getState();
    // After rollback, promotion status should be rolled_back
    expect(state.status).toBe('rolled_back');
    await ctrl.stop();
  });
});
