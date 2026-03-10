import { SlippageModeler } from '../../src/backtest/SlippageModeler';

describe('SlippageModeler', () => {
  describe('calculateSlippage', () => {
    it('should calculate slippage based on order book depth', () => {
      const originalPrice = 50000;
      const tradeSize = 1;
      const tradeSide: 'buy' | 'sell' = 'buy';

      // Create a simple order book
      const orderBook = [
        { price: 50001, volume: 5, side: 'ask' as const },  // Ask levels
        { price: 50002, volume: 3, side: 'ask' as const },
        { price: 49999, volume: 5, side: 'bid' as const },  // Bid levels
        { price: 49998, volume: 3, side: 'bid' as const }
      ];

      const config = {
        baseSlippageBps: 5,
        volumeImpact: 1.0,
        marketImpactModel: 'sqrt' as const
      };

      const result = SlippageModeler.calculateSlippage(
        originalPrice,
        tradeSize,
        tradeSide,
        orderBook,
        config
      );

      expect(result).toBeDefined();
      expect(result.executionPrice).toBeGreaterThanOrEqual(originalPrice);
      expect(result.effectivePrice).toBeGreaterThanOrEqual(originalPrice);
      expect(result.slippagePercent).toBeGreaterThanOrEqual(0);
    });

    it('should calculate different slippage for buy vs sell', () => {
      const originalPrice = 50000;
      const tradeSize = 1;

      const orderBook = [
        { price: 50001, volume: 5, side: 'ask' as const },
        { price: 50002, volume: 3, side: 'ask' as const },
        { price: 49999, volume: 5, side: 'bid' as const },
        { price: 49998, volume: 3, side: 'bid' as const }
      ];

      const config = {
        baseSlippageBps: 5,
        volumeImpact: 1.0,
        marketImpactModel: 'sqrt' as const
      };

      const buyResult = SlippageModeler.calculateSlippage(
        originalPrice,
        tradeSize,
        'buy',
        orderBook,
        config
      );

      const sellResult = SlippageModeler.calculateSlippage(
        originalPrice,
        tradeSize,
        'sell',
        orderBook,
        config
      );

      // Buy should generally have higher price (more slippage) than sell
      expect(buyResult.effectivePrice).toBeGreaterThanOrEqual(sellResult.effectivePrice);
    });
  });

  describe('estimateLiquidity', () => {
    it('should estimate liquidity metrics', () => {
      const orderBook = [
        { price: 50001, volume: 10, side: 'ask' as const },
        { price: 50002, volume: 5, side: 'ask' as const },
        { price: 49999, volume: 10, side: 'bid' as const },
        { price: 49998, volume: 5, side: 'bid' as const }
      ];

      const metrics = SlippageModeler.estimateLiquidity(orderBook);

      expect(metrics.bidAskSpread).toBeGreaterThanOrEqual(0);
      expect(metrics.marketDepth).toBeGreaterThan(0);
      expect(metrics.liquidityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.liquidityScore).toBeLessThanOrEqual(1);
    });
  });
});