/**
 * Tests: feature-extractor.ts — feature vector computation from orderbook snapshots.
 */

import {
  extractFeatures,
  computeVolumeImbalance,
  computeBookSlope,
  computeMicroPrice,
  computeTradeFlow,
  type OrderbookSnapshot,
  type TradeEvent,
} from '../../../src/arbitrage/phase7_aan/predictiveLiquidity/feature-extractor';

const makeSnapshot = (
  bids: [number, number][],
  asks: [number, number][],
  ts = 1000,
): OrderbookSnapshot => ({
  bids: bids.map(([price, size]) => ({ price, size })),
  asks: asks.map(([price, size]) => ({ price, size })),
  timestamp: ts,
});

const makeTrades = (events: Array<{ price: number; size: number; side: 'buy' | 'sell' }>): TradeEvent[] =>
  events.map((e) => ({ ...e, timestamp: Date.now() }));

describe('computeVolumeImbalance', () => {
  it('returns 0 when bid and ask volume are equal', () => {
    const bids = [{ price: 100, size: 10 }];
    const asks = [{ price: 101, size: 10 }];
    expect(computeVolumeImbalance(bids, asks)).toBeCloseTo(0);
  });

  it('returns positive when bids dominate', () => {
    const bids = [{ price: 100, size: 20 }];
    const asks = [{ price: 101, size: 5 }];
    expect(computeVolumeImbalance(bids, asks)).toBeGreaterThan(0);
  });

  it('returns negative when asks dominate', () => {
    const bids = [{ price: 100, size: 5 }];
    const asks = [{ price: 101, size: 20 }];
    expect(computeVolumeImbalance(bids, asks)).toBeLessThan(0);
  });

  it('returns 0 for empty book', () => {
    expect(computeVolumeImbalance([], [])).toBe(0);
  });

  it('clamps result to [-1, 1]', () => {
    const bids = [{ price: 100, size: 1000 }];
    const asks = [{ price: 101, size: 0.001 }];
    const result = computeVolumeImbalance(bids, asks);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('computeBookSlope', () => {
  it('returns 0 when midPrice is 0', () => {
    const bids = [{ price: 100, size: 10 }];
    const asks = [{ price: 101, size: 10 }];
    expect(computeBookSlope(bids, asks, 0)).toBe(0);
  });

  it('returns positive value for valid book', () => {
    const bids = [{ price: 100, size: 10 }];
    const asks = [{ price: 101, size: 10 }];
    expect(computeBookSlope(bids, asks, 100.5)).toBeGreaterThan(0);
  });

  it('increases with deeper book', () => {
    const thinBids = [{ price: 100, size: 1 }];
    const thickBids = [{ price: 100, size: 100 }];
    const asks = [{ price: 101, size: 10 }];
    const thin = computeBookSlope(thinBids, asks, 100.5);
    const thick = computeBookSlope(thickBids, asks, 100.5);
    expect(thick).toBeGreaterThan(thin);
  });
});

describe('computeMicroPrice', () => {
  it('returns simple mid when sizes are equal', () => {
    const bids = [{ price: 100, size: 10 }];
    const asks = [{ price: 102, size: 10 }];
    expect(computeMicroPrice(bids, asks)).toBeCloseTo(101);
  });

  it('pulls toward ask side when ask size is larger', () => {
    const bids = [{ price: 100, size: 1 }];
    const asks = [{ price: 102, size: 9 }];
    const micro = computeMicroPrice(bids, asks);
    // Micro price pulls toward ask (large ask size weights bid price more)
    expect(micro).toBeLessThan(101.5);
  });

  it('returns 0 for empty book', () => {
    expect(computeMicroPrice([], [])).toBe(0);
  });
});

describe('computeTradeFlow', () => {
  it('returns 0 for empty trades', () => {
    expect(computeTradeFlow([])).toBe(0);
  });

  it('returns 1 when all trades are buys', () => {
    const trades = makeTrades([
      { price: 100, size: 5, side: 'buy' },
      { price: 100, size: 3, side: 'buy' },
    ]);
    expect(computeTradeFlow(trades)).toBeCloseTo(1);
  });

  it('returns -1 when all trades are sells', () => {
    const trades = makeTrades([
      { price: 100, size: 5, side: 'sell' },
    ]);
    expect(computeTradeFlow(trades)).toBeCloseTo(-1);
  });

  it('returns balanced flow for mixed trades', () => {
    const trades = makeTrades([
      { price: 100, size: 10, side: 'buy' },
      { price: 100, size: 10, side: 'sell' },
    ]);
    expect(computeTradeFlow(trades)).toBeCloseTo(0);
  });
});

describe('extractFeatures', () => {
  it('returns zero vector for empty snapshot', () => {
    const snapshot = makeSnapshot([], []);
    const result = extractFeatures(snapshot, []);
    expect(result.volumeImbalance).toBe(0);
    expect(result.midPrice).toBe(0);
    expect(result.spread).toBe(0);
  });

  it('computes all fields for valid snapshot', () => {
    const snapshot = makeSnapshot([[100, 10], [99, 8]], [[101, 10], [102, 6]]);
    const trades = makeTrades([{ price: 100, size: 2, side: 'buy' }]);
    const result = extractFeatures(snapshot, trades);

    expect(result.midPrice).toBeCloseTo(100.5);
    expect(result.spread).toBeCloseTo(1);
    expect(result.volumeImbalance).toBeDefined();
    expect(result.bookSlope).toBeGreaterThan(0);
    expect(result.microPrice).toBeGreaterThan(0);
    expect(result.tradeFlow).toBeCloseTo(1); // all buys
    expect(result.timestamp).toBe(1000);
  });

  it('preserves timestamp from snapshot', () => {
    const snapshot = makeSnapshot([[100, 1]], [[101, 1]], 9999);
    const result = extractFeatures(snapshot, []);
    expect(result.timestamp).toBe(9999);
  });
});
