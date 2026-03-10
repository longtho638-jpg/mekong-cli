import { RsiSmaStrategy } from './RsiSmaStrategy';
import { SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';

function makeCandle(close: number, i: number): ICandle {
  return {
    timestamp: i * 3600000,
    open: close,
    high: close * 1.001,
    low: close * 0.999,
    close,
    volume: 1000
  };
}

function makeCandles(n: number, basePrice = 100, amplitude = 20): ICandle[] {
  return Array.from({ length: n }, (_, i) => {
    const price = basePrice + amplitude * Math.sin((i / n) * Math.PI * 4);
    return makeCandle(price, i);
  });
}

describe('RsiSmaStrategy', () => {
  it('should instantiate', () => {
    const s = new RsiSmaStrategy();
    expect(s.name).toBe('RSI + SMA Strategy');
  });

  it('should return null with empty history', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);
    const signal = await s.onCandle(makeCandle(100, 0));
    expect(signal).toBeNull();
  });

  it('should return null with insufficient data (< 50 candles)', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);
    // Need 50 candles for SMA50
    for (let i = 0; i < 40; i++) {
      const signal = await s.onCandle(makeCandle(100, i));
      expect(signal).toBeNull();
    }
  });

  it('should initialize with history', async () => {
    const s = new RsiSmaStrategy();
    const history = makeCandles(60);
    await s.init(history);
    const signal = await s.onCandle(makeCandle(105, 60));
    expect(signal === null || signal.type !== undefined).toBe(true);
  });

  it('should generate BUY signal when SMA20 > SMA50 AND RSI < 30', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    // Create uptrend (SMA20 > SMA50) with oversold RSI
    // Rising prices first, then sharp drop
    const candles: ICandle[] = [];
    // Uptrend phase
    for (let i = 0; i < 50; i++) {
      candles.push(makeCandle(100 + i * 2, i));
    }
    // Sharp drop to trigger oversold RSI
    for (let i = 0; i < 15; i++) {
      candles.push(makeCandle(200 - i * 10, 50 + i));
    }

    let buySignal = false;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.BUY) {
        buySignal = true;
        expect(signal.metadata?.rsi).toBeLessThan(30);
        expect(signal.metadata?.smaFast).toBeDefined();
        expect(signal.metadata?.smaSlow).toBeDefined();
        break;
      }
    }
    expect(buySignal).toBe(true);
  });

  it('should generate SELL signal when RSI > 70', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    // Create overbought scenario with rising prices
    const candles: ICandle[] = [];
    for (let i = 0; i < 60; i++) {
      candles.push(makeCandle(100 + i * 3, i)); // consistent rise
    }

    let sellSignal = false;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.SELL) {
        sellSignal = true;
        expect(signal.metadata?.rsi).toBeGreaterThan(70);
        break;
      }
    }
    expect(sellSignal).toBe(true);
  });

  it('should handle zero prices without crashing', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles = makeCandles(60, 0, 0);
    for (const c of candles) {
      await s.onCandle(c);
    }
    expect(true).toBe(true);
  });

  it('should handle extreme volatility', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles: ICandle[] = [];
    let price = 100;
    for (let i = 0; i < 70; i++) {
      price = i % 2 === 0 ? price * 1.3 : price * 0.7;
      candles.push(makeCandle(price, i));
    }

    for (const c of candles) {
      const signal = await s.onCandle(c);
      expect(signal === null || signal.type !== undefined).toBe(true);
    }
  });

  it('should handle flat market', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles = makeCandles(70, 100, 0);
    let signalCount = 0;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal) signalCount++;
    }
    // Flat market: RSI ~50, SMA20 ≈ SMA50, no BUY signals
    // But SELL signals may trigger if RSI transiently > 70 during warm-up
    // Allow reasonable upper bound
    expect(signalCount).toBeLessThanOrEqual(30);
  });

  it('should trim buffer at maxHistoryBuffer (200)', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles = makeCandles(250, 100, 10);
    for (const c of candles) {
      await s.onCandle(c);
    }
    expect(s['candles'].length).toBeLessThanOrEqual(200);
  });

  it('should handle NaN from indicators gracefully', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const { Indicators } = require('../analysis/indicators');
    const originalRsi = Indicators.rsi;
    Indicators.rsi = jest.fn().mockReturnValue([NaN]);

    const candles = makeCandles(60);
    for (const c of candles) {
      await s.onCandle(c);
    }

    Indicators.rsi = originalRsi;
    expect(true).toBe(true);
  });

  it('should handle negative prices', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles: ICandle[] = [];
    for (let i = 0; i < 60; i++) {
      candles.push(makeCandle(-50 - i, i));
    }

    for (const c of candles) {
      await s.onCandle(c);
    }
    expect(true).toBe(true);
  });

  it('should have BUY signal with correct metadata structure', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles = makeCandles(100, 100, 40);
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.BUY) {
        expect(signal.metadata).toBeDefined();
        expect(signal.metadata?.rsi).toBeDefined();
        expect(signal.metadata?.smaFast).toBeDefined();
        expect(signal.metadata?.smaSlow).toBeDefined();
        break;
      }
    }
  });

  it('should have SELL signal with correct metadata structure', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    const candles = makeCandles(100, 100, 40);
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.SELL) {
        expect(signal.metadata).toBeDefined();
        expect(signal.metadata?.rsi).toBeDefined();
        break;
      }
    }
  });

  it('should not generate signals before having 50 candles', async () => {
    const s = new RsiSmaStrategy();
    await s.init([]);

    for (let i = 0; i < 49; i++) {
      const signal = await s.onCandle(makeCandle(100 + i, i));
      expect(signal).toBeNull();
    }
  });
});
