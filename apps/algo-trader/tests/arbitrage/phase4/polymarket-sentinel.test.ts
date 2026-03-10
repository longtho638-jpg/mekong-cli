/**
 * Tests: Polymarket Sentinel — news ingestion, NLP, signal fusion, simulated trading
 * SIMULATION MODE ONLY
 */

describe('NewsIngestor', () => {
  let NewsIngestor: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/news-ingestor').NewsIngestor;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/news-ingestor');
    NewsIngestor = mod.NewsIngestor;
  });

  test('creates instance and starts/stops', () => {
    const ingestor = new NewsIngestor();
    ingestor.start();
    expect(ingestor.getStats().itemsProcessed).toBeGreaterThanOrEqual(0);
    ingestor.stop();
  });

  test('injectNews emits news event', (done) => {
    const ingestor = new NewsIngestor();
    ingestor.start();
    ingestor.on('news', (item: unknown) => {
      expect(item).toHaveProperty('headline');
      ingestor.stop();
      done();
    });
    ingestor.injectNews({
      id: 'test-1', timestamp: Date.now(), headline: 'Bitcoin surges to new high',
      source: 'mock', sentiment: 0.8, category: 'crypto',
    });
  });

  test('does not emit when stopped', () => {
    const ingestor = new NewsIngestor();
    const handler = jest.fn();
    ingestor.on('news', handler);
    ingestor.injectNews({
      id: 'test-2', timestamp: Date.now(), headline: 'Test',
      source: 'mock', sentiment: 0, category: 'test',
    });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('PredictionMarketFetcher', () => {
  let PredictionMarketFetcher: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/prediction-market-fetcher').PredictionMarketFetcher;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/prediction-market-fetcher');
    PredictionMarketFetcher = mod.PredictionMarketFetcher;
  });

  test('fetches mock contracts', () => {
    const fetcher = new PredictionMarketFetcher();
    const contracts = fetcher.fetchContracts();
    expect(contracts.length).toBeGreaterThan(0);
    expect(contracts[0]).toHaveProperty('yesPrice');
    expect(contracts[0]).toHaveProperty('noPrice');
  });

  test('starts and stops without error', () => {
    const fetcher = new PredictionMarketFetcher();
    fetcher.start();
    expect(fetcher.getStats().contractsFetched).toBeGreaterThanOrEqual(0);
    fetcher.stop();
  });
});

describe('NlpProcessor', () => {
  let NlpProcessor: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/nlp-processor').NlpProcessor;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/nlp-processor');
    NlpProcessor = mod.NlpProcessor;
  });

  test('bullish headlines get positive score', () => {
    const nlp = new NlpProcessor();
    const result = nlp.analyzeSentiment('Bitcoin surges as bull market continues rally');
    expect(result.score).toBeGreaterThan(0);
  });

  test('bearish headlines get negative score', () => {
    const nlp = new NlpProcessor();
    const result = nlp.analyzeSentiment('Market crash fears as recession deepens');
    expect(result.score).toBeLessThan(0);
  });

  test('neutral headlines get near-zero score', () => {
    const nlp = new NlpProcessor();
    const result = nlp.analyzeSentiment('Weather update for Tuesday afternoon');
    expect(Math.abs(result.score)).toBeLessThan(0.5);
  });

  test('batchAnalyze processes multiple headlines', () => {
    const nlp = new NlpProcessor();
    const results = nlp.batchAnalyze(['Bull run continues', 'Crash imminent', 'Cloudy skies']);
    expect(results).toHaveLength(3);
  });
});

describe('SignalFusionEngine', () => {
  let SignalFusionEngine: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/signal-fusion-engine').SignalFusionEngine;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/signal-fusion-engine');
    SignalFusionEngine = mod.SignalFusionEngine;
  });

  test('fuses bullish NLP + high market prob into bullish signal', () => {
    const engine = new SignalFusionEngine();
    const signal = engine.fuse([0.8, 0.6], [0.75, 0.8]);
    expect(signal.direction).toBe('bullish');
    expect(signal.strength).toBeGreaterThan(0.5);
  });

  test('fuses bearish NLP + low market prob into bearish signal', () => {
    const engine = new SignalFusionEngine();
    const signal = engine.fuse([-0.8, -0.6], [0.2, 0.15]);
    expect(signal.direction).toBe('bearish');
  });

  test('tracks signal history', () => {
    const engine = new SignalFusionEngine();
    engine.fuse([0.5], [0.6]);
    engine.fuse([-0.3], [0.4]);
    expect(engine.getHistory().length).toBe(2);
  });
});

describe('AssetCorrelator', () => {
  let AssetCorrelator: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/asset-correlator').AssetCorrelator;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/asset-correlator');
    AssetCorrelator = mod.AssetCorrelator;
  });

  test('returns correlation for known asset', () => {
    const correlator = new AssetCorrelator();
    const signal = { direction: 'bullish' as const, strength: 0.8, confidence: 0.9, timestamp: Date.now(), components: { nlpScore: 0.8, marketProb: 0.75 } };
    const result = correlator.getCorrelation('BTC', signal);
    expect(result).toHaveProperty('expectedReturn');
    expect(result).toHaveProperty('confidence');
  });

  test('returns low confidence for unknown asset', () => {
    const correlator = new AssetCorrelator();
    const signal = { direction: 'neutral' as const, strength: 0.1, confidence: 0.3, timestamp: Date.now(), components: { nlpScore: 0, marketProb: 0.5 } };
    const result = correlator.getCorrelation('UNKNOWN_COIN', signal);
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

describe('SentinelExecutor', () => {
  let SentinelExecutor: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/executor').SentinelExecutor;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/executor');
    SentinelExecutor = mod.SentinelExecutor;
  });

  test('generates trade when signal exceeds threshold', () => {
    const exec = new SentinelExecutor();
    const signal = { direction: 'bullish' as const, strength: 0.9, confidence: 0.85, timestamp: Date.now(), components: { nlpScore: 0.9, marketProb: 0.85 } };
    const trade = exec.evaluateAndExecute(signal, 0.7);
    expect(trade).not.toBeNull();
    expect(trade!.side).toBe('buy');
  });

  test('returns null when signal below threshold', () => {
    const exec = new SentinelExecutor();
    const signal = { direction: 'neutral' as const, strength: 0.3, confidence: 0.4, timestamp: Date.now(), components: { nlpScore: 0.1, marketProb: 0.5 } };
    const trade = exec.evaluateAndExecute(signal, 0.7);
    expect(trade).toBeNull();
  });

  test('tracks simulated PnL', () => {
    const exec = new SentinelExecutor();
    const signal = { direction: 'bearish' as const, strength: 0.85, confidence: 0.8, timestamp: Date.now(), components: { nlpScore: -0.8, marketProb: 0.2 } };
    exec.evaluateAndExecute(signal, 0.5);
    const stats = exec.getStats();
    expect(stats.trades).toBe(1);
  });
});

describe('PolymarketSentinelEngine', () => {
  let PolymarketSentinelEngine: typeof import('../../../src/arbitrage/phase4/polymarket-sentinel/index').PolymarketSentinelEngine;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/polymarket-sentinel/index');
    PolymarketSentinelEngine = mod.PolymarketSentinelEngine;
  });

  test('starts and stops without error', async () => {
    const engine = new PolymarketSentinelEngine({ pollIntervalMs: 60000 });
    await engine.start();
    const status = engine.getStatus();
    expect(status.running).toBe(true);
    engine.stop();
    expect(engine.getStatus().running).toBe(false);
  });

  test('getStatus reflects initial state', () => {
    const engine = new PolymarketSentinelEngine({ pollIntervalMs: 60000 });
    const status = engine.getStatus();
    expect(status.running).toBe(false);
    expect(status.newsProcessed).toBe(0);
    expect(status.signalsGenerated).toBe(0);
  });
});
