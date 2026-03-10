/**
 * Slippage Modeler for Backtesting
 * Implements realistic slippage modeling based on order book depth
 */

export interface SlippageConfig {
  baseSlippageBps?: number; // Base slippage in basis points
  volumeImpact?: number; // Impact based on trade size vs volume
  orderBookDepth?: number; // How far into the order book to look for pricing
  marketImpactModel?: 'linear' | 'sqrt' | 'quadratic'; // How slippage scales with volume
  liquidityThreshold?: number; // Threshold for low liquidity penalties
  takerFeeBps?: number; // Additional fee for market orders (taker)
  timeBasedSlippage?: number; // Additional slippage for fast execution
}

export interface OrderBookLevel {
  price: number;
  volume: number;
  side: 'bid' | 'ask'; // bid = buy, ask = sell
}

export interface SlippageEstimate {
  executionPrice: number;
  slippagePercent: number; // As percentage of original price
  slippageAmount: number; // Absolute amount of slippage
  effectivePrice: number; // Final price after slippage
  executionCost: number; // Total cost of slippage
  partialFill: boolean; // Whether the order was only partially filled
}

export interface MarketLiquidityMetrics {
  bidAskSpread: number; // Current bid-ask spread
  marketDepth: number; // Volume available in the top N levels
  volumeToSlippage: Map<number, number>; // Map of volume to expected slippage
  priceVolatility: number; // Recent price volatility
  liquidityScore: number; // Composite score of liquidity (0-1)
}

export class SlippageModeler {
  /**
   * Calculate realistic slippage based on order book depth and trade size
   * @param originalPrice The theoretical price without slippage
   * @param tradeSize The size of the trade (units)
   * @param tradeSide Whether this is a buy or sell order
   * @param orderBook Current market order book
   * @param config Slippage configuration
   * @returns Estimated execution price and slippage metrics
   */
  static calculateSlippage(
    originalPrice: number,
    tradeSize: number,
    tradeSide: 'buy' | 'sell',
    orderBook: OrderBookLevel[],
    config: SlippageConfig = {}
  ): SlippageEstimate {
    if (tradeSize <= 0) {
      return {
        executionPrice: originalPrice,
        slippagePercent: 0,
        slippageAmount: 0,
        effectivePrice: originalPrice,
        executionCost: 0,
        partialFill: false
      };
    }

    // Sort order book appropriately based on trade side
    const sortedLevels = this.sortOrderBook(orderBook, tradeSide);

    // Apply market impact model
    const marketImpactFactor = this.calculateMarketImpactFactor(tradeSize, config);

    // Calculate execution based on order book depth
    let remainingSize = tradeSize;
    let totalCost = 0;
    let executedVolume = 0;
    let partialFill = false;

    for (const level of sortedLevels) {
      if (remainingSize <= 0) break;

      // Calculate how much we can fill at this level
      const fillableAtLevel = Math.min(remainingSize, level.volume);
      const levelCost = fillableAtLevel * level.price;

      totalCost += levelCost;
      executedVolume += fillableAtLevel;
      remainingSize -= fillableAtLevel;

      // If we can't fill the entire order at available levels
      if (remainingSize > 0 && sortedLevels.indexOf(level) === sortedLevels.length - 1) {
        partialFill = true;
      }
    }

    // Calculate effective execution price
    const effectivePrice = executedVolume > 0 ? totalCost / executedVolume : originalPrice;

    // Apply additional factors like taker fees and time-based slippage
    const baseSlippageBps = config.baseSlippageBps || 5; // 0.05%
    const takerFeeBps = config.takerFeeBps || 0;

    // Calculate total additional slippage from all factors
    const totalAdditionalSlippageBps = baseSlippageBps + takerFeeBps + (config.timeBasedSlippage || 0);
    const totalAdditionalSlippagePercent = totalAdditionalSlippageBps / 10000;

    // Apply market impact as a multiplier to the slippage
    const marketImpactMultiplier = 1 + (marketImpactFactor * 0.1); // Scale market impact appropriately

    // Final effective price with all factors
    const finalEffectivePrice = tradeSide === 'buy'
      ? effectivePrice * (1 + totalAdditionalSlippagePercent * marketImpactMultiplier)
      : effectivePrice * (1 - totalAdditionalSlippagePercent * marketImpactMultiplier);

    // Calculate slippage metrics
    const slippageAmount = finalEffectivePrice - originalPrice;
    const slippagePercent = (Math.abs(slippageAmount) / originalPrice) * 100;
    const executionCost = slippageAmount * tradeSize;

    return {
      executionPrice: effectivePrice,
      slippagePercent,
      slippageAmount,
      effectivePrice: finalEffectivePrice,
      executionCost: Math.abs(executionCost),
      partialFill
    };
  }

  /**
   * Estimate market liquidity metrics based on order book data
   */
  static estimateLiquidity(orderBook: OrderBookLevel[]): MarketLiquidityMetrics {
    if (orderBook.length === 0) {
      return {
        bidAskSpread: 0,
        marketDepth: 0,
        volumeToSlippage: new Map(),
        priceVolatility: 0,
        liquidityScore: 0
      };
    }

    // Calculate bid-ask spread
    const asks = orderBook.filter(level => level.side === 'ask').sort((a, b) => a.price - b.price);
    const bids = orderBook.filter(level => level.side === 'bid').sort((a, b) => b.price - a.price);

    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bidAskSpread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

    // Calculate market depth (volume available in top levels)
    const topBidVolume = bids.slice(0, 5).reduce((sum, level) => sum + level.volume, 0);
    const topAskVolume = asks.slice(0, 5).reduce((sum, level) => sum + level.volume, 0);
    const marketDepth = topBidVolume + topAskVolume;

    // Create volume-to-slippage map based on order book depth
    const volumeToSlippage = new Map<number, number>();

    // Sample different volumes to estimate slippage
    const sampleVolumes = [0.1, 0.5, 1.0, 2.0, 5.0]; // Different volume sizes to test

    for (const volRatio of sampleVolumes) {
      const sampleVolume = marketDepth * volRatio * 0.01; // 1% of available depth

      // Estimate slippage for this volume
      const buyEstimate = this.estimateVolumeSlippage(sampleVolume, 'buy', orderBook);
      const sellEstimate = this.estimateVolumeSlippage(sampleVolume, 'sell', orderBook);

      // Average the buy and sell estimates
      const avgSlippage = (buyEstimate + sellEstimate) / 2;
      volumeToSlippage.set(sampleVolume, avgSlippage);
    }

    // Liquidity score (0-1): 1 = very liquid, 0 = illiquid
    const spreadBasedScore = bidAskSpread > 0 ? 1 / (1 + bidAskSpread) : 1;
    const depthBasedScore = marketDepth > 0 ? Math.min(1, marketDepth / 1000) : 0; // Normalize depth

    // Combine scores (this is a simplified approach)
    const liquidityScore = (spreadBasedScore + depthBasedScore) / 2;

    return {
      bidAskSpread,
      marketDepth,
      volumeToSlippage,
      priceVolatility: 0, // Would need historical data to calculate
      liquidityScore
    };
  }

  /**
   * Model slippage based on historical patterns and market conditions
   */
  static async modelHistoricalSlippage(
    historicalTrades: Array<{
      originalPrice: number;
      executionPrice: number;
      tradeSize: number;
      timestamp: Date;
    }>
  ): Promise<SlippageConfig> {
    if (historicalTrades.length === 0) {
      return { marketImpactModel: 'sqrt' };
    }

    // Calculate average slippage characteristics
    let totalSlippage = 0;
    let volumeWeightedSlippage = 0;
    let totalVolume = 0;

    for (const trade of historicalTrades) {
      const slippage = Math.abs(trade.executionPrice - trade.originalPrice);
      const slippagePercent = (slippage / trade.originalPrice) * 100;

      totalSlippage += slippagePercent;
      volumeWeightedSlippage += slippagePercent * trade.tradeSize;
      totalVolume += trade.tradeSize;
    }

    const avgSlippage = totalSlippage / historicalTrades.length;
    const volumeWeightedAvgSlippage = totalVolume > 0 ? volumeWeightedSlippage / totalVolume : avgSlippage;

    // Estimate base slippage (would be minimum expected)
    const baseSlippageBps = Math.max(1, avgSlippage * 100); // Convert to basis points

    // Determine the most appropriate market impact model based on data
    let marketImpactModel: 'linear' | 'sqrt' | 'quadratic' = 'sqrt';

    // In a full implementation, this would analyze how slippage scales with trade size
    // For now, we'll default to sqrt which often fits real-world data well

    return {
      baseSlippageBps,
      volumeImpact: volumeWeightedAvgSlippage > 0 ? volumeWeightedAvgSlippage / avgSlippage : 1,
      marketImpactModel,
      liquidityThreshold: 0.01 // 1% threshold for low liquidity
    };
  }

  /**
   * Calculate market impact factor based on trade size
   */
  private static calculateMarketImpactFactor(tradeSize: number, config: SlippageConfig): number {
    const model = config.marketImpactModel || 'sqrt';
    const volumeImpact = config.volumeImpact || 1.0;

    // Scale trade size for impact calculation
    const scaledSize = Math.log(tradeSize + 1); // Use log to reduce impact of very large trades

    switch (model) {
      case 'linear':
        return scaledSize * volumeImpact;
      case 'sqrt':
        return Math.sqrt(scaledSize) * volumeImpact;
      case 'quadratic':
        return (scaledSize * scaledSize) * volumeImpact;
      default:
        return Math.sqrt(scaledSize) * volumeImpact;
    }
  }

  /**
   * Sort order book appropriately based on trade side
   */
  private static sortOrderBook(orderBook: OrderBookLevel[], tradeSide: 'buy' | 'sell'): OrderBookLevel[] {
    if (tradeSide === 'buy') {
      // For buys, we want ascending price (closest asks first)
      return orderBook
        .filter(level => level.side === 'ask')
        .sort((a, b) => a.price - b.price);
    } else {
      // For sells, we want descending price (closest bids first)
      return orderBook
        .filter(level => level.side === 'bid')
        .sort((a, b) => b.price - a.price);
    }
  }

  /**
   * Estimate slippage for a given volume without calculating full execution
   */
  private static estimateVolumeSlippage(volume: number, side: 'buy' | 'sell', orderBook: OrderBookLevel[]): number {
    // Simplified estimate based on order book depth
    const relevantLevels = this.sortOrderBook(orderBook, side);

    if (relevantLevels.length === 0) return 0;

    let remainingVolume = volume;
    let totalPrice = 0;
    let totalExecuted = 0;

    for (const level of relevantLevels) {
      if (remainingVolume <= 0) break;

      const fillAtLevel = Math.min(remainingVolume, level.volume);
      totalPrice += fillAtLevel * level.price;
      totalExecuted += fillAtLevel;
      remainingVolume -= fillAtLevel;
    }

    if (totalExecuted === 0) return 0;

    const avgExecutionPrice = totalPrice / totalExecuted;
    const referencePrice = side === 'buy'
      ? Math.min(...relevantLevels.map(l => l.price))
      : Math.max(...relevantLevels.map(l => l.price));

    return Math.abs((avgExecutionPrice - referencePrice) / referencePrice) * 100;
  }

  /**
   * Adjust slippage calculations based on market volatility
   */
  static adjustForVolatility(baseEstimate: SlippageEstimate, originalPrice: number, tradeSide: 'buy' | 'sell', volatility: number): SlippageEstimate {
    // Increase slippage in high volatility conditions
    const volatilityAdjustment = 1 + (volatility * 0.1); // 10% sensitivity to volatility

    const adjustedSlippagePercent = baseEstimate.slippagePercent * volatilityAdjustment;
    const effectivePrice = tradeSide === 'buy'
      ? originalPrice * (1 + (adjustedSlippagePercent / 100))
      : originalPrice * (1 - (adjustedSlippagePercent / 100));

    return {
      executionPrice: baseEstimate.executionPrice,
      slippagePercent: adjustedSlippagePercent,
      slippageAmount: baseEstimate.slippageAmount * volatilityAdjustment,
      effectivePrice,
      executionCost: baseEstimate.executionCost * volatilityAdjustment,
      partialFill: baseEstimate.partialFill
    };
  }
}