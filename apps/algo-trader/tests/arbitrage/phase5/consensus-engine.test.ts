/**
 * Tests: ConsensusEngine — weighted voting + 5% influence cap.
 */

import { ConsensusEngine, MAX_AGENT_INFLUENCE } from '../../../src/arbitrage/phase5_god_mode/daoBrain/consensus-engine';
import type { AgentProposal, AgentWeight } from '../../../src/arbitrage/phase5_god_mode/daoBrain/consensus-engine';

describe('ConsensusEngine — basic voting', () => {
  const engine = new ConsensusEngine();

  test('resolves single agent single strategy', () => {
    const proposals: AgentProposal[] = [{ strategyId: 's1', capAdjustment: 0.05, agentId: 'a1' }];
    const weights: AgentWeight[] = [{ agentId: 'a1', weight: 1 }];
    const results = engine.resolve(proposals, weights);
    expect(results).toHaveLength(1);
    expect(results[0].strategyId).toBe('s1');
    expect(results[0].finalAdjustment).toBeCloseTo(0.05, 5);
  });

  test('averages proposals from two equal-weight agents', () => {
    const proposals: AgentProposal[] = [
      { strategyId: 's1', capAdjustment: 0.10, agentId: 'a1' },
      { strategyId: 's1', capAdjustment: -0.02, agentId: 'a2' },
    ];
    const weights: AgentWeight[] = [
      { agentId: 'a1', weight: 1 },
      { agentId: 'a2', weight: 1 },
    ];
    const results = engine.resolve(proposals, weights);
    expect(results[0].finalAdjustment).toBeCloseTo(0.04, 5);
  });

  test('groups proposals by strategyId correctly', () => {
    const proposals: AgentProposal[] = [
      { strategyId: 's1', capAdjustment: 0.05, agentId: 'a1' },
      { strategyId: 's2', capAdjustment: -0.03, agentId: 'a1' },
    ];
    const weights: AgentWeight[] = [{ agentId: 'a1', weight: 1 }];
    const results = engine.resolve(proposals, weights);
    expect(results).toHaveLength(2);
    const s1 = results.find((r) => r.strategyId === 's1')!;
    const s2 = results.find((r) => r.strategyId === 's2')!;
    expect(s1.finalAdjustment).toBeCloseTo(0.05, 5);
    expect(s2.finalAdjustment).toBeCloseTo(-0.03, 5);
  });

  test('returns empty array for empty proposals', () => {
    expect(engine.resolve([], [])).toEqual([]);
  });
});

describe('ConsensusEngine — 5% influence cap', () => {
  const engine = new ConsensusEngine();

  test('MAX_AGENT_INFLUENCE constant is 0.05', () => {
    expect(MAX_AGENT_INFLUENCE).toBe(0.05);
  });

  test('dominant agent capped at 5% influence with many small agents', () => {
    // One agent with 90% raw weight, 19 tiny agents
    const proposals: AgentProposal[] = [];
    const weights: AgentWeight[] = [{ agentId: 'dominant', weight: 90 }];

    // dominant proposes +0.10; tiny agents propose -0.10
    proposals.push({ strategyId: 's1', capAdjustment: 0.10, agentId: 'dominant' });
    for (let i = 0; i < 19; i++) {
      weights.push({ agentId: `tiny${i}`, weight: 1 });
      proposals.push({ strategyId: 's1', capAdjustment: -0.10, agentId: `tiny${i}` });
    }

    const results = engine.resolve(proposals, weights);
    const adj = results[0].finalAdjustment;

    // After capping dominant at 5%, tiny agents collectively have 95% influence
    // Weighted sum ≈ 0.05 * 0.10 + 0.95 * (-0.10) = -0.09
    expect(adj).toBeLessThan(0); // tiny agents dominate
    // Each agent's weight in contributions is hard-capped at MAX_AGENT_INFLUENCE
    expect(results[0].contributions['dominant']).toBeLessThanOrEqual(MAX_AGENT_INFLUENCE + 1e-9);
  });

  test('agent with zero weight has no influence', () => {
    const proposals: AgentProposal[] = [
      { strategyId: 's1', capAdjustment: 0.10, agentId: 'active' },
      { strategyId: 's1', capAdjustment: -0.99, agentId: 'ghost' },
    ];
    const weights: AgentWeight[] = [
      { agentId: 'active', weight: 1 },
      { agentId: 'ghost', weight: 0 },
    ];
    const results = engine.resolve(proposals, weights);
    // ghost has 0 weight → no influence → result driven by active
    expect(results[0].finalAdjustment).toBeCloseTo(0.10, 4);
  });

  test('all agents capped — re-normalisation sums to 1', () => {
    // 3 equal-weight agents, each capped at 5% — after re-norm each gets ~33%
    const proposals: AgentProposal[] = [
      { strategyId: 's1', capAdjustment: 0.03, agentId: 'a' },
      { strategyId: 's1', capAdjustment: 0.03, agentId: 'b' },
      { strategyId: 's1', capAdjustment: 0.03, agentId: 'c' },
    ];
    const weights: AgentWeight[] = [
      { agentId: 'a', weight: 1 },
      { agentId: 'b', weight: 1 },
      { agentId: 'c', weight: 1 },
    ];
    const results = engine.resolve(proposals, weights);
    expect(results[0].finalAdjustment).toBeCloseTo(0.03, 4);
  });
});
