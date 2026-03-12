/**
 * Maker Bot Strategy
 *
 * Two-sided market making: continuously post bid/ask orders,
 * capture spread, cancel/replace as market moves.
 *
 * Core Loop:
 * 1. Calculate fair value from signal inputs
 * 2. Post bid at fairValue - spread/2
 * 3. Post ask at fairValue + spread/2
 * 4. When filled or stale, cancel and replace
 *
 * Inventory skew: Adjust quotes based on position to reduce risk
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';
import { logger } from '../../../utils/logger';

export interface MakerBotConfig {
  spreadBps: number;         // Target spread in bps (default 200 = 2%)
  orderSize: number;         // Shares per order (default 50)
  maxInventory: number;      // Max net position (default 200)
  skewFactor: number;        // Inventory skew multiplier (default 0.5)
  staleThresholdMs: number;  // Cancel/replace interval (default 5000)
  minConfidence: number;     // Min confidence to quote (default 0.3)
}

interface MakerState {
  lastBidPrice: number | null;
  lastAskPrice: number | null;
  lastUpdate: number;
  inventory: number; // Positive = long YES, negative = short YES
}

export class MakerBotStrategy extends BasePolymarketStrategy {
  name = 'MakerBot';

  protected config: Required<MakerBotConfig> = {
    spreadBps: 200,
    orderSize: 50,
    maxInventory: 200,
    skewFactor: 0.5,
    staleThresholdMs: 5000,
    minConfidence: 0.3,
  };

  private state = new Map<string, MakerState>(); // tokenId -> state

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as MakerBotConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      spreadBps: { type: 'number', default: 200, min: 50, max: 1000 },
      orderSize: { type: 'number', default: 50, min: 10, max: 500 },
      maxInventory: { type: 'number', default: 200, min: 50, max: 1000 },
      skewFactor: { type: 'number', default: 0.5, min: 0, max: 2 },
      staleThresholdMs: { type: 'number', default: 5000, min: 1000, max: 30000 },
      minConfidence: { type: 'number', default: 0.3, min: 0, max: 1 },
    };
  }

  /**
   * Calculate fair value from market microstructure
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const tick = this.getTick(tokenId);
    if (!tick) return null;

    // Fair value = mid price
    return (tick.yesBid + tick.yesAsk) / 2;
  }

  /**
   * Calculate inventory skew
   * Positive inventory → lower quotes to sell down
   * Negative inventory → raise quotes to buy back
   */
  private calculateSkew(inventory: number): number {
    const inventoryRatio = inventory / this.config.maxInventory;
    return inventoryRatio * this.config.skewFactor;
  }

  /**
   * Generate maker quotes
   */
  generateQuotes(tick: IMarketTick): IPolymarketSignal[] {
    const state = this.state.get(tick.tokenId) || {
      lastBidPrice: null,
      lastAskPrice: null,
      lastUpdate: 0,
      inventory: 0,
    };

    const fairValue = (tick.yesBid + tick.yesAsk) / 2;
    const halfSpread = (this.config.spreadBps / 10000) * fairValue / 2;
    const skew = this.calculateSkew(state.inventory);

    // Adjusted bid/ask with skew
    const bidPrice = Math.max(0.01, fairValue - halfSpread - skew);
    const askPrice = Math.min(0.99, fairValue + halfSpread - skew);

    const signals: IPolymarketSignal[] = [];
    const now = Date.now();
    const isStale = (now - state.lastUpdate) > this.config.staleThresholdMs;

    // Check if we need to update quotes
    const bidChanged = state.lastBidPrice === null || Math.abs(state.lastBidPrice - bidPrice) > 0.005;
    const askChanged = state.lastAskPrice === null || Math.abs(state.lastAskPrice - askPrice) > 0.005;

    if (bidChanged || isStale) {
      // Cancel old bid if exists
      if (state.lastBidPrice !== null) {
        signals.push({
          type: PolymarketSignalType.CANCEL,
          tokenId: tick.tokenId,
          marketId: tick.marketId,
          side: 'YES',
          action: 'CANCEL',
          price: state.lastBidPrice,
          size: 0,
          timestamp: now,
          catalyst: 'Stale quote or price move',
          metadata: { reason: 'cancel_bid' },
        });
      }

      // Place new bid
      signals.push({
        type: PolymarketSignalType.BUY_YES,
        tokenId: tick.tokenId,
        marketId: tick.marketId,
        side: 'YES',
        action: 'BUY',
        price: bidPrice,
        size: this.config.orderSize,
        timestamp: now,
        confidence: 0.5,
        catalyst: 'Maker bot bid',
        metadata: {
          fairValue,
          spreadBps: this.config.spreadBps,
          inventory: state.inventory,
          skew,
        },
      });
    }

    if (askChanged || isStale) {
      // Cancel old ask if exists
      if (state.lastAskPrice !== null) {
        signals.push({
          type: PolymarketSignalType.CANCEL,
          tokenId: tick.tokenId,
          marketId: tick.marketId,
          side: 'YES',
          action: 'CANCEL',
          price: state.lastAskPrice,
          size: 0,
          timestamp: now,
          catalyst: 'Stale quote or price move',
          metadata: { reason: 'cancel_ask' },
        });
      }

      // Place new ask
      signals.push({
        type: PolymarketSignalType.SELL_YES,
        tokenId: tick.tokenId,
        marketId: tick.marketId,
        side: 'YES',
        action: 'SELL',
        price: askPrice,
        size: this.config.orderSize,
        timestamp: now,
        confidence: 0.5,
        catalyst: 'Maker bot ask',
        metadata: {
          fairValue,
          spreadBps: this.config.spreadBps,
          inventory: state.inventory,
          skew,
        },
      });
    }

    // Update state
    state.lastBidPrice = bidPrice;
    state.lastAskPrice = askPrice;
    state.lastUpdate = now;
    this.state.set(tick.tokenId, state);

    return signals;
  }

  /**
   * Update inventory from fills
   */
  updateInventory(tokenId: string, side: 'BUY' | 'SELL', size: number): void {
    const state = this.state.get(tokenId) || {
      lastBidPrice: null,
      lastAskPrice: null,
      lastUpdate: 0,
      inventory: 0,
    };

    if (side === 'BUY') {
      state.inventory += size;
    } else {
      state.inventory -= size;
    }

    this.state.set(tokenId, state);
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  /**
   * Process tick and generate maker quotes
   */
  processTick(tick: IMarketTick): IPolymarketSignal[] {
    this.onMarketTick(tick);
    return this.generateQuotes(tick);
  }
}
