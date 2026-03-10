import { VolatilityAnalyzer } from '../../../src/expansion/asset-universe/volatility-analyzer';
import type { SymbolInfo } from '../../../src/expansion/expansion-config-types';

const makeSymbols = (symbols: string[]): SymbolInfo[] =>
  symbols.map((symbol) => ({ symbol, volume24h: 1_000_000, volatility: 0 }));

describe('VolatilityAnalyzer', () => {
  it('annotates symbols with non-zero volatility', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0, 1] });
    const result = analyzer.annotateVolatility(makeSymbols(['BTC/USDT', 'ETH/USDT']));
    result.forEach((s) => expect(s.volatility).toBeGreaterThan(0));
  });

  it('annotateVolatility is deterministic for same symbol', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0, 1] });
    const [a] = analyzer.annotateVolatility(makeSymbols(['BTC/USDT']));
    const [b] = analyzer.annotateVolatility(makeSymbols(['BTC/USDT']));
    expect(a.volatility).toBe(b.volatility);
  });

  it('filterByVolatility removes out-of-bounds symbols', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0.05, 0.10] });
    const symbols = makeSymbols(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT']);
    const filtered = analyzer.filterByVolatility(symbols);
    filtered.forEach((s) => {
      expect(s.volatility).toBeGreaterThanOrEqual(0.05);
      expect(s.volatility).toBeLessThanOrEqual(0.10);
    });
  });

  it('filterByVolatility emits filtered event', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0, 1] });
    const emitted: unknown[] = [];
    analyzer.on('filtered', (r) => emitted.push(r));
    analyzer.filterByVolatility(makeSymbols(['BTC/USDT']));
    expect(emitted).toHaveLength(1);
  });

  it('getVolatility returns value in [0.005, 0.30]', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0, 1] });
    const vol = analyzer.getVolatility('ETH/USDT');
    expect(vol).toBeGreaterThanOrEqual(0.005);
    expect(vol).toBeLessThanOrEqual(0.30);
  });

  it('returns all symbols when bounds are wide', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0, 1] });
    const symbols = makeSymbols(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
    const filtered = analyzer.filterByVolatility(symbols);
    expect(filtered).toHaveLength(3);
  });

  it('returns empty when bounds are impossible', () => {
    const analyzer = new VolatilityAnalyzer({ bounds: [0.99, 1] });
    const symbols = makeSymbols(['BTC/USDT', 'ETH/USDT']);
    const filtered = analyzer.filterByVolatility(symbols);
    expect(filtered).toHaveLength(0);
  });
});
