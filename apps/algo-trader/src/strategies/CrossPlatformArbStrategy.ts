/**
 * Cross-Platform Arbitrage Strategy
 *
 * Detects and exploits price differences between Polymarket and Kalshi
 * for the same binary event. When YES prices diverge across exchanges,
 * we can buy the cheaper side and sell (or buy opposite) the expensive side.
 *
 * Arb Logic:
 * - If Poly_YES + Kalshi_NO < 1.00: Buy YES on Poly, Buy NO on Kalshi
 * - If Kalshi_YES + Poly_NO < 1.00: Buy YES on Kalshi, Buy NO on Poly
 *
 * Edge = 1.00 - (buyPrice + sellPrice + fees)
 * Profit = Edge * shares
 */

import { BasePolymarketStrategy } from './polymarket/BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';
import { CrossExchangeFairValue, NormalizedPrice, ArbEdge } from '../../analysis/CrossExchangeFairValue';

export interface CrossPlatformArbConfig {
  minEdgeThreshold: number;   // Minimum edge to trade (default 0.01 = 1%)
  maxPositionSize: number;    // Max shares per arb (default 100)
  feeRateBps: number;         // Fee rate in basis points (default 25 = 0.25%)
  staleDataMs: number;        // Max age for price data (default 5000 = 5s)
}

export interface ArbOpportunity {
  eventId: string;
  buyMarket: 'POLY' | 'KALSHI';
  sellMarket: 'POLY' | 'KALSHI';
  buyTokenId: string;
  sellTokenId: string;
  edge: number;
  profitPerShare: number;
  confidence: number;
}

export class CrossPlatformArbStrategy extends BasePolymarketStrategy {
  name = 'CrossPlatformArb';

  protected config: Required<CrossPlatformArbConfig> = {
    minEdgeThreshold: 0.01,
    maxPositionSize: 100,
    feeRateBps: 25,
    staleDataMs: 5000,
  };

  private fairValueCalculator: CrossExchangeFairValue;
  private kalshiPrices = new Map<string, IMarketTick>(); // tokenId -> tick
  private lastPriceUpdate = new Map<string, number>(); // tokenId -> timestamp

  constructor(fairValueCalculator?: CrossExchangeFairValue) {
    super();
    this.fairValueCalculator = fairValueCalculator ?? new CrossExchangeFairValue();
  }

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as CrossPlatformArbConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minEdgeThreshold: { type: 'number', default: 0.01, min: 0.001, max: 0.1 },
      maxPositionSize: { type: 'number', default: 100, min: 10, max: 1000 },
      feeRateBps: { type: 'number', default: 25, min: 0, max: 100 },
      staleDataMs: { type: 'number', default: 5000, min: 1000, max: 30000 },
    };
  }

  /**
   * Update Kalshi price data
   */
  updateKalshiPrice(tick: IMarketTick): void {
    this.kalshiPrices.set(tick.tokenId, tick);
    this.lastPriceUpdate.set(tick.tokenId, tick.timestamp);
  }

  /**
   * Check if price data is fresh enough
   */
  private isPriceFresh(tokenId: string): boolean {
    const lastUpdate = this.lastPriceUpdate.get(tokenId);
    if (!lastUpdate) return false;
    return Date.now() - lastUpdate <= this.config.staleDataMs;
  }

  /**
   * Normalize Polymarket tick to NormalizedPrice format
   */
  private normalizePolymarketTick(tick: IMarketTick): NormalizedPrice {
    // For Polymarket, use bid/ask spread from yesBid/yesAsk
    return {
      exchange: 'POLY',
      yesBid: tick.yesBid,
      yesAsk: tick.yesAsk,
      noBid: 1 - tick.yesAsk,  // NO bid = 1 - YES ask
      noAsk: 1 - tick.yesBid,  // NO ask = 1 - YES bid
      midPrice: (tick.yesBid + tick.yesAsk) / 2,
      timestamp: tick.timestamp,
    };
  }

  /**
   * Normalize Kalshi tick to NormalizedPrice format
   */
  private normalizeKalshiTick(tick: IMarketTick): NormalizedPrice {
    return {
      exchange: 'KALSHI',
      yesBid: tick.yesBid,
      yesAsk: tick.yesAsk,
      noBid: tick.noBid,
      noAsk: tick.noAsk,
      midPrice: (tick.yesBid + tick.yesAsk) / 2,
      timestamp: tick.timestamp,
    };
  }

  /**
   * Calculate fair value for a token across exchanges
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const polyTick = this.getTick(tokenId);
    const kalshiTick = this.kalshiPrices.get(tokenId);

    if (!polyTick || !kalshiTick) {
      return null;
    }

    const polyPrice = this.normalizePolymarketTick(polyTick);
    const kalshiPrice = this.normalizeKalshiTick(kalshiTick);

    // Return average of both exchanges as fair value
    const fairValue = (polyPrice.midPrice + kalshiPrice.midPrice) / 2;
    return fairValue;
  }

  /**
   * Detect cross-platform arbitrage opportunity
   */
  detectArbitrage(polyTick: IMarketTick, kalshiTick: IMarketTick): {
    hasArb: boolean;
    opportunity: ArbOpportunity | null;
    edge: number;
  } {
    // Check if prices are fresh
    if (!this.isPriceFresh(polyTick.tokenId) || !this.isPriceFresh(kalshiTick.tokenId)) {
      return { hasArb: false, opportunity: null, edge: 0 };
    }

    const polyPrice = this.normalizePolymarketTick(polyTick);
    const kalshiPrice = this.normalizeKalshiTick(kalshiTick);

    // Use fair value calculator to detect arb
    const arbEdge = this.fairValueCalculator.detectArb(polyPrice, kalshiPrice);

    if (!arbEdge || arbEdge.edge < this.config.minEdgeThreshold) {
      return { hasArb: false, opportunity: null, edge: 0 };
    }

    // Build opportunity
    const opportunity: ArbOpportunity = {
      eventId: polyTick.marketId, // Same event on both platforms
      buyMarket: arbEdge.buyExchange === 'POLY' ? 'POLY' : 'KALSHI',
      sellMarket: arbEdge.sellExchange === 'POLY' ? 'POLY' : 'KALSHI',
      buyTokenId: polyTick.tokenId,
      sellTokenId: kalshiTick.tokenId,
      edge: arbEdge.edge,
      profitPerShare: arbEdge.profitPerShare,
      confidence: arbEdge.confidence,
    };

    return { hasArb: true, opportunity, edge: arbEdge.edge };
  }

  /**
   * Generate arbitrage signals
   */
  generateSignals(polyTick: IMarketTick, kalshiTick: IMarketTick): IPolymarketSignal[] {
    const arb = this.detectArbitrage(polyTick, kalshiTick);
    const signals: IPolymarketSignal[] = [];

    if (!arb.hasArb || !arb.opportunity) return signals;

    const opp = arb.opportunity;
    const size = this.config.maxPositionSize;
    const now = Date.now();

    // Determine which tick to use for which leg
    const buyTick = opp.buyMarket === 'POLY' ? polyTick : kalshiTick;
    const sellTick = opp.sellMarket === 'POLY' ? polyTick : kalshiTick;

    // Signal 1: Buy YES on cheaper exchange
    signals.push({
      type: PolymarketSignalType.BUY_YES,
      tokenId: opp.buyTokenId,
      marketId: opp.eventId,
      side: 'YES',
      action: 'BUY',
      price: buyTick.yesAsk,
      size,
      timestamp: now,
      expectedValue: opp.edge * size,
      confidence: opp.confidence,
      catalyst: `Cross-platform arb: ${opp.buyMarket} YES + ${opp.sellMarket} NO < 1.00`,
      metadata: {
        marketQuestion: `Arb: ${opp.buyMarket} vs ${opp.sellMarket}`,
        outcomePrices: [buyTick.yesAsk, sellTick.noAsk],
        edge: opp.edge,
        profitPerShare: opp.profitPerShare,
        buyMarket: opp.buyMarket,
        sellMarket: opp.sellMarket,
      },
    });

    // Signal 2: Buy NO on opposite exchange
    signals.push({
      type: PolymarketSignalType.BUY_NO,
      tokenId: opp.sellTokenId,
      marketId: opp.eventId,
      side: 'NO',
      action: 'BUY',
      price: sellTick.noAsk,
      size,
      timestamp: now,
      expectedValue: opp.edge * size,
      confidence: opp.confidence,
      catalyst: `Cross-platform arb: ${opp.buyMarket} YES + ${opp.sellMarket} NO < 1.00`,
      metadata: {
        marketQuestion: `Arb: ${opp.buyMarket} vs ${opp.sellMarket}`,
        outcomePrices: [buyTick.yesAsk, sellTick.noAsk],
        edge: opp.edge,
        profitPerShare: opp.profitPerShare,
        buyMarket: opp.buyMarket,
        sellMarket: opp.sellMarket,
      },
    });

    return signals;
  }

  /**
   * Process candle (for compatibility)
   */
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  /**
   * Process ticks from both exchanges and generate arbitrage signals
   */
  processTicks(polyTick: IMarketTick, kalshiTick: IMarketTick): IPolymarketSignal[] {
    // Store ticks
    this.onMarketTick(polyTick);
    this.updateKalshiPrice(kalshiTick);

    return this.generateSignals(polyTick, kalshiTick);
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    // Single tick processing - store but need both for arb
    this.onMarketTick(tick);
    return null;
  }
}
