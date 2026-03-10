/**
 * Queries exchanges for symbols and filters by minimum 24h volume.
 * All exchange calls are mocked — no real network I/O.
 */

import { EventEmitter } from 'events';
import type { SymbolInfo } from '../expansion-config-types';

export interface LiquidityScannerConfig {
  minVolume24h: number;
  exchanges?: string[];
}

interface MockTicker {
  symbol: string;
  volume24h: number;
}

const MOCK_TICKERS: MockTicker[] = [
  { symbol: 'BTC/USDT', volume24h: 5_000_000_000 },
  { symbol: 'ETH/USDT', volume24h: 2_000_000_000 },
  { symbol: 'SOL/USDT', volume24h: 800_000_000 },
  { symbol: 'DOGE/USDT', volume24h: 500_000 },
  { symbol: 'SHIB/USDT', volume24h: 100_000 },
  { symbol: 'ARB/USDT', volume24h: 150_000_000 },
  { symbol: 'OP/USDT', volume24h: 120_000_000 },
  { symbol: 'MATIC/USDT', volume24h: 300_000_000 },
];

export class LiquidityScanner extends EventEmitter {
  private readonly config: LiquidityScannerConfig;

  constructor(config: LiquidityScannerConfig) {
    super();
    this.config = config;
  }

  /** Simulates fetching tickers from an exchange. */
  private fetchMockTickers(_exchange: string): MockTicker[] {
    return MOCK_TICKERS;
  }

  /** Returns symbols passing the minimum 24h volume threshold. */
  async scanLiquidSymbols(): Promise<SymbolInfo[]> {
    const exchanges = this.config.exchanges ?? ['binance'];
    const seen = new Set<string>();
    const results: SymbolInfo[] = [];

    for (const exchange of exchanges) {
      const tickers = this.fetchMockTickers(exchange);
      for (const ticker of tickers) {
        if (!seen.has(ticker.symbol) && ticker.volume24h >= this.config.minVolume24h) {
          seen.add(ticker.symbol);
          results.push({
            symbol: ticker.symbol,
            volume24h: ticker.volume24h,
            volatility: 0, // filled by VolatilityAnalyzer
          });
        }
      }
    }

    this.emit('scan-complete', results);
    return results;
  }

  /** Returns raw volume for a given symbol from mock data. */
  getVolume(symbol: string): number {
    const ticker = MOCK_TICKERS.find((t) => t.symbol === symbol);
    return ticker?.volume24h ?? 0;
  }
}
