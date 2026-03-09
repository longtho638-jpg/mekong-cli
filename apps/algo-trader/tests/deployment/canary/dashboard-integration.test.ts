import { InstanceManager } from '../../../src/deployment/canary/instance-manager';
import { TrafficSplitter } from '../../../src/deployment/canary/traffic-splitter';
import { MetricsComparator } from '../../../src/deployment/canary/metrics-comparator';
import { RollbackTrigger } from '../../../src/deployment/canary/rollback-trigger';
import { PromotionManager } from '../../../src/deployment/canary/promotion-manager';
import { DashboardIntegration } from '../../../src/deployment/canary/dashboard-integration';
import { DEFAULT_CANARY_CONFIG } from '../../../src/deployment/canary/canary-config-types';

function buildDashboard(): DashboardIntegration {
  const cfg = DEFAULT_CANARY_CONFIG;
  const im = new InstanceManager(cfg);
  const ts = new TrafficSplitter(cfg.trafficSplit);
  const mc = new MetricsComparator(cfg.metrics);
  const rt = new RollbackTrigger(cfg.metrics);
  const pm = new PromotionManager(cfg.trafficSplit.evaluationPeriodHours);
  return new DashboardIntegration(im, ts, mc, rt, pm);
}

describe('DashboardIntegration', () => {
  it('getState returns all required fields', () => {
    const dash = buildDashboard();
    const state = dash.getState();
    expect(state).toHaveProperty('status');
    expect(state).toHaveProperty('trafficSplit');
    expect(state).toHaveProperty('baseline');
    expect(state).toHaveProperty('canary');
    expect(state).toHaveProperty('comparisons');
    expect(state).toHaveProperty('rollbackHistory');
    expect(state).toHaveProperty('promotionRecords');
    expect(state).toHaveProperty('lastUpdated');
  });

  it('getState reflects initial traffic split', () => {
    const dash = buildDashboard();
    expect(dash.getState().trafficSplit).toBe(DEFAULT_CANARY_CONFIG.trafficSplit.initialPercent);
  });

  it('handleOverride setPercent updates traffic split', () => {
    const dash = buildDashboard();
    const result = dash.handleOverride('setPercent', { percent: 25 });
    expect(result.success).toBe(true);
    expect(dash.getState().trafficSplit).toBe(25);
  });

  it('handleOverride rollback returns success', () => {
    const dash = buildDashboard();
    const result = dash.handleOverride('rollback');
    expect(result.success).toBe(true);
    expect(result.message).toContain('rollback');
  });

  it('handleOverride promote returns success', () => {
    const dash = buildDashboard();
    const result = dash.handleOverride('promote');
    expect(result.success).toBe(true);
    expect(result.message).toContain('promotion');
  });

  it('handleOverride unknown action returns failure', () => {
    const dash = buildDashboard();
    // @ts-expect-error testing invalid action
    const result = dash.handleOverride('unknownAction');
    expect(result.success).toBe(false);
  });
});
