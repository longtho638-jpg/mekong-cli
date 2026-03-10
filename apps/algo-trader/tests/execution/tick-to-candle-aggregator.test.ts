import { TickToCandleAggregator } from '../../src/execution/tick-to-candle-aggregator';
import { PriceTick } from '../../src/execution/websocket-multi-exchange-price-feed-manager';
import { ICandle } from '../../src/interfaces/ICandle';

describe('TickToCandleAggregator', () => {
  let aggregator: TickToCandleAggregator;

  beforeEach(() => {
    aggregator = new TickToCandleAggregator(1000); // 1s interval for fast tests
  });

  afterEach(() => {
    aggregator.stop();
    aggregator.removeAllListeners();
  });

  const makeTick = (exchange: string, symbol: string, bid: number, ask: number): PriceTick => ({
    exchange, symbol, bid, ask, timestamp: Date.now(),
  });

  test('addTick creates a new candle builder', () => {
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    expect(aggregator.size).toBe(1);
    const partial = aggregator.getPartial('binance:BTCUSDT');
    expect(partial).toBeDefined();
    expect(partial!.tickCount).toBe(1);
  });

  test('addTick updates OHLC correctly', () => {
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010)); // mid=50005
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50100, 50110)); // mid=50105 (high)
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 49900, 49910)); // mid=49905 (low)
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50050, 50060)); // mid=50055 (close)

    const partial = aggregator.getPartial('binance:BTCUSDT')!;
    expect(partial.open).toBe(50005);
    expect(partial.high).toBe(50105);
    expect(partial.low).toBe(49905);
    expect(partial.close).toBe(50055);
    expect(partial.tickCount).toBe(4);
  });

  test('flush emits candle events', () => {
    const candles: { candle: ICandle; key: string }[] = [];
    aggregator.on('candle', (candle: ICandle, key: string) => candles.push({ candle, key }));

    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.addTick(makeTick('okx', 'BTC-USDT', 50020, 50030));
    aggregator.flush();

    expect(candles).toHaveLength(2);
    expect(candles[0].candle.open).toBe(50005);
    expect(candles[1].candle.open).toBe(50025);
  });

  test('flush resets builder for next interval', () => {
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.flush();

    const partial = aggregator.getPartial('binance:BTCUSDT')!;
    expect(partial.tickCount).toBe(0);
    // open should be set to previous close
    expect(partial.open).toBe(50005);
  });

  test('flush skips builders with zero ticks', () => {
    const candles: ICandle[] = [];
    aggregator.on('candle', (c: ICandle) => candles.push(c));

    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.flush(); // emits 1
    aggregator.flush(); // should skip (0 ticks)

    expect(candles).toHaveLength(1);
  });

  test('multiple symbols tracked independently', () => {
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.addTick(makeTick('binance', 'ETHUSDT', 3000, 3010));
    expect(aggregator.size).toBe(2);

    const btc = aggregator.getPartial('binance:BTCUSDT')!;
    const eth = aggregator.getPartial('binance:ETHUSDT')!;
    expect(btc.close).toBe(50005);
    expect(eth.close).toBe(3005);
  });

  test('start and stop manage timer', () => {
    jest.useFakeTimers();
    const candles: ICandle[] = [];
    aggregator.on('candle', (c: ICandle) => candles.push(c));

    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.start();

    jest.advanceTimersByTime(1000);
    expect(candles).toHaveLength(1);

    aggregator.stop();
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50100, 50110));
    jest.advanceTimersByTime(1000);
    // No new candle after stop
    expect(candles).toHaveLength(1);

    jest.useRealTimers();
  });

  test('start is idempotent', () => {
    aggregator.start();
    aggregator.start(); // no-op
    aggregator.stop();
  });

  test('candle metadata includes symbol and tickCount', () => {
    const candles: ICandle[] = [];
    aggregator.on('candle', (c: ICandle) => candles.push(c));

    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50000, 50010));
    aggregator.addTick(makeTick('binance', 'BTCUSDT', 50020, 50030));
    aggregator.flush();

    expect(candles[0].metadata?.symbol).toBe('BTCUSDT');
    expect(candles[0].metadata?.tickCount).toBe(2);
  });
});
