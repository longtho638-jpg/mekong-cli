/**
 * Exchange Registry — Central config store for active exchanges.
 * Holds credentials, trading pairs, and router weights.
 */

export interface ExchangeConfig {
  id: string;
  enabled: boolean;
  apiKey?: string;
  secret?: string;
  tradingPairs: string[];
  weight?: number;  // Router weight, default 50
  maxRpm?: number;  // Rate limit per minute, default 60
}

export class ExchangeRegistry {
  private exchanges = new Map<string, ExchangeConfig>();

  register(config: ExchangeConfig): void {
    this.exchanges.set(config.id, config);
  }

  unregister(id: string): void {
    this.exchanges.delete(id);
  }

  get(id: string): ExchangeConfig | undefined {
    return this.exchanges.get(id);
  }

  getEnabled(): ExchangeConfig[] {
    return Array.from(this.exchanges.values()).filter(e => e.enabled);
  }

  /** Deduplicated union of all trading pairs across enabled exchanges */
  getAllPairs(): string[] {
    const pairs = new Set<string>();
    for (const ex of this.getEnabled()) {
      for (const p of ex.tradingPairs) pairs.add(p);
    }
    return Array.from(pairs);
  }

  /** Load API keys from environment variables: {ID}_API_KEY, {ID}_SECRET */
  loadFromEnv(exchangeIds: string[]): void {
    for (const id of exchangeIds) {
      const upper = id.toUpperCase();
      const apiKey = process.env[`${upper}_API_KEY`];
      const secret = process.env[`${upper}_SECRET`];
      const existing = this.exchanges.get(id);
      if (existing) {
        if (apiKey) existing.apiKey = apiKey;
        if (secret) existing.secret = secret;
      }
    }
  }

  /** Number of registered exchanges */
  get size(): number {
    return this.exchanges.size;
  }

  /** All registered exchange IDs */
  getIds(): string[] {
    return Array.from(this.exchanges.keys());
  }
}
