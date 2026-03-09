import { ArbitrageEnabler } from '../../../src/expansion/cross-chain-rwa/arbitrage-enabler';

describe('ArbitrageEnabler', () => {
  it('evaluate returns null when profit below threshold', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 100 });
    const result = enabler.evaluate('GOLD', 'ethereum', 100, 'bsc', 100.05);
    expect(result).toBeNull();
  });

  it('evaluate returns path when profit exceeds threshold', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 5 });
    // 2% gross = 200 bps, minus 20 bps bridge fee = 180 bps net
    const result = enabler.evaluate('GOLD', 'ethereum', 100, 'bsc', 102);
    expect(result).not.toBeNull();
    expect(result!.profitBps).toBeGreaterThanOrEqual(5);
  });

  it('evaluate emits path-found when profitable', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 5 });
    const events: unknown[] = [];
    enabler.on('path-found', (p) => events.push(p));
    enabler.evaluate('GOLD', 'ethereum', 100, 'bsc', 102);
    expect(events).toHaveLength(1);
  });

  it('getActivePaths reflects evaluated profitable paths', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 5 });
    enabler.evaluate('GOLD', 'ethereum', 100, 'bsc', 102);
    enabler.evaluate('TSLA', 'solana', 200, 'ethereum', 205);
    expect(enabler.getActivePaths().length).toBeGreaterThanOrEqual(1);
  });

  it('scanPaths resets active paths on each call', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 5 });
    enabler.evaluate('GOLD', 'ethereum', 100, 'bsc', 110);
    const paths = enabler.scanPaths([], []);
    expect(paths).toHaveLength(0);
    expect(enabler.getActivePaths()).toHaveLength(0);
  });

  it('profitBps accounts for bridge fees', () => {
    const enabler = new ArbitrageEnabler({ minProfitBps: 1 });
    // 1% gross = 100 bps, minus 20 bps = 80 bps net
    const result = enabler.evaluate('GOLD', 'a', 100, 'b', 101);
    if (result) {
      expect(result.profitBps).toBe(80);
    }
  });
});
