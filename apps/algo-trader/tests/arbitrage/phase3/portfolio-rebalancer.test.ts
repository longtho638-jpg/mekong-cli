/**
 * Tests: Portfolio Rebalancer module — ExposureAggregator, RiskCalculator,
 * PortfolioOptimizer, RebalancingExecutor, PortfolioRebalancerEngine
 */

import { ExposureAggregator } from '../../../src/arbitrage/phase3/portfolio-rebalancer/exposure-aggregator';
import type { AssetExposure } from '../../../src/arbitrage/phase3/portfolio-rebalancer/exposure-aggregator';
import { RiskCalculator } from '../../../src/arbitrage/phase3/portfolio-rebalancer/risk-calculator';
import { PortfolioOptimizer } from '../../../src/arbitrage/phase3/portfolio-rebalancer/optimizer-core';
import { RebalancingExecutor } from '../../../src/arbitrage/phase3/portfolio-rebalancer/rebalancing-executor';
import { PortfolioRebalancerEngine } from '../../../src/arbitrage/phase3/portfolio-rebalancer/index';
import { LicenseService } from '../../../src/lib/raas-gate';

beforeEach(() => { LicenseService.getInstance().reset(); });
afterEach(() => { LicenseService.getInstance().reset(); });

// ─── ExposureAggregator ───────────────────────────────────────────────────────

describe('ExposureAggregator', () => {
  const makeExposure = (override: Partial<AssetExposure> = {}): AssetExposure => ({
    asset: 'BTC',
    exchange: 'binance',
    type: 'spot',
    amount: 1,
    valueUsd: 50_000,
    ...override,
  });

  test('addExposure stores and getSnapshot returns it', () => {
    const agg = new ExposureAggregator();
    agg.addExposure(makeExposure());
    const snap = agg.getSnapshot();
    expect(snap.exposures).toHaveLength(1);
    expect(snap.exposures[0].asset).toBe('BTC');
    expect(snap.totalValueUsd).toBe(50_000);
  });

  test('addExposure upserts same asset+exchange+type', () => {
    const agg = new ExposureAggregator();
    agg.addExposure(makeExposure({ valueUsd: 50_000 }));
    agg.addExposure(makeExposure({ valueUsd: 60_000 })); // update
    const snap = agg.getSnapshot();
    expect(snap.exposures).toHaveLength(1);
    expect(snap.exposures[0].valueUsd).toBe(60_000);
  });

  test('addExposure accumulates different assets', () => {
    const agg = new ExposureAggregator();
    agg.addExposure(makeExposure({ asset: 'BTC', valueUsd: 50_000 }));
    agg.addExposure(makeExposure({ asset: 'ETH', exchange: 'bybit', valueUsd: 10_000 }));
    const snap = agg.getSnapshot();
    expect(snap.exposures).toHaveLength(2);
    expect(snap.totalValueUsd).toBe(60_000);
  });

  test('getExposureMatrix aggregates USD value per asset', () => {
    const agg = new ExposureAggregator();
    agg.addExposure(makeExposure({ asset: 'BTC', exchange: 'binance', valueUsd: 30_000 }));
    agg.addExposure(makeExposure({ asset: 'BTC', exchange: 'bybit', type: 'perp', valueUsd: 20_000 }));
    agg.addExposure(makeExposure({ asset: 'ETH', exchange: 'binance', valueUsd: 10_000 }));
    const matrix = agg.getExposureMatrix();
    expect(matrix.get('BTC')).toBe(50_000);
    expect(matrix.get('ETH')).toBe(10_000);
  });

  test('getSnapshot includes timestamp', () => {
    const agg = new ExposureAggregator();
    const before = Date.now();
    const snap = agg.getSnapshot();
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
  });
});

// ─── RiskCalculator ───────────────────────────────────────────────────────────

describe('RiskCalculator', () => {
  const calc = new RiskCalculator();

  test('spot position has positive delta', () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000 });
    const snap = agg.getSnapshot();
    const priceChanges = new Map([['BTC', 0.01]]);
    const metrics = calc.computeRisk(snap, priceChanges);
    const btc = metrics.find(m => m.asset === 'BTC');
    expect(btc).toBeDefined();
    expect(btc!.delta).toBeGreaterThan(0);
  });

  test('perp position has negative delta (short hedge)', () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'ETH', exchange: 'binance', type: 'perp', amount: 10, valueUsd: 20_000 });
    const snap = agg.getSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['ETH', 0.02]]));
    const eth = metrics.find(m => m.asset === 'ETH');
    expect(eth!.delta).toBeLessThan(0);
  });

  test('lending position has partial (0.5x) delta', () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'USDC', exchange: 'aave', type: 'lending', amount: 10_000, valueUsd: 10_000, apy: 0.05 });
    const snap = agg.getSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['USDC', 0.001]]));
    const usdc = metrics.find(m => m.asset === 'USDC');
    expect(usdc!.delta).toBe(5_000); // 0.5 * 10_000
  });

  test('mixed portfolio returns metrics for each asset', () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000 });
    agg.addExposure({ asset: 'ETH', exchange: 'binance', type: 'perp', amount: 10, valueUsd: 20_000 });
    const snap = agg.getSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['BTC', 0.01], ['ETH', -0.02]]));
    expect(metrics).toHaveLength(2);
    expect(metrics.every(m => typeof m.maxDrawdownPct === 'number')).toBe(true);
  });

  test('returns empty array for empty snapshot', () => {
    const agg = new ExposureAggregator();
    const snap = agg.getSnapshot();
    const metrics = calc.computeRisk(snap, new Map());
    expect(metrics).toHaveLength(0);
  });
});

// ─── PortfolioOptimizer ───────────────────────────────────────────────────────

describe('PortfolioOptimizer', () => {
  const opt = new PortfolioOptimizer();
  const calc = new RiskCalculator();

  const makeSnapshot = () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000, apy: 0.01 });
    agg.addExposure({ asset: 'ETH', exchange: 'binance', type: 'spot', amount: 10, valueUsd: 20_000, apy: 0.02 });
    return agg.getSnapshot();
  };

  test('returns allocations for each asset', () => {
    const snap = makeSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['BTC', 0.01], ['ETH', 0.02]]));
    const result = opt.optimize(snap, metrics, { maxSlippageBps: 5 });
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations.every(a => typeof a.targetPct === 'number')).toBe(true);
  });

  test('target percentages sum to ~1', () => {
    const snap = makeSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['BTC', 0.01], ['ETH', 0.01]]));
    const result = opt.optimize(snap, metrics, { maxSlippageBps: 5 });
    const total = result.allocations.reduce((s, a) => s + a.targetPct, 0);
    expect(total).toBeCloseTo(1, 1);
  });

  test('respects maxSlippageBps constraint (no crash)', () => {
    const snap = makeSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['BTC', 0.01], ['ETH', 0.01]]));
    expect(() => opt.optimize(snap, metrics, { maxSlippageBps: 1 })).not.toThrow();
  });

  test('returns empty result for empty snapshot', () => {
    const agg = new ExposureAggregator();
    const snap = agg.getSnapshot();
    const result = opt.optimize(snap, [], { maxSlippageBps: 5 });
    expect(result.allocations).toHaveLength(0);
    expect(result.riskReduction).toBe(0);
  });

  test('result includes riskReduction and expectedYieldBps', () => {
    const snap = makeSnapshot();
    const metrics = calc.computeRisk(snap, new Map([['BTC', 0.02], ['ETH', 0.01]]));
    const result = opt.optimize(snap, metrics, { maxSlippageBps: 5 });
    expect(typeof result.riskReduction).toBe('number');
    expect(typeof result.expectedYieldBps).toBe('number');
  });
});

// ─── RebalancingExecutor ──────────────────────────────────────────────────────

describe('RebalancingExecutor', () => {
  const exec = new RebalancingExecutor();

  const makeSnapshotAndTarget = () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000 });
    agg.addExposure({ asset: 'ETH', exchange: 'binance', type: 'spot', amount: 10, valueUsd: 20_000 });
    const snap = agg.getSnapshot();
    const target = {
      allocations: [
        { asset: 'BTC', targetPct: 0.6, currentPct: 0.714, adjustmentUsd: -8_000 },
        { asset: 'ETH', targetPct: 0.4, currentPct: 0.286, adjustmentUsd: 8_000 },
      ],
      riskReduction: 0.1,
      expectedYieldBps: 150,
    };
    return { snap, target };
  };

  test('generateTrades produces buy/sell trades', () => {
    const { snap, target } = makeSnapshotAndTarget();
    const trades = exec.generateTrades(snap, target);
    expect(trades.length).toBeGreaterThan(0);
    const sides = trades.map(t => t.side);
    expect(sides).toContain('buy');
    expect(sides).toContain('sell');
  });

  test('generateTrades skips sub-$1 adjustments', () => {
    const agg = new ExposureAggregator();
    agg.addExposure({ asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000 });
    const snap = agg.getSnapshot();
    const target = {
      allocations: [{ asset: 'BTC', targetPct: 1.0, currentPct: 1.0, adjustmentUsd: 0.5 }],
      riskReduction: 0,
      expectedYieldBps: 0,
    };
    const trades = exec.generateTrades(snap, target);
    expect(trades).toHaveLength(0);
  });

  test('executeTrades returns execution summary', async () => {
    const { snap, target } = makeSnapshotAndTarget();
    const trades = exec.generateTrades(snap, target);
    const summary = await exec.executeTrades(trades);
    expect(typeof summary.executed).toBe('number');
    expect(typeof summary.failed).toBe('number');
    expect(summary.executed + summary.failed).toBe(trades.length);
  });

  test('emits rebalance:complete after executeTrades', async () => {
    const { snap, target } = makeSnapshotAndTarget();
    const trades = exec.generateTrades(snap, target);
    const handler = jest.fn();
    exec.on('rebalance:complete', handler);
    await exec.executeTrades(trades);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── PortfolioRebalancerEngine ────────────────────────────────────────────────

describe('PortfolioRebalancerEngine', () => {
  test('start/stop lifecycle', () => {
    const engine = new PortfolioRebalancerEngine({ intervalMs: 10000 });
    engine.start();
    expect(engine.getStatus().running).toBe(true);
    engine.stop();
    expect(engine.getStatus().running).toBe(false);
  });

  test('double start is idempotent', () => {
    const engine = new PortfolioRebalancerEngine({ intervalMs: 10000 });
    engine.start();
    engine.start();
    expect(engine.getStatus().running).toBe(true);
    engine.stop();
  });

  test('getStatus returns expected fields', () => {
    const engine = new PortfolioRebalancerEngine({ intervalMs: 10000 });
    const status = engine.getStatus();
    expect(status).toHaveProperty('running');
    expect(status).toHaveProperty('totalValueUsd');
    expect(status).toHaveProperty('lastRebalanceTime');
    expect(status).toHaveProperty('tradesExecuted');
  });

  test('totalValueUsd reflects added exposures', () => {
    const engine = new PortfolioRebalancerEngine({ intervalMs: 10000 });
    engine.getAggregator().addExposure({
      asset: 'BTC', exchange: 'binance', type: 'spot', amount: 1, valueUsd: 50_000,
    });
    expect(engine.getStatus().totalValueUsd).toBe(50_000);
    engine.stop();
  });
});
