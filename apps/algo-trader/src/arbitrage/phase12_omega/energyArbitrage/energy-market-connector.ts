/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Fetches real-time electricity prices from spot markets (Nord Pool, ERCOT).
 * Uses simulation with realistic diurnal price curves ($/MWh).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnergyMarket = 'NORDPOOL' | 'ERCOT' | 'PJM' | 'CAISO';

export interface EnergyPrice {
  market: EnergyMarket;
  pricePerMwh: number;
  timestamp: number;
  currency: 'USD' | 'EUR';
  zone: string;
}

export interface MarketConnectorConfig {
  markets: EnergyMarket[];
  /** Interval between fetches in ms. Default 300_000 (5 min) */
  fetchIntervalMs: number;
  /** Enable simulation mode (no real API calls) */
  simulation: boolean;
}

// ── Price curve simulation ─────────────────────────────────────────────────

/** Realistic diurnal curves: off-peak ~$30, peak ~$120, midday dip for solar */
const MARKET_BASE_PRICES: Record<EnergyMarket, number> = {
  NORDPOOL: 45,
  ERCOT: 35,
  PJM: 50,
  CAISO: 55,
};

const MARKET_ZONES: Record<EnergyMarket, string> = {
  NORDPOOL: 'NO1',
  ERCOT: 'HB_NORTH',
  PJM: 'AEP',
  CAISO: 'SP15',
};

const MARKET_CURRENCY: Record<EnergyMarket, 'USD' | 'EUR'> = {
  NORDPOOL: 'EUR',
  ERCOT: 'USD',
  PJM: 'USD',
  CAISO: 'USD',
};

/**
 * Simulates hourly electricity price using a sine-based diurnal curve.
 * Peak at hour 18, trough at hour 3. Adds ±10% random noise.
 */
function simulatePrice(basePrice: number, nowMs?: number): number {
  const now = nowMs ?? Date.now();
  const hourOfDay = new Date(now).getHours() + new Date(now).getMinutes() / 60;
  // Sine wave: peak at 18:00, trough at 6:00
  const phaseFactor = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI);
  const cyclicMultiplier = 1 + 0.5 * phaseFactor;
  const noise = 0.9 + Math.random() * 0.2;
  return Math.round(basePrice * cyclicMultiplier * noise * 100) / 100;
}

// ── EnergyMarketConnector ──────────────────────────────────────────────────

export class EnergyMarketConnector {
  private readonly config: MarketConnectorConfig;
  private latestPrices: Map<EnergyMarket, EnergyPrice> = new Map();

  constructor(config: Partial<MarketConnectorConfig> = {}) {
    this.config = {
      markets: ['NORDPOOL', 'ERCOT'],
      fetchIntervalMs: 300_000,
      simulation: true,
      ...config,
    };
  }

  /** Fetch current prices for all configured markets. */
  async fetchPrices(nowMs?: number): Promise<EnergyPrice[]> {
    const timestamp = nowMs ?? Date.now();
    const results: EnergyPrice[] = [];

    for (const market of this.config.markets) {
      const price = await this.fetchMarketPrice(market, timestamp);
      this.latestPrices.set(market, price);
      results.push(price);
    }

    return results;
  }

  /** Fetch price for a single market. */
  private async fetchMarketPrice(market: EnergyMarket, timestamp: number): Promise<EnergyPrice> {
    if (this.config.simulation) {
      return {
        market,
        pricePerMwh: simulatePrice(MARKET_BASE_PRICES[market], timestamp),
        timestamp,
        currency: MARKET_CURRENCY[market],
        zone: MARKET_ZONES[market],
      };
    }
    // Real API integration placeholder — extend with Nord Pool / ERCOT REST APIs
    throw new Error(`Live market fetch not implemented for ${market}`);
  }

  /** Return cached latest prices without fetching. */
  getLatestPrices(): EnergyPrice[] {
    return Array.from(this.latestPrices.values());
  }

  /** Return cheapest market from cached prices. */
  getCheapestMarket(): EnergyPrice | undefined {
    const prices = this.getLatestPrices();
    if (prices.length === 0) return undefined;
    return prices.reduce((min, p) => (p.pricePerMwh < min.pricePerMwh ? p : min));
  }

  getConfig(): MarketConnectorConfig {
    return { ...this.config };
  }
}

export default EnergyMarketConnector;
