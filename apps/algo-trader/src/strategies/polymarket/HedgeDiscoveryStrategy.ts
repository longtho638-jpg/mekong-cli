/**
 * Hedge Discovery Strategy
 *
 * Finds logically related markets and identifies pricing inconsistencies.
 * Example: If "Trump wins 2024" = 0.60, then "Trump loses 2024" should = 0.40
 *
 * Signal Logic:
 * - Scan for related markets (same event, different outcomes)
 * - Calculate implied probabilities
 * - Detect inconsistencies: P(A) + P(not A) != 1.0
 * - Buy undervalued side, sell overvalued side
 *
 * Works for: Political elections, binary events, complementary outcomes
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface HedgeDiscoveryConfig {
  minEdgeThreshold: number;    // Minimum edge (default 0.03 = 3%)
  maxPositionSize: number;     // Max shares per leg (default 40)
  correlationThreshold: number; // Min correlation to consider related (default 0.8)
}

export interface RelatedMarkets {
  marketA: { tokenId: string; marketId: string; question: string };
  marketB: { tokenId: string; marketId: string; question: string };
  relationship: 'COMPLEMENT' | 'IMPLICATION' | 'MUTUAL_EXCLUSIVE';
  // P(A) + P(B) should = 1.0 for complements
  // P(A) <= P(B) for implications (A -> B)
}

export class HedgeDiscoveryStrategy extends BasePolymarketStrategy {
  name = 'Hedge Discovery';

  protected config: Required<HedgeDiscoveryConfig> = {
    minEdgeThreshold: 0.03,
    maxPositionSize: 40,
    correlationThreshold: 0.8,
  };

  private relatedPairs = new Map<string, RelatedMarkets>(); // pairId -> pair
  private lastPrices = new Map<string, number>(); // tokenId -> price

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as HedgeDiscoveryConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minEdgeThreshold: { type: 'number', default: 0.03, min: 0.01, max: 0.1 },
      maxPositionSize: { type: 'number', default: 40, min: 10, max: 200 },
      correlationThreshold: { type: 'number', default: 0.8, min: 0.5, max: 1.0 },
    };
  }

  /**
   * Register related markets pair
   */
  registerPair(pairId: string, pair: RelatedMarkets): void {
    this.relatedPairs.set(pairId, pair);
  }

  /**
   * Update price for a token
   */
  updatePrice(tokenId: string, price: number): void {
    this.lastPrices.set(tokenId, price);
  }

  /**
   * Calculate fair value based on related market
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    // Find pairs involving this token
    for (const [, pair] of this.relatedPairs) {
      if (pair.marketA.tokenId === tokenId) {
        const priceB = this.lastPrices.get(pair.marketB.tokenId);
        if (priceB === undefined) continue;

        if (pair.relationship === 'COMPLEMENT') {
          // P(A) = 1 - P(B)
          return 1 - priceB;
        }
      }
      if (pair.marketB.tokenId === tokenId) {
        const priceA = this.lastPrices.get(pair.marketA.tokenId);
        if (priceA === undefined) continue;

        if (pair.relationship === 'COMPLEMENT') {
          // P(B) = 1 - P(A)
          return 1 - priceA;
        }
      }
    }
    return null;
  }

  /**
   * Check pair for arbitrage opportunity
   */
  checkPair(pair: RelatedMarkets, priceA: number, priceB: number): {
    hasOpportunity: boolean;
    edge: number;
    signals: Array<'BUY_A' | 'SELL_A' | 'BUY_B' | 'SELL_B'>;
  } {
    const signals: Array<'BUY_A' | 'SELL_A' | 'BUY_B' | 'SELL_B'> = [];

    if (pair.relationship === 'COMPLEMENT') {
      const sum = priceA + priceB;
      const edge = 1 - sum;

      if (edge > this.config.minEdgeThreshold) {
        // Sum < 1, buy both for arb
        return {
          hasOpportunity: true,
          edge,
          signals: ['BUY_A', 'BUY_B'],
        };
      }

      if (edge < -this.config.minEdgeThreshold) {
        // Sum > 1, sell both if possible
        return {
          hasOpportunity: true,
          edge: Math.abs(edge),
          signals: ['SELL_A', 'SELL_B'],
        };
      }
    }

    return { hasOpportunity: false, edge: 0, signals: [] };
  }

  /**
   * Generate hedge signals
   */
  generateSignals(tickA: IMarketTick, tickB: IMarketTick, pair: RelatedMarkets): IPolymarketSignal[] {
    const result = this.checkPair(pair, tickA.yesPrice, tickB.yesPrice);
    const signals: IPolymarketSignal[] = [];

    if (!result.hasOpportunity) return signals;

    const now = Date.now();

    for (const signal of result.signals) {
      if (signal === 'BUY_A') {
        signals.push({
          type: PolymarketSignalType.BUY_YES,
          tokenId: tickA.tokenId,
          marketId: tickA.marketId,
          side: 'YES',
          action: 'BUY',
          price: tickA.yesPrice,
          size: this.config.maxPositionSize,
          timestamp: now,
          expectedValue: result.edge * this.config.maxPositionSize,
          confidence: Math.min(result.edge / 0.05, 1.0),
          catalyst: `Hedge: ${pair.marketA.question}`,
          metadata: { pair: pair.relationship, edge: result.edge },
        });
      } else if (signal === 'BUY_B') {
        signals.push({
          type: PolymarketSignalType.BUY_YES,
          tokenId: tickB.tokenId,
          marketId: tickB.marketId,
          side: 'YES',
          action: 'BUY',
          price: tickB.yesPrice,
          size: this.config.maxPositionSize,
          timestamp: now,
          expectedValue: result.edge * this.config.maxPositionSize,
          confidence: Math.min(result.edge / 0.05, 1.0),
          catalyst: `Hedge: ${pair.marketB.question}`,
          metadata: { pair: pair.relationship, edge: result.edge },
        });
      }
      // Add SELL signals if needed (when sum > 1)
    }

    return signals;
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    this.onMarketTick(tick);
    return null; // Need pair for hedge detection
  }

  /**
   * Process pair of ticks for hedge discovery
   */
  processPair(tickA: IMarketTick, tickB: IMarketTick, pair: RelatedMarkets): IPolymarketSignal[] {
    this.onMarketTick(tickA);
    this.onMarketTick(tickB);
    this.updatePrice(tickA.tokenId, tickA.yesPrice);
    this.updatePrice(tickB.tokenId, tickB.yesPrice);
    return this.generateSignals(tickA, tickB, pair);
  }
}
