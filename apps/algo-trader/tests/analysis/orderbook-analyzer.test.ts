/**
 * Order Book Analyzer Tests
 */

import { OrderBookAnalyzer } from '../../src/analysis/orderbook/OrderBookAnalyzer';
import type { RawOrderBook, ProcessedOrderBook, OrderBookSnapshot } from '../../src/analysis/orderbook/types';
import { rawToSnapshot, processedToSnapshot } from '../../src/analysis/orderbook/orderbook-utils';

describe('OrderBookAnalyzer', () => {
  let analyzer: OrderBookAnalyzer;

  const mockRawBook: RawOrderBook = {
    bids: [
      { price: '0.52', size: '100' },
      { price: '0.51', size: '200' },
      { price: '0.50', size: '150' },
    ],
    asks: [
      { price: '0.54', size: '150' },
      { price: '0.55', size: '100' },
      { price: '0.56', size: '200' },
    ],
  };

  const mockProcessedBook: ProcessedOrderBook = {
    bids: [
      { price: 0.52, size: 100 },
      { price: 0.51, size: 200 },
      { price: 0.50, size: 150 },
    ],
    asks: [
      { price: 0.54, size: 150 },
      { price: 0.55, size: 100 },
      { price: 0.56, size: 200 },
    ],
  };

  beforeEach(() => {
    analyzer = new OrderBookAnalyzer({
      depthLevels: 10,
      wallThreshold: 100,
      minZoneSize: 50,
    });
  });

  describe('processSnapshot', () => {
    it('should process raw order book (string format)', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      expect(snapshot.tokenId).toBe('token-1');
      expect(snapshot.bids.length).toBe(3);
      expect(snapshot.asks.length).toBe(3);
      expect(snapshot.bids[0].price).toBe(0.52); // Highest bid first
      expect(snapshot.asks[0].price).toBe(0.54); // Lowest ask first
    });

    it('should process processed order book (number format)', () => {
      const snapshot = analyzer.processSnapshot(mockProcessedBook, 'token-1', 'market-1');

      expect(snapshot.tokenId).toBe('token-1');
      expect(snapshot.bids.length).toBe(3);
      expect(snapshot.asks.length).toBe(3);
    });

    it('should calculate correct mid price and spread', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      expect(snapshot.midPrice).toBe((0.52 + 0.54) / 2);
      expect(snapshot.spread).toBe(0.54 - 0.52);
      expect(snapshot.spreadBps).toBeCloseTo((0.02 / 0.53) * 10000, 1);
    });

    it('should calculate cumulative sizes correctly', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      expect(snapshot.bids[0].cumulativeSize).toBe(100);
      expect(snapshot.bids[1].cumulativeSize).toBe(300);
      expect(snapshot.bids[2].cumulativeSize).toBe(450);

      expect(snapshot.asks[0].cumulativeSize).toBe(150);
      expect(snapshot.asks[1].cumulativeSize).toBe(250);
      expect(snapshot.asks[2].cumulativeSize).toBe(450);
    });
  });

  describe('computeMetrics', () => {
    it('should compute order book imbalance', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      // Total bid vol = 450, Total ask vol = 450
      // Imbalance = (450 - 450) / (450 + 450) = 0
      expect(metrics.imbalance).toBe(0);
    });

    it('should compute positive imbalance (more bids)', () => {
      const bullishBook: RawOrderBook = {
        bids: [
          { price: '0.52', size: '300' },
          { price: '0.51', size: '300' },
        ],
        asks: [
          { price: '0.54', size: '100' },
          { price: '0.55', size: '100' },
        ],
      };

      const snapshot = analyzer.processSnapshot(bullishBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      // Imbalance should be positive (more bid volume)
      expect(metrics.imbalance).toBeGreaterThan(0);
    });

    it('should compute negative imbalance (more asks)', () => {
      const bearishBook: RawOrderBook = {
        bids: [
          { price: '0.52', size: '100' },
          { price: '0.51', size: '100' },
        ],
        asks: [
          { price: '0.54', size: '300' },
          { price: '0.55', size: '300' },
        ],
      };

      const snapshot = analyzer.processSnapshot(bearishBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      // Imbalance should be negative (more ask volume)
      expect(metrics.imbalance).toBeLessThan(0);
    });

    it('should compute VWAP for bids and asks', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      // Bid VWAP = (0.52*100 + 0.51*200 + 0.50*150) / 450
      const expectedBidVWAP = (0.52 * 100 + 0.51 * 200 + 0.50 * 150) / 450;
      expect(metrics.bidVWAP).toBeCloseTo(expectedBidVWAP, 4);

      // Ask VWAP = (0.54*150 + 0.55*100 + 0.56*200) / 450
      const expectedAskVWAP = (0.54 * 150 + 0.55 * 100 + 0.56 * 200) / 450;
      expect(metrics.askVWAP).toBeCloseTo(expectedAskVWAP, 4);
    });

    it('should compute liquidity score', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      expect(metrics.liquidityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.liquidityScore).toBeLessThanOrEqual(100);
    });

    it('should find liquidity zones', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const metrics = analyzer.computeMetrics(snapshot);

      expect(Array.isArray(metrics.concentrationZones)).toBe(true);
    });
  });

  describe('estimateSlippage', () => {
    it('should estimate slippage for BUY market order', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      // Buying 100 shares at market = fill at 0.54 (best ask)
      const result = analyzer.estimateSlippage(snapshot, 100, 'BUY');

      expect(result.side).toBe('BUY');
      expect(result.avgExecutionPrice).toBe(0.54);
      expect(result.slippageBps).toBeCloseTo(((0.54 - 0.53) / 0.53) * 10000, 1);
      expect(result.fillable).toBe(true);
    });

    it('should estimate slippage for SELL market order', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      // Selling 100 shares at market = fill at 0.52 (best bid)
      const result = analyzer.estimateSlippage(snapshot, 100, 'SELL');

      expect(result.side).toBe('SELL');
      expect(result.avgExecutionPrice).toBe(0.52);
      expect(result.fillable).toBe(true);
    });

    it('should handle large orders that walk the book', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      // Buying 250 shares = 150 @ 0.54 + 100 @ 0.55
      const result = analyzer.estimateSlippage(snapshot, 250, 'BUY');

      const expectedAvgPrice = (150 * 0.54 + 100 * 0.55) / 250;
      expect(result.avgExecutionPrice).toBeCloseTo(expectedAvgPrice, 4);
      expect(result.slippageBps).toBeGreaterThan(0);
    });

    it('should report unfillable orders', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');

      // Trying to buy 1000 shares when only 450 available
      const result = analyzer.estimateSlippage(snapshot, 1000, 'BUY');

      expect(result.fillable).toBe(false);
      expect(result.maxFillableSize).toBe(450);
    });
  });

  describe('calculateImbalance', () => {
    it('should calculate imbalance at default depth', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const imbalance = analyzer.calculateImbalance(snapshot);

      expect(imbalance).toBeGreaterThanOrEqual(-1);
      expect(imbalance).toBeLessThanOrEqual(1);
    });

    it('should calculate imbalance at custom depth', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const imbalance3 = analyzer.calculateImbalance(snapshot, 3);

      expect(imbalance3).toBeGreaterThanOrEqual(-1);
      expect(imbalance3).toBeLessThanOrEqual(1);
    });
  });

  describe('findLiquidityWalls', () => {
    it('should find walls above threshold', () => {
      const bigBook: RawOrderBook = {
        bids: [
          { price: '0.52', size: '500' }, // Wall
          { price: '0.51', size: '50' },  // Not a wall
        ],
        asks: [
          { price: '0.54', size: '100' },
        ],
      };

      const snapshot = analyzer.processSnapshot(bigBook, 'token-1', 'market-1');
      const walls = analyzer.findLiquidityWalls(snapshot, 100);

      expect(walls.length).toBeGreaterThan(0);
      expect(walls.some(w => w.price === 0.52)).toBe(true);
    });
  });

  describe('getDepthData', () => {
    it('should return depth data for visualization', () => {
      const snapshot = analyzer.processSnapshot(mockRawBook, 'token-1', 'market-1');
      const depthData = analyzer.getDepthData(snapshot);

      expect(depthData.bids.length).toBe(3);
      expect(depthData.asks.length).toBe(3);
      expect(depthData.bids[0]).toHaveProperty('price');
      expect(depthData.bids[0]).toHaveProperty('cumulative');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      analyzer.updateConfig({ depthLevels: 5, wallThreshold: 200 });

      const config = analyzer.getConfig();
      expect(config.depthLevels).toBe(5);
      expect(config.wallThreshold).toBe(200);
    });
  });
});

describe('orderbook-utils', () => {
  describe('rawToSnapshot', () => {
    it('should convert raw order book to snapshot', () => {
      const rawBook: RawOrderBook = {
        bids: [{ price: '0.50', size: '100' }],
        asks: [{ price: '0.52', size: '100' }],
      };

      const snapshot = rawToSnapshot(rawBook, 'token-1', 'market-1', 1234567890);

      expect(snapshot.tokenId).toBe('token-1');
      expect(snapshot.midPrice).toBe(0.51);
      expect(snapshot.timestamp).toBe(1234567890);
    });
  });

  describe('processedToSnapshot', () => {
    it('should convert processed order book to snapshot', () => {
      const processedBook: ProcessedOrderBook = {
        bids: [{ price: 0.50, size: 100 }],
        asks: [{ price: 0.52, size: 100 }],
      };

      const snapshot = processedToSnapshot(processedBook, 'token-1', 'market-1');

      expect(snapshot.tokenId).toBe('token-1');
      expect(snapshot.midPrice).toBe(0.51);
      expect(snapshot.bids[0].cumulativeSize).toBe(100);
    });
  });
});
