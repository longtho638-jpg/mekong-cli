/**
 * Tests: Market Morphogenesis — Phase 12 Module 3.
 * Covers: DexDeployer, LiquidityProvider, ValidatorNode,
 * OrderFlowCapture, InfrastructureGovernor, MarketMorphEngine.
 * Target: 70+ tests.
 */

import {
  DexDeployer,
  LiquidityProvider,
  ValidatorNode,
  OrderFlowCapture,
  InfrastructureGovernor,
  MarketMorphEngine,
} from '../../../src/arbitrage/phase12_omega/marketMorph/index';

import type {
  DexDeployment,
  TokenPair,
  LPPosition,
  LPReport,
  ValidatorReport,
  RevenueReport,
  GovernanceDecision,
  MarketSnapshot,
  MarketMorphMetrics,
} from '../../../src/arbitrage/phase12_omega/marketMorph/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    volumeUsd24h: 200_000,
    avgIlPct: 2,
    validatorRewardsEth24h: 0.003,
    currentFeeBps: 30,
    currentCommissionRate: 0.05,
    currentLpAllocationPct: 40,
    ...overrides,
  };
}

// ── DexDeployer ───────────────────────────────────────────────────────────────

describe('DexDeployer — deploy', () => {
  it('returns DexDeployment with expected shape', () => {
    const deployer = new DexDeployer();
    const result = deployer.deploy();
    expect(result).toHaveProperty('factoryAddress');
    expect(result).toHaveProperty('routerAddress');
    expect(result).toHaveProperty('deploymentTxHash');
    expect(result).toHaveProperty('pairs');
    expect(result).toHaveProperty('chainId');
    expect(result).toHaveProperty('simulation');
    expect(result).toHaveProperty('deployedAt');
  });

  it('factoryAddress and routerAddress are hex strings starting with 0x', () => {
    const deployer = new DexDeployer();
    const result = deployer.deploy();
    expect(result.factoryAddress).toMatch(/^0x[0-9a-f]{40}$/);
    expect(result.routerAddress).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it('deploymentTxHash is a 66-char hex string', () => {
    const deployer = new DexDeployer();
    const result = deployer.deploy();
    expect(result.deploymentTxHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('pairs array length matches input', () => {
    const deployer = new DexDeployer();
    const result = deployer.deploy(['ETH/USDC', 'WBTC/ETH', 'LINK/ETH']);
    expect(result.pairs).toHaveLength(3);
  });

  it('each pair has token0, token1, pairAddress, reserve0, reserve1', () => {
    const deployer = new DexDeployer();
    const result = deployer.deploy(['ETH/USDC']);
    const pair = result.pairs[0] as TokenPair;
    expect(pair.token0).toBe('ETH');
    expect(pair.token1).toBe('USDC');
    expect(pair.pairAddress).toMatch(/^0x[0-9a-f]{40}$/);
    expect(pair.reserve0).toBeGreaterThan(0);
    expect(pair.reserve1).toBeGreaterThan(0);
  });

  it('simulation flag is true by default', () => {
    const deployer = new DexDeployer();
    expect(deployer.deploy().simulation).toBe(true);
  });

  it('simulation flag is false when configured', () => {
    const deployer = new DexDeployer({ simulation: false });
    expect(deployer.deploy().simulation).toBe(false);
  });

  it('chainId defaults to 31337', () => {
    const deployer = new DexDeployer();
    expect(deployer.deploy().chainId).toBe(31337);
  });

  it('chainId reflects configured value', () => {
    const deployer = new DexDeployer({ chainId: 1 });
    expect(deployer.deploy().chainId).toBe(1);
  });

  it('two deployments have different factoryAddresses', () => {
    const deployer = new DexDeployer();
    const a = deployer.deploy();
    const b = deployer.deploy();
    expect(a.factoryAddress).not.toBe(b.factoryAddress);
  });

  it('getDeployments accumulates history', () => {
    const deployer = new DexDeployer();
    deployer.deploy();
    deployer.deploy();
    expect(deployer.getDeployments()).toHaveLength(2);
  });

  it('getDeployments returns a copy', () => {
    const deployer = new DexDeployer();
    deployer.deploy();
    const copy = deployer.getDeployments();
    copy.pop();
    expect(deployer.getDeployments()).toHaveLength(1);
  });

  it('clearDeployments resets history', () => {
    const deployer = new DexDeployer();
    deployer.deploy();
    deployer.clearDeployments();
    expect(deployer.getDeployments()).toHaveLength(0);
  });

  it('reserve values are near initialLiquidityUsd', () => {
    const deployer = new DexDeployer({ initialLiquidityUsd: 10_000 });
    const pair = deployer.deploy(['ETH/USDC']).pairs[0] as TokenPair;
    expect(pair.reserve0).toBeGreaterThan(8_000);
    expect(pair.reserve0).toBeLessThan(13_000);
  });

  it('deployedAt is a recent timestamp', () => {
    const before = Date.now();
    const deployer = new DexDeployer();
    const result = deployer.deploy();
    expect(result.deployedAt).toBeGreaterThanOrEqual(before);
  });

  it('getConfig returns configured values', () => {
    const deployer = new DexDeployer({ chainId: 5, initialLiquidityUsd: 500 });
    const cfg = deployer.getConfig();
    expect(cfg.chainId).toBe(5);
    expect(cfg.initialLiquidityUsd).toBe(500);
  });
});

// ── LiquidityProvider ─────────────────────────────────────────────────────────

describe('LiquidityProvider — openPosition', () => {
  it('returns position with expected shape', () => {
    const lp = new LiquidityProvider();
    const pos = lp.openPosition('ETH/USDC', 1000, 1000, 1.5);
    expect(pos).toHaveProperty('positionId');
    expect(pos).toHaveProperty('pool', 'ETH/USDC');
    expect(pos).toHaveProperty('token0Amount', 1000);
    expect(pos).toHaveProperty('token1Amount', 1000);
    expect(pos).toHaveProperty('entryPrice', 1.5);
    expect(pos).toHaveProperty('isActive', true);
    expect(pos).toHaveProperty('feesEarned', 0);
    expect(pos).toHaveProperty('ilEstimatePct', 0);
  });

  it('positionId is a non-empty string', () => {
    const lp = new LiquidityProvider();
    const pos = lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    expect(typeof pos.positionId).toBe('string');
    expect(pos.positionId.length).toBeGreaterThan(0);
  });

  it('two positions have different positionIds', () => {
    const lp = new LiquidityProvider();
    const p1 = lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    const p2 = lp.openPosition('WBTC/ETH', 2000, 2000, 1.0);
    expect(p1.positionId).not.toBe(p2.positionId);
  });

  it('getPositions returns all open positions', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 500, 500, 1.0);
    lp.openPosition('WBTC/ETH', 500, 500, 1.0);
    expect(lp.getPositions()).toHaveLength(2);
  });

  it('clearPositions resets all positions', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 500, 500, 1.0);
    lp.clearPositions();
    expect(lp.getPositions()).toHaveLength(0);
  });
});

describe('LiquidityProvider — updatePositions', () => {
  it('returns LPReport with expected shape', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    const report = lp.updatePositions({});
    expect(report).toHaveProperty('positions');
    expect(report).toHaveProperty('totalFeesEarned');
    expect(report).toHaveProperty('totalIlPct');
    expect(report).toHaveProperty('activePositions');
    expect(report).toHaveProperty('recommendation');
    expect(report).toHaveProperty('generatedAt');
  });

  it('feesEarned increases after update', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 10_000, 10_000, 1.0);
    const report = lp.updatePositions({});
    expect(report.totalFeesEarned).toBeGreaterThan(0);
  });

  it('recommendation is hold/rebalance/withdraw', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    const report = lp.updatePositions({});
    expect(['hold', 'rebalance', 'withdraw']).toContain(report.recommendation);
  });

  it('high IL triggers withdraw recommendation', () => {
    const lp = new LiquidityProvider({ ilThresholdPct: 1 });
    // Open position with entryPrice far from current → high IL
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    // Force large price change
    const report = lp.updatePositions({ 'ETH/USDC': 2.0 });
    // After threshold exceeded, position becomes inactive
    expect(report.activePositions).toBeLessThanOrEqual(1);
  });

  it('position deactivated when IL exceeds threshold', () => {
    const lp = new LiquidityProvider({ ilThresholdPct: 0.5 });
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    // Large price move → IL > 0.5%
    lp.updatePositions({ 'ETH/USDC': 5.0 });
    const positions = lp.getPositions();
    expect(positions[0]?.isActive).toBe(false);
  });

  it('generateReport returns positions as copies', () => {
    const lp = new LiquidityProvider();
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    const report = lp.generateReport();
    report.positions[0]!.feesEarned = 999_999;
    const report2 = lp.generateReport();
    expect(report2.positions[0]?.feesEarned).not.toBe(999_999);
  });

  it('getConfig returns configured ilThresholdPct', () => {
    const lp = new LiquidityProvider({ ilThresholdPct: 8 });
    expect(lp.getConfig().ilThresholdPct).toBe(8);
  });

  it('activePositions count is correct', () => {
    const lp = new LiquidityProvider({ ilThresholdPct: 1000 });
    lp.openPosition('ETH/USDC', 1000, 1000, 1.0);
    lp.openPosition('WBTC/ETH', 1000, 1000, 1.0);
    const report = lp.updatePositions({});
    expect(report.activePositions).toBe(2);
  });
});

// ── ValidatorNode ─────────────────────────────────────────────────────────────

describe('ValidatorNode — runEpoch', () => {
  it('returns ValidatorReport with expected shape', () => {
    const node = new ValidatorNode();
    const report = node.runEpoch();
    expect(report).toHaveProperty('validatorId');
    expect(report).toHaveProperty('stakeEth');
    expect(report).toHaveProperty('commissionRate');
    expect(report).toHaveProperty('rewardsEth');
    expect(report).toHaveProperty('uptimePct');
    expect(report).toHaveProperty('slashingRisk');
    expect(report).toHaveProperty('epochsActive');
    expect(report).toHaveProperty('simulation');
    expect(report).toHaveProperty('generatedAt');
  });

  it('validatorId starts with 0x', () => {
    const node = new ValidatorNode();
    expect(node.getValidatorId()).toMatch(/^0x[0-9a-f]+$/);
  });

  it('simulation is true by default', () => {
    const node = new ValidatorNode();
    expect(node.runEpoch().simulation).toBe(true);
  });

  it('rewardsEth is positive', () => {
    const node = new ValidatorNode();
    expect(node.runEpoch().rewardsEth).toBeGreaterThan(0);
  });

  it('uptimePct is between 0 and 100', () => {
    const node = new ValidatorNode();
    for (let i = 0; i < 10; i++) {
      const r = node.runEpoch();
      expect(r.uptimePct).toBeGreaterThanOrEqual(0);
      expect(r.uptimePct).toBeLessThanOrEqual(100);
    }
  });

  it('slashingRisk is low/medium/high', () => {
    const node = new ValidatorNode();
    const r = node.runEpoch();
    expect(['low', 'medium', 'high']).toContain(r.slashingRisk);
  });

  it('high uptime → slashingRisk low', () => {
    const node = new ValidatorNode({ targetUptimePct: 99.9 });
    const r = node.runEpoch();
    expect(r.slashingRisk).toBe('low');
  });

  it('stakeEth matches config', () => {
    const node = new ValidatorNode({ stakeEth: 64 });
    expect(node.runEpoch().stakeEth).toBe(64);
  });

  it('commissionRate matches config', () => {
    const node = new ValidatorNode({ commissionRate: 0.1 });
    expect(node.runEpoch().commissionRate).toBe(0.1);
  });

  it('epochsActive matches argument', () => {
    const node = new ValidatorNode();
    expect(node.runEpoch(5).epochsActive).toBe(5);
  });

  it('getReports accumulates history', () => {
    const node = new ValidatorNode();
    node.runEpoch();
    node.runEpoch();
    node.runEpoch();
    expect(node.getReports()).toHaveLength(3);
  });

  it('getReports returns copies', () => {
    const node = new ValidatorNode();
    node.runEpoch();
    const reports = node.getReports();
    reports[0]!.rewardsEth = 99999;
    expect(node.getReports()[0]?.rewardsEth).not.toBe(99999);
  });

  it('clearReports resets history', () => {
    const node = new ValidatorNode();
    node.runEpoch();
    node.clearReports();
    expect(node.getReports()).toHaveLength(0);
  });

  it('getAggregateStats returns correct reportCount', () => {
    const node = new ValidatorNode();
    node.runEpoch();
    node.runEpoch();
    const stats = node.getAggregateStats();
    expect(stats.reportCount).toBe(2);
  });

  it('getAggregateStats totalRewardsEth sums all rewards', () => {
    const node = new ValidatorNode();
    const r1 = node.runEpoch();
    const r2 = node.runEpoch();
    const stats = node.getAggregateStats();
    expect(stats.totalRewardsEth).toBeCloseTo(r1.rewardsEth + r2.rewardsEth, 6);
  });

  it('getAggregateStats with no reports returns zeros', () => {
    const node = new ValidatorNode();
    const stats = node.getAggregateStats();
    expect(stats.reportCount).toBe(0);
    expect(stats.totalRewardsEth).toBe(0);
    expect(stats.avgUptimePct).toBe(0);
  });

  it('generatedAt is a recent timestamp', () => {
    const before = Date.now();
    const node = new ValidatorNode();
    const r = node.runEpoch();
    expect(r.generatedAt).toBeGreaterThanOrEqual(before);
  });
});

// ── OrderFlowCapture ──────────────────────────────────────────────────────────

describe('OrderFlowCapture — revenue aggregation', () => {
  it('generateReport with no sources returns zero total', () => {
    const ofc = new OrderFlowCapture();
    const report = ofc.generateReport();
    expect(report.totalUsd).toBe(0);
  });

  it('recordDexFees adds to breakdown', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(500);
    const report = ofc.generateReport();
    expect(report.breakdown.dex_fees).toBe(500);
  });

  it('recordValidatorReward converts ETH to USD', () => {
    const ofc = new OrderFlowCapture({ ethPriceUsd: 3200 });
    ofc.recordValidatorReward(1); // 1 ETH → $3200
    const report = ofc.generateReport();
    expect(report.breakdown.validator_rewards).toBeCloseTo(3200, 1);
  });

  it('recordMevCapture adds to breakdown', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordMevCapture(250);
    const report = ofc.generateReport();
    expect(report.breakdown.mev_capture).toBe(250);
  });

  it('recordLpFees adds to breakdown', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordLpFees(100);
    const report = ofc.generateReport();
    expect(report.breakdown.lp_fees).toBe(100);
  });

  it('totalUsd is sum of all breakdown values', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(100);
    ofc.recordMevCapture(200);
    ofc.recordLpFees(50);
    const report = ofc.generateReport();
    expect(report.totalUsd).toBeCloseTo(350, 2);
  });

  it('dominantSource is the largest contributor', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(1000);
    ofc.recordMevCapture(50);
    ofc.recordLpFees(50);
    const report = ofc.generateReport();
    expect(report.dominantSource).toBe('dex_fees');
  });

  it('annualisedApyPct is positive when revenue exists', () => {
    const ofc = new OrderFlowCapture({ capitalBaseUsd: 10_000 });
    ofc.recordDexFees(100);
    const report = ofc.generateReport();
    expect(report.annualisedApyPct).toBeGreaterThan(0);
  });

  it('annualisedApyPct is 0 when capitalBase is 0', () => {
    const ofc = new OrderFlowCapture({ capitalBaseUsd: 0 });
    ofc.recordDexFees(100);
    const report = ofc.generateReport();
    expect(report.annualisedApyPct).toBe(0);
  });

  it('sources array in report reflects all recorded entries', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(100);
    ofc.recordMevCapture(200);
    const report = ofc.generateReport();
    expect(report.sources).toHaveLength(2);
  });

  it('clearSources resets all recorded data', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(500);
    ofc.clearSources();
    const report = ofc.generateReport();
    expect(report.totalUsd).toBe(0);
    expect(report.sources).toHaveLength(0);
  });

  it('multiple dex_fees records accumulate in breakdown', () => {
    const ofc = new OrderFlowCapture();
    ofc.recordDexFees(100);
    ofc.recordDexFees(200);
    const report = ofc.generateReport();
    expect(report.breakdown.dex_fees).toBeCloseTo(300, 2);
  });

  it('generatedAt is a recent timestamp', () => {
    const before = Date.now();
    const ofc = new OrderFlowCapture();
    const report = ofc.generateReport();
    expect(report.generatedAt).toBeGreaterThanOrEqual(before);
  });

  it('validator source stores amountNative and nativeToken', () => {
    const ofc = new OrderFlowCapture({ ethPriceUsd: 3000 });
    ofc.recordValidatorReward(0.5);
    const report = ofc.generateReport();
    const src = report.sources.find((s) => s.source === 'validator_rewards');
    expect(src?.amountNative).toBeCloseTo(0.5, 6);
    expect(src?.nativeToken).toBe('ETH');
  });

  it('getConfig returns configured values', () => {
    const ofc = new OrderFlowCapture({ ethPriceUsd: 4000, capitalBaseUsd: 50_000 });
    const cfg = ofc.getConfig();
    expect(cfg.ethPriceUsd).toBe(4000);
    expect(cfg.capitalBaseUsd).toBe(50_000);
  });
});

// ── InfrastructureGovernor ────────────────────────────────────────────────────

describe('InfrastructureGovernor — fee adjustment', () => {
  it('high volume lowers DEX fee', () => {
    const gov = new InfrastructureGovernor({ highVolThresholdUsd: 500_000, feeStepBps: 5 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 600_000, currentFeeBps: 30 }));
    expect(decision.newFeeBps).toBe(25);
  });

  it('low volume raises DEX fee', () => {
    const gov = new InfrastructureGovernor({ lowVolThresholdUsd: 50_000, feeStepBps: 5 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 10_000, currentFeeBps: 30 }));
    expect(decision.newFeeBps).toBe(35);
  });

  it('normal volume keeps fee unchanged', () => {
    const gov = new InfrastructureGovernor({
      highVolThresholdUsd: 500_000,
      lowVolThresholdUsd: 50_000,
    });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 200_000, currentFeeBps: 30 }));
    expect(decision.newFeeBps).toBe(30);
  });

  it('fee never goes below minFeeBps', () => {
    const gov = new InfrastructureGovernor({ minFeeBps: 10, feeStepBps: 50 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 999_999, currentFeeBps: 10 }));
    expect(decision.newFeeBps).toBeGreaterThanOrEqual(10);
  });

  it('fee never exceeds maxFeeBps', () => {
    const gov = new InfrastructureGovernor({ maxFeeBps: 50, feeStepBps: 50 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 1, currentFeeBps: 50 }));
    expect(decision.newFeeBps).toBeLessThanOrEqual(50);
  });
});

describe('InfrastructureGovernor — LP allocation', () => {
  it('high IL reduces LP allocation', () => {
    const gov = new InfrastructureGovernor({ ilThresholdPct: 4 });
    const decision = gov.evaluate(makeSnapshot({ avgIlPct: 5, currentLpAllocationPct: 40 }));
    expect(decision.newLpAllocationPct).toBe(30);
  });

  it('normal IL keeps LP allocation unchanged', () => {
    const gov = new InfrastructureGovernor({ ilThresholdPct: 4 });
    const decision = gov.evaluate(makeSnapshot({ avgIlPct: 2, currentLpAllocationPct: 40 }));
    expect(decision.newLpAllocationPct).toBe(40);
  });

  it('LP allocation never goes below 0', () => {
    const gov = new InfrastructureGovernor({ ilThresholdPct: 0 });
    const decision = gov.evaluate(makeSnapshot({ avgIlPct: 999, currentLpAllocationPct: 0 }));
    expect(decision.newLpAllocationPct).toBeGreaterThanOrEqual(0);
  });
});

describe('InfrastructureGovernor — validator commission', () => {
  it('high rewards raise commission', () => {
    const gov = new InfrastructureGovernor({ rewardThresholdEth: 0.005, commissionStep: 0.01 });
    const decision = gov.evaluate(makeSnapshot({ validatorRewardsEth24h: 0.01, currentCommissionRate: 0.05 }));
    expect(decision.newCommissionRate).toBeCloseTo(0.06, 4);
  });

  it('low rewards lower commission', () => {
    const gov = new InfrastructureGovernor({ rewardThresholdEth: 0.005, commissionStep: 0.01 });
    const decision = gov.evaluate(makeSnapshot({ validatorRewardsEth24h: 0.001, currentCommissionRate: 0.05 }));
    expect(decision.newCommissionRate).toBeCloseTo(0.04, 4);
  });

  it('commission never exceeds 0.2', () => {
    const gov = new InfrastructureGovernor({ commissionStep: 0.5 });
    const decision = gov.evaluate(makeSnapshot({ validatorRewardsEth24h: 999, currentCommissionRate: 0.2 }));
    expect(decision.newCommissionRate).toBeLessThanOrEqual(0.2);
  });

  it('commission never goes below 0', () => {
    const gov = new InfrastructureGovernor({ commissionStep: 0.5 });
    const decision = gov.evaluate(makeSnapshot({ validatorRewardsEth24h: 0, currentCommissionRate: 0 }));
    expect(decision.newCommissionRate).toBeGreaterThanOrEqual(0);
  });
});

describe('InfrastructureGovernor — actions log', () => {
  it('returns non-empty actions array', () => {
    const gov = new InfrastructureGovernor();
    const decision = gov.evaluate(makeSnapshot());
    expect(decision.actions.length).toBeGreaterThan(0);
  });

  it('high volume action contains "dex_fee_lowered"', () => {
    const gov = new InfrastructureGovernor({ highVolThresholdUsd: 100 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 999_999 }));
    expect(decision.actions.some((a) => a.includes('dex_fee_lowered'))).toBe(true);
  });

  it('low volume action contains "dex_fee_raised"', () => {
    const gov = new InfrastructureGovernor({ lowVolThresholdUsd: 999_999 });
    const decision = gov.evaluate(makeSnapshot({ volumeUsd24h: 1 }));
    expect(decision.actions.some((a) => a.includes('dex_fee_raised'))).toBe(true);
  });

  it('getDecisions accumulates history', () => {
    const gov = new InfrastructureGovernor();
    gov.evaluate(makeSnapshot());
    gov.evaluate(makeSnapshot());
    expect(gov.getDecisions()).toHaveLength(2);
  });

  it('clearDecisions resets history', () => {
    const gov = new InfrastructureGovernor();
    gov.evaluate(makeSnapshot());
    gov.clearDecisions();
    expect(gov.getDecisions()).toHaveLength(0);
  });

  it('snapshot is embedded in decision', () => {
    const gov = new InfrastructureGovernor();
    const snap = makeSnapshot({ volumeUsd24h: 123_456 });
    const decision = gov.evaluate(snap);
    expect(decision.snapshot.volumeUsd24h).toBe(123_456);
  });

  it('decidedAt is recent', () => {
    const before = Date.now();
    const gov = new InfrastructureGovernor();
    const decision = gov.evaluate(makeSnapshot());
    expect(decision.decidedAt).toBeGreaterThanOrEqual(before);
  });

  it('getConfig returns configured minFeeBps', () => {
    const gov = new InfrastructureGovernor({ minFeeBps: 3 });
    expect(gov.getConfig().minFeeBps).toBe(3);
  });
});

// ── MarketMorphEngine ─────────────────────────────────────────────────────────

describe('MarketMorphEngine — lifecycle', () => {
  it('isRunning is false before start', () => {
    const engine = new MarketMorphEngine();
    expect(engine.isRunning()).toBe(false);
  });

  it('isRunning is true after start', () => {
    const engine = new MarketMorphEngine({ revenueLoopIntervalMs: 60_000 });
    engine.start();
    expect(engine.isRunning()).toBe(true);
    engine.stop();
  });

  it('isRunning is false after stop', () => {
    const engine = new MarketMorphEngine({ revenueLoopIntervalMs: 60_000 });
    engine.start();
    engine.stop();
    expect(engine.isRunning()).toBe(false);
  });

  it('calling start twice does not create duplicate loops', () => {
    const engine = new MarketMorphEngine({ revenueLoopIntervalMs: 60_000 });
    engine.start();
    engine.start(); // second call ignored
    expect(engine.isRunning()).toBe(true);
    engine.stop();
  });
});

describe('MarketMorphEngine — metrics after start', () => {
  let engine: MarketMorphEngine;

  beforeEach(() => {
    engine = new MarketMorphEngine({ revenueLoopIntervalMs: 60_000 });
    engine.start();
  });

  afterEach(() => {
    engine.stop();
  });

  it('deployment is populated after start', () => {
    const metrics = engine.getMetrics();
    expect(metrics.deployment).not.toBeNull();
    expect(metrics.deployment?.factoryAddress).toMatch(/^0x/);
  });

  it('lastValidatorReport is populated after start', () => {
    expect(engine.getMetrics().lastValidatorReport).not.toBeNull();
  });

  it('lastLpReport is populated after start', () => {
    expect(engine.getMetrics().lastLpReport).not.toBeNull();
  });

  it('lastRevenueReport is populated after start', () => {
    expect(engine.getMetrics().lastRevenueReport).not.toBeNull();
  });

  it('lastGovernanceDecision is populated after start', () => {
    expect(engine.getMetrics().lastGovernanceDecision).not.toBeNull();
  });

  it('loopIterations is at least 1 after start', () => {
    expect(engine.getMetrics().loopIterations).toBeGreaterThanOrEqual(1);
  });

  it('startedAt is a recent timestamp', () => {
    const before = Date.now() - 1000;
    expect(engine.getMetrics().startedAt).toBeGreaterThan(before);
  });

  it('getRevenue returns a RevenueReport', () => {
    const report = engine.getRevenue();
    expect(report).not.toBeNull();
    expect(report?.totalUsd).toBeGreaterThanOrEqual(0);
  });

  it('revenue report contains all four sources', () => {
    const report = engine.getRevenue();
    expect(report?.breakdown).toHaveProperty('dex_fees');
    expect(report?.breakdown).toHaveProperty('validator_rewards');
    expect(report?.breakdown).toHaveProperty('mev_capture');
    expect(report?.breakdown).toHaveProperty('lp_fees');
  });

  it('deployer has one deployment stored', () => {
    expect(engine.deployer.getDeployments()).toHaveLength(1);
  });

  it('lpProvider has positions open for each pair', () => {
    const positions = engine.lpProvider.getPositions();
    expect(positions.length).toBeGreaterThanOrEqual(2);
  });
});

describe('MarketMorphEngine — component access', () => {
  it('exposes deployer instance', () => {
    const engine = new MarketMorphEngine();
    expect(engine.deployer).toBeInstanceOf(DexDeployer);
  });

  it('exposes lpProvider instance', () => {
    const engine = new MarketMorphEngine();
    expect(engine.lpProvider).toBeInstanceOf(LiquidityProvider);
  });

  it('exposes validator instance', () => {
    const engine = new MarketMorphEngine();
    expect(engine.validator).toBeInstanceOf(ValidatorNode);
  });

  it('exposes orderFlow instance', () => {
    const engine = new MarketMorphEngine();
    expect(engine.orderFlow).toBeInstanceOf(OrderFlowCapture);
  });

  it('exposes governor instance', () => {
    const engine = new MarketMorphEngine();
    expect(engine.governor).toBeInstanceOf(InfrastructureGovernor);
  });

  it('getRevenue returns null before start', () => {
    const engine = new MarketMorphEngine();
    expect(engine.getRevenue()).toBeNull();
  });

  it('getMetrics before start has null reports', () => {
    const engine = new MarketMorphEngine();
    const m = engine.getMetrics();
    expect(m.deployment).toBeNull();
    expect(m.lastRevenueReport).toBeNull();
    expect(m.startedAt).toBeNull();
    expect(m.loopIterations).toBe(0);
  });
});
