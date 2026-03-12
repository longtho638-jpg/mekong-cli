/**
 * ListingArbStrategy - Binance Listing Arbitrage
 *
 * Strategy: Buy YES on Polymarket when Binance announces new token listings
 * Thesis: Binance listings cause immediate price pumps; Polymarket markets lag 30-120s
 *
 * Flow:
 * 1. Monitor Binance CMS for listing announcements (via BinanceAnnouncementWS)
 * 2. On new listing detected, lookup corresponding Polymarket market via Gamma API
 * 3. If market found and criteria met, generate BUY_YES signal
 * 4. Exit after position opened or timeout
 */

import { ICandle } from "../interfaces/ICandle";
import { ISignal, SignalType } from "../interfaces/ISignal";
import {
  BasePolymarketStrategy,
} from "../strategies/polymarket/BasePolymarketStrategy";
import {
  IPolymarketSignal,
  PolymarketSignalType,
} from "../interfaces/IPolymarket";
import {
  BinanceAnnouncementWS,
} from "../adapters/BinanceAnnouncementWS";
import {
  ListingEvent,
  ListingArbConfig,
  DEFAULT_LISTING_ARB_CONFIG,
  BinanceAnnouncementCategory,
  GammaTokenMapping,
} from "../interfaces/IBinance";
import { PolymarketGammaClient, ParsedMarket } from "../polymarket/gamma";
import { logger } from "../utils/logger";

export class ListingArbStrategy extends BasePolymarketStrategy {
  name = "ListingArbStrategy";

  private config: ListingArbConfig;
  private binanceWS: BinanceAnnouncementWS;
  private gammaClient: PolymarketGammaClient;
  private pendingListings = new Map<string, ListingEvent>(); // coin -> event
  private tokenCache = new Map<string, GammaTokenMapping>(); // coin -> mapping
  private lastListingTime = 0;
  private isRunning = false;

  // Stats
  private stats = {
    listingsDetected: 0,
    signalsGenerated: 0,
    marketsFound: 0,
    marketsNotFound: 0,
    signalsSkipped: 0,
  };

  constructor(config: Partial<ListingArbConfig> = {}) {
    super();
    this.config = { ...DEFAULT_LISTING_ARB_CONFIG, ...config };
    this.binanceWS = new BinanceAnnouncementWS();
    this.gammaClient = new PolymarketGammaClient();

    // Bind event handlers
    this.handleListingEvent = this.handleListingEvent.bind(this);
  }

  /**
   * Initialize strategy
   */
  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);

    // Merge any additional config
    if (config) {
      this.config = { ...this.config, ...config as Partial<ListingArbConfig> };
    }

    logger.info("[ListingArbStrategy] Initialized with config:", this.config);
  }

  /**
   * Start monitoring for listing announcements
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("[ListingArbStrategy] Already running");
      return;
    }

    this.isRunning = true;
    logger.info("[ListingArbStrategy] Starting monitoring...");

    // Set up Binance WS event listener
    this.binanceWS.on("listing", this.handleListingEvent);

    // Connect to Binance announcement feed
    await this.binanceWS.connect();

    logger.info("[ListingArbStrategy] Monitoring started");
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info("[ListingArbStrategy] Stopping...");

    // Remove event listener
    this.binanceWS.removeListener("listing", this.handleListingEvent);

    // Disconnect from Binance
    this.binanceWS.disconnect();

    // Clear pending listings
    this.pendingListings.clear();

    logger.info("[ListingArbStrategy] Stopped");
  }

  /**
   * Handle listing event from Binance
   */
  private async handleListingEvent(event: ListingEvent): Promise<void> {
    this.stats.listingsDetected++;
    logger.info(
      `[ListingArbStrategy] Listing detected: ${event.coin} (latency: ${event.latency}ms)`
    );

    // Check if listing is too old
    const age = Date.now() - event.announcedAt;
    if (age > this.config.maxAgeMs) {
      logger.warn(
        `[ListingArbStrategy] Listing too old (${age}ms > ${this.config.maxAgeMs}ms), skipping`
      );
      this.stats.signalsSkipped++;
      return;
    }

    // Check if coin is excluded
    if (this.config.excludedCoins.includes(event.coin.toUpperCase())) {
      logger.debug(
        `[ListingArbStrategy] Excluded coin: ${event.coin}, skipping`
      );
      this.stats.signalsSkipped++;
      return;
    }

    // Store pending listing
    this.pendingListings.set(event.coin.toUpperCase(), event);
    this.lastListingTime = Date.now();

    // Try to find Polymarket market immediately
    await this.lookupAndGenerateSignal(event);
  }

  /**
   * Lookup Polymarket market and generate signal
   */
  private async lookupAndGenerateSignal(event: ListingEvent): Promise<void> {
    try {
      // Check cache first
      const cached = this.tokenCache.get(event.coin.toUpperCase());
      if (cached && cached.tokenId && cached.marketId) {
        logger.debug(
          `[ListingArbStrategy] Using cached market for ${event.coin}`
        );
        this.generateSignalFromMarket(event, cached);
        return;
      }

      // Search Gamma API for matching market
      const market = await this.findPolymarketMarket(event.coin);

      if (!market) {
        logger.warn(
          `[ListingArbStrategy] No Polymarket market found for ${event.coin}`
        );
        this.stats.marketsNotFound++;
        return;
      }

      this.stats.marketsFound++;

      // Cache the mapping
      const mapping: GammaTokenMapping = {
        coin: event.coin.toUpperCase(),
        tokenId: market.yesTokenId,
        marketId: market.id,
        slug: market.slug,
        question: market.question,
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        volume: market.volume,
        liquidity: market.liquidity,
        lastUpdated: Date.now(),
      };

      this.tokenCache.set(event.coin.toUpperCase(), mapping);

      // Generate signal
      this.generateSignalFromMarket(event, mapping);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `[ListingArbStrategy] Error looking up market: ${errorMsg}`
      );
    }
  }

  /**
   * Find Polymarket market for a coin
   */
  private async findPolymarketMarket(coin: string): Promise<ParsedMarket | null> {
    const coinUpper = coin.toUpperCase();

    // Search for markets with coin name
    const markets = await this.gammaClient.search(coinUpper, 20);

    // Filter for active, relevant markets
    const activeMarkets = markets.filter(m =>
      m.active &&
      !m.closed &&
      m.volume > 0
    );

    if (activeMarkets.length === 0) {
      return null;
    }

    // Return market with highest volume
    return activeMarkets.reduce((best, current) =>
      current.volume > best.volume ? current : best
    );
  }

  /**
   * Generate BUY_YES signal from market data
   */
  private generateSignalFromMarket(
    event: ListingEvent,
    market: GammaTokenMapping
  ): void {
    // Check minimum volume
    if (market.volume && market.volume < this.config.minVolumeUsd) {
      logger.debug(
        `[ListingArbStrategy] Volume too low (${market.volume} < ${this.config.minVolumeUsd}), skipping`
      );
      this.stats.signalsSkipped++;
      return;
    }

    if (!market.tokenId || !market.marketId) {
      logger.warn(
        `[ListingArbStrategy] Missing tokenId or marketId, skipping`
      );
      return;
    }

    // Calculate position size based on config
    const size = this.calculatePositionSize(market.yesPrice || 0.5);

    // Generate signal
    const signal: IPolymarketSignal = {
      type: PolymarketSignalType.BUY_YES,
      tokenId: market.tokenId,
      marketId: market.marketId,
      side: "YES",
      action: "BUY",
      price: market.yesPrice || 0.5,
      size,
      timestamp: Date.now(),
      catalyst: `Binance listing: ${event.coin}`,
      expiresAt: Date.now() + this.config.maxAgeMs,
      metadata: {
        marketQuestion: market.question,
        outcomePrices: [market.yesPrice, market.noPrice],
        volume: market.volume,
        liquidity: market.liquidity,
        binanceEvent: {
          coin: event.coin,
          tradingPairs: event.tradingPairs,
          latency: event.latency,
        },
      },
    };

    this.stats.signalsGenerated++;
    logger.info(
      `[ListingArbStrategy] Signal generated: BUY ${size} YES @ ${signal.price} (${market.question?.substring(0, 50)}...)`
    );

    // Emit signal event
    this.emit("signal", signal);
  }

  /**
   * Calculate position size based on price and risk
   */
  private calculatePositionSize(currentPrice: number): number {
    const baseSize = this.config.positionSizeUsd;

    // Adjust size based on price (buy fewer shares at higher prices)
    const adjustedSize = baseSize / currentPrice;

    return Math.floor(adjustedSize * 100) / 100; // Round to 2 decimals
  }

  /**
   * Process candle (required by IStrategy interface)
   * For this strategy, we rely on listing events, not candles
   */
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    // This strategy doesn't use candles directly
    // Signals are generated from Binance listing events
    return null;
  }

  /**
   * Get pending listings
   */
  getPendingListings(): ListingEvent[] {
    return Array.from(this.pendingListings.values());
  }

  /**
   * Get token cache
   */
  getTokenCache(): Map<string, GammaTokenMapping> {
    return new Map(this.tokenCache);
  }

  /**
   * Get strategy stats
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Clear expired pending listings
   */
  clearExpiredListings(maxAgeMs: number = this.config.maxAgeMs): void {
    const now = Date.now();
    for (const [coin, event] of this.pendingListings.entries()) {
      if (now - event.detectedAt > maxAgeMs) {
        this.pendingListings.delete(coin);
        logger.debug(
          `[ListingArbStrategy] Cleared expired listing: ${coin}`
        );
      }
    }
  }

  /**
   * Manual market lookup (for testing/debugging)
   */
  async lookupMarket(coin: string): Promise<GammaTokenMapping | null> {
    const market = await this.findPolymarketMarket(coin);
    if (!market) return null;

    return {
      coin: coin.toUpperCase(),
      tokenId: market.yesTokenId,
      marketId: market.id,
      slug: market.slug,
      question: market.question,
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      volume: market.volume,
      liquidity: market.liquidity,
      lastUpdated: Date.now(),
    };
  }
}

export default ListingArbStrategy;
