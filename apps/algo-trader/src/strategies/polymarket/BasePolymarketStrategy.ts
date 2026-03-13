/**
 * Base Strategy for Polymarket binary prediction markets
 *
 * Extends standard IStrategy with Polymarket-specific functionality
 */

import { IStrategy, ISignal, SignalType } from '../../interfaces/ISignal';
import { ICandle } from '../../interfaces/ICandle';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../interfaces/IPolymarket';

export abstract class BasePolymarketStrategy implements IStrategy {
  abstract name: string;

  protected marketTicks = new Map<string, IMarketTick>(); // tokenId -> tick
  protected config: Record<string, unknown> = {};
  protected maxHistoryBuffer: number = 100;

  // Convert standard SignalType to PolymarketSignalType
  protected toPolymarketSignal(
    type: SignalType,
    tokenId: string,
    marketId: string,
    side: 'YES' | 'NO',
    price: number,
    size: number,
    metadata: IPolymarketSignal['metadata'] = {},
  ): IPolymarketSignal {
    const action = type === SignalType.BUY ? 'BUY' : 'SELL';
    const pmType = type === SignalType.BUY
      ? (side === 'YES' ? PolymarketSignalType.BUY_YES : PolymarketSignalType.BUY_NO)
      : (side === 'YES' ? PolymarketSignalType.SELL_YES : PolymarketSignalType.SELL_NO);

    return {
      type: pmType,
      tokenId,
      marketId,
      side,
      action,
      price,
      size,
      timestamp: Date.now(),
      metadata,
    };
  }

  /**
   * Initialize with market data
   */
  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    // Only merge config if provided, preserve subclass defaults
    if (config) {
      this.config = { ...this.config, ...config };
    }
    // For Polymarket, we use market ticks instead of candles
    this.candles = candles;
  }

  /**
   * Update configuration at runtime
   */
  async updateConfig(config: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Record<string, unknown> {
    return this.config;
  }

  getConfigSchema(): Record<string, unknown> {
    return {};
  }

  /**
   * Process market tick data
   */
  protected onMarketTick(tick: IMarketTick): void {
    this.marketTicks.set(tick.tokenId, tick);
  }

  /**
   * Get current tick for a token
   */
  protected getTick(tokenId: string): IMarketTick | undefined {
    return this.marketTicks.get(tokenId);
  }

  /**
   * Calculate fair value - to be implemented by subclasses
   */
  abstract calculateFairValue(tokenId: string): Promise<number | null>;

  /**
   * Generate signal based on price vs fair value
   * Subclasses can override with additional params
   */
  protected generateSignal(_tokenId: string, _marketId: string, _tick?: IMarketTick): IPolymarketSignal | null {
    return null;
  }

  // Candle storage for compatibility
  protected candles: ICandle[] = [];

  abstract onCandle(candle: ICandle): Promise<ISignal | null>;
}
