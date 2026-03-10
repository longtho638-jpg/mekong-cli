/**
 * PredatoryLiquidityEngine — composes PumpDetector, LiquidityTrapper, and
 * DumpExecutor into a pipeline: pump detected → place makers → dump on threshold.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { PumpDetector } from './pump-detector';
import type { PumpSignal } from './pump-detector';
import { LiquidityTrapper } from './liquidity-trapper';
import { DumpExecutor } from './dump-executor';

export interface PredatoryLiquidityConfig {
  pumpThreshold?: number;
  dumpThreshold?: number;
  makerSpreadBps?: number;
  maxPositionUsd?: number;
}

interface PredatoryStatus {
  running: boolean;
  activePumps: number;
  makerOrders: number;
  dumpsExecuted: number;
}

const DEFAULT_CONFIG: Required<PredatoryLiquidityConfig> = {
  pumpThreshold: 0.7,
  dumpThreshold: 0.9,
  makerSpreadBps: 2,
  maxPositionUsd: 10_000,
};

export class PredatoryLiquidityEngine extends EventEmitter {
  private config: Required<PredatoryLiquidityConfig>;
  private pumpDetector: PumpDetector;
  private trapper: LiquidityTrapper;
  private dumpExecutor: DumpExecutor;
  private running = false;
  private activePumps = new Set<string>();
  private dumpsExecuted = 0;

  constructor(config?: PredatoryLiquidityConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.pumpDetector = new PumpDetector({ pumpThreshold: this.config.pumpThreshold });
    this.trapper = new LiquidityTrapper({
      makerSpreadBps: this.config.makerSpreadBps,
      maxPositionUsd: this.config.maxPositionUsd,
    });
    this.dumpExecutor = new DumpExecutor({
      dumpThreshold: this.config.dumpThreshold,
      maxPositionUsd: this.config.maxPositionUsd,
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.pumpDetector.on('pump:detected', (signal: PumpSignal) => this.handlePump(signal));
    this.dumpExecutor.on('dump:executed', (trade: unknown) => {
      this.dumpsExecuted++;
      this.emit('ws:message', { type: 'phase3:pump_signal', payload: trade });
    });

    logger.info('[PredatoryLiquidityEngine] Started');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.pumpDetector.removeAllListeners('pump:detected');
    this.dumpExecutor.removeAllListeners('dump:executed');
    logger.info('[PredatoryLiquidityEngine] Stopped');
  }

  private async handlePump(signal: PumpSignal): Promise<void> {
    const { asset, probability } = signal;
    if (this.activePumps.has(asset)) return; // already tracking
    this.activePumps.add(asset);

    logger.info(`[PredatoryLiquidityEngine] Pump ${asset} prob=${probability.toFixed(2)} — placing makers`);

    // Simulate a mid price for the asset
    const midPrice = 100 + Math.random() * 900; // $100–$1000
    const orders = this.trapper.placeMakerOrders(asset, midPrice);

    // If probability exceeds dump threshold, execute immediately
    if (probability >= this.config.dumpThreshold) {
      await this.dumpExecutor.executeDump(asset, midPrice, orders);
      this.trapper.cancelAll(asset);
      this.activePumps.delete(asset);
    }
  }

  /** Expose sub-components for test access */
  getPumpDetector(): PumpDetector { return this.pumpDetector; }
  getTrapper(): LiquidityTrapper { return this.trapper; }
  getDumpExecutor(): DumpExecutor { return this.dumpExecutor; }

  getStatus(): PredatoryStatus {
    return {
      running: this.running,
      activePumps: this.activePumps.size,
      makerOrders: this.trapper.getActiveOrders().length,
      dumpsExecuted: this.dumpsExecuted,
    };
  }
}

export type { PumpSignal } from './pump-detector';
export type { MakerOrder } from './liquidity-trapper';
export type { DumpTrade } from './dump-executor';
