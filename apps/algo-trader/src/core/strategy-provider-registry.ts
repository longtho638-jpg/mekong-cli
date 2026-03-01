/**
 * Strategy Provider Registry — Nixpacks-inspired provider system.
 *
 * Each strategy is a "provider" that self-describes:
 * - detect(): can this provider handle the given market/config?
 * - getMetadata(): strategy capabilities, supported pairs, risk level
 * - create(): factory to instantiate the strategy
 *
 * Registry discovers, validates, and manages providers.
 * Inspired by railway/nixpacks Provider trait pattern.
 */

import { IStrategy } from '../interfaces/IStrategy';

/** Strategy type classification */
export type StrategyType = 'trend' | 'momentum' | 'arbitrage' | 'mean-reversion' | 'hybrid';
export type RiskLevel = 'low' | 'medium' | 'high';

/** Provider metadata — self-description of strategy capabilities */
export interface StrategyMetadata {
  id: string;
  name: string;
  version: string;
  type: StrategyType;
  supportedPairs: string[];      // ["BTC/USDT", "*"] — "*" = all pairs
  supportedTimeframes: string[]; // ["1m", "5m", "1h", "4h", "1d"]
  riskLevel: RiskLevel;
  description: string;
  requiredIndicators: string[];  // ["rsi", "sma", "bollinger"]
  minHistoryCandles: number;     // minimum candles needed for init
}

/** Detection context — what the provider checks to determine applicability */
export interface DetectionContext {
  pair: string;
  timeframe: string;
  exchangeId: string;
  marketCondition?: 'trending' | 'ranging' | 'volatile' | 'quiet';
  availableIndicators?: string[];
}

/** Strategy provider interface — Nixpacks Provider trait equivalent */
export interface StrategyProvider {
  metadata: StrategyMetadata;
  detect(context: DetectionContext): boolean;
  create(): IStrategy;
}

/**
 * StrategyProviderRegistry — discovers and manages strategy providers.
 * Analogous to Nixpacks' provider registry that matches source code to build providers.
 */
export class StrategyProviderRegistry {
  private providers = new Map<string, StrategyProvider>();

  /** Register a strategy provider */
  register(provider: StrategyProvider): void {
    if (this.providers.has(provider.metadata.id)) {
      throw new Error(`Provider "${provider.metadata.id}" already registered`);
    }
    this.providers.set(provider.metadata.id, provider);
  }

  /** Get provider by ID */
  get(id: string): StrategyProvider | undefined {
    return this.providers.get(id);
  }

  /** List all registered providers */
  list(): StrategyMetadata[] {
    return Array.from(this.providers.values()).map(p => p.metadata);
  }

  /** Auto-detect applicable providers for given context (Nixpacks detect pattern) */
  detect(context: DetectionContext): StrategyProvider[] {
    return Array.from(this.providers.values()).filter(p => p.detect(context));
  }

  /** Find best provider for context (first match by priority: arbitrage > trend > momentum) */
  findBest(context: DetectionContext): StrategyProvider | undefined {
    const matches = this.detect(context);
    if (matches.length === 0) return undefined;

    // Priority: arbitrage opportunities first, then specific type matches
    const priorityOrder: StrategyType[] = ['arbitrage', 'mean-reversion', 'trend', 'momentum', 'hybrid'];
    for (const type of priorityOrder) {
      const match = matches.find(p => p.metadata.type === type);
      if (match) return match;
    }
    return matches[0];
  }

  /** Filter providers by type */
  filterByType(type: StrategyType): StrategyProvider[] {
    return Array.from(this.providers.values()).filter(p => p.metadata.type === type);
  }

  /** Filter providers by pair support */
  filterByPair(pair: string): StrategyProvider[] {
    return Array.from(this.providers.values()).filter(p =>
      p.metadata.supportedPairs.includes('*') || p.metadata.supportedPairs.includes(pair)
    );
  }

  /** Get count of registered providers */
  get size(): number {
    return this.providers.size;
  }
}
