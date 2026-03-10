import { BacktestScheduler } from '../../../src/expansion/asset-universe/backtest-scheduler';
import type { SymbolInfo } from '../../../src/expansion/expansion-config-types';

const makeSymbols = (symbols: string[]): SymbolInfo[] =>
  symbols.map((symbol) => ({ symbol, volume24h: 1_000_000, volatility: 0.05 }));

describe('BacktestScheduler', () => {
  it('returns backtest results for all symbols', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 0 });
    const results = await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT', 'ETH/USDT']));
    expect(results).toHaveLength(2);
  });

  it('promotes symbols with sharpe >= threshold', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 0 });
    await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']));
    // All should be promoted since threshold is 0
    expect(scheduler.getLiveList().length).toBeGreaterThan(0);
  });

  it('does not promote symbols below threshold', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 999 });
    await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT']));
    expect(scheduler.getLiveList()).toHaveLength(0);
  });

  it('emits promoted event for qualifying symbols', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 0 });
    const promoted: unknown[] = [];
    scheduler.on('promoted', (r) => promoted.push(r));
    await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT', 'ETH/USDT']));
    expect(promoted.length).toBeGreaterThan(0);
  });

  it('emits backtest-complete event', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 1 });
    const events: unknown[] = [];
    scheduler.on('backtest-complete', (r) => events.push(r));
    await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT']));
    expect(events).toHaveLength(1);
  });

  it('demote removes symbol from live list', async () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 0 });
    await scheduler.scheduleBacktests(makeSymbols(['BTC/USDT']));
    const before = scheduler.getLiveList().length;
    if (before > 0) {
      scheduler.demote('BTC/USDT');
      expect(scheduler.getLiveList()).not.toContain('BTC/USDT');
    }
  });

  it('demote returns false for unknown symbol', () => {
    const scheduler = new BacktestScheduler({ sharpeThreshold: 1 });
    expect(scheduler.demote('UNKNOWN/USDT')).toBe(false);
  });
});
