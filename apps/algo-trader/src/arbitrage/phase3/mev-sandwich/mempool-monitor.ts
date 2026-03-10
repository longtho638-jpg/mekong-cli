/**
 * MempoolMonitor — simulated Ethereum/Solana mempool watcher.
 * In production, connects to Ethereum WS RPC and Jito block engine.
 * For this layer, provides inject API for testing and emits pending_tx.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;       // in ETH/SOL units
  gasPrice: number;
  data: string;
  chain: 'ethereum' | 'solana';
  timestamp: number;
}

export interface MempoolConfig {
  ethereumRpc?: string;
  solanaJitoUrl?: string;
}

interface MempoolStats {
  txCount: number;
  startTime: number;
}

export class MempoolMonitor extends EventEmitter {
  private config: Required<MempoolConfig>;
  private running = false;
  private txCount = 0;
  private startTime = 0;

  constructor(config?: MempoolConfig) {
    super();
    this.config = {
      ethereumRpc: config?.ethereumRpc ?? '',
      solanaJitoUrl: config?.solanaJitoUrl ?? '',
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    logger.info('[MempoolMonitor] Started — monitoring ethereum/solana pending transactions');
    if (this.config.ethereumRpc) {
      logger.debug(`[MempoolMonitor] Ethereum RPC: ${this.config.ethereumRpc}`);
    }
    if (this.config.solanaJitoUrl) {
      logger.debug(`[MempoolMonitor] Solana Jito: ${this.config.solanaJitoUrl}`);
    }
    this.emit('started');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    logger.info('[MempoolMonitor] Stopped');
  }

  /**
   * Inject a transaction for testing or simulation purposes.
   * In production this would be driven by WS subscription callbacks.
   */
  injectTransaction(tx: PendingTransaction): void {
    if (!this.running) return;
    this.txCount++;
    logger.debug(`[MempoolMonitor] Pending tx ${tx.hash} on ${tx.chain} value=${tx.value}`);
    this.emit('pending_tx', tx);
  }

  getStats(): MempoolStats {
    return {
      txCount: this.txCount,
      startTime: this.startTime,
    };
  }

  isRunning(): boolean {
    return this.running;
  }
}
