import { OrderBookDepthAnalyzer } from '../../src/execution/order-book-depth-analyzer';
import type { IOrderBook } from '../../src/interfaces/IExchange';

function makeOrderBook(
  symbol: string,
  bids: [number, number][],
  asks: [number, number][],
): IOrderBook {
  return {
    symbol,
    bids: bids.map(([price, amount]) => ({ price, amount })),
    asks: asks.map(([price, amount]) => ({ price, amount })),
    timestamp: Date.now(),
  };
}

describe('OrderBookDepthAnalyzer', () => {
  let analyzer: OrderBookDepthAnalyzer;

  beforeEach(() => {
    analyzer = new OrderBookDepthAnalyzer({
      minLiquidityScore: 30,
      maxSlippagePct: 0.005,
      maxDepthLevels: 20,
    });
  });

  describe('analyzeDepth', () => {
    test('calculates buy slippage from asks', () => {
      const book = makeOrderBook('BTC/USDT', [], [
        [50000, 0.5],  // level 1
        [50100, 0.5],  // level 2
        [50200, 0.5],  // level 3
      ]);

      const result = analyzer.analyzeDepth(book, 'binance', 'buy', 0.8);
      expect(result.bestPrice).toBe(50000);
      // 0.5 at 50000 + 0.3 at 50100 = avg ~50037.5
      expect(result.avgFillPrice).toBeGreaterThan(50000);
      expect(result.avgFillPrice).toBeLessThan(50100);
      expect(result.slippagePct).toBeGreaterThan(0);
      expect(result.fullyFillable).toBe(true);
      expect(result.levelsConsumed).toBe(2);
    });

    test('calculates sell slippage from bids', () => {
      const book = makeOrderBook('BTC/USDT', [
        [50000, 1.0],  // best bid
        [49900, 1.0],
      ], []);

      const result = analyzer.analyzeDepth(book, 'okx', 'sell', 0.5);
      expect(result.bestPrice).toBe(50000);
      expect(result.avgFillPrice).toBe(50000); // fully filled at level 1
      expect(result.slippagePct).toBe(0);
      expect(result.fullyFillable).toBe(true);
      expect(result.levelsConsumed).toBe(1);
    });

    test('detects insufficient liquidity', () => {
      const book = makeOrderBook('BTC/USDT', [], [
        [50000, 0.1],
        [50100, 0.1],
      ]);

      const result = analyzer.analyzeDepth(book, 'binance', 'buy', 1.0);
      expect(result.fullyFillable).toBe(false);
      expect(result.maxFillableAmount).toBe(0.2);
    });

    test('returns empty analysis for empty book', () => {
      const book = makeOrderBook('BTC/USDT', [], []);

      const result = analyzer.analyzeDepth(book, 'binance', 'buy', 1.0);
      expect(result.avgFillPrice).toBe(0);
      expect(result.fullyFillable).toBe(false);
      expect(result.liquidityScore).toBe(0);
    });

    test('liquidity score reflects depth ratio', () => {
      const deepBook = makeOrderBook('BTC/USDT', [], [
        [50000, 10], [50001, 10], [50002, 10], [50003, 10], [50004, 10],
      ]);
      const shallowBook = makeOrderBook('BTC/USDT', [], [
        [50000, 0.01],
      ]);

      const deep = analyzer.analyzeDepth(deepBook, 'binance', 'buy', 1.0);
      const shallow = analyzer.analyzeDepth(shallowBook, 'binance', 'buy', 1.0);
      expect(deep.liquidityScore).toBeGreaterThan(shallow.liquidityScore);
    });
  });

  describe('analyzeArbSpread', () => {
    test('calculates net spread with real slippage', () => {
      const buyBook = makeOrderBook('BTC/USDT', [], [
        [50000, 2.0], [50001, 2.0], [50002, 2.0], [50003, 2.0], [50004, 2.0],
      ]);
      const sellBook = makeOrderBook('BTC/USDT', [
        [50300, 2.0], [50299, 2.0], [50298, 2.0], [50297, 2.0], [50296, 2.0],
      ], []);

      const result = analyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 0.5);
      expect(result.netSpreadPct).toBeGreaterThan(0);
      expect(result.buyAnalysis.exchange).toBe('binance');
      expect(result.sellAnalysis.exchange).toBe('okx');
      expect(result.executable).toBe(true);
    });

    test('marks as non-executable when slippage too high', () => {
      const strictAnalyzer = new OrderBookDepthAnalyzer({ maxSlippagePct: 0.0001 });

      const buyBook = makeOrderBook('BTC/USDT', [], [
        [50000, 0.01], [51000, 0.01], // huge gap = high slippage
      ]);
      const sellBook = makeOrderBook('BTC/USDT', [
        [52000, 1.0],
      ], []);

      const result = strictAnalyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 0.015);
      // Slippage on buy side will exceed 0.01%
      expect(result.buyAnalysis.slippagePct).toBeGreaterThan(0.0001);
      expect(result.executable).toBe(false);
    });

    test('marks as non-executable when liquidity insufficient', () => {
      const buyBook = makeOrderBook('BTC/USDT', [], [
        [50000, 0.001], // very thin
      ]);
      const sellBook = makeOrderBook('BTC/USDT', [
        [50300, 1.0],
      ], []);

      const result = analyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 1.0);
      expect(result.buyAnalysis.fullyFillable).toBe(false);
      expect(result.executable).toBe(false);
    });

    test('calculates estimated profit correctly', () => {
      const buyBook = makeOrderBook('BTC/USDT', [], [
        [50000, 5.0],
      ]);
      const sellBook = makeOrderBook('BTC/USDT', [
        [50500, 5.0],
      ], []);

      const result = analyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 1.0, 0.001, 0.001);
      // Gross: (50500-50000)/50000 = 1%, net = 1% - 0.2% fees = 0.8%
      expect(result.estimatedProfitUsd).toBeGreaterThan(0);
      expect(result.netSpreadPct).toBeCloseTo(0.008, 3);
    });
  });

  describe('isTradeViable', () => {
    test('returns true for profitable executable trade', () => {
      const buyBook = makeOrderBook('BTC/USDT', [], [
        [50000, 5.0], [50001, 5.0], [50002, 5.0], [50003, 5.0], [50004, 5.0],
      ]);
      const sellBook = makeOrderBook('BTC/USDT', [
        [50500, 5.0], [50499, 5.0], [50498, 5.0], [50497, 5.0], [50496, 5.0],
      ], []);

      const analysis = analyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 1.0);
      expect(analyzer.isTradeViable(analysis, 0.001)).toBe(true);
    });

    test('returns false when net spread below min', () => {
      const buyBook = makeOrderBook('BTC/USDT', [], [[50000, 5.0]]);
      const sellBook = makeOrderBook('BTC/USDT', [[50010, 5.0]], []);

      const analysis = analyzer.analyzeArbSpread(buyBook, sellBook, 'binance', 'okx', 1.0);
      // Spread is tiny, probably negative after fees
      expect(analyzer.isTradeViable(analysis, 0.01)).toBe(false);
    });
  });

  describe('calculateOptimalSize', () => {
    test('returns max size within slippage threshold', () => {
      const book = makeOrderBook('BTC/USDT', [], [
        [50000, 1.0],
        [50050, 1.0],  // 0.1% above best
        [50500, 1.0],  // 1% above best — would exceed threshold
      ]);

      const optimalSize = analyzer.calculateOptimalSize(book, 'buy', 0.001);
      // Should include level 1 (0 slippage) and possibly part of level 2
      expect(optimalSize).toBeGreaterThanOrEqual(1.0);
      expect(optimalSize).toBeLessThanOrEqual(3.0);
    });

    test('returns 0 for empty book', () => {
      const book = makeOrderBook('BTC/USDT', [], []);
      expect(analyzer.calculateOptimalSize(book, 'buy')).toBe(0);
    });

    test('returns full depth when slippage is minimal', () => {
      const book = makeOrderBook('BTC/USDT', [
        [50000, 2.0],
        [49999, 2.0],
        [49998, 2.0],
      ], []);

      const optimalSize = analyzer.calculateOptimalSize(book, 'sell', 0.01);
      // All levels are within 0.01% slippage
      expect(optimalSize).toBe(6.0);
    });
  });
});
