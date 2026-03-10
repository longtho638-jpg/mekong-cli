import { StrategyLoader } from '../../../src/testing/backtest/strategy-loader';
import { SignalType } from '../../../src/interfaces/IStrategy';

describe('StrategyLoader', () => {
  it('loads only enabled phases', async () => {
    const loader = new StrategyLoader({
      'phase-a': { enabled: true },
      'phase-b': { enabled: false },
      'phase-c': { enabled: true },
    });
    const instances = await loader.loadStrategies();
    expect(instances.length).toBe(2);
    expect(instances.map(i => i.phaseId)).toEqual(['phase-a', 'phase-c']);
  });

  it('returns empty array when all phases disabled', async () => {
    const loader = new StrategyLoader({
      'p1': { enabled: false },
      'p2': { enabled: false },
    });
    expect((await loader.loadStrategies()).length).toBe(0);
  });

  it('returns empty array with no phases', async () => {
    const loader = new StrategyLoader({});
    expect((await loader.loadStrategies()).length).toBe(0);
  });

  it('each instance has phaseId and strategy', async () => {
    const loader = new StrategyLoader({ 'arb': { enabled: true } });
    const [inst] = await loader.loadStrategies();
    expect(inst.phaseId).toBe('arb');
    expect(inst.strategy).toBeDefined();
    expect(typeof inst.strategy.onCandle).toBe('function');
  });

  it('mock strategy emits valid signals', async () => {
    const loader = new StrategyLoader({ 'test': { enabled: true, sandwichThreshold: 0.0001 } });
    const [inst] = await loader.loadStrategies();
    const candle = { timestamp: Date.now(), open: 50000, high: 50100, low: 49900, close: 50000, volume: 1 };
    const signal = await inst.strategy.onCandle(candle);
    expect(signal).not.toBeNull();
    expect(Object.values(SignalType)).toContain(signal!.type);
  });

  it('createMockStrategy has correct name', () => {
    const loader = new StrategyLoader({});
    const strategy = loader.createMockStrategy('my-phase', { enabled: true });
    expect(strategy.name).toBe('mock-my-phase');
  });
});
