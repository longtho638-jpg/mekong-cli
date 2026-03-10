/**
 * Cross-Chain Triangular Arbitrage with MEV Protection (CCTAMP) — main loop.
 * Continuously scans for profitable paths and executes via flash loans + MEV bundles.
 * SIMULATION / DRY-RUN by default.
 */

import { EventEmitter } from 'events';
import { ChainGraphBuilder } from './chain-graph-builder';
import { PathFinder } from './path-finder';
import { AtomicExecutor } from './atomic-executor';

export interface CrossChainArbitrageConfig {
  enabled: boolean;
  chains: string[];
  minProfitUsd: number;
  flashLoanProviders: string[];
  mevRelay: string;
  scanIntervalMs: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: CrossChainArbitrageConfig = {
  enabled: false,
  chains: ['ethereum', 'solana', 'bsc'],
  minProfitUsd: 50,
  flashLoanProviders: ['aave', 'jito'],
  mevRelay: 'flashbots',
  scanIntervalMs: 100,
  dryRun: true,
};

export class CrossChainArbitrageEngine extends EventEmitter {
  private readonly cfg: CrossChainArbitrageConfig;
  private readonly graphBuilder: ChainGraphBuilder;
  private readonly pathFinder: PathFinder;
  private readonly executor: AtomicExecutor;
  private timer: ReturnType<typeof setInterval> | null = null;
  private scanCount = 0;
  private totalProfitUsd = 0;

  constructor(config: Partial<CrossChainArbitrageConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.graphBuilder = new ChainGraphBuilder();
    this.pathFinder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
    this.executor = new AtomicExecutor({
      minProfitUsd: this.cfg.minProfitUsd,
      dryRun: this.cfg.dryRun,
    });

    this.executor.on('executed', (r) => {
      this.totalProfitUsd += r.netProfitUsd;
      this.emit('profit', r);
    });
    this.executor.on('failed', (r) => this.emit('failed', r));
    this.executor.on('skipped', (r) => this.emit('skipped', r));
  }

  start(): void {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }
    this.timer = setInterval(() => void this.scan(), this.cfg.scanIntervalMs);
    this.emit('started', { chains: this.cfg.chains });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped', this.getStats());
  }

  private async scan(): Promise<void> {
    this.scanCount++;
    try {
      this.graphBuilder.refreshPrices();
      const graph = this.graphBuilder.getGraph();
      const best = this.pathFinder.bestPath(graph);
      if (best) {
        this.emit('path:found', best);
        await this.executor.execute(best);
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  getStats(): {
    scans: number;
    totalProfitUsd: number;
    execution: ReturnType<AtomicExecutor['getStats']>;
  } {
    return {
      scans: this.scanCount,
      totalProfitUsd: this.totalProfitUsd,
      execution: this.executor.getStats(),
    };
  }
}

// Barrel exports
export { ChainGraphBuilder } from './chain-graph-builder';
export type { ExchangeNode, PairEdge, ChainGraph } from './chain-graph-builder';
export { PathFinder } from './path-finder';
export type { ArbitragePath, PathHop } from './path-finder';
export { FlashLoanManager } from './flash-loan-manager';
export type { FlashLoanResult } from './flash-loan-manager';
export { MEVProtector } from './mev-protector';
export type { MEVBundle, BundleSubmitResult } from './mev-protector';
export { AtomicExecutor } from './atomic-executor';
export type { AtomicExecutionResult } from './atomic-executor';
