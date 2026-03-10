import {
  FundingRateArbitrageScanner,
  type FundingRateConfig,
  type FundingRateOpportunity,
} from '../../src/execution/funding-rate-arbitrage-scanner';

const NOW = Date.now();

describe('FundingRateArbitrageScanner', () => {
  let scanner: FundingRateArbitrageScanner;

  const config: FundingRateConfig = {
    minRateDifferential: 0.0005, // 0.05%
    staleThresholdMs: 60_000,
    scanIntervalMs: 100,
  };

  beforeEach(() => {
    scanner = new FundingRateArbitrageScanner(config);
  });

  afterEach(() => {
    scanner.stop();
  });

  // ── Core detection ───────────────────────────────────────────────────────

  test('detects profitable differential — short high-rate, long low-rate exchange', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);  // +0.1%
    scanner.updateRate('bybit', 'BTC/USDT', -0.0005, NOW + 28800_000); // -0.05%

    const opps = scanner.scan();

    expect(opps.length).toBeGreaterThanOrEqual(1);
    const opp = opps[0];
    expect(opp.symbol).toBe('BTC/USDT');
    expect(opp.shortExchange).toBe('binance'); // higher rate → short here
    expect(opp.longExchange).toBe('bybit');    // lower rate → long here
    expect(opp.rateDifferential).toBeCloseTo(0.0015, 6);
  });

  test('no opportunity when rates are similar (below threshold)', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.0001, NOW + 28800_000);
    scanner.updateRate('bybit', 'BTC/USDT', 0.00013, NOW + 28800_000);
    // diff = 0.00003, below 0.0005 threshold

    const opps = scanner.scan();
    expect(opps.length).toBe(0);
  });

  test('filters stale rate entries', () => {
    // Use a scanner with very tight staleness window
    const tightScanner = new FundingRateArbitrageScanner({
      minRateDifferential: 0.0005,
      staleThresholdMs: 1, // 1ms — anything older is stale
    });

    tightScanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    tightScanner.updateRate('bybit', 'BTC/USDT', -0.001, NOW + 28800_000);

    // Wait 5ms so entries are now stale
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const opps = tightScanner.scan();
        expect(opps.length).toBe(0); // both entries stale → no pairs
        tightScanner.stop();
        resolve();
      }, 5);
    });
  });

  test('calculates annualized return correctly for 0.01% per 8h interval', () => {
    // 0.01% per 8h = 3 intervals/day × 365 days = 1095 intervals/year
    // annualized = 0.0001 × 1095 = 0.1095 = 10.95%
    const annualized = scanner.calculateAnnualizedReturn(0.0001, 8);
    expect(annualized).toBeCloseTo(0.1095, 4);
  });

  test('calculates annualized return for 4h interval', () => {
    // 4h interval: 6/day × 365 = 2190 intervals/year
    const annualized = scanner.calculateAnnualizedReturn(0.0001, 4);
    expect(annualized).toBeCloseTo(0.219, 4);
  });

  test('handles negative funding rates (both negative, still detects differential)', () => {
    scanner.updateRate('binance', 'BTC/USDT', -0.0002, NOW + 28800_000);
    scanner.updateRate('okx', 'BTC/USDT', -0.0010, NOW + 28800_000);
    // diff = 0.0008, above threshold
    // okx has lower (more negative) rate → long on okx, short on binance

    const opps = scanner.scan();
    expect(opps.length).toBeGreaterThanOrEqual(1);
    const opp = opps[0];
    expect(opp.shortExchange).toBe('binance'); // -0.0002 is higher (less negative)
    expect(opp.longExchange).toBe('okx');      // -0.001 is lower
    expect(opp.rateDifferential).toBeCloseTo(0.0008, 6);
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  test('tracks stats: scans, opportunitiesFound, bestDifferential', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.002, NOW + 28800_000);
    scanner.updateRate('bybit', 'BTC/USDT', -0.001, NOW + 28800_000);

    scanner.scan();
    scanner.scan();

    const stats = scanner.getStats();
    expect(stats.totalScans).toBe(2);
    expect(stats.opportunitiesFound).toBe(2); // 1 opp per scan
    expect(stats.bestDifferential).toBeCloseTo(0.003, 6);
  });

  test('tracks activeSymbols and activeExchanges in stats', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    scanner.updateRate('bybit', 'BTC/USDT', -0.001, NOW + 28800_000);
    scanner.updateRate('binance', 'ETH/USDT', 0.0008, NOW + 28800_000);
    scanner.updateRate('okx', 'ETH/USDT', 0.0001, NOW + 28800_000);

    scanner.scan();

    const stats = scanner.getStats();
    expect(stats.activeSymbols).toBe(2);
    expect(stats.activeExchanges).toBe(3); // binance, bybit, okx
  });

  // ── Events ───────────────────────────────────────────────────────────────

  test('emits opportunity event for each profitable pair', () => {
    const events: FundingRateOpportunity[] = [];
    scanner.on('opportunity', (opp: FundingRateOpportunity) => events.push(opp));

    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    scanner.updateRate('bybit', 'BTC/USDT', -0.001, NOW + 28800_000);

    scanner.scan();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]).toHaveProperty('symbol', 'BTC/USDT');
    expect(events[0]).toHaveProperty('rateDifferential');
    expect(events[0]).toHaveProperty('annualizedReturnPct');
  });

  // ── Timer ────────────────────────────────────────────────────────────────

  test('start/stop manages periodic scan timer', () => {
    expect(scanner.getStats().totalScans).toBe(0);
    scanner.start();
    scanner.stop(); // stops before first tick fires
    expect(scanner.getStats().totalScans).toBe(0);
  });

  test('start with custom intervalMs overrides config', (done) => {
    scanner.start(50);
    setTimeout(() => {
      scanner.stop();
      // With 50ms interval, at least 1 scan should have fired in 120ms
      expect(scanner.getStats().totalScans).toBeGreaterThanOrEqual(1);
      done();
    }, 120);
  });

  // ── getActiveRates ───────────────────────────────────────────────────────

  test('getActiveRates returns current data grouped by symbol', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    scanner.updateRate('okx', 'BTC/USDT', 0.0005, NOW + 28800_000);

    const activeRates = scanner.getActiveRates();
    expect(activeRates.has('BTC/USDT')).toBe(true);
    const entries = activeRates.get('BTC/USDT')!;
    expect(entries.length).toBe(2);
    expect(entries.map((e) => e.exchange).sort()).toEqual(['binance', 'okx']);
  });

  test('getActiveRates returns a copy (mutation does not affect internal state)', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);

    const first = scanner.getActiveRates();
    first.get('BTC/USDT')!.length = 0; // mutate copy

    const second = scanner.getActiveRates();
    expect(second.get('BTC/USDT')!.length).toBe(1); // internal unchanged
  });

  // ── Single exchange / edge cases ─────────────────────────────────────────

  test('single exchange for a symbol produces no cross-exchange opportunity', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.005, NOW + 28800_000);
    // Only one exchange, no pair to compare

    const opps = scanner.scan();
    expect(opps.length).toBe(0);
  });

  test('updateRate replaces existing entry for same exchange/symbol', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    scanner.updateRate('binance', 'BTC/USDT', 0.002, NOW + 28800_000); // update

    const entries = scanner.getActiveRates().get('BTC/USDT')!;
    expect(entries.length).toBe(1); // still one entry for binance
    expect(entries[0].rate).toBe(0.002);
  });

  test('multiple symbols are tracked independently', () => {
    scanner.updateRate('binance', 'BTC/USDT', 0.001, NOW + 28800_000);
    scanner.updateRate('okx', 'BTC/USDT', -0.001, NOW + 28800_000);
    scanner.updateRate('binance', 'ETH/USDT', 0.0008, NOW + 28800_000);
    scanner.updateRate('okx', 'ETH/USDT', 0.0001, NOW + 28800_000);

    const opps = scanner.scan();
    const symbols = [...new Set(opps.map((o) => o.symbol))];
    expect(symbols).toContain('BTC/USDT');
    expect(symbols).toContain('ETH/USDT');
  });
});
