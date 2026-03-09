import { CandidatePromoter } from '../../../src/expansion/genetic-promotion/candidate-promoter';
import type { StrategyPerformance } from '../../../src/expansion/expansion-config-types';

const makePerf = (id: string, sharpe: number): StrategyPerformance => ({
  id, sharpe, totalPnl: sharpe * 100, trades: 50,
});

describe('CandidatePromoter', () => {
  it('promotes candidate when slot is available', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 3 });
    const record = promoter.tryPromote(makePerf('s1', 1.5));
    expect(record).not.toBeNull();
    expect(record!.promoted.id).toBe('s1');
    expect(record!.replaced).toBeNull();
  });

  it('replaces worst when slots are full and candidate is better', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 2 });
    promoter.addLive(makePerf('s1', 1.0));
    promoter.addLive(makePerf('s2', 0.5));
    const record = promoter.tryPromote(makePerf('s3', 2.0));
    expect(record).not.toBeNull();
    expect(record!.replaced?.id).toBe('s2');
  });

  it('rejects candidate when slots full and candidate is not better', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 1 });
    promoter.addLive(makePerf('s1', 2.0));
    const record = promoter.tryPromote(makePerf('s2', 1.0));
    expect(record).toBeNull();
  });

  it('emits promoted event on successful promotion', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 3 });
    const events: unknown[] = [];
    promoter.on('promoted', (r) => events.push(r));
    promoter.tryPromote(makePerf('s1', 1.5));
    expect(events).toHaveLength(1);
  });

  it('emits rejected event when candidate is not better', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 1 });
    promoter.addLive(makePerf('s1', 2.0));
    const events: unknown[] = [];
    promoter.on('rejected', (r) => events.push(r));
    promoter.tryPromote(makePerf('s2', 0.5));
    expect(events).toHaveLength(1);
  });

  it('getLiveStrategies returns all live strategies', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 3 });
    promoter.addLive(makePerf('s1', 1.0));
    promoter.addLive(makePerf('s2', 1.5));
    expect(promoter.getLiveStrategies()).toHaveLength(2);
  });

  it('removeLive removes a strategy by id', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 3 });
    promoter.addLive(makePerf('s1', 1.0));
    expect(promoter.removeLive('s1')).toBe(true);
    expect(promoter.getLiveStrategies()).toHaveLength(0);
  });

  it('getHistory accumulates promotion records', () => {
    const promoter = new CandidatePromoter({ maxLiveCandidates: 3 });
    promoter.tryPromote(makePerf('s1', 1.0));
    promoter.tryPromote(makePerf('s2', 1.5));
    expect(promoter.getHistory()).toHaveLength(2);
  });
});
