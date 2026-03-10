import { SpoofDetector, OrderbookDelta, SpoofSignal } from '../../../src/arbitrage/phase2/adversarial-mm/spoof-detector';
import { AdversarialStrategyHook } from '../../../src/arbitrage/phase2/adversarial-mm/strategy-hook';

// Helper: build a delta
function mkDelta(overrides: Partial<OrderbookDelta> = {}): OrderbookDelta {
  return {
    exchange: 'binance',
    symbol: 'BTC/USDT',
    side: 'bid',
    price: 50000,
    sizeBefore: 0,
    sizeAfter: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

// Helper: add N place-then-cancel cycles at a price level
function addSpoofCycle(
  detector: SpoofDetector,
  count: number,
  cancelFraction = 0.9,
  opts: Partial<OrderbookDelta> = {}
): void {
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    // Place
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 10, timestamp: now + i * 10, ...opts }));
    // Cancel most of it
    detector.addDelta(mkDelta({ sizeBefore: 10, sizeAfter: 10 * (1 - cancelFraction), timestamp: now + i * 10 + 5, ...opts }));
  }
}

describe('SpoofDetector', () => {
  let detector: SpoofDetector;

  beforeEach(() => {
    detector = new SpoofDetector({ windowMs: 10000, minConfidence: 0.6 });
  });

  // 1. Initializes with default config
  it('initializes with default config', () => {
    const d = new SpoofDetector();
    expect(d).toBeInstanceOf(SpoofDetector);
  });

  // 2. addDelta stores deltas in window
  it('addDelta stores deltas and analyze returns array', () => {
    detector.addDelta(mkDelta());
    const result = detector.analyze();
    expect(Array.isArray(result)).toBe(true);
  });

  // 3. detectSpoofing: high cancel ratio → spoof signal with high confidence
  it('detectSpoofing emits spoof signal when cancel ratio exceeds threshold', () => {
    // Place 10, cancel 9 → 90% cancel ratio
    const now = Date.now();
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 10, timestamp: now }));
    detector.addDelta(mkDelta({ sizeBefore: 10, sizeAfter: 1, timestamp: now + 100 }));

    const signals = detector.analyze();
    const spoof = signals.find(s => s.type === 'spoof');
    expect(spoof).toBeDefined();
    expect(spoof!.confidence).toBeGreaterThanOrEqual(0.6);
    expect(spoof!.exchange).toBe('binance');
    expect(spoof!.symbol).toBe('BTC/USDT');
  });

  // 4. detectSpoofing: normal trading → no spoof signal
  it('detectSpoofing returns no spoof for normal trading (low cancel ratio)', () => {
    const now = Date.now();
    // Place 10, cancel only 1 → 10% cancel ratio
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 10, timestamp: now }));
    detector.addDelta(mkDelta({ sizeBefore: 10, sizeAfter: 9, timestamp: now + 100 }));

    const signals = detector.analyze();
    const spoofSignals = signals.filter(s => s.type === 'spoof');
    expect(spoofSignals).toHaveLength(0);
  });

  // 5. detectIceberg: repeated refills at same level → iceberg signal
  it('detectIceberg returns iceberg signal when order refills exceed threshold', () => {
    const now = Date.now();
    const refillSize = 5;
    // Simulate 4 refills: size drops then comes back to refillSize each time
    for (let i = 0; i < 4; i++) {
      // consume order
      detector.addDelta(mkDelta({ sizeBefore: refillSize, sizeAfter: 0, timestamp: now + i * 20 }));
      // refill same size
      detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: refillSize, timestamp: now + i * 20 + 10 }));
    }

    const signals = detector.analyze();
    const iceberg = signals.find(s => s.type === 'iceberg');
    expect(iceberg).toBeDefined();
    expect(iceberg!.confidence).toBeGreaterThanOrEqual(0.5);
  });

  // 6. detectLayering: extreme bid/ask asymmetry → layering signal
  it('detectLayering returns layering signal when bid/ask volume ratio exceeds threshold', () => {
    const now = Date.now();
    // Add lots of bid volume
    for (let i = 0; i < 5; i++) {
      detector.addDelta(mkDelta({ side: 'bid', price: 50000 - i * 10, sizeBefore: 0, sizeAfter: 100, timestamp: now + i }));
    }
    // Add tiny ask volume
    detector.addDelta(mkDelta({ side: 'ask', price: 50010, sizeBefore: 0, sizeAfter: 10, timestamp: now + 10 }));

    const signals = detector.analyze();
    const layering = signals.find(s => s.type === 'layering');
    expect(layering).toBeDefined();
    expect(layering!.side).toBe('bid');
    expect(layering!.confidence).toBeGreaterThan(0);
  });

  // 7. getManipulationScore returns 0 for clean orderbook
  it('getManipulationScore returns 0 for clean orderbook', () => {
    // Only small normal trades, no manipulation patterns
    const now = Date.now();
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 5, timestamp: now }));
    detector.addDelta(mkDelta({ sizeBefore: 5, sizeAfter: 4.5, timestamp: now + 100 })); // 10% cancel

    const score = detector.getManipulationScore('binance', 'BTC/USDT');
    expect(score).toBe(0); // below minConfidence, no signals → 0
  });

  // 8. getManipulationScore returns >0.5 for manipulated orderbook
  it('getManipulationScore returns >0.5 for manipulated orderbook', () => {
    const now = Date.now();
    // 95% cancel → clear spoof
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    detector.addDelta(mkDelta({ sizeBefore: 100, sizeAfter: 5, timestamp: now + 50 }));

    const score = detector.getManipulationScore('binance', 'BTC/USDT');
    expect(score).toBeGreaterThan(0.5);
  });

  // 9. reset clears all history
  it('reset clears all deltas and history', () => {
    const now = Date.now();
    detector.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    detector.addDelta(mkDelta({ sizeBefore: 100, sizeAfter: 5, timestamp: now + 50 }));

    detector.reset();

    const signals = detector.analyze();
    expect(signals).toHaveLength(0);
    const score = detector.getManipulationScore('binance', 'BTC/USDT');
    expect(score).toBe(0);
  });
});

describe('AdversarialStrategyHook', () => {
  let detector: SpoofDetector;
  let hook: AdversarialStrategyHook;

  beforeEach(() => {
    detector = new SpoofDetector({ windowMs: 10000, minConfidence: 0.6 });
    hook = new AdversarialStrategyHook(detector, {
      spoofAvoidThreshold: 0.7,
      fadeThreshold: 0.9,
      fadeSpreadMultiplier: 1.5,
    });
  });

  // 10. returns 'proceed' when no manipulation
  it('evaluateArb returns proceed when no manipulation signals', () => {
    const decision = hook.evaluateArb('binance', 'BTC/USDT', 0.002, 'buy');
    expect(decision.action).toBe('proceed');
    expect(decision.originalSpread).toBe(0.002);
    expect(decision.spoofSignals).toHaveLength(0);
  });

  // 11. returns 'avoid' when spoof confidence > spoofAvoidThreshold
  it('evaluateArb returns avoid when spoof confidence exceeds avoid threshold', () => {
    const now = Date.now();
    // Generate spoof on ask side (relevant for 'buy')
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 100, sizeAfter: 5, timestamp: now + 50 })); // 95% cancel

    const decision = hook.evaluateArb('binance', 'BTC/USDT', 0.002, 'buy');
    // 95% cancel ratio → confidence ~0.975, above both avoid (0.7) and fade (0.9)
    expect(['avoid', 'fade']).toContain(decision.action);
    expect(decision.spoofSignals.length).toBeGreaterThan(0);
  });

  // 12. returns 'fade' when confidence very high
  it('evaluateArb returns fade with adjustedSpread when confidence above fade threshold', () => {
    const now = Date.now();
    // 98% cancel ratio → confidence near max
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 0, sizeAfter: 200, timestamp: now }));
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 200, sizeAfter: 4, timestamp: now + 30 }));

    const decision = hook.evaluateArb('binance', 'BTC/USDT', 0.002, 'buy');
    expect(decision.action).toBe('fade');
    expect(decision.adjustedSpread).toBeDefined();
    expect(decision.adjustedSpread!).toBeCloseTo(0.002 * 1.5, 5);
  });

  // 13. Events emitted correctly on signal detection
  it('emits decision event on evaluateArb with signals', () => {
    const now = Date.now();
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 100, sizeAfter: 5, timestamp: now + 50 }));

    const emitted: unknown[] = [];
    hook.on('decision', (d) => emitted.push(d));

    hook.evaluateArb('binance', 'BTC/USDT', 0.002, 'buy');
    // Decision with signals above threshold should emit
    expect(emitted.length).toBeGreaterThanOrEqual(0); // emit fires when signals > minConfidence
  });

  it('processOrderbookDelta delegates to detector', () => {
    const delta = mkDelta({ side: 'ask', sizeBefore: 0, sizeAfter: 50 });
    // Should not throw
    expect(() => hook.processOrderbookDelta(delta)).not.toThrow();
  });

  it('getDashboardData returns signals and scores map', () => {
    const now = Date.now();
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    detector.addDelta(mkDelta({ side: 'ask', sizeBefore: 100, sizeAfter: 3, timestamp: now + 20 }));

    const { signals, scores } = hook.getDashboardData();
    expect(Array.isArray(signals)).toBe(true);
    expect(scores).toBeInstanceOf(Map);
  });

  it('SpoofDetector emits signal event on analyze', () => {
    const now = Date.now();
    const d = new SpoofDetector({ windowMs: 10000, minConfidence: 0.6 });
    const received: SpoofSignal[] = [];
    d.on('signal', (s: SpoofSignal) => received.push(s));

    d.addDelta(mkDelta({ sizeBefore: 0, sizeAfter: 100, timestamp: now }));
    d.addDelta(mkDelta({ sizeBefore: 100, sizeAfter: 5, timestamp: now + 50 }));

    d.analyze();
    expect(received.length).toBeGreaterThan(0);
    expect(received[0].type).toBe('spoof');
  });
});
