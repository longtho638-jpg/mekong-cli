/**
 * Whale Tracking Strategy
 *
 * Monitors on-chain whale wallets and copies their Polymarket trades.
 * Tracks successful traders' wallet addresses and follows their signals.
 *
 * Signal Logic:
 * - Maintain list of whale wallet addresses
 * - Monitor Polygon blockchain for their trades
 * - When whale buys YES/NO, generate copy signal
 * - Weight signal by whale's historical win rate
 *
 * Works for: High-impact traders, insider-following, smart money tracking
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface WhaleTrackingConfig {
  minWinRate: number;          // Min whale win rate to follow (default 0.55 = 55%)
  maxPositionSize: number;     // Max shares (default 25)
  copyDelayMs: number;         // Delay before copying (default 5000)
  minTrades: number;           // Min trades for whale to be tracked (default 10)
}

export interface WhaleData {
  address: string;
  winRate: number;             // Historical win rate
  totalTrades: number;
  totalPnL: number;
  specialty?: string;          // Category specialty (politics, crypto, etc.)
}

export interface WhaleTrade {
  whaleAddress: string;
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  action: 'BUY' | 'SELL';
  size: number;
  price: number;
  timestamp: number;
}

export class WhaleTrackingStrategy extends BasePolymarketStrategy {
  name = 'Whale Tracking';

  protected config: Required<WhaleTrackingConfig> = {
    minWinRate: 0.55,
    maxPositionSize: 25,
    copyDelayMs: 5000,
    minTrades: 10,
  };

  private whales = new Map<string, WhaleData>(); // address -> data
  private pendingTrades = new Map<string, WhaleTrade>(); // tokenId -> pending trade

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as WhaleTrackingConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minWinRate: { type: 'number', default: 0.55, min: 0.4, max: 0.8 },
      maxPositionSize: { type: 'number', default: 25, min: 10, max: 100 },
      copyDelayMs: { type: 'number', default: 5000, min: 0, max: 60000 },
      minTrades: { type: 'number', default: 10, min: 5, max: 50 },
    };
  }

  /**
   * Register a whale wallet
   */
  registerWhale(whale: WhaleData): void {
    this.whales.set(whale.address, whale);
  }

  /**
   * Remove a whale wallet
   */
  removeWhale(address: string): void {
    this.whales.delete(address);
  }

  /**
   * Process whale trade (called externally from on-chain monitor)
   */
  processWhaleTrade(trade: WhaleTrade): void {
    const whale = this.whales.get(trade.whaleAddress);
    if (!whale) return;

    // Check if whale meets criteria
    if (whale.totalTrades < this.config.minTrades) return;
    if (whale.winRate < this.config.minWinRate) return;

    // Schedule copy with delay
    this.pendingTrades.set(trade.tokenId, trade);

    // Execute after delay
    setTimeout(() => {
      this.pendingTrades.delete(trade.tokenId);
    }, this.config.copyDelayMs);
  }

  /**
   * Calculate fair value based on whale activity
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const pendingTrade = this.pendingTrades.get(tokenId);
    if (!pendingTrade) return null;

    const whale = this.whales.get(pendingTrade.whaleAddress);
    if (!whale) return null;

    // Fair value = whale's implied probability
    return pendingTrade.side === 'YES' ? whale.winRate : 1 - whale.winRate;
  }

  /**
   * Generate copy signal
   */
  generateSignal(tick: IMarketTick): IPolymarketSignal | null {
    const pendingTrade = this.pendingTrades.get(tick.tokenId);
    if (!pendingTrade) return null;

    const whale = this.whales.get(pendingTrade.whaleAddress);
    if (!whale) return null;

    // Scale position by confidence (whale's win rate)
    const confidence = whale.winRate;
    const size = Math.floor(this.config.maxPositionSize * confidence);

    if (pendingTrade.side === 'YES') {
      return {
        type: PolymarketSignalType.BUY_YES,
        tokenId: tick.tokenId,
        marketId: tick.marketId,
        side: 'YES',
        action: 'BUY',
        price: tick.yesPrice,
        size,
        timestamp: Date.now(),
        expectedValue: (confidence - 0.5) * size,
        confidence,
        catalyst: `Whale ${whale.address.slice(0, 10)}... bought YES`,
        metadata: {
          whaleAddress: whale.address,
          whaleWinRate: whale.winRate,
          whaleTrades: whale.totalTrades,
          whalePnL: whale.totalPnL,
          copySize: pendingTrade.size,
          copyPrice: pendingTrade.price,
        },
      };
    } else {
      return {
        type: PolymarketSignalType.BUY_NO,
        tokenId: tick.tokenId,
        marketId: tick.marketId,
        side: 'NO',
        action: 'BUY',
        price: tick.noPrice,
        size,
        timestamp: Date.now(),
        expectedValue: (confidence - 0.5) * size,
        confidence,
        catalyst: `Whale ${whale.address.slice(0, 10)}... bought NO`,
        metadata: {
          whaleAddress: whale.address,
          whaleWinRate: whale.winRate,
          whaleTrades: whale.totalTrades,
          whalePnL: whale.totalPnL,
          copySize: pendingTrade.size,
          copyPrice: pendingTrade.price,
        },
      };
    }
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    this.onMarketTick(tick);
    return this.generateSignal(tick);
  }
}
