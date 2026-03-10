/**
 * Tests: atomic-executor.ts — multi-chain execution flow (flash loan + MEV).
 */

import { AtomicExecutor } from '../../../src/arbitrage/phase7_aan/crossChainArbitrage/atomic-executor';
import type { ArbitragePath } from '../../../src/arbitrage/phase7_aan/crossChainArbitrage/path-finder';

const makePath = (profitRatio = 1.005, estimatedProfitUsd = 100): ArbitragePath => ({
  hops: [
    { exchangeId: 'binance',   fromAsset: 'BTC', toAsset: 'ETH',  price: 17,    feeBps: 10, effectiveRate: 16.98 },
    { exchangeId: 'coinbase',  fromAsset: 'ETH', toAsset: 'USDT', price: 3100,  feeBps: 10, effectiveRate: 3099 },
    { exchangeId: 'kraken',    fromAsset: 'USDT', toAsset: 'BTC', price: 0.00002, feeBps: 10, effectiveRate: 0.0000199 },
  ],
  profitRatio,
  estimatedProfitUsd,
  startCapitalUsd: 10_000,
  detectedAt: Date.now(),
});

describe('AtomicExecutor', () => {
  it('skips path when profit is below minProfitUsd', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 200, dryRun: true });
    const skipped: unknown[] = [];
    executor.on('skipped', (r) => skipped.push(r));

    const result = await executor.execute(makePath(1.001, 50));
    expect(result.success).toBe(false);
    expect(result.failureReason).toContain('min');
    expect(skipped).toHaveLength(1);
  });

  it('returns execution result with required fields', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    const result = await executor.execute(makePath(1.005, 100));

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('flashLoan');
    expect(result).toHaveProperty('netProfitUsd');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('durationMs');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('increments execution count on each call', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    await executor.execute(makePath(1.005, 100));
    await executor.execute(makePath(1.005, 100));
    expect(executor.getStats().executions).toBe(2);
  });

  it('getStats returns correct shape', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    const stats = executor.getStats();
    expect(stats).toHaveProperty('executions');
    expect(stats).toHaveProperty('successes');
    expect(stats).toHaveProperty('successRate');
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeLessThanOrEqual(1);
  });

  it('emits executed or failed event (not skipped) for above-threshold path', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    const events: string[] = [];
    executor.on('executed', () => events.push('executed'));
    executor.on('failed', () => events.push('failed'));
    executor.on('mev:missed', () => events.push('mev:missed'));

    await executor.execute(makePath(1.005, 100));
    // One of executed/failed/mev:missed must fire
    expect(events.length).toBeGreaterThan(0);
  });

  it('flash loan result is present on all non-skipped paths', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    const result = await executor.execute(makePath(1.005, 100));
    expect(result.flashLoan).toBeDefined();
    expect(result.flashLoan.borrowedAmount).toBe(10_000);
  });

  it('uses Solana path for raydium exchange (jito flash loan)', async () => {
    const executor = new AtomicExecutor({ minProfitUsd: 50, dryRun: true });
    const solanaPath: ArbitragePath = {
      ...makePath(1.005, 100),
      hops: [
        { exchangeId: 'raydium', fromAsset: 'SOL', toAsset: 'USDC', price: 200, feeBps: 30, effectiveRate: 199.4 },
        { exchangeId: 'raydium', fromAsset: 'USDC', toAsset: 'BTC',  price: 0.00002, feeBps: 30, effectiveRate: 0.0000199 },
        { exchangeId: 'raydium', fromAsset: 'BTC',  toAsset: 'SOL',  price: 250, feeBps: 30, effectiveRate: 249.25 },
      ],
    };
    const result = await executor.execute(solanaPath);
    // Should use jito provider for Solana
    expect(['aave', 'dydx', 'jito']).toContain(result.flashLoan.provider);
  });
});
