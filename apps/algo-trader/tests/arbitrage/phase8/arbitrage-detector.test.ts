/**
 * Tests: arbitrage-detector.ts — AMM vs CEX price discrepancy detection.
 */

import { ArbitrageDetector } from '../../../src/arbitrage/phase8_omninets/yieldOptimizer/arbitrage-detector';
import type { PoolState } from '../../../src/arbitrage/phase8_omninets/yieldOptimizer/amm-monitor';
import type { CexQuote } from '../../../src/arbitrage/phase8_omninets/yieldOptimizer/arbitrage-detector';

const makePool = (price: number, overrides: Partial<PoolState> = {}): PoolState => ({
  poolId: 'uniswap_v3_eth_usdc',
  protocol: 'uniswap_v3',
  token0: 'ETH',
  token1: 'USDC',
  price,
  liquidity: 10_000_000,
  fee: 0.003,
  updatedAt: Date.now(),
  ...overrides,
});

const makeCex = (mid: number): CexQuote => ({
  symbol: 'ETH/USDT',
  bid: mid - 0.5,
  ask: mid + 0.5,
  exchange: 'binance',
  timestamp: Date.now(),
});

describe('ArbitrageDetector', () => {
  it('returns null when spread is below minProfitUsd', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 1_000_000 });
    const result = det.detect(makePool(3000), makeCex(3000.5));
    expect(result).toBeNull();
  });

  it('detects opportunity when AMM price is significantly higher than CEX', () => {
    // AMM price 3% above CEX — should produce large profit on 10M liquidity
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const result = det.detect(makePool(3090), makeCex(3000));
    expect(result).not.toBeNull();
    expect(result?.direction).toBe('buy-cex-sell-amm');
  });

  it('detects opportunity when CEX price is higher than AMM', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const result = det.detect(makePool(3000), makeCex(3090));
    expect(result).not.toBeNull();
    expect(result?.direction).toBe('buy-amm-sell-cex');
  });

  it('opportunity has expected fields', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const result = det.detect(makePool(3090), makeCex(3000));
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('poolId');
    expect(result).toHaveProperty('estimatedProfitUsd');
    expect(result).toHaveProperty('priceDiffPct');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('detectedAt');
  });

  it('estimatedProfitUsd is positive', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const result = det.detect(makePool(3090), makeCex(3000));
    expect(result!.estimatedProfitUsd).toBeGreaterThan(0);
  });

  it('increments detectedCount on opportunity', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    det.detect(makePool(3090), makeCex(3000));
    det.detect(makePool(3090), makeCex(3000));
    expect(det.getDetectedCount()).toBe(2);
  });

  it('does not increment detectedCount when no opportunity', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 1_000_000 });
    det.detect(makePool(3000), makeCex(3000));
    expect(det.getDetectedCount()).toBe(0);
  });

  it('emits opportunity:detected event', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const events: unknown[] = [];
    det.on('opportunity:detected', (e) => events.push(e));
    det.detect(makePool(3090), makeCex(3000));
    expect(events).toHaveLength(1);
  });

  it('scanAll returns opportunities for multiple pools', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const pools = [
      makePool(3090, { poolId: 'pool-a' }),
      makePool(3090, { poolId: 'pool-b' }),
    ];
    const results = det.scanAll(pools, makeCex(3000));
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('scanAll returns empty array when no opportunities', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 1_000_000 });
    const pools = [makePool(3000, { poolId: 'pool-a' })];
    const results = det.scanAll(pools, makeCex(3000));
    expect(results).toHaveLength(0);
  });

  it('priceDiffPct is correctly calculated', () => {
    const det = new ArbitrageDetector({ minProfitUsd: 20 });
    const result = det.detect(makePool(3100), makeCex(3000));
    if (result) {
      const expected = ((3100 - 3000) / 3000) * 100;
      expect(result.priceDiffPct).toBeCloseTo(expected, 2);
    }
  });
});
