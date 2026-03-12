import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetTracker } from '../../src/constraints/budget.js';
import { ConstraintChecker } from '../../src/constraints/checker.js';

describe('BudgetTracker', () => {
  let tracker: BudgetTracker;

  beforeEach(() => {
    tracker = new BudgetTracker();
  });

  it('starts and checks task budget', () => {
    tracker.startTask('t1', { maxCost: 1.0, maxTokens: 100000, maxTimeSeconds: 300, warnAtPercent: 80 });
    const status = tracker.checkBudget('t1');
    expect(status.withinLimits).toBe(true);
    expect(status.costUsed).toBe(0);
  });

  it('records usage and calculates cost', () => {
    tracker.startTask('t1', { maxCost: 1.0, maxTokens: 100000, maxTimeSeconds: 300, warnAtPercent: 80 });
    tracker.recordUsage('t1', { inputTokens: 1000, outputTokens: 500, model: 'deepseek-chat', provider: 'deepseek' });
    const status = tracker.checkBudget('t1');
    expect(status.costUsed).toBeGreaterThan(0);
    expect(status.tokensUsed).toBe(1500);
  });

  it('detects budget exceeded', () => {
    tracker.startTask('t1', { maxCost: 0.001, maxTokens: 100, maxTimeSeconds: 300, warnAtPercent: 50 });
    tracker.recordUsage('t1', { inputTokens: 50000, outputTokens: 50000, model: 'gpt-4o', provider: 'openai' });
    const status = tracker.checkBudget('t1');
    expect(status.withinLimits).toBe(false);
  });

  it('generates report with breakdown', () => {
    tracker.startTask('t1', { maxCost: 1.0, maxTokens: 100000, maxTimeSeconds: 300, warnAtPercent: 80 });
    tracker.recordUsage('t1', { inputTokens: 1000, outputTokens: 500, model: 'gpt-4o', provider: 'openai' });
    const report = tracker.getReport('t1');
    expect(report.breakdown).toHaveLength(1);
    expect(report.breakdown[0].model).toBe('openai/gpt-4o');
  });

  it('returns safe status for unknown task', () => {
    const status = tracker.checkBudget('nonexistent');
    expect(status.withinLimits).toBe(true);
    expect(status.costUsed).toBe(0);
  });

  it('accumulates multiple calls', () => {
    tracker.startTask('t1', { maxCost: 10, maxTokens: 1000000, maxTimeSeconds: 300, warnAtPercent: 80 });
    tracker.recordUsage('t1', { inputTokens: 1000, outputTokens: 500, model: 'gpt-4o', provider: 'openai' });
    tracker.recordUsage('t1', { inputTokens: 2000, outputTokens: 1000, model: 'gpt-4o', provider: 'openai' });
    const status = tracker.checkBudget('t1');
    expect(status.tokensUsed).toBe(4500);
  });

  it('removes task on endTask', () => {
    tracker.startTask('t1', { maxCost: 1.0, maxTokens: 100000, maxTimeSeconds: 300, warnAtPercent: 80 });
    tracker.endTask('t1');
    const status = tracker.checkBudget('t1');
    expect(status.costUsed).toBe(0);
    expect(status.costLimit).toBe(0);
  });

  it('uses zero cost for ollama model', () => {
    tracker.startTask('t1', { maxCost: 1.0, maxTokens: 100000, maxTimeSeconds: 300, warnAtPercent: 80 });
    tracker.recordUsage('t1', { inputTokens: 100000, outputTokens: 100000, model: 'ollama', provider: 'local' });
    const status = tracker.checkBudget('t1');
    expect(status.costUsed).toBe(0);
    expect(status.withinLimits).toBe(false); // token limit exceeded
  });
});

describe('ConstraintChecker', () => {
  let checker: ConstraintChecker;

  beforeEach(() => {
    checker = new ConstraintChecker();
  });

  it('allows valid context', () => {
    const result = checker.check({ iteration: 1, tokensUsed: 100, timeElapsedSeconds: 10 });
    expect(result.ok).toBe(true);
  });

  it('stops after 3 consecutive failures', () => {
    checker.check({ iteration: 1, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.check({ iteration: 2, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    const result = checker.check({ iteration: 3, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    expect(result.ok).toBe(false);
    expect(result.severity).toBe('critical');
  });

  it('resets failure counter on success', () => {
    checker.check({ iteration: 1, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.check({ iteration: 2, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.check({ iteration: 3, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: false });
    const result = checker.check({ iteration: 4, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    expect(result.ok).toBe(true); // only 1 failure now
  });

  it('enforces time limit with identity', () => {
    checker.setIdentity({
      name: 'test',
      personality: '',
      boundaries: [],
      communicationStyle: [],
      scopeControls: { wipLimit: 3, maxTaskDepth: 5, maxTokensPerTurn: 4096, timeLimit: 10 },
      qualityGates: [],
      escalationProtocol: {},
    });
    const result = checker.check({ iteration: 1, tokensUsed: 100, timeElapsedSeconds: 20 });
    expect(result.ok).toBe(false);
    expect(result.violation).toContain('Time limit');
  });

  it('enforces iteration limit', () => {
    const result = checker.check({ iteration: 50, tokensUsed: 100, timeElapsedSeconds: 10 });
    expect(result.ok).toBe(false);
    expect(result.violation).toContain('Iteration limit');
    expect(result.severity).toBe('error');
  });

  it('enforces token limit as warning', () => {
    const result = checker.check({ iteration: 1, tokensUsed: 10000, timeElapsedSeconds: 10 });
    expect(result.ok).toBe(false);
    expect(result.severity).toBe('warning');
    expect(result.violation).toContain('Token limit');
  });

  it('resetFailures clears counter', () => {
    checker.check({ iteration: 1, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.check({ iteration: 2, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.resetFailures();
    // After reset, need 3 more failures to trigger critical
    checker.check({ iteration: 3, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    checker.check({ iteration: 4, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    const result = checker.check({ iteration: 5, tokensUsed: 100, timeElapsedSeconds: 10, lastActionFailed: true });
    expect(result.ok).toBe(false);
    expect(result.severity).toBe('critical');
  });
});
