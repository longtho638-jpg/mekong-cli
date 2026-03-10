import { RollbackTrigger } from '../../../src/deployment/canary/rollback-trigger';
import { DEFAULT_CANARY_CONFIG } from '../../../src/deployment/canary/canary-config-types';
import { ComparisonResult } from '../../../src/deployment/canary/metrics-comparator';

const makeResult = (overrides: Partial<ComparisonResult>): ComparisonResult => ({
  metric: 'slippageBps',
  baselineMean: 2,
  canaryMean: 2,
  pValue: 0.5,
  significant: false,
  degraded: false,
  ...overrides,
});

const goodComparisons: ComparisonResult[] = [
  makeResult({ metric: 'sharpe' }),
  makeResult({ metric: 'slippageBps' }),
];

const degradedComparisons: ComparisonResult[] = [
  makeResult({ metric: 'sharpe' }),
  makeResult({ metric: 'slippageBps', canaryMean: 20, significant: true, degraded: true }),
];

const hardThresholdBreach: ComparisonResult[] = [
  makeResult({ metric: 'slippageBps', canaryMean: 10 }), // > threshold of 5
];

describe('RollbackTrigger', () => {
  let trigger: RollbackTrigger;

  beforeEach(() => {
    trigger = new RollbackTrigger(DEFAULT_CANARY_CONFIG.metrics);
  });

  it('returns null when metrics are healthy', () => {
    const event = trigger.evaluate(goodComparisons);
    expect(event).toBeNull();
  });

  it('returns RollbackEvent when metrics are degraded', () => {
    const event = trigger.evaluate(degradedComparisons);
    expect(event).not.toBeNull();
    expect(event?.action).toBe('rollback');
    expect(event?.reason).toContain('slippageBps');
  });

  it('triggers rollback on hard threshold breach', () => {
    const event = trigger.evaluate(hardThresholdBreach);
    expect(event).not.toBeNull();
    expect(event?.reason).toContain('slippage hard breach');
  });

  it('calls rollback handler when triggered', () => {
    const handler = jest.fn();
    trigger.setRollbackHandler(handler);
    trigger.evaluate(degradedComparisons);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].action).toBe('rollback');
  });

  it('does not call handler on healthy metrics', () => {
    const handler = jest.fn();
    trigger.setRollbackHandler(handler);
    trigger.evaluate(goodComparisons);
    expect(handler).not.toHaveBeenCalled();
  });

  it('records events in history', () => {
    trigger.evaluate(degradedComparisons);
    trigger.evaluate(degradedComparisons);
    expect(trigger.getHistory()).toHaveLength(2);
  });

  it('shouldRollback returns false for good metrics', () => {
    expect(trigger.shouldRollback(goodComparisons)).toBe(false);
  });

  it('shouldRollback returns true for degraded metrics', () => {
    expect(trigger.shouldRollback(degradedComparisons)).toBe(true);
  });
});
