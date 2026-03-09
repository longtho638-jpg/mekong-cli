import { PromotionManager } from '../../../src/deployment/canary/promotion-manager';
import { ComparisonResult } from '../../../src/deployment/canary/metrics-comparator';

const goodComparisons: ComparisonResult[] = [
  { metric: 'sharpe', baselineMean: 1.5, canaryMean: 1.6, pValue: 0.4, significant: false, degraded: false },
  { metric: 'slippageBps', baselineMean: 2, canaryMean: 2, pValue: 0.9, significant: false, degraded: false },
];

const degradedComparisons: ComparisonResult[] = [
  { metric: 'slippageBps', baselineMean: 2, canaryMean: 15, pValue: 0.01, significant: true, degraded: true },
];

describe('PromotionManager', () => {
  it('starts in pending state', () => {
    const pm = new PromotionManager(24);
    expect(pm.getStatus()).toBe('pending');
  });

  it('moves to evaluating after startEvaluation', () => {
    const pm = new PromotionManager(24);
    pm.startEvaluation();
    expect(pm.getStatus()).toBe('evaluating');
  });

  it('remains evaluating when period not elapsed and metrics good', () => {
    const pm = new PromotionManager(24);
    pm.startEvaluation();
    const status = pm.checkPromotion(Date.now(), goodComparisons);
    expect(status).toBe('evaluating');
  });

  it('promotes after evaluation period elapses with good metrics', () => {
    const pm = new PromotionManager(0.0001); // ~0.36 seconds
    pm.startEvaluation();
    const futureTime = Date.now() + 10000; // well past period
    const status = pm.checkPromotion(futureTime, goodComparisons);
    expect(status).toBe('promoted');
    expect(pm.getRecords()).toHaveLength(1);
    expect(pm.getRecords()[0].status).toBe('promoted');
  });

  it('rolls back when degraded metrics detected during evaluation', () => {
    const pm = new PromotionManager(24);
    pm.startEvaluation();
    const status = pm.checkPromotion(Date.now(), degradedComparisons);
    expect(status).toBe('rolled_back');
    expect(pm.getStatus()).toBe('rolled_back');
  });

  it('forcePromote sets status and records entry', () => {
    const pm = new PromotionManager(24);
    pm.startEvaluation();
    const record = pm.forcePromote();
    expect(record.status).toBe('promoted');
    expect(pm.getStatus()).toBe('promoted');
    expect(pm.getRecords()).toHaveLength(1);
  });

  it('forceRollback sets status and records comparisons', () => {
    const pm = new PromotionManager(24);
    pm.startEvaluation();
    const record = pm.forceRollback(degradedComparisons);
    expect(record.status).toBe('rolled_back');
    expect(record.metricsSnapshot).toEqual(degradedComparisons);
    expect(pm.getStatus()).toBe('rolled_back');
  });

  it('checkPromotion returns current status when not evaluating', () => {
    const pm = new PromotionManager(24);
    const status = pm.checkPromotion(Date.now(), goodComparisons);
    expect(status).toBe('pending');
  });
});
