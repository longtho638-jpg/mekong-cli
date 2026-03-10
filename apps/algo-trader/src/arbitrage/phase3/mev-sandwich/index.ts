/**
 * MevSandwichEngine — orchestrates mempool monitoring, sandwich detection,
 * bundle building and execution into a single composable engine.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { MempoolMonitor } from './mempool-monitor';
import type { PendingTransaction } from './mempool-monitor';
import { SandwichDetector } from './sandwich-detector';
import type { SandwichOpportunity } from './sandwich-detector';
import { BundleBuilder } from './bundle-builder';
import { BundleExecutor } from './bundle-executor';

export interface MevSandwichConfig {
  minProfitUsd?: number;
  maxGasUsd?: number;
  ethereumRpc?: string;
  flashbotsRelay?: string;
  solanaJitoUrl?: string;
}

interface MevStatus {
  running: boolean;
  opportunities: number;
  bundlesSubmitted: number;
  successRate: number;
}

const DEFAULT_CONFIG: Required<MevSandwichConfig> = {
  minProfitUsd: 10,
  maxGasUsd: 50,
  ethereumRpc: '',
  flashbotsRelay: 'https://relay.flashbots.net',
  solanaJitoUrl: 'https://mainnet.block-engine.jito.wtf',
};

export class MevSandwichEngine extends EventEmitter {
  private config: Required<MevSandwichConfig>;
  private monitor: MempoolMonitor;
  private detector: SandwichDetector;
  private builder: BundleBuilder;
  private executor: BundleExecutor;
  private running = false;
  private opportunityCount = 0;

  constructor(config?: MevSandwichConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.monitor = new MempoolMonitor({
      ethereumRpc: this.config.ethereumRpc,
      solanaJitoUrl: this.config.solanaJitoUrl,
    });
    this.detector = new SandwichDetector({
      minProfitUsd: this.config.minProfitUsd,
      maxGasUsd: this.config.maxGasUsd,
    });
    this.builder = new BundleBuilder();
    this.executor = new BundleExecutor({
      flashbotsRelay: this.config.flashbotsRelay,
      solanaJitoUrl: this.config.solanaJitoUrl,
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.monitor.on('pending_tx', (tx: PendingTransaction) => this.handlePendingTx(tx));
    this.executor.on('bundle:submitted', (data: unknown) =>
      this.emit('ws:message', { type: 'phase3:mev_opportunity', payload: data }),
    );

    this.monitor.start();
    logger.info('[MevSandwichEngine] Started');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.monitor.stop();
    this.monitor.removeAllListeners('pending_tx');
    this.executor.removeAllListeners('bundle:submitted');
    logger.info('[MevSandwichEngine] Stopped');
  }

  private async handlePendingTx(tx: PendingTransaction): Promise<void> {
    // Use a minimal simulated orderbook for the detected asset
    const orderbookData = new Map<string, { bid: number; ask: number }>();
    const assetKey = `TOKEN_${tx.to.slice(-4).toUpperCase()}`;
    orderbookData.set(assetKey, { bid: 1.998, ask: 2.002 });

    const opp: SandwichOpportunity | null = this.detector.analyze(tx, orderbookData);
    if (!opp) return;

    this.opportunityCount++;

    const bundle = tx.chain === 'ethereum'
      ? this.builder.buildEthBundle(opp)
      : this.builder.buildSolBundle(opp);

    await this.executor.submitBundle(bundle);
  }

  /** Expose monitor for test injection */
  getMonitor(): MempoolMonitor { return this.monitor; }

  getStatus(): MevStatus {
    const stats = this.executor.getStats();
    const successRate = stats.submitted > 0 ? stats.included / stats.submitted : 0;
    return {
      running: this.running,
      opportunities: this.opportunityCount,
      bundlesSubmitted: stats.submitted,
      successRate,
    };
  }
}

export type { PendingTransaction, SandwichOpportunity };
