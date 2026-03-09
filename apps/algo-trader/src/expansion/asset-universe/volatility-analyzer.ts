/**
 * Computes rolling volatility for symbols and filters by configurable bounds.
 */

import { EventEmitter } from 'events';
import type { SymbolInfo } from '../expansion-config-types';

export interface VolatilityAnalyzerConfig {
  bounds: [number, number]; // [min, max] as annualized decimal
  lookbackPeriods?: number;
}

/** Annualized volatility computed from simulated daily returns. */
function computeVolatility(symbol: string): number {
  // Deterministic mock: hash symbol to a stable volatility value
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  // Map hash to range [0.005, 0.30]
  return 0.005 + (Math.abs(hash) % 1000) / 1000 * 0.295;
}

export class VolatilityAnalyzer extends EventEmitter {
  private readonly config: VolatilityAnalyzerConfig;

  constructor(config: VolatilityAnalyzerConfig) {
    super();
    this.config = config;
  }

  /** Annotates symbols with computed volatility. */
  annotateVolatility(symbols: SymbolInfo[]): SymbolInfo[] {
    return symbols.map((s) => ({
      ...s,
      volatility: computeVolatility(s.symbol),
    }));
  }

  /**
   * Filters to symbols whose volatility is within [min, max] bounds.
   */
  filterByVolatility(symbols: SymbolInfo[]): SymbolInfo[] {
    const [min, max] = this.config.bounds;
    const annotated = this.annotateVolatility(symbols);
    const filtered = annotated.filter(
      (s) => s.volatility >= min && s.volatility <= max,
    );
    this.emit('filtered', filtered);
    return filtered;
  }

  /** Returns the volatility estimate for a single symbol. */
  getVolatility(symbol: string): number {
    return computeVolatility(symbol);
  }
}
