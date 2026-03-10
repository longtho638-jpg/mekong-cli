import { ProposalExecutor } from '../../../src/expansion/dao-governance/proposal-executor';
import type { ProposalAction } from '../../../src/expansion/expansion-config-types';

const makeAction = (): ProposalAction => ({
  id: 'act-1',
  type: 'param-update',
  params: { key: 'value' },
  passed: false,
});

describe('ProposalExecutor', () => {
  const config = { quorumPercent: 10, totalVotingPower: 100 };

  it('submit registers a pending proposal', () => {
    const exec = new ProposalExecutor(config);
    const p = exec.submit({ id: 'p1', title: 'Test', action: makeAction(), votesFor: 0, votesAgainst: 0 });
    expect(p.status).toBe('pending');
    expect(exec.getProposal('p1')).toBeDefined();
  });

  it('finalizeVote marks as passed when quorum met and majority for', () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 60, votesAgainst: 10 });
    const result = exec.finalizeVote('p1');
    expect(result.status).toBe('passed');
  });

  it('finalizeVote marks as rejected when votes against majority', () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 20, votesAgainst: 50 });
    const result = exec.finalizeVote('p1');
    expect(result.status).toBe('rejected');
  });

  it('finalizeVote marks as rejected when quorum not reached', () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 5, votesAgainst: 0 });
    const result = exec.finalizeVote('p1');
    // 5/100 = 5% < 10% quorum
    expect(result.status).toBe('rejected');
  });

  it('execute marks proposal as executed', async () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 60, votesAgainst: 10 });
    exec.finalizeVote('p1');
    const result = await exec.execute('p1');
    expect(result.status).toBe('executed');
    expect(result.executedAt).toBeDefined();
  });

  it('execute throws when proposal not passed', async () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 0, votesAgainst: 50 });
    exec.finalizeVote('p1');
    await expect(exec.execute('p1')).rejects.toThrow('not passed');
  });

  it('listProposals returns all proposals', () => {
    const exec = new ProposalExecutor(config);
    exec.submit({ id: 'p1', title: 'T1', action: makeAction(), votesFor: 0, votesAgainst: 0 });
    exec.submit({ id: 'p2', title: 'T2', action: makeAction(), votesFor: 0, votesAgainst: 0 });
    expect(exec.listProposals()).toHaveLength(2);
  });

  it('emits proposal-passed event', () => {
    const exec = new ProposalExecutor(config);
    const events: unknown[] = [];
    exec.on('proposal-passed', (p) => events.push(p));
    exec.submit({ id: 'p1', title: 'T', action: makeAction(), votesFor: 80, votesAgainst: 0 });
    exec.finalizeVote('p1');
    expect(events).toHaveLength(1);
  });
});
