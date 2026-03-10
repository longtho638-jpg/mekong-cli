import { RealtimeArbitrageScanner, type ArbitrageOpportunity } from '../../src/execution/realtime-arbitrage-scanner';
import type { PriceTick } from '../../src/execution/websocket-multi-exchange-price-feed-manager';

function tick(exchange: string, symbol: string, bid: number, ask: number, age = 0): PriceTick {
  return { exchange, symbol, bid, ask, timestamp: Date.now() - age };
}

describe('RealtimeArbitrageScanner', () => {
  let scanner: RealtimeArbitrageScanner;

  beforeEach(() => {
    scanner = new RealtimeArbitrageScanner({
      symbols: ['BTC/USDT'],
      minNetSpreadPct: 0.001, // 0.1%
      scanIntervalMs: 100,
      positionSizeUsd: 1000,
      staleTickMs: 5000,
    });
  });

  afterEach(() => {
    scanner.stop();
  });

  test('detects profitable spread between two exchanges', async () => {
    // Buy cheap on binance, sell high on okx
    scanner.onTick(tick('binance', 'BTC/USDT', 49900, 50000)); // ask 50000
    scanner.onTick(tick('okx', 'BTC/USDT', 50200, 50300));     // bid 50200

    const opps = await scanner.scan();
    // At least one profitable direction expected (okx bid > binance ask after fees)
    const profitable = opps.filter(o => o.spread.profitable);
    expect(profitable.length).toBeGreaterThanOrEqual(1);
    if (profitable.length > 0) {
      expect(profitable[0].spread.buyExchange).toBe('binance');
      expect(profitable[0].spread.sellExchange).toBe('okx');
    }
  });

  test('no opportunity when prices are equal', async () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001));
    scanner.onTick(tick('okx', 'BTC/USDT', 50000, 50001));

    const opps = await scanner.scan();
    const profitable = opps.filter(o => o.spread.profitable);
    expect(profitable.length).toBe(0);
  });

  test('filters out stale ticks', async () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 49000, 50000, 10_000)); // stale
    scanner.onTick(tick('okx', 'BTC/USDT', 50200, 50300));

    const opps = await scanner.scan();
    // Stale binance tick should be filtered, no pairs to compare
    expect(opps.length).toBe(0);
  });

  test('emits opportunity event', async () => {
    const events: ArbitrageOpportunity[] = [];
    scanner.on('opportunity', (opp) => events.push(opp));

    scanner.onTick(tick('binance', 'BTC/USDT', 49900, 50000));
    scanner.onTick(tick('okx', 'BTC/USDT', 50200, 50300));

    await scanner.scan();
    // Should have emitted at least 1 event for profitable spread
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  test('tracks scan stats correctly', async () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 49900, 50000));
    scanner.onTick(tick('okx', 'BTC/USDT', 50200, 50300));

    await scanner.scan();
    await scanner.scan();

    const stats = scanner.getStats();
    expect(stats.totalScans).toBe(2);
    expect(stats.lastScanAt).toBeGreaterThan(0);
  });

  test('getActiveExchangeCount counts non-stale exchanges', () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001));
    scanner.onTick(tick('okx', 'BTC/USDT', 50000, 50001));
    scanner.onTick(tick('bybit', 'BTC/USDT', 50000, 50001, 10_000)); // stale

    expect(scanner.getActiveExchangeCount()).toBe(2);
  });

  test('handles multiple symbols', async () => {
    const multi = new RealtimeArbitrageScanner({
      symbols: ['BTC/USDT', 'ETH/USDT'],
      minNetSpreadPct: 0.001,
      staleTickMs: 5000,
    });

    multi.onTick(tick('binance', 'BTC/USDT', 49900, 50000));
    multi.onTick(tick('okx', 'BTC/USDT', 50200, 50300));
    multi.onTick(tick('binance', 'ETH/USDT', 3000, 3001));
    multi.onTick(tick('okx', 'ETH/USDT', 3010, 3011));

    await multi.scan();
    // Should scan both symbols
    const stats = multi.getStats();
    expect(stats.totalScans).toBe(1);
    multi.stop();
  });

  test('start/stop manages timer', () => {
    scanner.start();
    expect(scanner.getStats().totalScans).toBe(0); // no scan yet
    scanner.stop();
  });

  test('getLatestTicks returns copy', () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001));
    const ticks = scanner.getLatestTicks();
    expect(ticks.size).toBe(1);
    // Mutating copy should not affect internal state
    ticks.clear();
    expect(scanner.getLatestTicks().size).toBe(1);
  });
});
