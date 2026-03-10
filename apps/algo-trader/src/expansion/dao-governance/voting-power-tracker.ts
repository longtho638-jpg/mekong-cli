/**
 * Calculates voting power from simulated token holdings.
 * Square-root weighting applied to reduce whale dominance.
 */

import { EventEmitter } from 'events';

export interface HolderRecord {
  address: string;
  tokenBalance: bigint;
  votingPower: number;
}

export interface VotingSnapshot {
  totalVotingPower: number;
  holderCount: number;
  holders: HolderRecord[];
  snapshotAt: number;
}

export class VotingPowerTracker extends EventEmitter {
  private readonly holders: Map<string, bigint> = new Map();

  constructor() {
    super();
  }

  /** Set or update token balance for an address. */
  setBalance(address: string, tokenBalance: bigint): void {
    this.holders.set(address, tokenBalance);
    this.emit('balance-updated', { address, tokenBalance });
  }

  /** Remove an address from tracking. */
  removeHolder(address: string): boolean {
    const removed = this.holders.delete(address);
    if (removed) this.emit('holder-removed', address);
    return removed;
  }

  /**
   * Compute voting power for a single address.
   * Uses square-root of token balance (in whole tokens) to reduce whale power.
   */
  getVotingPower(address: string): number {
    const balance = this.holders.get(address) ?? 0n;
    const wholeTokens = Number(balance / 10n ** 18n);
    return Math.sqrt(wholeTokens);
  }

  /** Take a snapshot of all holders and their voting power. */
  snapshot(): VotingSnapshot {
    const records: HolderRecord[] = [];

    for (const [address, tokenBalance] of this.holders) {
      records.push({
        address,
        tokenBalance,
        votingPower: this.getVotingPower(address),
      });
    }

    const totalVotingPower = records.reduce((s, r) => s + r.votingPower, 0);
    const snap: VotingSnapshot = {
      totalVotingPower,
      holderCount: records.length,
      holders: records,
      snapshotAt: Date.now(),
    };

    this.emit('snapshot', snap);
    return snap;
  }

  getTotalVotingPower(): number {
    return this.snapshot().totalVotingPower;
  }
}
