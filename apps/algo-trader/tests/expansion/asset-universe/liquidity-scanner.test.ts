import { LiquidityScanner } from '../../../src/expansion/asset-universe/liquidity-scanner';

describe('LiquidityScanner', () => {
  it('filters symbols by minVolume24h', async () => {
    const scanner = new LiquidityScanner({ minVolume24h: 1_000_000_000 });
    const results = await scanner.scanLiquidSymbols();
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => expect(s.volume24h).toBeGreaterThanOrEqual(1_000_000_000));
  });

  it('returns empty when threshold is very high', async () => {
    const scanner = new LiquidityScanner({ minVolume24h: 999_999_999_999 });
    const results = await scanner.scanLiquidSymbols();
    expect(results).toHaveLength(0);
  });

  it('emits scan-complete event with results', async () => {
    const scanner = new LiquidityScanner({ minVolume24h: 1_000_000 });
    const emitted: unknown[] = [];
    scanner.on('scan-complete', (r) => emitted.push(r));
    const results = await scanner.scanLiquidSymbols();
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual(results);
  });

  it('deduplicates symbols across exchanges', async () => {
    const scanner = new LiquidityScanner({
      minVolume24h: 1_000_000,
      exchanges: ['binance', 'okx'],
    });
    const results = await scanner.scanLiquidSymbols();
    const symbols = results.map((r) => r.symbol);
    const unique = new Set(symbols);
    expect(symbols.length).toBe(unique.size);
  });

  it('getVolume returns correct volume for known symbol', () => {
    const scanner = new LiquidityScanner({ minVolume24h: 0 });
    expect(scanner.getVolume('BTC/USDT')).toBe(5_000_000_000);
  });

  it('getVolume returns 0 for unknown symbol', () => {
    const scanner = new LiquidityScanner({ minVolume24h: 0 });
    expect(scanner.getVolume('UNKNOWN/USDT')).toBe(0);
  });

  it('returned symbols have volatility initialised to 0', async () => {
    const scanner = new LiquidityScanner({ minVolume24h: 1_000_000_000 });
    const results = await scanner.scanLiquidSymbols();
    results.forEach((s) => expect(s.volatility).toBe(0));
  });
});
