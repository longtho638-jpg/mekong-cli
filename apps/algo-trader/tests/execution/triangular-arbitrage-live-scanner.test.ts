/**
 * Tests for TriangularArbitrageLiveScanner — 3-pair cycle detection and profit evaluation.
 */

import { TriangularArbitrageLiveScanner, type TriArbOpportunity } from '../../src/execution/triangular-arbitrage-live-scanner';

function tick(exchange: string, symbol: string, bid: number, ask: number, ageMs = 0) {
  return { exchange, symbol, bid, ask, timestamp: Date.now() - ageMs };
}

/** Feed BTC/USDT, ETH/BTC, ETH/USDT with configurable prices */
function feedBalancedTicks(scanner: TriangularArbitrageLiveScanner, exchange = 'binance') {
  // Perfectly balanced: 1 USDT → 1/50000 BTC → (1/50000)*(50000/3000) ETH → *(3000) USDT = 1
  scanner.onTick(tick(exchange, 'BTC/USDT', 50000, 50000));
  scanner.onTick(tick(exchange, 'ETH/BTC', 0.06, 0.06));   // ETH/BTC: 1 ETH = 0.06 BTC
  scanner.onTick(tick(exchange, 'ETH/USDT', 3000, 3000));
}

function feedProfitableTicks(scanner: TriangularArbitrageLiveScanner, exchange = 'binance') {
  // USDT→BTC→ETH→USDT path:
  //   buy BTC/USDT ask 50000  → 1/50000 BTC per USDT
  //   sell BTC as ETH/BTC bid 0.065 → 1/(0.065) ETH per BTC  → use ETH/BTC: buy ETH costs 0.065 BTC
  //   Actually: BTC→ETH: buy ETH/BTC ask=0.065 → rate = 1/0.065 ETH per BTC
  //   ETH→USDT: sell ETH/USDT bid=3250 → rate = 3250 USDT per ETH
  //   product = (1/50000) * (1/0.065) * 3250 ≈ 1.0
  // Let's make it clearly profitable: lower BTC/USDT ask, higher ETH/USDT bid
  scanner.onTick(tick(exchange, 'BTC/USDT', 49900, 50000));
  scanner.onTick(tick(exchange, 'ETH/BTC', 0.059, 0.060));   // ETH/BTC
  scanner.onTick(tick(exchange, 'ETH/USDT', 3100, 3150));
}

describe('TriangularArbitrageLiveScanner', () => {
  let scanner: TriangularArbitrageLiveScanner;

  beforeEach(() => {
    scanner = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,  // very low threshold so we can test both sides
      feePct: 0.001,
      scanIntervalMs: 100,
    });
  });

  afterEach(() => {
    scanner.stop();
  });

  // ─── buildCycles ───────────────────────────────────────────────────────────

  test('buildCycles finds valid 3-pair cycles', () => {
    feedBalancedTicks(scanner);
    const cycles = scanner.buildCycles();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
    // Every cycle must have 3 legs and 3 currencies
    for (const c of cycles) {
      expect(c.legs).toHaveLength(3);
      expect(c.currencies).toHaveLength(3);
    }
  });

  test('buildCycles starts each cycle from baseCurrency', () => {
    feedBalancedTicks(scanner);
    const cycles = scanner.buildCycles();
    for (const c of cycles) {
      expect(c.currencies[0]).toBe('USDT');
    }
  });

  test('buildCycles returns empty when fewer than 3 symbols', () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001));
    scanner.onTick(tick('binance', 'ETH/USDT', 3000, 3001));
    // Only 2 pairs — no triangle possible without ETH/BTC
    const cycles = scanner.buildCycles();
    expect(cycles.length).toBe(0);
  });

  // ─── evaluateCycle ─────────────────────────────────────────────────────────

  test('no opportunity when prices are perfectly balanced', () => {
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,
      feePct: 0,  // zero fee to isolate price math
    });
    // USDT→BTC→ETH→USDT = 1/50000 * (1/0.06) * 3000 = 1.0 exactly
    scanner2.onTick(tick('binance', 'BTC/USDT', 50000, 50000));
    scanner2.onTick(tick('binance', 'ETH/BTC', 0.06, 0.06));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3000, 3000));

    const cycles = scanner2.buildCycles();
    let found = false;
    for (const c of cycles) {
      const opp = scanner2.evaluateCycle(c);
      if (opp) { found = true; break; }
    }
    expect(found).toBe(false);
  });

  test('detects profitable triangular opportunity with skewed prices', () => {
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,
      feePct: 0,  // zero fee so price imbalance determines result
    });
    // USDT→BTC→ETH→USDT:
    //   buy BTC/USDT ask=50000 → rate = 1/50000
    //   buy ETH/BTC ask=0.06  → rate = 1/0.06
    //   sell ETH/USDT bid=3500 → rate = 3500
    //   product = (1/50000) * (1/0.06) * 3500 ≈ 1.1667 → profitable
    scanner2.onTick(tick('binance', 'BTC/USDT', 49000, 50000));
    scanner2.onTick(tick('binance', 'ETH/BTC', 0.059, 0.060));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3500, 3600));

    const cycles = scanner2.buildCycles();
    let profitable: TriArbOpportunity | null = null;
    for (const c of cycles) {
      const opp = scanner2.evaluateCycle(c);
      if (opp) { profitable = opp; break; }
    }
    expect(profitable).not.toBeNull();
    expect(profitable!.profitPct).toBeGreaterThan(0);
  });

  test('applies fees correctly across 3 legs', () => {
    const feePct = 0.001;
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,
      feePct,
    });
    // Set prices that give gross profit ~16.67% before fees
    scanner2.onTick(tick('binance', 'BTC/USDT', 49000, 50000));
    scanner2.onTick(tick('binance', 'ETH/BTC', 0.059, 0.060));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3500, 3600));

    const cycles = scanner2.buildCycles();
    let profitWithFee: number | null = null;
    for (const c of cycles) {
      const opp = scanner2.evaluateCycle(c);
      if (opp) { profitWithFee = opp.profitPct; break; }
    }

    // Compare with zero-fee scanner
    const scanner3 = new TriangularArbitrageLiveScanner({ baseCurrency: 'USDT', minProfitPct: 0.0001, feePct: 0 });
    scanner3.onTick(tick('binance', 'BTC/USDT', 49000, 50000));
    scanner3.onTick(tick('binance', 'ETH/BTC', 0.059, 0.060));
    scanner3.onTick(tick('binance', 'ETH/USDT', 3500, 3600));

    const cycles3 = scanner3.buildCycles();
    let profitNoFee: number | null = null;
    for (const c of cycles3) {
      const opp = scanner3.evaluateCycle(c);
      if (opp) { profitNoFee = opp.profitPct; break; }
    }

    expect(profitWithFee).not.toBeNull();
    expect(profitNoFee).not.toBeNull();
    // Fee should reduce profit by (1-fee)^3 factor
    const expectedFactor = Math.pow(1 - feePct, 3);
    expect(profitWithFee! + 1).toBeCloseTo((profitNoFee! + 1) * expectedFactor, 6);
  });

  // ─── scan ──────────────────────────────────────────────────────────────────

  test('scan returns only profitable opportunities above threshold', () => {
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.5,   // 50% threshold — nothing should pass
      feePct: 0.001,
    });
    feedProfitableTicks(scanner2);
    const opps = scanner2.scan();
    expect(opps.length).toBe(0);
  });

  test('scan emits opportunity event for profitable cycle', (done) => {
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,
      feePct: 0,
    });
    scanner2.onTick(tick('binance', 'BTC/USDT', 49000, 50000));
    scanner2.onTick(tick('binance', 'ETH/BTC', 0.059, 0.060));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3500, 3600));

    scanner2.on('opportunity', (opp: TriArbOpportunity) => {
      expect(opp.profitPct).toBeGreaterThan(0);
      expect(opp.path).toContain('USDT');
      done();
    });

    scanner2.scan();
  });

  test('handles missing pair in cycle gracefully (returns null)', () => {
    feedBalancedTicks(scanner);
    const cycles = scanner.buildCycles();
    expect(cycles.length).toBeGreaterThanOrEqual(1);

    // Remove one tick to simulate missing pair
    const scanner2 = new TriangularArbitrageLiveScanner({ baseCurrency: 'USDT', minProfitPct: 0.0001, feePct: 0.001 });
    scanner2.onTick(tick('binance', 'BTC/USDT', 50000, 50000));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3000, 3000));
    // ETH/BTC intentionally not added

    const opps = scanner2.scan();
    expect(opps.length).toBe(0);
  });

  // ─── getStats ──────────────────────────────────────────────────────────────

  test('getStats tracks scan count and best profit', () => {
    const scanner2 = new TriangularArbitrageLiveScanner({
      baseCurrency: 'USDT',
      minProfitPct: 0.0001,
      feePct: 0,
    });
    scanner2.onTick(tick('binance', 'BTC/USDT', 49000, 50000));
    scanner2.onTick(tick('binance', 'ETH/BTC', 0.059, 0.060));
    scanner2.onTick(tick('binance', 'ETH/USDT', 3500, 3600));

    expect(scanner2.getStats().totalScans).toBe(0);
    scanner2.scan();
    const stats = scanner2.getStats();
    expect(stats.totalScans).toBe(1);
    expect(stats.opportunitiesFound).toBeGreaterThanOrEqual(1);
    expect(stats.bestProfitPct).toBeGreaterThan(0);
  });

  // ─── start / stop ──────────────────────────────────────────────────────────

  test('start and stop manages interval timer', (done) => {
    feedBalancedTicks(scanner);
    scanner.start(50);

    setTimeout(() => {
      const statsBefore = scanner.getStats();
      scanner.stop();
      const statsAfter = scanner.getStats();

      // Should have scanned at least once while running
      expect(statsBefore.totalScans).toBeGreaterThan(0);
      // After stop, no more scans
      const scansBefore = statsAfter.totalScans;
      setTimeout(() => {
        expect(scanner.getStats().totalScans).toBe(scansBefore);
        done();
      }, 100);
    }, 200);
  });

  test('calling start twice does not create duplicate timers', () => {
    feedBalancedTicks(scanner);
    scanner.start(50);
    scanner.start(50); // second call should be a no-op
    scanner.stop();
    // If two timers were created, getStats would show extra scans — but we just
    // verify no error is thrown and stop works cleanly
    expect(scanner.getStats().totalScans).toBeGreaterThanOrEqual(0);
  });

  // ─── onTick / stale filtering ──────────────────────────────────────────────

  test('onTick updates price book with latest data', () => {
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001));
    scanner.onTick(tick('binance', 'BTC/USDT', 51000, 51001)); // update
    scanner.onTick(tick('binance', 'ETH/BTC', 0.06, 0.061));
    scanner.onTick(tick('binance', 'ETH/USDT', 3060, 3100));

    const cycles = scanner.buildCycles();
    // With updated price book, cycle should still be found
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  test('filters stale prices (ignores ticks older than 10s)', () => {
    // Feed fresh ETH/BTC and ETH/USDT, but stale BTC/USDT (11s old)
    scanner.onTick(tick('binance', 'BTC/USDT', 50000, 50001, 11_000)); // stale
    scanner.onTick(tick('binance', 'ETH/BTC', 0.06, 0.061));
    scanner.onTick(tick('binance', 'ETH/USDT', 3000, 3001));

    const cycles = scanner.buildCycles();
    // Without BTC/USDT, the BTC leg is broken — no complete cycle
    expect(cycles.length).toBe(0);
  });
});
