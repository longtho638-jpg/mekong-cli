/**
 * RaaS Strategy Marketplace — discovery, rating, and deployment registry.
 * Bridges StrategyProviderRegistry + StrategyLoader with marketplace metadata.
 * Inspired by n8n community nodes + Portkey model registry.
 */

import {
  StrategyProviderRegistry,
  StrategyProvider,
  StrategyMetadata,
  DetectionContext,
} from './strategy-provider-registry';
import { logger } from '../utils/logger';

export interface MarketplaceEntry {
  metadata: StrategyMetadata;
  author: string;
  rating: number;       // 0-5, EMA α=0.3
  totalUsers: number;
  totalTrades: number;
  avgReturn: number;    // Percentage, EMA α=0.3
  avgSharpe: number;    // EMA α=0.3
  tags: string[];
  createdAt: number;    // Unix ms
  updatedAt: number;    // Unix ms
}

export interface MarketplaceStats {
  totalStrategies: number;
  avgRating: number;
  topPerformers: MarketplaceEntry[];
  byType: Record<string, number>;
}

const EMA_ALPHA = 0.3;

function ema(current: number, next: number): number {
  return EMA_ALPHA * next + (1 - EMA_ALPHA) * current;
}

export class StrategyMarketplace {
  private registry: StrategyProviderRegistry;
  private entries = new Map<string, MarketplaceEntry>();

  constructor(registry?: StrategyProviderRegistry) {
    this.registry = registry ?? new StrategyProviderRegistry();
  }

  /** Publish a strategy to marketplace — also registers provider if not already */
  publish(provider: StrategyProvider, author: string, tags: string[] = []): MarketplaceEntry {
    const { id } = provider.metadata;

    if (!this.registry.get(id)) {
      this.registry.register(provider);
    }

    const now = Date.now();
    const entry: MarketplaceEntry = {
      metadata: provider.metadata,
      author,
      rating: 0,
      totalUsers: 0,
      totalTrades: 0,
      avgReturn: 0,
      avgSharpe: 0,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.set(id, entry);
    logger.info(`[Marketplace] Published strategy: ${id} by ${author}`);
    return entry;
  }

  /** Rate a strategy (1-5); updates via EMA; ignores if not found */
  rate(strategyId: string, rating: number): void {
    const entry = this.entries.get(strategyId);
    if (!entry) {
      logger.warn(`[Marketplace] rate() — strategy not found: ${strategyId}`);
      return;
    }

    const clamped = Math.max(1, Math.min(5, rating));
    entry.rating = entry.rating === 0 ? clamped : ema(entry.rating, clamped);
    entry.updatedAt = Date.now();
    logger.info(`[Marketplace] Rated ${strategyId}: ${entry.rating.toFixed(2)}`);
  }

  /** Record a trade result — EMA-updates avgReturn and avgSharpe; increments totalTrades */
  recordPerformance(strategyId: string, returnPct: number, sharpe: number): void {
    const entry = this.entries.get(strategyId);
    if (!entry) {
      logger.warn(`[Marketplace] recordPerformance() — strategy not found: ${strategyId}`);
      return;
    }

    if (entry.totalTrades === 0) {
      entry.avgReturn = returnPct;
      entry.avgSharpe = sharpe;
    } else {
      entry.avgReturn = ema(entry.avgReturn, returnPct);
      entry.avgSharpe = ema(entry.avgSharpe, sharpe);
    }

    entry.totalTrades += 1;
    entry.updatedAt = Date.now();
  }

  /** Search strategies by type, minRating, tags (partial match), or supported pair */
  search(query: {
    type?: string;
    minRating?: number;
    tags?: string[];
    pair?: string;
  }): MarketplaceEntry[] {
    return Array.from(this.entries.values()).filter(entry => {
      if (query.type && entry.metadata.type !== query.type) return false;
      if (query.minRating !== undefined && entry.rating < query.minRating) return false;
      if (query.pair) {
        const supported = entry.metadata.supportedPairs;
        if (!supported.includes('*') && !supported.includes(query.pair)) return false;
      }
      if (query.tags && query.tags.length > 0) {
        const hasAll = query.tags.every(t =>
          entry.tags.some(et => et.toLowerCase().includes(t.toLowerCase()))
        );
        if (!hasAll) return false;
      }
      return true;
    });
  }

  /** Top N strategies sorted by avgSharpe DESC */
  getTopPerformers(n = 5): MarketplaceEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.avgSharpe - a.avgSharpe)
      .slice(0, n);
  }

  /** Marketplace-wide statistics */
  getStats(): MarketplaceStats {
    const all = Array.from(this.entries.values());
    const totalStrategies = all.length;
    const avgRating = totalStrategies === 0
      ? 0
      : all.reduce((sum, e) => sum + e.rating, 0) / totalStrategies;

    const byType: Record<string, number> = {};
    for (const e of all) {
      byType[e.metadata.type] = (byType[e.metadata.type] ?? 0) + 1;
    }

    return {
      totalStrategies,
      avgRating,
      topPerformers: this.getTopPerformers(3),
      byType,
    };
  }

  /** Discover marketplace entries that match a DetectionContext */
  discover(context: DetectionContext): MarketplaceEntry[] {
    const matched = this.registry.detect(context);
    const matchedIds = new Set(matched.map(p => p.metadata.id));
    return Array.from(this.entries.values())
      .filter(e => matchedIds.has(e.metadata.id))
      .sort((a, b) => b.avgSharpe - a.avgSharpe);
  }

  /** Get single entry by strategy ID */
  get(strategyId: string): MarketplaceEntry | undefined {
    return this.entries.get(strategyId);
  }

  /** List all marketplace entries */
  list(): MarketplaceEntry[] {
    return Array.from(this.entries.values());
  }
}
