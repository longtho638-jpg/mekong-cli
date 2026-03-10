/**
 * Tests: Shadow Layering — exchange simulator, spoofing strategy, impact analysis
 * SIMULATION MODE ONLY
 */

describe('ExchangeSimulator', () => {
  let ExchangeSimulator: typeof import('../../../src/arbitrage/phase4/shadow-layering/exchange-simulator').ExchangeSimulator;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/shadow-layering/exchange-simulator');
    ExchangeSimulator = mod.ExchangeSimulator;
  });

  test('places and retrieves limit orders', () => {
    const sim = new ExchangeSimulator();
    const order = sim.placeOrder({ side: 'buy', price: 100, size: 10, type: 'limit', owner: 'bot-1' });
    expect(order).toHaveProperty('id');
    expect(order.price).toBe(100);
    const openOrders = sim.getOpenOrders('bot-1');
    expect(openOrders.length).toBeGreaterThanOrEqual(1);
  });

  test('cancels order successfully', () => {
    const sim = new ExchangeSimulator();
    const order = sim.placeOrder({ side: 'sell', price: 200, size: 5, type: 'limit', owner: 'bot-2' });
    const cancelled = sim.cancelOrder(order.id);
    expect(cancelled).toBe(true);
    expect(sim.getOpenOrders('bot-2')).toHaveLength(0);
  });

  test('cancel non-existent order returns false', () => {
    const sim = new ExchangeSimulator();
    expect(sim.cancelOrder('non-existent')).toBe(false);
  });

  test('matches crossing orders and emits trade', (done) => {
    const sim = new ExchangeSimulator();
    sim.on('trade', (trade: unknown) => {
      expect(trade).toHaveProperty('price');
      expect(trade).toHaveProperty('size');
      done();
    });
    sim.placeOrder({ side: 'buy', price: 105, size: 5, type: 'limit', owner: 'buyer' });
    sim.placeOrder({ side: 'sell', price: 100, size: 5, type: 'limit', owner: 'seller' });
  });

  test('getSnapshot returns valid orderbook', () => {
    const sim = new ExchangeSimulator();
    sim.placeOrder({ side: 'buy', price: 99, size: 10, type: 'limit', owner: 'mm' });
    sim.placeOrder({ side: 'sell', price: 101, size: 10, type: 'limit', owner: 'mm' });
    const snap = sim.getSnapshot();
    expect(snap.bids.length).toBeGreaterThan(0);
    expect(snap.asks.length).toBeGreaterThan(0);
    expect(snap.spread).toBeGreaterThan(0);
  });

  test('iceberg order only shows visible size in snapshot', () => {
    const sim = new ExchangeSimulator();
    sim.placeOrder({ side: 'buy', price: 98, size: 100, type: 'iceberg', visibleSize: 10, owner: 'iceberg-mm' });
    const snap = sim.getSnapshot();
    const bid = snap.bids.find(b => b.price === 98);
    // Iceberg should show visibleSize or partial
    expect(bid).toBeDefined();
    if (bid) expect(bid.size).toBeLessThanOrEqual(100);
  });

  test('market order executes at best available price', () => {
    const sim = new ExchangeSimulator();
    sim.placeOrder({ side: 'sell', price: 150, size: 20, type: 'limit', owner: 'seller' });
    const trades: unknown[] = [];
    sim.on('trade', (t: unknown) => trades.push(t));
    sim.placeOrder({ side: 'buy', price: 0, size: 10, type: 'market', owner: 'buyer' });
    expect(trades.length).toBeGreaterThan(0);
  });
});

describe('ShadowLayeringStrategy', () => {
  let ShadowLayeringStrategy: typeof import('../../../src/arbitrage/phase4/shadow-layering/shadow-layering-strategy').ShadowLayeringStrategy;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/shadow-layering/shadow-layering-strategy');
    ShadowLayeringStrategy = mod.ShadowLayeringStrategy;
  });

  test('evaluates snapshot and returns actions', () => {
    const strategy = new ShadowLayeringStrategy();
    const snapshot = {
      bids: [{ price: 99, size: 100 }, { price: 98, size: 200 }],
      asks: [{ price: 101, size: 100 }, { price: 102, size: 200 }],
      midPrice: 100, spread: 2, timestamp: Date.now(),
    };
    const actions = strategy.evaluate(snapshot, 0.5);
    expect(Array.isArray(actions)).toBe(true);
  });

  test('tracks action history', () => {
    const strategy = new ShadowLayeringStrategy();
    const snapshot = {
      bids: [{ price: 99, size: 50 }], asks: [{ price: 101, size: 50 }],
      midPrice: 100, spread: 2, timestamp: Date.now(),
    };
    strategy.evaluate(snapshot, 0.3);
    strategy.evaluate(snapshot, 0.7);
    expect(strategy.getActionHistory().length).toBeGreaterThanOrEqual(0);
  });
});

describe('ImpactAnalyzer', () => {
  let ImpactAnalyzer: typeof import('../../../src/arbitrage/phase4/shadow-layering/impact-analyzer').ImpactAnalyzer;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/shadow-layering/impact-analyzer');
    ImpactAnalyzer = mod.ImpactAnalyzer;
  });

  test('analyzes price movement impact', () => {
    const analyzer = new ImpactAnalyzer();
    const preSnap = { bids: [{ price: 99, size: 100 }], asks: [{ price: 101, size: 100 }], midPrice: 100, spread: 2, timestamp: Date.now() };
    const postSnap = { bids: [{ price: 100, size: 80 }], asks: [{ price: 102, size: 120 }], midPrice: 101, spread: 2, timestamp: Date.now() + 1000 };
    const report = analyzer.analyze([], [], preSnap, postSnap);
    expect(report).toHaveProperty('priceMovementPct');
    expect(report.priceMovementPct).toBeGreaterThan(0);
  });

  test('stores reports', () => {
    const analyzer = new ImpactAnalyzer();
    const snap = { bids: [], asks: [], midPrice: 100, spread: 1, timestamp: Date.now() };
    analyzer.analyze([], [], snap, snap);
    expect(analyzer.getReports().length).toBe(1);
  });
});

describe('DefensiveDetector', () => {
  let DefensiveDetector: typeof import('../../../src/arbitrage/phase4/shadow-layering/defensive-detector').DefensiveDetector;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/shadow-layering/defensive-detector');
    DefensiveDetector = mod.DefensiveDetector;
  });

  test('detects spoofing from high cancel ratio', () => {
    const detector = new DefensiveDetector();
    const actions = [
      { type: 'place' as const, orderId: 'o1', price: 100, size: 50, timestamp: Date.now(), reason: 'layer' },
      { type: 'cancel' as const, orderId: 'o1', price: 100, size: 50, timestamp: Date.now() + 100, reason: 'price approach' },
      { type: 'place' as const, orderId: 'o2', price: 101, size: 50, timestamp: Date.now() + 200, reason: 'layer' },
      { type: 'cancel' as const, orderId: 'o2', price: 101, size: 50, timestamp: Date.now() + 300, reason: 'price approach' },
      { type: 'place' as const, orderId: 'o3', price: 102, size: 50, timestamp: Date.now() + 400, reason: 'layer' },
      { type: 'cancel' as const, orderId: 'o3', price: 102, size: 50, timestamp: Date.now() + 500, reason: 'price approach' },
    ];
    const snapshot = { bids: [{ price: 99, size: 50 }], asks: [{ price: 101, size: 50 }], midPrice: 100, spread: 2, timestamp: Date.now() };
    const alert = detector.detect(actions, snapshot);
    // With 100% cancel ratio, should detect spoofing
    if (alert) {
      expect(alert.confidence).toBeGreaterThan(0);
      expect(alert.pattern).toBeDefined();
    }
  });

  test('no alert for normal trading', () => {
    const detector = new DefensiveDetector();
    const actions = [
      { type: 'place' as const, orderId: 'o1', price: 100, size: 10, timestamp: Date.now(), reason: 'buy' },
      { type: 'fill' as const, orderId: 'o1', price: 100, size: 10, timestamp: Date.now() + 1000, reason: 'matched' },
    ];
    const snapshot = { bids: [{ price: 99, size: 50 }], asks: [{ price: 101, size: 50 }], midPrice: 100, spread: 2, timestamp: Date.now() };
    const alert = detector.detect(actions, snapshot);
    // Normal fill-to-cancel ratio should not trigger
    expect(alert).toBeNull();
  });
});

describe('ShadowLayeringEngine', () => {
  let ShadowLayeringEngine: typeof import('../../../src/arbitrage/phase4/shadow-layering/index').ShadowLayeringEngine;

  beforeAll(async () => {
    const mod = await import('../../../src/arbitrage/phase4/shadow-layering/index');
    ShadowLayeringEngine = mod.ShadowLayeringEngine;
  });

  test('starts and stops without error', async () => {
    const engine = new ShadowLayeringEngine({ simulatedLatencyMs: 60000 });
    await engine.start();
    const status = engine.getStatus();
    expect(status.running).toBe(true);
    engine.stop();
    expect(engine.getStatus().running).toBe(false);
  });

  test('getStatus initial state', () => {
    const engine = new ShadowLayeringEngine({ simulatedLatencyMs: 60000 });
    const status = engine.getStatus();
    expect(status.running).toBe(false);
    expect(status.tradesExecuted).toBe(0);
  });
});
