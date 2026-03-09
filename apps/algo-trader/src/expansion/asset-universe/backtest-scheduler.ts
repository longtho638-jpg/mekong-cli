/**
 * Runs short backtests for new pairs. If Sharpe > threshold, adds to live list.
 * All backtest results are mocked — no real strategy execution.
 */

import { EventEmitter } from 'events';
import type { SymbolInfo, BacktestResult } from '../expansion-config-types';

export interface BacktestSchedulerConfig {
  sharpeThreshold: number;
}

/** Deterministic mock backtest: derives Sharpe from symbol string. */
function mockBacktest(symbol: string): BacktestResult {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const sharpe = 0.5 + (Math.abs(hash) % 1000) / 500; // range [0.5, 2.5]
  const totalReturn = (Math.abs(hash) % 200 - 50) / 100; // range [-0.5, 1.5]
  return { symbol, sharpe, totalReturn };
}

export class BacktestScheduler extends EventEmitter {
  private readonly config: BacktestSchedulerConfig;
  private readonly liveList: Set<string> = new Set();

  constructor(config: BacktestSchedulerConfig) {
    super();
    this.config = config;
  }

  /** Runs mock backtests and promotes symbols exceeding Sharpe threshold. */
  async scheduleBacktests(symbols: SymbolInfo[]): Promise<BacktestResult[]> {
    const results: BacktestResult[] = [];

    for (const s of symbols) {
      const result = mockBacktest(s.symbol);
      results.push(result);

      if (result.sharpe >= this.config.sharpeThreshold) {
        this.liveList.add(s.symbol);
        this.emit('promoted', result);
      }
    }

    this.emit('backtest-complete', results);
    return results;
  }

  /** Returns the current set of promoted live symbols. */
  getLiveList(): string[] {
    return Array.from(this.liveList);
  }

  /** Removes a symbol from the live list (e.g., on deteriorating performance). */
  demote(symbol: string): boolean {
    const removed = this.liveList.delete(symbol);
    if (removed) this.emit('demoted', symbol);
    return removed;
  }
}
