import { RwaOracleManager } from '../../../src/expansion/cross-chain-rwa/rwa-oracle-manager';

describe('RwaOracleManager', () => {
  it('fetchPrices returns one entry per asset', async () => {
    const oracle = new RwaOracleManager(['TSLA', 'AAPL', 'GOLD']);
    const prices = await oracle.fetchPrices();
    expect(prices).toHaveLength(3);
    expect(prices.map((p) => p.asset)).toEqual(expect.arrayContaining(['TSLA', 'AAPL', 'GOLD']));
  });

  it('prices are positive numbers', async () => {
    const oracle = new RwaOracleManager(['TSLA', 'GOLD']);
    const prices = await oracle.fetchPrices();
    prices.forEach((p) => {
      expect(p.price).toBeGreaterThan(0);
      expect(p.timestamp).toBeGreaterThan(0);
    });
  });

  it('getPrice returns null before fetch', () => {
    const oracle = new RwaOracleManager(['TSLA']);
    expect(oracle.getPrice('TSLA')).toBeNull();
  });

  it('getPrice returns value after fetch', async () => {
    const oracle = new RwaOracleManager(['GOLD']);
    await oracle.fetchPrices();
    expect(oracle.getPrice('GOLD')).not.toBeNull();
    expect(oracle.getPrice('GOLD')!).toBeGreaterThan(0);
  });

  it('emits price-updated for each asset', async () => {
    const oracle = new RwaOracleManager(['TSLA', 'AAPL']);
    const events: unknown[] = [];
    oracle.on('price-updated', (p) => events.push(p));
    await oracle.fetchPrices();
    expect(events).toHaveLength(2);
  });

  it('getAssets returns configured assets', () => {
    const oracle = new RwaOracleManager(['OIL', 'SILVER']);
    expect(oracle.getAssets()).toEqual(['OIL', 'SILVER']);
  });

  it('handles unknown asset gracefully', () => {
    const oracle = new RwaOracleManager(['UNKNOWN_ASSET']);
    expect(() => oracle.fetchPrices()).not.toThrow();
  });
});
