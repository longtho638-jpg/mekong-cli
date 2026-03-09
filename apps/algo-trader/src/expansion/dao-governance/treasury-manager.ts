/**
 * Mock on-chain treasury management.
 * Tracks inflows/outflows and simulates on-chain balance reads.
 */

import { EventEmitter } from 'events';

export interface TreasuryTransaction {
  id: string;
  type: 'inflow' | 'outflow';
  amountUsd: number;
  description: string;
  timestamp: number;
}

export interface TreasuryState {
  balanceUsd: number;
  totalInflows: number;
  totalOutflows: number;
  transactions: TreasuryTransaction[];
}

export class TreasuryManager extends EventEmitter {
  private balanceUsd: number;
  private readonly transactions: TreasuryTransaction[] = [];
  private txCounter = 0;

  constructor(initialBalanceUsd = 0) {
    super();
    this.balanceUsd = initialBalanceUsd;
  }

  /** Record an inflow (e.g., protocol fees, donations). */
  recordInflow(amountUsd: number, description: string): TreasuryTransaction {
    const tx: TreasuryTransaction = {
      id: `tx-${++this.txCounter}`,
      type: 'inflow',
      amountUsd,
      description,
      timestamp: Date.now(),
    };
    this.balanceUsd += amountUsd;
    this.transactions.push(tx);
    this.emit('inflow', tx);
    return tx;
  }

  /** Record an outflow (e.g., grants, operational costs). */
  recordOutflow(amountUsd: number, description: string): TreasuryTransaction {
    if (amountUsd > this.balanceUsd) {
      throw new Error(`Insufficient treasury balance: ${this.balanceUsd} < ${amountUsd}`);
    }
    const tx: TreasuryTransaction = {
      id: `tx-${++this.txCounter}`,
      type: 'outflow',
      amountUsd,
      description,
      timestamp: Date.now(),
    };
    this.balanceUsd -= amountUsd;
    this.transactions.push(tx);
    this.emit('outflow', tx);
    return tx;
  }

  getState(): TreasuryState {
    const totalInflows = this.transactions
      .filter((t) => t.type === 'inflow')
      .reduce((s, t) => s + t.amountUsd, 0);
    const totalOutflows = this.transactions
      .filter((t) => t.type === 'outflow')
      .reduce((s, t) => s + t.amountUsd, 0);
    return {
      balanceUsd: this.balanceUsd,
      totalInflows,
      totalOutflows,
      transactions: [...this.transactions],
    };
  }

  getBalance(): number {
    return this.balanceUsd;
  }
}
