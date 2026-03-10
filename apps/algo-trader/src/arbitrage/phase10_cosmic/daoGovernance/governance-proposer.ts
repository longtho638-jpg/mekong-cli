/**
 * Governance Proposer — On-chain proposal submission and voting (mock).
 * Token-weighted voting with quorum enforcement.
 * All ops default to dry-run mode.
 */

import { randomBytes } from 'crypto';

export type ProposalStatus = 'pending' | 'active' | 'passed' | 'rejected' | 'executed';

export interface GovernanceProposerConfig {
  /** Voting period in seconds. Default: 86400 (1 day). */
  votingPeriodSec: number;
  /** Minimum quorum as fraction of total supply (0.1 = 10%). Default: 0.1. */
  quorumFraction: number;
  /** Dry-run: skip state changes. Default: true. */
  dryRun: boolean;
}

export interface Proposal {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  createdAt: number;
  expiresAt: number;
  executionPayload: string;
}

export interface Vote {
  voter: string;
  proposalId: string;
  support: boolean;
  weight: number;
  castAt: number;
}

const DEFAULT_CONFIG: GovernanceProposerConfig = {
  votingPeriodSec: 86_400,
  quorumFraction: 0.1,
  dryRun: true,
};

export class GovernanceProposer {
  private readonly cfg: GovernanceProposerConfig;
  private proposals: Map<string, Proposal> = new Map();
  private votes: Map<string, Vote[]> = new Map(); // proposalId → votes

  constructor(config: Partial<GovernanceProposerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Submit a new governance proposal. Returns proposalId. */
  createProposal(
    proposer: string,
    title: string,
    description: string,
    executionPayload: string,
  ): string {
    if (!proposer) throw new Error('createProposal: proposer required');
    if (!title.trim()) throw new Error('createProposal: title required');
    const proposalId = 'prop-' + randomBytes(8).toString('hex');
    if (this.cfg.dryRun) return proposalId;
    const now = Date.now();
    const proposal: Proposal = {
      proposalId,
      title,
      description,
      proposer,
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      createdAt: now,
      expiresAt: now + this.cfg.votingPeriodSec * 1000,
      executionPayload,
    };
    this.proposals.set(proposalId, proposal);
    this.votes.set(proposalId, []);
    return proposalId;
  }

  /**
   * Cast a vote on an active proposal.
   * weight = token balance of voter.
   */
  vote(proposalId: string, voter: string, support: boolean, weight: number): void {
    if (this.cfg.dryRun) return;
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`vote: proposal not found: ${proposalId}`);
    if (proposal.status !== 'active') throw new Error(`vote: proposal not active`);
    if (Date.now() > proposal.expiresAt) {
      proposal.status = 'rejected';
      throw new Error('vote: voting period expired');
    }
    if (weight <= 0) throw new Error('vote: weight must be positive');
    const existing = (this.votes.get(proposalId) ?? []).find((v) => v.voter === voter);
    if (existing) throw new Error(`vote: ${voter} already voted`);

    const v: Vote = { voter, proposalId, support, weight, castAt: Date.now() };
    this.votes.get(proposalId)!.push(v);
    if (support) proposal.votesFor += weight;
    else proposal.votesAgainst += weight;
  }

  /** Retrieve a proposal by ID. Returns undefined if not found. */
  getProposal(proposalId: string): Proposal | undefined {
    const p = this.proposals.get(proposalId);
    return p ? { ...p } : undefined;
  }

  /** List all proposals with status === 'active'. */
  listActiveProposals(): Proposal[] {
    return [...this.proposals.values()]
      .filter((p) => p.status === 'active')
      .map((p) => ({ ...p }));
  }

  /**
   * Finalise proposal based on quorum + majority.
   * totalSupply needed to calculate quorum.
   */
  finalise(proposalId: string, totalSupply: number): ProposalStatus {
    if (this.cfg.dryRun) return 'pending';
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`finalise: proposal not found: ${proposalId}`);
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const quorum = this.cfg.quorumFraction * totalSupply;
    if (totalVotes < quorum) {
      proposal.status = 'rejected';
    } else {
      proposal.status = proposal.votesFor > proposal.votesAgainst ? 'passed' : 'rejected';
    }
    return proposal.status;
  }

  getVotes(proposalId: string): Vote[] {
    return [...(this.votes.get(proposalId) ?? [])];
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }
}
