/**
 * Mock RWA price feeds for tokenized stocks and commodities.
 */

import { EventEmitter } from 'events';
import type { RwaPrice } from '../expansion-config-types';

const BASE_PRICES: Record<string, number> = {
  TSLA: 245.50,
  AAPL: 189.30,
  GOLD: 2350.00,
  SILVER: 28.50,
  OIL: 82.40,
};

export class RwaOracleManager extends EventEmitter {
  private readonly assets: string[];
  private readonly prices: Map<string, number> = new Map();

  constructor(assets: string[]) {
    super();
    this.assets = assets;
  }

  /** Fetch (mock) latest prices for all configured RWA assets. */
  async fetchPrices(): Promise<RwaPrice[]> {
    const results: RwaPrice[] = [];
    const now = Date.now();

    for (const asset of this.assets) {
      const base = BASE_PRICES[asset] ?? 100;
      // Add deterministic noise: ±0.5%
      const noise = (Math.sin(now / 10_000 + asset.length) * 0.005 + 1);
      const price = parseFloat((base * noise).toFixed(4));
      this.prices.set(asset, price);
      const rwaPrice: RwaPrice = { asset, price, timestamp: now };
      results.push(rwaPrice);
      this.emit('price-updated', rwaPrice);
    }

    return results;
  }

  /** Returns the last known price for an asset, or null if not yet fetched. */
  getPrice(asset: string): number | null {
    return this.prices.get(asset) ?? null;
  }

  /** Returns all tracked assets. */
  getAssets(): string[] {
    return [...this.assets];
  }
}
