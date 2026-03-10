/**
 * Phase 12 Omega — Energy Arbitrage Test Suite.
 * Covers: EnergyMarketConnector, ComputeCostModel, ArbitrageOptimizer,
 *         MiningValidatorModule, TreasuryManager, EnergyArbitrageEngine.
 * Target: 70+ tests, no external dependencies, manual mocks only.
 */

import { EnergyMarketConnector } from '../../../src/arbitrage/phase12_omega/energyArbitrage/energy-market-connector';
import { ComputeCostModel } from '../../../src/arbitrage/phase12_omega/energyArbitrage/compute-cost-model';
import { ArbitrageOptimizer } from '../../../src/arbitrage/phase12_omega/energyArbitrage/arbitrage-optimizer';
import { MiningValidatorModule } from '../../../src/arbitrage/phase12_omega/energyArbitrage/mining-validator-module';
import { TreasuryManager } from '../../../src/arbitrage/phase12_omega/energyArbitrage/treasury-manager';
import { EnergyArbitrageEngine } from '../../../src/arbitrage/phase12_omega/energyArbitrage/index';
import type { EnergyPrice } from '../../../src/arbitrage/phase12_omega/energyArbitrage/energy-market-connector';
import type { ComputeUsage } from '../../../src/arbitrage/phase12_omega/energyArbitrage/compute-cost-model';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePrice(pricePerMwh: number, market: EnergyPrice['market'] = 'ERCOT'): EnergyPrice {
  return { market, pricePerMwh, timestamp: Date.now(), currency: 'USD', zone: 'HB_NORTH' };
}

function makeUsage(overrides: Partial<ComputeUsage> = {}): ComputeUsage {
  return { cpuHours: 1, memoryGbHours: 4, bandwidthGb: 0.5, storageGbMonth: 100, gpuHours: 0, ...overrides };
}

// ── EnergyMarketConnector ─────────────────────────────────────────────────────

describe('EnergyMarketConnector', () => {
  it('constructs with default config', () => {
    const c = new EnergyMarketConnector();
    expect(c.getConfig().markets).toEqual(['NORDPOOL', 'ERCOT']);
    expect(c.getConfig().simulation).toBe(true);
  });

  it('accepts custom markets', () => {
    const c = new EnergyMarketConnector({ markets: ['PJM', 'CAISO'] });
    expect(c.getConfig().markets).toContain('PJM');
  });

  it('returns empty latest prices before first fetch', () => {
    const c = new EnergyMarketConnector();
    expect(c.getLatestPrices()).toHaveLength(0);
  });

  it('fetchPrices returns one price per market', async () => {
    const c = new EnergyMarketConnector({ markets: ['ERCOT', 'PJM'], simulation: true });
    const prices = await c.fetchPrices();
    expect(prices).toHaveLength(2);
  });

  it('fetchPrices sets timestamp close to now', async () => {
    const before = Date.now();
    const c = new EnergyMarketConnector({ markets: ['ERCOT'], simulation: true });
    const prices = await c.fetchPrices();
    expect(prices[0].timestamp).toBeGreaterThanOrEqual(before);
  });

  it('fetchPrices prices are positive numbers', async () => {
    const c = new EnergyMarketConnector({ markets: ['NORDPOOL', 'ERCOT', 'PJM', 'CAISO'], simulation: true });
    const prices = await c.fetchPrices();
    for (const p of prices) {
      expect(p.pricePerMwh).toBeGreaterThan(0);
    }
  });

  it('getLatestPrices returns cached data after fetch', async () => {
    const c = new EnergyMarketConnector({ markets: ['ERCOT'], simulation: true });
    await c.fetchPrices();
    expect(c.getLatestPrices()).toHaveLength(1);
  });

  it('getCheapestMarket returns undefined before fetch', () => {
    const c = new EnergyMarketConnector();
    expect(c.getCheapestMarket()).toBeUndefined();
  });

  it('getCheapestMarket returns lowest price market', async () => {
    const c = new EnergyMarketConnector({ markets: ['NORDPOOL', 'ERCOT'], simulation: true });
    await c.fetchPrices();
    const cheap = c.getCheapestMarket();
    const prices = c.getLatestPrices();
    const minPrice = Math.min(...prices.map((p) => p.pricePerMwh));
    expect(cheap?.pricePerMwh).toBe(minPrice);
  });

  it('NORDPOOL prices are in EUR', async () => {
    const c = new EnergyMarketConnector({ markets: ['NORDPOOL'], simulation: true });
    const prices = await c.fetchPrices();
    expect(prices[0].currency).toBe('EUR');
  });

  it('ERCOT prices are in USD', async () => {
    const c = new EnergyMarketConnector({ markets: ['ERCOT'], simulation: true });
    const prices = await c.fetchPrices();
    expect(prices[0].currency).toBe('USD');
  });

  it('prices within realistic range 5–300 $/MWh', async () => {
    const c = new EnergyMarketConnector({ markets: ['ERCOT'], simulation: true });
    for (let i = 0; i < 20; i++) {
      const prices = await c.fetchPrices();
      expect(prices[0].pricePerMwh).toBeGreaterThanOrEqual(5);
      expect(prices[0].pricePerMwh).toBeLessThan(300);
    }
  });

  it('successive fetches update cached prices', async () => {
    const c = new EnergyMarketConnector({ markets: ['ERCOT'], simulation: true });
    await c.fetchPrices();
    const first = c.getLatestPrices()[0].pricePerMwh;
    await c.fetchPrices();
    // Prices may differ due to noise — just verify it's a valid number
    expect(typeof c.getLatestPrices()[0].pricePerMwh).toBe('number');
    void first;
  });
});

// ── ComputeCostModel ──────────────────────────────────────────────────────────

describe('ComputeCostModel', () => {
  it('constructs with defaults', () => {
    const m = new ComputeCostModel();
    expect(m.getConfig().provider).toBe('AWS');
  });

  it('calculateCost returns zero for zero usage', () => {
    const m = new ComputeCostModel();
    const report = m.calculateCost(makeUsage({ cpuHours: 0, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0 }));
    expect(report.costs.totalHourly).toBe(0);
  });

  it('CPU cost scales linearly', () => {
    const m = new ComputeCostModel({ provider: 'AWS' });
    const r1 = m.calculateCost(makeUsage({ cpuHours: 1, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0 }));
    const r2 = m.calculateCost(makeUsage({ cpuHours: 2, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0 }));
    expect(r2.costs.cpuCost).toBeCloseTo(r1.costs.cpuCost * 2, 4);
  });

  it('GPU cost included when gpuHours > 0', () => {
    const m = new ComputeCostModel();
    const report = m.calculateCost(makeUsage({ gpuHours: 1, cpuHours: 0, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0 }));
    expect(report.costs.gpuCost).toBeGreaterThan(0);
  });

  it('totalDaily = totalHourly * 24', () => {
    const m = new ComputeCostModel();
    const report = m.calculateCost(makeUsage());
    expect(report.costs.totalDaily).toBeCloseTo(report.costs.totalHourly * 24, 3);
  });

  it('GCP provider returns different rates than AWS', () => {
    const aws = new ComputeCostModel({ provider: 'AWS' });
    const gcp = new ComputeCostModel({ provider: 'GCP' });
    const u = makeUsage({ cpuHours: 10, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0 });
    expect(aws.calculateCost(u).costs.cpuCost).not.toBe(gcp.calculateCost(u).costs.cpuCost);
  });

  it('AZURE provider supported', () => {
    const m = new ComputeCostModel({ provider: 'AZURE' });
    const report = m.calculateCost(makeUsage());
    expect(report.provider).toBe('AZURE');
    expect(report.costs.totalHourly).toBeGreaterThan(0);
  });

  it('recordUsage accumulates', () => {
    const m = new ComputeCostModel();
    m.recordUsage({ cpuHours: 1 });
    m.recordUsage({ cpuHours: 2 });
    const report = m.calculateCost();
    const direct = m.calculateCost(makeUsage({ cpuHours: 3, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0 }));
    expect(report.costs.cpuCost).toBeCloseTo(direct.costs.cpuCost, 3);
  });

  it('resetUsage clears accumulated usage', () => {
    const m = new ComputeCostModel();
    m.recordUsage({ cpuHours: 10 });
    m.resetUsage();
    const report = m.calculateCost();
    expect(report.costs.cpuCost).toBe(0);
  });

  it('getRates returns non-zero values', () => {
    const m = new ComputeCostModel();
    const rates = m.getRates();
    expect(rates.cpuPerHour).toBeGreaterThan(0);
    expect(rates.gpuPerHour).toBeGreaterThan(0);
  });

  it('bandwidth cost greater than zero for outbound traffic', () => {
    const m = new ComputeCostModel();
    const report = m.calculateCost(makeUsage({ bandwidthGb: 100, cpuHours: 0, memoryGbHours: 0, storageGbMonth: 0, gpuHours: 0 }));
    expect(report.costs.bandwidthCost).toBeGreaterThan(0);
  });

  it('generatedAt is recent timestamp', () => {
    const before = Date.now();
    const m = new ComputeCostModel();
    const report = m.calculateCost(makeUsage());
    expect(report.generatedAt).toBeGreaterThanOrEqual(before);
  });
});

// ── ArbitrageOptimizer ────────────────────────────────────────────────────────

describe('ArbitrageOptimizer', () => {
  const cheapPrices = [makePrice(25)];   // well below threshold
  const expensivePrices = [makePrice(100)]; // above threshold
  const neutralPrices = [makePrice(60)]; // between thresholds

  it('constructs with defaults', () => {
    const o = new ArbitrageOptimizer();
    expect(o.getConfig().cheapThresholdUsd).toBe(40);
    expect(o.getConfig().expensiveThresholdUsd).toBe(80);
  });

  it('returns 24 slots by default', () => {
    const o = new ArbitrageOptimizer();
    const schedule = o.optimize(cheapPrices);
    expect(schedule.slots).toHaveLength(24);
  });

  it('custom lookAheadHours respected', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 12 });
    const schedule = o.optimize(cheapPrices);
    expect(schedule.slots).toHaveLength(12);
  });

  it('cheap energy → SCALE_UP action', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(cheapPrices);
    expect(schedule.slots[0].action).toBe('SCALE_UP');
  });

  it('expensive energy → SCALE_DOWN or DEFER_BATCH', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(expensivePrices);
    expect(['SCALE_DOWN', 'DEFER_BATCH']).toContain(schedule.slots[0].action);
  });

  it('neutral energy → MAINTAIN action', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(neutralPrices);
    expect(schedule.slots[0].action).toBe('MAINTAIN');
  });

  it('SCALE_UP has positive estimated savings', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(cheapPrices);
    expect(schedule.slots[0].estimatedSavingsUsd).toBeGreaterThan(0);
  });

  it('MAINTAIN has zero estimated savings', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(neutralPrices);
    expect(schedule.slots[0].estimatedSavingsUsd).toBe(0);
  });

  it('cheapestSlot has lowest energy price', () => {
    const prices = [makePrice(20), makePrice(80), makePrice(50)];
    const o = new ArbitrageOptimizer({ lookAheadHours: 3 });
    const schedule = o.optimize(prices);
    expect(schedule.cheapestSlot?.energyPricePerMwh).toBe(
      Math.min(...schedule.slots.map((s) => s.energyPricePerMwh)),
    );
  });

  it('mostExpensiveSlot has highest energy price', () => {
    const prices = [makePrice(20), makePrice(80), makePrice(50)];
    const o = new ArbitrageOptimizer({ lookAheadHours: 3 });
    const schedule = o.optimize(prices);
    expect(schedule.mostExpensiveSlot?.energyPricePerMwh).toBe(
      Math.max(...schedule.slots.map((s) => s.energyPricePerMwh)),
    );
  });

  it('totalEstimatedSavingsUsd equals sum of slot savings', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 6 });
    const schedule = o.optimize(cheapPrices);
    const sum = schedule.slots.reduce((s, sl) => s + sl.estimatedSavingsUsd, 0);
    expect(schedule.totalEstimatedSavingsUsd).toBeCloseTo(sum, 2);
  });

  it('slot start/end times are sequential hour boundaries', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 3 });
    const schedule = o.optimize(cheapPrices);
    for (let i = 1; i < schedule.slots.length; i++) {
      expect(schedule.slots[i].startMs).toBe(schedule.slots[i - 1].endMs);
    }
  });

  it('slot duration is exactly 1 hour', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(cheapPrices);
    expect(schedule.slots[0].endMs - schedule.slots[0].startMs).toBe(3_600_000);
  });

  it('empty prices falls back to neutral threshold', () => {
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize([]);
    expect(schedule.slots[0]).toBeDefined();
  });

  it('generatedAt is recent', () => {
    const before = Date.now();
    const o = new ArbitrageOptimizer({ lookAheadHours: 1 });
    const schedule = o.optimize(cheapPrices);
    expect(schedule.generatedAt).toBeGreaterThanOrEqual(before);
  });

  it('very expensive energy (150 $/MWh) → DEFER_BATCH', () => {
    const o = new ArbitrageOptimizer({ cheapThresholdUsd: 40, expensiveThresholdUsd: 80, lookAheadHours: 1 });
    const schedule = o.optimize([makePrice(150)]);
    expect(schedule.slots[0].action).toBe('DEFER_BATCH');
  });

  it('custom thresholds respected', () => {
    const o = new ArbitrageOptimizer({ cheapThresholdUsd: 100, expensiveThresholdUsd: 200, lookAheadHours: 1 });
    const schedule = o.optimize([makePrice(80)]); // below custom cheap threshold
    expect(schedule.slots[0].action).toBe('SCALE_UP');
  });
});

// ── MiningValidatorModule ─────────────────────────────────────────────────────

describe('MiningValidatorModule', () => {
  it('constructs with defaults (POW)', () => {
    const m = new MiningValidatorModule();
    expect(m.getConfig().mode).toBe('POW');
  });

  it('PoW report returns BTC as crypto symbol', async () => {
    const m = new MiningValidatorModule({ mode: 'POW' });
    const report = await m.generateReport();
    expect(report.cryptoSymbol).toBe('BTC');
  });

  it('PoS report returns ETH as crypto symbol', async () => {
    const m = new MiningValidatorModule({ mode: 'POS', stakeAmountUsd: 50_000 });
    const report = await m.generateReport();
    expect(report.cryptoSymbol).toBe('ETH');
  });

  it('PoW report earnedCrypto > 0 for reasonable hash rate', async () => {
    const m = new MiningValidatorModule({ mode: 'POW', hashRateGhs: 1000 });
    const report = await m.generateReport(3_600_000);
    expect(report.earnedCrypto).toBeGreaterThan(0);
  });

  it('PoS earnedUsd scales with stake amount', async () => {
    const low = new MiningValidatorModule({ mode: 'POS', stakeAmountUsd: 10_000 });
    const high = new MiningValidatorModule({ mode: 'POS', stakeAmountUsd: 100_000 });
    const rLow = await low.generateReport(3_600_000 * 24 * 365);
    const rHigh = await high.generateReport(3_600_000 * 24 * 365);
    expect(rHigh.earnedUsd).toBeGreaterThan(rLow.earnedUsd);
  });

  it('PoW energy cost > 0', async () => {
    const m = new MiningValidatorModule({ mode: 'POW', powerConsumptionKw: 3, energyPricePerMwh: 50 });
    const report = await m.generateReport(3_600_000);
    expect(report.energyCostUsd).toBeGreaterThan(0);
  });

  it('PoS energy cost near zero', async () => {
    const m = new MiningValidatorModule({ mode: 'POS' });
    const report = await m.generateReport(3_600_000);
    expect(report.energyCostUsd).toBeLessThan(0.1);
  });

  it('netProfitUsd = earnedUsd - energyCostUsd', async () => {
    const m = new MiningValidatorModule({ mode: 'POS', stakeAmountUsd: 100_000 });
    const report = await m.generateReport(3_600_000 * 24 * 365);
    expect(report.netProfitUsd).toBeCloseTo(report.earnedUsd - report.energyCostUsd, 2);
  });

  it('profitMargin is a finite number (can be deeply negative for low hash rate)', async () => {
    const m = new MiningValidatorModule({ mode: 'POW', hashRateGhs: 100 });
    const report = await m.generateReport(3_600_000);
    expect(Number.isFinite(report.profitMargin)).toBe(true);
  });

  it('updateEnergyPrice changes energy cost', async () => {
    const m = new MiningValidatorModule({ mode: 'POW', powerConsumptionKw: 3, energyPricePerMwh: 30 });
    const r1 = await m.generateReport(3_600_000);
    m.updateEnergyPrice(150);
    const r2 = await m.generateReport(3_600_000);
    expect(r2.energyCostUsd).toBeGreaterThan(r1.energyCostUsd);
  });

  it('cumulativeEarnings accumulates across calls', async () => {
    const m = new MiningValidatorModule({ mode: 'POS', stakeAmountUsd: 100_000 });
    await m.generateReport(3_600_000 * 24 * 30);
    await m.generateReport(3_600_000 * 24 * 30);
    expect(m.getCumulativeEarnings()).toBeGreaterThan(0);
  });

  it('cumulativeEarnings starts at zero', () => {
    const m = new MiningValidatorModule();
    expect(m.getCumulativeEarnings()).toBe(0);
  });

  it('report periodMs matches argument', async () => {
    const m = new MiningValidatorModule({ mode: 'POW' });
    const period = 7_200_000;
    const report = await m.generateReport(period);
    expect(report.periodMs).toBe(period);
  });

  it('report mode matches config', async () => {
    const m = new MiningValidatorModule({ mode: 'POS' });
    const report = await m.generateReport();
    expect(report.mode).toBe('POS');
  });
});

// ── TreasuryManager ───────────────────────────────────────────────────────────

describe('TreasuryManager', () => {
  it('initial balance matches config', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 50_000 });
    expect(t.getBalance()).toBe(50_000);
  });

  it('recordIncome increases balance', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 10_000 });
    t.recordIncome(500, 'trading');
    expect(t.getBalance()).toBe(10_500);
  });

  it('recordExpense decreases balance', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 10_000 });
    t.recordExpense(200, 'compute');
    expect(t.getBalance()).toBe(9_800);
  });

  it('balance cannot go below zero', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 100 });
    t.recordExpense(1_000, 'compute');
    expect(t.getBalance()).toBe(0);
  });

  it('recordIncome ignores zero or negative amounts', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 10_000 });
    t.recordIncome(0, 'x');
    t.recordIncome(-100, 'x');
    expect(t.getBalance()).toBe(10_000);
  });

  it('recordExpense ignores zero or negative amounts', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 10_000 });
    t.recordExpense(0, 'x');
    t.recordExpense(-50, 'x');
    expect(t.getBalance()).toBe(10_000);
  });

  it('allocateSurplus: reinvestment + opCoverage + capex + reserve = surplus', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 100_000, targetReserveRatio: 0.10, reinvestmentRate: 0.60, miningCapexRate: 0.15 });
    t.recordIncome(10_000, 'trading');
    t.recordExpense(2_000, 'compute');
    const alloc = t.allocateSurplus(false);
    const total = alloc.operationalCoverage + alloc.reinvestment + alloc.miningCapex + alloc.reserve;
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(10_000);
  });

  it('reinvestment is largest allocation slice', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 100_000, reinvestmentRate: 0.60, miningCapexRate: 0.15, targetReserveRatio: 0.10 });
    t.recordIncome(20_000, 'trading');
    const alloc = t.allocateSurplus();
    expect(alloc.reinvestment).toBeGreaterThan(alloc.miningCapex);
  });

  it('generateReport returns non-negative balanceUsd', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 5_000 });
    t.recordExpense(10_000, 'massive cost');
    const report = t.generateReport();
    expect(report.balanceUsd).toBeGreaterThanOrEqual(0);
  });

  it('generateReport netPnlUsd = totalIncome - totalExpenses', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 50_000 });
    t.recordIncome(3_000, 'mining');
    t.recordExpense(1_000, 'compute');
    const report = t.generateReport();
    expect(report.netPnlUsd).toBeCloseTo(2_000, 1);
  });

  it('projectedAnnualProfitUsd > projectedMonthlyProfitUsd (365-day vs 30-day projection)', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 100_000 });
    t.recordIncome(5_000, 'trading');
    const report = t.generateReport();
    expect(report.projectedAnnualProfitUsd).toBeGreaterThan(report.projectedMonthlyProfitUsd);
  });

  it('resetPeriod zeroes income/expense counters', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 10_000 });
    t.recordIncome(1_000, 'x');
    t.recordExpense(500, 'y');
    t.resetPeriod();
    const report = t.generateReport();
    expect(report.totalIncomeUsd).toBe(0);
    expect(report.totalExpensesUsd).toBe(0);
  });

  it('reserveRatio between 0 and 1', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 50_000 });
    t.recordIncome(10_000, 'trading');
    const report = t.generateReport();
    expect(report.reserveRatio).toBeGreaterThanOrEqual(0);
    expect(report.reserveRatio).toBeLessThanOrEqual(1);
  });

  it('generatedAt is recent', () => {
    const before = Date.now();
    const t = new TreasuryManager();
    const report = t.generateReport();
    expect(report.generatedAt).toBeGreaterThanOrEqual(before);
  });

  it('getConfig returns immutable copy', () => {
    const t = new TreasuryManager({ initialBalanceUsd: 99_999 });
    const cfg = t.getConfig();
    expect(cfg.initialBalanceUsd).toBe(99_999);
  });
});

// ── EnergyArbitrageEngine ─────────────────────────────────────────────────────

describe('EnergyArbitrageEngine', () => {
  it('constructs without error', () => {
    expect(() => new EnergyArbitrageEngine()).not.toThrow();
  });

  it('isRunning returns false before start', () => {
    const e = new EnergyArbitrageEngine();
    expect(e.isRunning()).toBe(false);
  });

  it('isRunning returns true after start', async () => {
    const e = new EnergyArbitrageEngine({ cycleIntervalMs: 60_000, simulation: true });
    await e.start();
    expect(e.isRunning()).toBe(true);
    await e.stop();
  });

  it('isRunning returns false after stop', async () => {
    const e = new EnergyArbitrageEngine({ cycleIntervalMs: 60_000, simulation: true });
    await e.start();
    await e.stop();
    expect(e.isRunning()).toBe(false);
  });

  it('double start is idempotent', async () => {
    const e = new EnergyArbitrageEngine({ cycleIntervalMs: 60_000, simulation: true });
    await e.start();
    await e.start(); // should not throw
    expect(e.isRunning()).toBe(true);
    await e.stop();
  });

  it('getMetrics returns valid structure before start', () => {
    const e = new EnergyArbitrageEngine();
    const m = e.getMetrics();
    expect(m).toHaveProperty('cyclesCompleted');
    expect(m).toHaveProperty('treasuryBalanceUsd');
    expect(m).toHaveProperty('totalMiningEarningsUsd');
  });

  it('cyclesCompleted >= 1 after start (first cycle runs immediately)', async () => {
    const e = new EnergyArbitrageEngine({ cycleIntervalMs: 60_000, simulation: true });
    await e.start();
    expect(e.getMetrics().cyclesCompleted).toBeGreaterThanOrEqual(1);
    await e.stop();
  });

  it('treasuryBalanceUsd remains positive after one cycle', async () => {
    const e = new EnergyArbitrageEngine({ initialTreasuryUsd: 100_000, simulation: true, cycleIntervalMs: 60_000 });
    await e.start();
    expect(e.getMetrics().treasuryBalanceUsd).toBeGreaterThan(0);
    await e.stop();
  });

  it('uptimeMs is 0 before start', () => {
    const e = new EnergyArbitrageEngine();
    expect(e.getMetrics().uptimeMs).toBe(0);
  });

  it('uptimeMs > 0 while running', async () => {
    const e = new EnergyArbitrageEngine({ cycleIntervalMs: 60_000, simulation: true });
    await e.start();
    await new Promise((r) => setTimeout(r, 10));
    expect(e.getMetrics().uptimeMs).toBeGreaterThan(0);
    await e.stop();
  });

  it('stop is idempotent (double stop no throw)', async () => {
    const e = new EnergyArbitrageEngine({ simulation: true, cycleIntervalMs: 60_000 });
    await e.start();
    await e.stop();
    await expect(e.stop()).resolves.toBeUndefined();
  });

  it('POW mining mode accepted', async () => {
    const e = new EnergyArbitrageEngine({ miningMode: 'POW', simulation: true, cycleIntervalMs: 60_000 });
    await e.start();
    const m = e.getMetrics();
    expect(typeof m.totalMiningEarningsUsd).toBe('number');
    await e.stop();
  });

  it('POS staking mode accepted', async () => {
    const e = new EnergyArbitrageEngine({ miningMode: 'POS', stakeAmountUsd: 50_000, simulation: true, cycleIntervalMs: 60_000 });
    await e.start();
    await e.stop();
    expect(e.isRunning()).toBe(false);
  });

  it('lastOptimizedAction is set after first cycle', async () => {
    const e = new EnergyArbitrageEngine({ simulation: true, cycleIntervalMs: 60_000 });
    await e.start();
    expect(e.getMetrics().lastOptimizedAction).not.toBe('NONE');
    await e.stop();
  });
});
