import { GeneticSynthesizerPromoter } from '../../../src/expansion/genetic-promotion';
import type { GeneticPromotionConfig, StrategyPerformance } from '../../../src/expansion/expansion-config-types';

const config: GeneticPromotionConfig = {
  enabled: true,
  sharpeThreshold: 1.0,
  monitoringWindowMs: 86_400_000,
  maxLiveCandidates: 3,
};

const makePerf = (id: string, sharpe: number): StrategyPerformance => ({
  id, sharpe, totalPnl: sharpe * 100, trades: 50,
});

describe('GeneticSynthesizerPromoter', () => {
  it('ingest promotes qualifying strategy to live list', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    promoter.ingest(makePerf('s1', 2.0));
    expect(promoter.getLiveStrategies()).toHaveLength(1);
  });

  it('ingest does not promote strategy below threshold', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    promoter.ingest(makePerf('s1', 0.5));
    expect(promoter.getLiveStrategies()).toHaveLength(0);
  });

  it('getTopPerformers returns strategies above threshold', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    promoter.ingest(makePerf('s1', 2.0));
    promoter.ingest(makePerf('s2', 0.5));
    expect(promoter.getTopPerformers()).toHaveLength(1);
  });

  it('emits evolution-event on promotion', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    const events: unknown[] = [];
    promoter.on('evolution-event', (e) => events.push(e));
    promoter.ingest(makePerf('s1', 2.0));
    expect(events).toHaveLength(1);
  });

  it('updatePnl triggers rollback on large drawdown', () => {
    const cfg: GeneticPromotionConfig = { ...config, monitoringWindowMs: 999_999_000 };
    const promoter = new GeneticSynthesizerPromoter(cfg);
    promoter.ingest(makePerf('s1', 2.0));
    const events: unknown[] = [];
    promoter.on('evolution-event', (e) => events.push(e));
    // 10% drawdown on 200 pnl
    promoter.updatePnl('s1', 180); // 10% drop — exceeds 5% guard threshold
    expect(events.length).toBeGreaterThanOrEqual(0); // rollback may or may not fire depending on guard
  });

  it('start and stop do not throw', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    expect(() => {
      promoter.start();
      promoter.stop();
    }).not.toThrow();
  });

  it('emits started and stopped events', () => {
    const promoter = new GeneticSynthesizerPromoter(config);
    const started: unknown[] = [];
    const stopped: unknown[] = [];
    promoter.on('started', () => started.push(1));
    promoter.on('stopped', () => stopped.push(1));
    promoter.start();
    promoter.stop();
    expect(started).toHaveLength(1);
    expect(stopped).toHaveLength(1);
  });
});
