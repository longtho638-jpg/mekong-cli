/**
 * SybilMirageEngine — orchestrates wallet generation, tx simulation,
 * accumulation pattern detection, and dump simulation.
 * SIMULATION ONLY — no real blockchain connections.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { WalletGenerator } from './wallet-generator';
import type { MockWallet } from './wallet-generator';
import { TxOrchestrator } from './tx-orchestrator';
import type { SimulatedTx } from './tx-orchestrator';
import { PatternDetector } from './pattern-detector';
import type { AccumulationPattern } from './pattern-detector';
import { DumpSimulator } from './dump-simulator';
import type { DumpResult } from './dump-simulator';

export interface SybilMirageConfig {
  numWallets?: number;
  txIntervalMs?: number;
  dumpThreshold?: number;
  seed?: string;
}

interface SybilMirageStatus {
  running: boolean;
  activeWallets: number;
  txCount: number;
  patternsDetected: number;
  dumpsExecuted: number;
}

const DEFAULT_CONFIG: Required<SybilMirageConfig> = {
  numWallets: 20,
  txIntervalMs: 500,
  dumpThreshold: 2.0,
  seed: 'sybil-mirage-default',
};

// Base price used for dump simulations (notional)
const BASE_PRICE = 100;

export class SybilMirageEngine extends EventEmitter {
  private config: Required<SybilMirageConfig>;
  private generator: WalletGenerator;
  private orchestrator: TxOrchestrator;
  private detector: PatternDetector;
  private dumper: DumpSimulator;

  private running = false;
  private wallets: MockWallet[] = [];
  private patternsDetected = 0;
  private dumpsExecuted = 0;
  private patternCheckHandle: ReturnType<typeof setInterval> | null = null;

  constructor(config?: SybilMirageConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.generator = new WalletGenerator(this.config.seed);
    this.orchestrator = new TxOrchestrator();
    this.detector = new PatternDetector({ accumulationThreshold: this.config.dumpThreshold });
    this.dumper = new DumpSimulator();
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.wallets = this.generator.generate(this.config.numWallets);
    logger.info(`[SybilMirageEngine] Started — ${this.wallets.length} wallets seed=${this.config.seed.slice(0, 8)}...`);

    // Forward tx events for ws streaming
    this.orchestrator.on('tx', (tx: SimulatedTx) => {
      this.emit('ws:message', { type: 'phase4:sybil_activity', payload: tx });
    });

    // Periodically analyze tx stream for accumulation patterns
    this.patternCheckHandle = setInterval(() => {
      const txs = this.orchestrator.getTxHistory();
      const patterns = this.detector.analyzeTxStream(txs);

      for (const pattern of patterns) {
        this.patternsDetected++;
        this.emit('ws:message', { type: 'phase4:sybil_pattern', payload: pattern });
        this.handlePattern(pattern);
      }
    }, this.config.txIntervalMs * 10);

    this.orchestrator.start(this.wallets, this.config.txIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    this.orchestrator.stop();
    this.orchestrator.removeAllListeners('tx');

    if (this.patternCheckHandle) {
      clearInterval(this.patternCheckHandle);
      this.patternCheckHandle = null;
    }

    logger.info('[SybilMirageEngine] Stopped');
  }

  private handlePattern(pattern: AccumulationPattern): void {
    if (pattern.walletCluster.length === 0) return;

    // Use first wallet in cluster as "main wallet" for the dump
    const mainWallet = pattern.walletCluster[0];
    const sellSize = pattern.totalAccumulated * 0.8; // sell 80% of accumulated

    try {
      const result: DumpResult = this.dumper.simulateDump(mainWallet, sellSize, BASE_PRICE);
      this.dumpsExecuted++;
      this.emit('ws:message', { type: 'phase4:sybil_activity', payload: result });
    } catch (err) {
      logger.warn(`[SybilMirageEngine] Dump simulation failed: ${(err as Error).message}`);
    }
  }

  getStatus(): SybilMirageStatus {
    const { txCount } = this.orchestrator.getStats();
    return {
      running: this.running,
      activeWallets: this.wallets.length,
      txCount,
      patternsDetected: this.patternsDetected,
      dumpsExecuted: this.dumpsExecuted,
    };
  }

  // Expose sub-components for testing
  getOrchestrator(): TxOrchestrator { return this.orchestrator; }
  getDetector(): PatternDetector { return this.detector; }
  getDumper(): DumpSimulator { return this.dumper; }
}

export type { MockWallet } from './wallet-generator';
export type { SimulatedTx } from './tx-orchestrator';
export type { AccumulationPattern } from './pattern-detector';
export type { DumpResult } from './dump-simulator';
