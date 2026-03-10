import { SimulationEngine, SimulationConfig } from '../../../src/testing/backtest/simulation-engine';
import { StateManager } from '../../../src/testing/backtest/state-manager';
import { MetricsCollector } from '../../../src/testing/backtest/metrics-collector';
import { MarketDataEvent } from '../../../src/testing/backtest/data-loader';

function makeEngine(seed = 42): { engine: SimulationEngine; state: StateManager; metrics: MetricsCollector } {
  const config: SimulationConfig = { latencyMs: 100, batchSize: 10, deterministicSeed: seed, fees: { binance: { maker: 0.001, taker: 0.001 }, default: { fee: 0.001 } } };
  const state = new StateManager(10000);
  const metrics = new MetricsCollector(0.04);
  const engine = new SimulationEngine(config, state, metrics);
  return { engine, state, metrics };
}

function makeEvents(count: number): MarketDataEvent[] {
  const base = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: base + i * 1000,
    source: 'binance',
    type: 'trade' as const,
    price: 50000 + i * 10,
    volume: 0.1,
  }));
}

describe('SimulationEngine', () => {
  it('processes events without throwing', async () => {
    const { engine } = makeEngine();
    const events = makeEvents(20);
    await expect(engine.runSimulation(events, [])).resolves.toBeUndefined();
  });

  it('applies slippage: buy increases price', () => {
    const { engine } = makeEngine();
    const base = 50000;
    const slipped = engine.applySlippage(base, 1, 'buy');
    expect(slipped).toBeGreaterThan(base);
  });

  it('applies slippage: sell decreases price', () => {
    const { engine } = makeEngine();
    const base = 50000;
    const slipped = engine.applySlippage(base, 1, 'sell');
    expect(slipped).toBeLessThan(base);
  });

  it('slippage is proportional to volume', () => {
    const { engine } = makeEngine();
    const small = engine.applySlippage(50000, 0.1, 'buy');
    const large = engine.applySlippage(50000, 5, 'buy');
    expect(large).toBeGreaterThan(small);
  });

  it('applies fees correctly', () => {
    const { engine } = makeEngine();
    const fee = engine.applyFees(1000, 'binance', 'taker');
    expect(fee).toBeCloseTo(1, 5);
  });

  it('falls back to default fees for unknown exchange', () => {
    const { engine } = makeEngine();
    const fee = engine.applyFees(1000, 'unknown-exchange', 'taker');
    expect(fee).toBeCloseTo(1, 5);
  });

  it('simulateLatency returns value within [0, latencyMs)', () => {
    const { engine } = makeEngine();
    for (let i = 0; i < 20; i++) {
      const latency = engine.simulateLatency();
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(latency).toBeLessThan(100);
    }
  });

  it('is deterministic: same seed produces same latency sequence', () => {
    const { engine: e1 } = makeEngine(99);
    const { engine: e2 } = makeEngine(99);
    const seq1 = Array.from({ length: 5 }, () => e1.simulateLatency());
    const seq2 = Array.from({ length: 5 }, () => e2.simulateLatency());
    expect(seq1).toEqual(seq2);
  });

  it('records equity points after simulation', async () => {
    const { engine, state } = makeEngine();
    const events = makeEvents(5);
    await engine.runSimulation(events, []);
    expect(state.getEquityCurve().length).toBeGreaterThan(0);
  });

  it('processes in batches without skipping events', async () => {
    const config: SimulationConfig = { latencyMs: 10, batchSize: 3, deterministicSeed: 1 };
    const state = new StateManager(10000);
    const metrics = new MetricsCollector(0.04);
    const engine = new SimulationEngine(config, state, metrics);
    const events = makeEvents(10);
    await engine.runSimulation(events, []);
    expect(state.getEquityCurve().length).toBe(10);
  });
});
