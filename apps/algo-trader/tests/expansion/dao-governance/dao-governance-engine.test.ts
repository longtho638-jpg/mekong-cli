import { DaoGovernanceEngine } from '../../../src/expansion/dao-governance';
import type { DaoGovernanceConfig } from '../../../src/expansion/expansion-config-types';

const config: DaoGovernanceConfig = {
  enabled: true,
  tokenSymbol: 'ALGO',
  treasuryAddress: '0x0000000000000000000000000000000000000000',
  quorumPercent: 10,
};

describe('DaoGovernanceEngine', () => {
  it('start deploys token and seeds treasury', async () => {
    const engine = new DaoGovernanceEngine(config);
    await engine.start();
    const metrics = engine.getMetrics();
    expect(metrics.tokenDeployed).toBe(true);
    expect(metrics.contractAddress).toMatch(/^0x/);
    expect(metrics.treasuryBalanceUsd).toBeGreaterThan(0);
  });

  it('getMetrics returns zero voting power before any holders set', async () => {
    const engine = new DaoGovernanceEngine(config);
    await engine.start();
    expect(engine.getMetrics().totalVotingPower).toBe(0);
  });

  it('getMetrics reflects proposal count', async () => {
    const engine = new DaoGovernanceEngine(config);
    await engine.start();
    engine.getExecutor().submit({
      id: 'p1',
      title: 'Test',
      action: { id: 'a1', type: 'update', params: {}, passed: false },
      votesFor: 0,
      votesAgainst: 0,
    });
    expect(engine.getMetrics().proposalCount).toBe(1);
  });

  it('exposes sub-components via getters', async () => {
    const engine = new DaoGovernanceEngine(config);
    await engine.start();
    expect(engine.getDeployer()).toBeDefined();
    expect(engine.getTreasury()).toBeDefined();
    expect(engine.getExecutor()).toBeDefined();
    expect(engine.getTracker()).toBeDefined();
  });

  it('emits token-deployed event on start', async () => {
    const engine = new DaoGovernanceEngine(config);
    const events: unknown[] = [];
    engine.on('token-deployed', (d) => events.push(d));
    await engine.start();
    expect(events).toHaveLength(1);
  });

  it('emits started event on start', async () => {
    const engine = new DaoGovernanceEngine(config);
    const events: unknown[] = [];
    engine.on('started', (m) => events.push(m));
    await engine.start();
    expect(events).toHaveLength(1);
  });
});
