/**
 * MarketPairMapper - Polymarket ↔ Kalshi ticker mapping
 * Manual mapping table + auto-discovery via text similarity + caching
 */

export interface MarketMapping {
  polySlug: string;
  kalshiTicker: string;
  eventId: string;
  description: string;
  confidence?: number; // Auto-discovered mappings have < 1.0
  createdAt: number;
}

export interface MappingCache {
  [key: string]: MarketMapping; // key: `${polySlug}-${kalshiTicker}`
}

export class MarketPairMapper {
  private manualMappings: Map<string, MarketMapping> = new Map();
  private cache: MappingCache = {};
  private readonly cacheTTL: number;

  constructor(cacheTTLMs: number = 5 * 60 * 1000) {
    this.cacheTTL = cacheTTLMs;
  }

  /**
   * Add a manual mapping entry
   */
  addMapping(mapping: MarketMapping): void {
    const key = `${mapping.polySlug}-${mapping.kalshiTicker}`;
    mapping.confidence = 1.0;
    mapping.createdAt = Date.now();
    this.manualMappings.set(key, mapping);
    this.cache[key] = mapping;
  }

  /**
   * Load multiple mappings at once
   */
  loadMappings(mappings: MarketMapping[]): void {
    for (const m of mappings) {
      this.addMapping(m);
    }
  }

  /**
   * Find Kalshi ticker for a Polymarket slug
   */
  getKalshiForPolymarket(polySlug: string): MarketMapping | null {
    for (const [key, mapping] of this.manualMappings.entries()) {
      if (key.startsWith(`${polySlug}-`)) {
        return this.isCacheValid(mapping) ? mapping : null;
      }
    }
    return null;
  }

  /**
   * Find Polymarket slug for a Kalshi ticker
   */
  getPolymarketForKalshi(kalshiTicker: string): MarketMapping | null {
    for (const [key, mapping] of this.manualMappings.entries()) {
      if (key.endsWith(`-${kalshiTicker}`)) {
        return this.isCacheValid(mapping) ? mapping : null;
      }
    }
    return null;
  }

  /**
   * Auto-discover mappings via text similarity (Jaccard index)
   */
  autoDiscoverMappings(
    polyMarkets: Array<{ slug: string; title: string }>,
    kalshiMarkets: Array<{ ticker: string; title: string; eventId: string }>
  ): MarketMapping[] {
    const discovered: MarketMapping[] = [];

    for (const poly of polyMarkets) {
      let bestMatch: MarketMapping | null = null;
      let bestScore = 0;

      for (const kalshi of kalshiMarkets) {
        const score = this.computeTextSimilarality(poly.title, kalshi.title);
        if (score > bestScore && score > 0.6) {
          bestScore = score;
          bestMatch = {
            polySlug: poly.slug,
            kalshiTicker: kalshi.ticker,
            eventId: kalshi.eventId,
            description: kalshi.title,
            confidence: score,
            createdAt: Date.now(),
          };
        }
      }

      if (bestMatch) {
        discovered.push(bestMatch);
        const key = `${bestMatch.polySlug}-${bestMatch.kalshiTicker}`;
        this.cache[key] = bestMatch;
      }
    }

    return discovered;
  }

  /**
   * Get cached mapping by key
   */
  getCached(key: string): MarketMapping | null {
    return this.isCacheValid(this.cache[key]) ? this.cache[key] : null;
  }

  /**
   * Clear expired cache entries
   */
  pruneCache(): void {
    const now = Date.now();
    for (const key of Object.keys(this.cache)) {
      if (now - this.cache[key].createdAt > this.cacheTTL) {
        delete this.cache[key];
      }
    }
  }

  /**
   * Get all manual mappings
   */
  getAllMappings(): MarketMapping[] {
    return Array.from(this.manualMappings.values()).filter(m => this.isCacheValid(m));
  }

  private isCacheValid(mapping: MarketMapping | undefined): boolean {
    if (!mapping) return false;
    return Date.now() - mapping.createdAt < this.cacheTTL;
  }

  /**
   * Compute Jaccard similarity between two text strings
   */
  private computeTextSimilarality(a: string, b: string): number {
    const tokensA = this.tokenize(a);
    const tokensB = this.tokenize(b);

    const intersection = new Set([...tokensA].filter(t => tokensB.has(t)));
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[?.,!()"]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
  }
}
