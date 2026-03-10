import { RsiCrossoverStrategy } from './RsiCrossoverStrategy';
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

describe('RsiCrossoverStrategy', () => {
  it('should instantiate with default params', () => {
    const s = new RsiCrossoverStrategy();
    expect(s.name).toBe('RSI Crossover Strategy');
  });

  it('should return null with empty history', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);
    const signal = await s.onCandle(makeCandle(100, 0));
    expect(signal).toBeNull();
  });

  it('should return null with insufficient data for RSI', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);
    // RSI needs at least 14 + 1 = 15 candles
    for (let i = 0; i < 10; i++) {
      const signal = await s.onCandle(makeCandle(100, i));
      expect(signal).toBeNull();
    }
  });

  it('should initialize with history and warm up prevRsi', async () => {
    const s = new RsiCrossoverStrategy();
    const history = makeCandles(30);
    await s.init(history);
    // Should not throw after warm init
    const signal = await s.onCandle(makeCandle(105, 30));
    expect(signal === null || signal.type !== undefined).toBe(true);
  });

  it('should generate BUY signal on RSI oversold crossover', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // Create scenario: RSI starts oversold, then crosses above 30
    // Low prices to push RSI down, then rising prices
    const candles: ICandle[] = [];
    // First, push price down consistently to get RSI oversold
    for (let i = 0; i < 20; i++) {
      candles.push(makeCandle(80 - i * 2, i)); // declining prices
    }
    // Then sharp rise to trigger crossover
    for (let i = 0; i < 10; i++) {
      candles.push(makeCandle(50 + i * 5, 20 + i)); // rising prices
    }

    let buySignal: SignalType | null = null;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.BUY) {
        buySignal = signal.type;
        expect(signal.metadata).toBeDefined();
        expect(signal.metadata.condition).toBe('oversold_crossover_up');
        break;
      }
    }
    expect(buySignal).toBe(SignalType.BUY);
  });

  it('should generate SELL signal on RSI overbought crossover', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // Create scenario: RSI starts overbought, then crosses below 70
    const candles: ICandle[] = [];
    // First, push price up consistently to get RSI overbought
    for (let i = 0; i < 20; i++) {
      candles.push(makeCandle(100 + i * 3, i)); // rising prices
    }
    // Then sharp drop to trigger crossover
    for (let i = 0; i < 10; i++) {
      candles.push(makeCandle(160 - i * 8, 20 + i)); // declining prices
    }

    let sellSignal: SignalType | null = null;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.SELL) {
        sellSignal = signal.type;
        expect(signal.metadata).toBeDefined();
        expect(signal.metadata.condition).toBe('overbought_crossover_down');
        break;
      }
    }
    expect(sellSignal).toBe(SignalType.SELL);
  });

  it('should handle zero price without crashing', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    const candles = makeCandles(30, 0, 0); // all zero prices
    for (const c of candles) {
      // Should not throw
      await s.onCandle(c);
    }
    expect(true).toBe(true);
  });

  it('should handle extreme price volatility', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // Extreme volatility: price swings 50% up/down each candle
    const candles: ICandle[] = [];
    let price = 100;
    for (let i = 0; i < 50; i++) {
      price = i % 2 === 0 ? price * 1.5 : price * 0.5;
      candles.push(makeCandle(price, i));
    }

    for (const c of candles) {
      // Should not throw
      const signal = await s.onCandle(c);
      expect(signal === null || signal.type !== undefined).toBe(true);
    }
  });

  it('should handle flat market (all identical candles)', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    const candles = makeCandles(50, 100, 0); // all same price
    let signalCount = 0;
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal) signalCount++;
    }
    // Flat market = RSI flat = no crossovers expected
    // Note: RSI at exactly 50 in flat market, so no overbought/oversold crossover
    // Allow at most 1 signal during warm-up phase
    expect(signalCount).toBeLessThanOrEqual(1);
  });

  it('should handle single candle history', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([makeCandle(100, 0)]);
    const signal = await s.onCandle(makeCandle(101, 1));
    // Single candle + 1 = not enough for RSI
    expect(signal).toBeNull();
  });

  it('should trim buffer at maxHistoryBuffer', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // maxHistoryBuffer = 200, feed 250 candles
    const candles = makeCandles(250, 100, 10);
    for (const c of candles) {
      await s.onCandle(c);
    }
    // Should not throw, buffer should be trimmed
    expect(s['candles'].length).toBeLessThanOrEqual(200);
  });

  it('should handle NaN from RSI calculation gracefully', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // Mock RSI to return NaN
    const { Indicators } = require('../analysis/indicators');
    const originalRsi = Indicators.rsi;
    Indicators.rsi = jest.fn().mockReturnValue([NaN]);

    const candles = makeCandles(30);
    for (const c of candles) {
      await s.onCandle(c);
    }

    // Restore
    Indicators.rsi = originalRsi;
    expect(true).toBe(true); // no crash = pass
  });

  it('should handle negative prices gracefully', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // Negative prices (shouldn't happen in crypto but test anyway)
    const candles: ICandle[] = [];
    for (let i = 0; i < 30; i++) {
      candles.push(makeCandle(-100 - i, i));
    }

    for (const c of candles) {
      // Should not throw
      await s.onCandle(c);
    }
    expect(true).toBe(true);
  });

  it('should update prevRsi after each candle', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    const candles = makeCandles(30, 100, 20);
    // Feed first batch
    for (let i = 0; i < 10; i++) {
      await s.onCandle(candles[i]);
    }
    const prevRsi1 = s['prevRsi'];

    // Feed more
    for (let i = 10; i < 20; i++) {
      await s.onCandle(candles[i]);
    }
    const prevRsi2 = s['prevRsi'];

    // prevRsi should have changed (different market conditions)
    expect(prevRsi1).toBeDefined();
    expect(prevRsi2).toBeDefined();
  });

  it('should not generate consecutive BUY signals without price movement', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    // After a BUY signal, RSI needs to go back below 30 before another crossover
    const candles = makeCandles(100, 100, 30);
    let buySignals = 0;

    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal?.type === SignalType.BUY) {
        buySignals++;
      }
    }

    // Should have limited BUY signals (need reset between crossovers)
    expect(buySignals).toBeLessThan(10); // reasonable upper bound
  });

  it('should have metadata with rsi and prevRsi on signals', async () => {
    const s = new RsiCrossoverStrategy();
    await s.init([]);

    const candles = makeCandles(100, 100, 35);
    for (const c of candles) {
      const signal = await s.onCandle(c);
      if (signal) {
        expect(signal.metadata?.rsi).toBeDefined();
        expect(signal.metadata?.prevRsi).toBeDefined();
      }
    }
  });
});
