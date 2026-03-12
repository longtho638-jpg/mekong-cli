/**
 * Market Maker Strategy
 *
 * Two-sided orderbook liquidity provision with configurable spread.
 * Places bid/ask orders around midprice, captures spread + maker rebates.
 * Auto-cancels and replaces orders when midprice moves beyond threshold.
 *
 * Key Features:
 * - Configurable target spread (default 10 cents)
 * - Inventory management (delta neutral targeting)
 * - Cancel/replace heartbeat loop
 * - Maker fee rebate optimization
 */

import { BasePolymarketStrategy } from './polymarket/BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface MMConfig {
  targetSpread: number;      // Target spread in dollars (0.10 = 10 cents)
  orderSize: number;         // Shares per side per order
  maxInventory: number;      // Max delta exposure (shares)
  cancelReplaceMs: number;   // Heartbeat interval for cancel/replace (ms)
  minEdgeThreshold: number;  // Minimum edge vs midprice (default 0.01)
  skewEnabled: boolean;      // Skew quotes based on inventory (default true)
  skewFactor: number;        // Inventory skew factor (default 0.5)
}

export interface MMPosition {
  tokenId: string;
  marketId: string;
  netShares: number;      // Positive = long, negative = short
  avgPrice: number;
  unrealizedPnL: number;
}

export interface MMOrder {
  orderId: string;
  tokenId: string;
  side: 'YES' | 'NO';
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  status: 'live' | 'cancelled' | 'filled';
  placedAt: number;
}

export class MarketMakerStrategy extends BasePolymarketStrategy {
  name = 'MarketMaker';

  protected config: Required<MMConfig> = {
    targetSpread: 0.10,
    orderSize: 50,
    maxInventory: 200,
    cancelReplaceMs: 5000,
    minEdgeThreshold: 0.01,
    skewEnabled: true,
    skewFactor: 0.5,
  };

  // Current inventory per token
  private positions = new Map<string, MMPosition>();

  // Active orders
  private activeOrders = new Map<string, MMOrder>(); // orderId -> order

  // Last midprice per token (for move detection)
  private lastMidprice = new Map<string, number>();

  // Order counter for generating unique IDs
  private orderCounter = 0;

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as MMConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      targetSpread: { type: 'number', default: 0.10, min: 0.02, max: 0.50 },
      orderSize: { type: 'number', default: 50, min: 10, max: 500 },
      maxInventory: { type: 'number', default: 200, min: 50, max: 1000 },
      cancelReplaceMs: { type: 'number', default: 5000, min: 1000, max: 30000 },
      minEdgeThreshold: { type: 'number', default: 0.01, min: 0.001, max: 0.05 },
      skewEnabled: { type: 'boolean', default: true },
      skewFactor: { type: 'number', default: 0.5, min: 0, max: 2 },
    };
  }

  /**
   * Calculate fair value (midprice) for a token
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const tick = this.getTick(tokenId);
    if (!tick) return null;

    // Midprice = (best bid + best ask) / 2
    const midPrice = (tick.yesBid + tick.yesAsk) / 2;
    return midPrice;
  }

  /**
   * Calculate inventory skew adjustment
   *
   * If long inventory: lower bid, raise ask (encourage selling)
   * If short inventory: raise bid, lower ask (encourage buying)
   */
  private calculateSkew(tokenId: string): { bidAdjustment: number; askAdjustment: number } {
    if (!this.config.skewEnabled) {
      return { bidAdjustment: 0, askAdjustment: 0 };
    }

    const position = this.positions.get(tokenId);
    const netShares = position?.netShares ?? 0;

    // Normalize to [-1, 1] range
    const inventoryRatio = netShares / this.config.maxInventory;
    const clampedRatio = Math.max(-1, Math.min(1, inventoryRatio));

    // Skew factor determines how much to adjust
    const skew = clampedRatio * this.config.skewFactor * this.config.targetSpread;

    // Long inventory: lower bid, raise ask
    // Short inventory: raise bid, lower ask
    return {
      bidAdjustment: -skew / 2,
      askAdjustment: skew / 2,
    };
  }

  /**
   * Calculate target bid/ask prices around midprice
   */
  calculateQuotes(tokenId: string, midPrice: number): { bid: number; ask: number } {
    const halfSpread = this.config.targetSpread / 2;
    const skew = this.calculateSkew(tokenId);

    let bid = midPrice - halfSpread + skew.bidAdjustment;
    let ask = midPrice + halfSpread + skew.askAdjustment;

    // Clamp to valid range [0, 1]
    bid = Math.max(0.01, Math.min(0.99, bid));
    ask = Math.max(0.01, Math.min(0.99, ask));

    // Ensure bid < ask
    if (bid >= ask) {
      const mid = (bid + ask) / 2;
      const halfMinSpread = this.config.minEdgeThreshold;
      bid = mid - halfMinSpread;
      ask = mid + halfMinSpread;
    }

    return { bid, ask };
  }

  /**
   * Check if inventory allows additional position
   */
  canAddPosition(tokenId: string, size: number, side: 'BUY' | 'SELL'): boolean {
    const position = this.positions.get(tokenId);
    const currentNet = position?.netShares ?? 0;

    if (side === 'BUY') {
      // Buying increases net position
      return currentNet + size <= this.config.maxInventory;
    } else {
      // Selling decreases net position (or increases short)
      return currentNet - size >= -this.config.maxInventory;
    }
  }

  /**
   * Update position after fill
   */
  updatePosition(tokenId: string, marketId: string, side: 'YES' | 'NO', size: number, price: number): void {
    const existing = this.positions.get(tokenId);

    if (!existing) {
      // New position
      const netShares = side === 'YES' ? size : -size;
      this.positions.set(tokenId, {
        tokenId,
        marketId,
        netShares,
        avgPrice: price,
        unrealizedPnL: 0,
      });
    } else {
      // Update existing position
      const currentNet = existing.netShares;
      const tradeDirection = side === 'YES' ? 1 : -1;
      const newNet = currentNet + (tradeDirection * size);

      // Update average price (weighted average)
      const totalValue = (existing.avgPrice * Math.abs(currentNet)) + (price * size);
      const newAvgPrice = totalValue / Math.abs(newNet);

      this.positions.set(tokenId, {
        ...existing,
        netShares: newNet,
        avgPrice: Math.abs(newNet) > 0 ? newAvgPrice : 0,
        unrealizedPnL: 0, // Will be updated on next tick
      });
    }
  }

  /**
   * Generate market making signals (bid + ask orders)
   */
  generateMMSignals(tokenId: string, tick: IMarketTick): IPolymarketSignal[] {
    const signals: IPolymarketSignal[] = [];
    const midPrice = (tick.yesBid + tick.yesAsk) / 2;

    // Check if midprice moved significantly (trigger cancel/replace)
    const lastMid = this.lastMidprice.get(tokenId);
    const minMoveThreshold = this.config.targetSpread * 0.3; // 30% of spread

    if (lastMid !== undefined && Math.abs(midPrice - lastMid) < minMoveThreshold) {
      // Midprice hasn't moved enough, keep existing orders
      return signals;
    }

    // Update last midprice
    this.lastMidprice.set(tokenId, midPrice);

    // Calculate target quotes
    const quotes = this.calculateQuotes(tokenId, midPrice);

    const now = Date.now();

    // Cancel existing orders first (if any)
    const existingOrders = Array.from(this.activeOrders.values()).filter(o => o.tokenId === tokenId);
    for (const order of existingOrders) {
      if (order.status === 'live') {
        signals.push({
          type: PolymarketSignalType.CANCEL,
          tokenId,
          marketId: tick.marketId,
          side: order.side,
          action: 'CANCEL',
          price: order.price,
          size: order.size,
          timestamp: now,
          metadata: {
            orderId: order.orderId,
            reason: 'cancel_replace',
          },
        });
      }
    }

    // Check inventory limits before placing new orders
    const canBuy = this.canAddPosition(tokenId, this.config.orderSize, 'BUY');
    const canSell = this.canAddPosition(tokenId, this.config.orderSize, 'SELL');

    // Place bid order (buy YES)
    if (canBuy) {
      const bidOrderId = `mm-bid-${++this.orderCounter}`;
      signals.push({
        type: PolymarketSignalType.BUY_YES,
        tokenId,
        marketId: tick.marketId,
        side: 'YES',
        action: 'BUY',
        price: quotes.bid,
        size: this.config.orderSize,
        timestamp: now,
        expectedValue: (midPrice - quotes.bid) * this.config.orderSize,
        confidence: 0.8,
        catalyst: `MM bid @ ${quotes.bid} (mid: ${midPrice.toFixed(2)}, spread: ${this.config.targetSpread.toFixed(2)})`,
        metadata: {
          marketQuestion: tick.marketId,
          outcomePrices: [tick.yesBid, tick.yesAsk],
          orderType: 'limit',
          isMaker: true,
          orderId: bidOrderId,
          quote: { bid: quotes.bid, ask: quotes.ask },
        },
      });

      this.activeOrders.set(bidOrderId, {
        orderId: bidOrderId,
        tokenId,
        side: 'YES',
        action: 'BUY',
        price: quotes.bid,
        size: this.config.orderSize,
        status: 'live',
        placedAt: now,
      });
    }

    // Place ask order (sell YES, or equivalently buy NO)
    if (canSell) {
      const askOrderId = `mm-ask-${++this.orderCounter}`;
      signals.push({
        type: PolymarketSignalType.SELL_YES,
        tokenId,
        marketId: tick.marketId,
        side: 'YES',
        action: 'SELL',
        price: quotes.ask,
        size: this.config.orderSize,
        timestamp: now,
        expectedValue: (quotes.ask - midPrice) * this.config.orderSize,
        confidence: 0.8,
        catalyst: `MM ask @ ${quotes.ask} (mid: ${midPrice.toFixed(2)}, spread: ${this.config.targetSpread.toFixed(2)})`,
        metadata: {
          marketQuestion: tick.marketId,
          outcomePrices: [tick.yesBid, tick.yesAsk],
          orderType: 'limit',
          isMaker: true,
          orderId: askOrderId,
          quote: { bid: quotes.bid, ask: quotes.ask },
        },
      });

      this.activeOrders.set(askOrderId, {
        orderId: askOrderId,
        tokenId,
        side: 'YES',
        action: 'SELL',
        price: quotes.ask,
        size: this.config.orderSize,
        status: 'live',
        placedAt: now,
      });
    }

    return signals;
  }

  /**
   * Update unrealized PnL based on current prices
   */
  updateUnrealizedPnL(tokenId: string, currentPrice: number): void {
    const position = this.positions.get(tokenId);
    if (!position) return;

    const priceDiff = currentPrice - position.avgPrice;
    const unrealizedPnL = priceDiff * position.netShares;

    this.positions.set(tokenId, {
      ...position,
      unrealizedPnL,
    });
  }

  /**
   * Get current position for a token
   */
  getPosition(tokenId: string): MMPosition | undefined {
    return this.positions.get(tokenId);
  }

  /**
   * Get all active positions
   */
  getPositions(): MMPosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get all active orders
   */
  getActiveOrders(): MMOrder[] {
    return Array.from(this.activeOrders.values()).filter(o => o.status === 'live');
  }

  /**
   * Mark order as filled
   */
  markOrderFilled(orderId: string, fillPrice?: number, fillSize?: number): void {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    order.status = 'filled';

    // Update position if we have fill details
    if (fillPrice !== undefined && fillSize !== undefined) {
      this.updatePosition(
        order.tokenId,
        order.tokenId, // marketId = tokenId for simplicity
        order.side,
        fillSize,
        fillPrice,
      );
    }

    this.activeOrders.set(orderId, order);
  }

  /**
   * Mark order as cancelled
   */
  markOrderCancelled(orderId: string): void {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    order.status = 'cancelled';
    this.activeOrders.set(orderId, order);
  }

  /**
   * Process candle (for compatibility)
   */
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  processTick(tick: IMarketTick): IPolymarketSignal[] {
    // Store tick
    this.onMarketTick(tick);

    // Update unrealized PnL
    const midPrice = (tick.yesBid + tick.yesAsk) / 2;
    this.updateUnrealizedPnL(tick.tokenId, midPrice);

    // Generate MM signals
    return this.generateMMSignals(tick.tokenId, tick);
  }
}
