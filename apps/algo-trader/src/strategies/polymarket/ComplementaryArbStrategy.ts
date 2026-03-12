/**
 * Complementary Arbitrage Strategy
 *
 * Detects when YES + NO != $1.00 and arbitrages the difference.
 * In efficient markets, YES + NO should equal exactly $1.00 (100%).
 * When the sum deviates, we can buy both sides for < $1.00 and guarantee profit.
 *
 * Signal Logic:
 * - If yesPrice + noPrice < 1.00: Buy both YES and NO (arbitrage opportunity)
 * - If yesPrice + noPrice > 1.00: Sell both sides (if possible)
 *
 * Edge = 1.00 - (yesPrice + noPrice)
 * Profit = Edge * shares - fees
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface ComplementaryArbConfig {
  minEdgeThreshold: number;    // Minimum edge to trade (default 0.02 = 2%)
  maxPositionSize: number;     // Max shares per arb (default 100)
  feeRateBps: number;          // Fee rate in basis points (default 2500 = 0.25%)
}

export class ComplementaryArbStrategy extends BasePolymarketStrategy {
  name = 'ComplementaryArb';

  protected config: Required<ComplementaryArbConfig> = {
    minEdgeThreshold: 0.02,
    maxPositionSize: 100,
    feeRateBps: 2500,
  };

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as ComplementaryArbConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minEdgeThreshold: { type: 'number', default: 0.02, min: 0.001, max: 0.1 },
      maxPositionSize: { type: 'number', default: 100, min: 10, max: 1000 },
      feeRateBps: { type: 'number', default: 2500, min: 0, max: 10000 },
    };
  }

  /**
   * Calculate if YES + NO != 1.00
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    // For complementary arb, fair value of the pair is always 1.00
    return 1.00;
  }

  /**
   * Check for arbitrage opportunity
   */
  checkArbitrage(yesTick: IMarketTick, noTick: IMarketTick): {
    hasArb: boolean;
    edge: number;
    profitPerShare: number;
    side: 'BUY_BOTH' | 'SELL_BOTH' | null;
  } {
    const sumPrices = yesTick.yesPrice + noTick.noPrice;
    const edge = 1.00 - sumPrices;
    const feePerShare = (this.config.feeRateBps / 10000) * sumPrices;
    const profitPerShare = edge - feePerShare;

    if (edge > this.config.minEdgeThreshold && profitPerShare > 0) {
      return { hasArb: true, edge, profitPerShare, side: 'BUY_BOTH' };
    }

    if (edge < -this.config.minEdgeThreshold) {
      return { hasArb: true, edge, profitPerShare: -edge, side: 'SELL_BOTH' };
    }

    return { hasArb: false, edge: 0, profitPerShare: 0, side: null };
  }

  /**
   * Generate arbitrage signals
   */
  generateSignals(yesTick: IMarketTick, noTick: IMarketTick): IPolymarketSignal[] {
    const arb = this.checkArbitrage(yesTick, noTick);
    const signals: IPolymarketSignal[] = [];

    if (!arb.hasArb || !arb.side) return signals;

    const size = this.config.maxPositionSize;
    const now = Date.now();

    if (arb.side === 'BUY_BOTH') {
      // Buy YES shares
      signals.push({
        type: PolymarketSignalType.BUY_YES,
        tokenId: yesTick.tokenId,
        marketId: yesTick.marketId,
        side: 'YES',
        action: 'BUY',
        price: yesTick.yesPrice,
        size,
        timestamp: now,
        expectedValue: arb.edge * size,
        confidence: Math.min(arb.edge / 0.05, 1.0), // Scale confidence by edge
        catalyst: `Complementary arb: YES+NO=${1-arb.edge} < 1.00`,
        metadata: {
          marketQuestion: yesTick.marketId,
          outcomePrices: [yesTick.yesPrice, noTick.noPrice],
          edge: arb.edge,
          profitPerShare: arb.profitPerShare,
        },
      });

      // Buy NO shares
      signals.push({
        type: PolymarketSignalType.BUY_NO,
        tokenId: noTick.tokenId,
        marketId: noTick.marketId,
        side: 'NO',
        action: 'BUY',
        price: noTick.noPrice,
        size,
        timestamp: now,
        expectedValue: arb.edge * size,
        confidence: Math.min(arb.edge / 0.05, 1.0),
        catalyst: `Complementary arb: YES+NO=${1-arb.edge} < 1.00`,
        metadata: {
          marketQuestion: noTick.marketId,
          outcomePrices: [yesTick.yesPrice, noTick.noPrice],
          edge: arb.edge,
          profitPerShare: arb.profitPerShare,
        },
      });
    }

    return signals;
  }

  /**
   * Process candle (for compatibility)
   */
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  /**
   * Process ticks and generate arbitrage signals
   * Call with both YES and NO ticks for arb detection
   */
  processTicks(yesTick: IMarketTick, noTick: IMarketTick): IPolymarketSignal[] {
    this.onMarketTick(yesTick);
    this.onMarketTick(noTick);
    return this.generateSignals(yesTick, noTick);
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    // For compatibility - store tick but need both for arb
    this.onMarketTick(tick);
    return null;
  }
}
