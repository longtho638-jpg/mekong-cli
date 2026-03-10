/**
 * Predictive Liquidity Engine (PLE) — main loop.
 * Runs at 5ms intervals: update features → run inference → emit signals.
 * SIMULATION / DRY-RUN by default.
 */

import { EventEmitter } from 'events';
import { extractFeatures, type OrderbookSnapshot, type TradeEvent } from './feature-extractor';
import { OrderbookImbalanceModel, type ModelConfig } from './orderbook-imbalance-model';
import { LiquidityScoreCalculator, type LiquidityScoreConfig } from './liquidity-score-calculator';
import { AlphaSignalGenerator, type AlphaSignalConfig, type AlphaSignal } from './alpha-signal-generator';

export interface PLEConfig {
  enabled: boolean;
  modelPath: string;
  threshold: number;
  updateIntervalMs: number;
  symbol: string;
  dryRun: boolean;
  liquidityScore?: Partial<LiquidityScoreConfig>;
}

const DEFAULT_CONFIG: PLEConfig = {
  enabled: false,
  modelPath: './models/imbalance.onnx',
  threshold: 0.7,
  updateIntervalMs: 5,
  symbol: 'BTC/USDT',
  dryRun: true,
};

export class PredictiveLiquidityEngine extends EventEmitter {
  private readonly cfg: PLEConfig;
  private readonly model: OrderbookImbalanceModel;
  private readonly scorer: LiquidityScoreCalculator;
  private readonly signalGen: AlphaSignalGenerator;

  private timer: ReturnType<typeof setInterval> | null = null;
  private latestSnapshot: OrderbookSnapshot | null = null;
  private recentTrades: TradeEvent[] = [];
  private cycleCount = 0;

  constructor(config: Partial<PLEConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };

    const modelCfg: ModelConfig = { modelPath: this.cfg.modelPath, deadZone: 0.05 };
    this.model = new OrderbookImbalanceModel(modelCfg);
    this.scorer = new LiquidityScoreCalculator(this.cfg.liquidityScore);

    const signalCfg: Partial<AlphaSignalConfig> = {
      symbol: this.cfg.symbol,
      imbalanceThreshold: this.cfg.threshold,
      dryRun: this.cfg.dryRun,
    };
    this.signalGen = new AlphaSignalGenerator(signalCfg);

    // Bubble signals up
    this.signalGen.on('signal', (s: AlphaSignal) => this.emit('signal', s));
    this.signalGen.on('signal:dry', (s: AlphaSignal) => this.emit('signal:dry', s));
  }

  /** Feed a new orderbook snapshot into the engine. */
  updateOrderbook(snapshot: OrderbookSnapshot): void {
    this.latestSnapshot = snapshot;
  }

  /** Append a trade event to the rolling window (capped at 200). */
  addTrade(trade: TradeEvent): void {
    this.recentTrades.push(trade);
    if (this.recentTrades.length > 200) {
      this.recentTrades.shift();
    }
  }

  /** Start the main 5ms inference loop. */
  async start(): Promise<void> {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }
    await this.model.load();
    this.timer = setInterval(() => void this.tick(), this.cfg.updateIntervalMs);
    this.emit('started');
  }

  /** Stop the loop. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped', { cycles: this.cycleCount });
  }

  private async tick(): Promise<void> {
    if (!this.latestSnapshot) return;
    try {
      const features = extractFeatures(this.latestSnapshot, this.recentTrades);
      const prediction = await this.model.predict(features);
      const liquidity = this.scorer.compute(features, prediction);
      this.signalGen.evaluate(features, prediction, liquidity);
      this.cycleCount++;
      this.emit('tick', { features, prediction, liquidity, cycle: this.cycleCount });
    } catch (err) {
      this.emit('error', err);
    }
  }

  getStats(): { cycles: number; signals: number; running: boolean } {
    return {
      cycles: this.cycleCount,
      signals: this.signalGen.getSignalCount(),
      running: this.timer !== null,
    };
  }
}

// Barrel exports
export { extractFeatures } from './feature-extractor';
export type { FeatureVector, OrderbookSnapshot, TradeEvent } from './feature-extractor';
export { OrderbookImbalanceModel } from './orderbook-imbalance-model';
export type { ImbalancePrediction } from './orderbook-imbalance-model';
export { LiquidityScoreCalculator } from './liquidity-score-calculator';
export type { LiquidityScore } from './liquidity-score-calculator';
export { AlphaSignalGenerator } from './alpha-signal-generator';
export type { AlphaSignal, SignalSide } from './alpha-signal-generator';
