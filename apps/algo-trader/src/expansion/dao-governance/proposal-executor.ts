/**
 * Listens for passed governance proposals and executes their actions.
 * All execution is simulated — no real smart contract calls.
 */

import { EventEmitter } from 'events';
import type { ProposalAction } from '../expansion-config-types';

export type ProposalStatus = 'pending' | 'passed' | 'rejected' | 'executed' | 'failed';

export interface Proposal {
  id: string;
  title: string;
  action: ProposalAction;
  votesFor: number;
  votesAgainst: number;
  status: ProposalStatus;
  createdAt: number;
  executedAt?: number;
}

export interface ProposalExecutorConfig {
  quorumPercent: number;
  totalVotingPower: number;
}

export class ProposalExecutor extends EventEmitter {
  private readonly proposals: Map<string, Proposal> = new Map();
  private readonly config: ProposalExecutorConfig;

  constructor(config: ProposalExecutorConfig) {
    super();
    this.config = config;
  }

  /** Register a new proposal. */
  submit(proposal: Omit<Proposal, 'status' | 'createdAt'>): Proposal {
    const full: Proposal = {
      ...proposal,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.proposals.set(full.id, full);
    this.emit('proposal-submitted', full);
    return full;
  }

  /** Finalize vote tally and mark as passed or rejected. */
  finalizeVote(proposalId: string): Proposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (proposal.status !== 'pending') throw new Error(`Proposal ${proposalId} already finalized`);

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const quorumReached =
      totalVotes >= (this.config.quorumPercent / 100) * this.config.totalVotingPower;
    const passed = quorumReached && proposal.votesFor > proposal.votesAgainst;

    proposal.status = passed ? 'passed' : 'rejected';
    this.emit(passed ? 'proposal-passed' : 'proposal-rejected', proposal);
    return proposal;
  }

  /** Execute a passed proposal's action. */
  async execute(proposalId: string): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (proposal.status !== 'passed') throw new Error(`Proposal ${proposalId} not passed`);

    await Promise.resolve(); // simulate tx
    proposal.status = 'executed';
    proposal.executedAt = Date.now();
    this.emit('proposal-executed', proposal);
    return proposal;
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }

  listProposals(): Proposal[] {
    return Array.from(this.proposals.values());
  }
}
