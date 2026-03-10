/**
 * TxOrchestrator — simulates micro-transactions between mock wallets.
 * In-memory ledger tracks balances. No real blockchain connections.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../../../utils/logger';
import type { MockWallet } from './wallet-generator';

export interface SimulatedTx {
  hash: string;
  from: string;
  to: string;
  value: number;
  token: string;
  chain: string;
  timestamp: number;
  blockNumber: number;
}

interface TxStats {
  txCount: number;
  totalVolume: number;
}

const TOKENS = ['USDC', 'WETH', 'WBTC', 'ARB', 'SOL'];
const BASE_BLOCK = 18_000_000;

export class TxOrchestrator extends EventEmitter {
  private ledger: Map<string, number> = new Map();
  private txHistory: SimulatedTx[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private wallets: MockWallet[] = [];
  private blockNumber = BASE_BLOCK;
  private totalVolume = 0;

  constructor() {
    super();
  }

  start(wallets: MockWallet[], intervalMs: number): void {
    if (this.intervalHandle) return;
    this.wallets = wallets;

    // Seed ledger with wallet balances
    for (const w of wallets) {
      this.ledger.set(w.address, w.balance);
    }

    logger.info(`[TxOrchestrator] Starting with ${wallets.length} wallets, interval=${intervalMs}ms`);

    this.intervalHandle = setInterval(() => {
      if (this.wallets.length < 2) return;
      const fromIdx = Math.floor(Math.random() * this.wallets.length);
      let toIdx = Math.floor(Math.random() * this.wallets.length);
      if (toIdx === fromIdx) toIdx = (fromIdx + 1) % this.wallets.length;

      const from = this.wallets[fromIdx];
      const to = this.wallets[toIdx];
      const balance = this.ledger.get(from.address) ?? 0;
      if (balance <= 0.001) return;

      const value = parseFloat((Math.random() * Math.min(balance * 0.3, 0.5) + 0.001).toFixed(6));
      this.executeTx(from.address, to.address, value);
    }, intervalMs);
  }

  stop(): void {
    if (!this.intervalHandle) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    logger.info('[TxOrchestrator] Stopped');
  }

  executeTx(from: string, to: string, value: number): SimulatedTx {
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const chain = from.startsWith('0x') ? 'ethereum' : 'solana';
    const timestamp = Date.now();
    this.blockNumber++;

    const hash = '0x' + createHash('sha256')
      .update(`${from}:${to}:${value}:${timestamp}`)
      .digest('hex');

    // Update ledger
    const fromBal = this.ledger.get(from) ?? 0;
    const toBal = this.ledger.get(to) ?? 0;
    this.ledger.set(from, Math.max(0, fromBal - value));
    this.ledger.set(to, toBal + value);
    this.totalVolume += value;

    const tx: SimulatedTx = { hash, from, to, value, token, chain, timestamp, blockNumber: this.blockNumber };
    this.txHistory.push(tx);
    logger.debug(`[TxOrchestrator] tx ${hash.slice(0, 10)}... ${from.slice(0, 8)}→${to.slice(0, 8)} ${value} ${token}`);
    this.emit('tx', tx);
    return tx;
  }

  getLedger(): Map<string, number> {
    return new Map(this.ledger);
  }

  getStats(): TxStats {
    return { txCount: this.txHistory.length, totalVolume: this.totalVolume };
  }

  getTxHistory(): SimulatedTx[] {
    return [...this.txHistory];
  }
}
