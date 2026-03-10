import { StrategyEvaluator } from '../../../src/expansion/genetic-promotion/strategy-evaluator';
import type { StrategyPerformance } from '../../../src/expansion/expansion-config-types';

const makePerf = (id: string, sharpe: number): StrategyPerformance => ({
  id, sharpe, totalPnl: sharpe * 100, trades: 50,
});

describe('StrategyEvaluator', () => {
  it('record stores performance', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    evaluator.record(makePerf('s1', 1.5));
    expect(evaluator.getPerformance('s1')).toBeDefined();
  });

  it('getTopPerformers returns strategies above threshold', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    evaluator.record(makePerf('s1', 1.5));
    evaluator.record(makePerf('s2', 0.5));
    const top = evaluator.getTopPerformers();
    expect(top).toHaveLength(1);
    expect(top[0].id).toBe('s1');
  });

  it('getWorstPerformer returns strategy with lowest sharpe', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    evaluator.record(makePerf('s1', 2.0));
    evaluator.record(makePerf('s2', 0.3));
    evaluator.record(makePerf('s3', 1.2));
    expect(evaluator.getWorstPerformer()?.id).toBe('s2');
  });

  it('getWorstPerformer returns null when no strategies', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    expect(evaluator.getWorstPerformer()).toBeNull();
  });

  it('getRanked returns descending order by sharpe', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    evaluator.record(makePerf('s1', 0.5));
    evaluator.record(makePerf('s2', 2.0));
    evaluator.record(makePerf('s3', 1.2));
    const ranked = evaluator.getRanked();
    expect(ranked[0].sharpe).toBeGreaterThanOrEqual(ranked[1].sharpe);
    expect(ranked[1].sharpe).toBeGreaterThanOrEqual(ranked[2].sharpe);
  });

  it('remove deletes strategy and returns true', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    evaluator.record(makePerf('s1', 1.5));
    expect(evaluator.remove('s1')).toBe(true);
    expect(evaluator.getPerformance('s1')).toBeUndefined();
  });

  it('remove returns false for unknown id', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    expect(evaluator.remove('unknown')).toBe(false);
  });

  it('emits above-threshold when sharpe >= threshold', () => {
    const evaluator = new StrategyEvaluator({ sharpeThreshold: 1.0 });
    const events: unknown[] = [];
    evaluator.on('above-threshold', (p) => events.push(p));
    evaluator.record(makePerf('s1', 1.5));
    expect(events).toHaveLength(1);
  });
});
