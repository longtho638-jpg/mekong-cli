/**
 * CEX Price Fetcher — mock centralised-exchange price feed for RWA tokens.
 * In production: fetches from Binance / Coinbase / Kraken REST APIs.
 * Mock: returns seeded prices with slight random variation per exchange.
 * All instances default to dryRun: true.
 */

import { randomBytes } from 'crypto';

export interface CexPriceFetcherConfig {
  /** Dry-run mode — no real HTTP calls. Default: true. */
  dryRun: boolean;
  /** Exchange names to simulate. */
  exchanges: string[];
}

export interface CexPriceResult {
  symbol: string;
  price: number;
  exchange: string;
  timestamp: number;
}

/** Baseline CEX prices for supported symbols (USD). */
const CEX_BASE_PRICES: Record<string, number> = {
  'AAPL': 185.50,
  'GOLD': 2052.00,
  'TSLA': 246.00,
  'MSFT': 415.80,
  'OIL':    80.30,
  'REAL_ESTATE_IDX': 301.00,
};

/** Max random spread ±0.3% per exchange. */
const MAX_VARIATION = 0.003;

const DEFAULT_CONFIG: CexPriceFetcherConfig = {
  dryRun: true,
  exchanges: ['binance', 'coinbase', 'kraken'],
};

export class CexPriceFetcher {
  private readonly cfg: CexPriceFetcherConfig;

  constructor(config: Partial<CexPriceFetcherConfig> = {}) {
    this.cfg = {
      ...DEFAULT_CONFIG,
      ...config,
      exchanges: config.exchanges?.length ? config.exchanges : DEFAULT_CONFIG.exchanges,
    };
  }

  /**
   * Fetch mock CEX price for a symbol.
   * Picks the first configured exchange and applies a small random variation
   * so CEX prices differ slightly from on-chain oracle prices.
   */
  fetchPrice(symbol: string): CexPriceResult {
    const base = CEX_BASE_PRICES[symbol] ?? 100.50;
    const exchange = this._pickExchange();
    const variation = this._randomVariation();
    const price = parseFloat((base * (1 + variation)).toFixed(4));

    return {
      symbol,
      price,
      exchange,
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch prices from all configured exchanges for a symbol.
   * Returns one result per exchange.
   */
  fetchAllExchanges(symbol: string): CexPriceResult[] {
    const base = CEX_BASE_PRICES[symbol] ?? 100.50;
    return this.cfg.exchanges.map((exchange) => ({
      symbol,
      price: parseFloat((base * (1 + this._randomVariation())).toFixed(4)),
      exchange,
      timestamp: Date.now(),
    }));
  }

  /** List all supported symbols. */
  supportedSymbols(): string[] {
    return Object.keys(CEX_BASE_PRICES);
  }

  getConfig(): CexPriceFetcherConfig {
    return { ...this.cfg, exchanges: [...this.cfg.exchanges] };
  }

  /** Pick exchange in round-robin using a random byte for variety. */
  private _pickExchange(): string {
    const idx = randomBytes(1).readUInt8(0) % this.cfg.exchanges.length;
    return this.cfg.exchanges[idx];
  }

  /** Random variation in [-MAX_VARIATION, +MAX_VARIATION]. */
  private _randomVariation(): number {
    const byte = randomBytes(1).readUInt8(0);
    return (byte / 255 - 0.5) * 2 * MAX_VARIATION;
  }
}
