/**
 * AgiArbitrageEngine — Intelligent multi-exchange spread detector + execution engine.
 * Wraps SpreadDetectorEngine with AGI capabilities:
 *
 * 1. RegimeDetector   — Classifies market state (trending/mean-revert/volatile/quiet)
 * 2. KellyPositionSizer — Optimal position sizing via Kelly criterion
 * 3. Self-tuning      — Adjusts score threshold + spread threshold via EMA of profitability
 * 4. Strategy routing  — Selects execution parameters based on detected regime
 *
 * Lifecycle: init() → start() → [AGI loop: detect regime → tune params → execute] → stop()
 */

import { getArbLogger } from './arb-logger';
import {
  SpreadDetectorEngine,
  SpreadDetectorConfig,
  EngineStats,
  DetectionEvent,
} from './spread-detector-engine';
import { RegimeDetector, MarketRegime, RegimeSignal } from './regime-detector';
import { KellyPositionSizer, KellyResult } from './kelly-position-sizer';

export interface AgiConfig {
  /** Base SpreadDetectorEngine config */
  engine: Partial<SpreadDetectorConfig>;
  /** Enable regime detection (default: true) */
  enableRegimeDetection: boolean;
  /** Enable Kelly position sizing (default: true) */
  enableKellySizing: boolean;
  /** Enable self-tuning thresholds (default: true) */
  enableSelfTuning: boolean;
  /** Regime detection interval ms (default: 30000) */
  regimeIntervalMs: number;
  /** EMA alpha for profitability smoothing (default: 0.1) */
  tuningAlpha: number;
  /** Min score threshold floor (default: 40) */
  minScoreThreshold: number;
  /** Max score threshold ceiling (default: 90) */
  maxScoreThreshold: number;
  /** Initial equity USD */
  initialEquity: number;
  /** Regime parameter overrides */
  regimeParams: Record<MarketRegime, RegimeExecutionParams>;
}

export interface RegimeExecutionParams {
  scoreThresholdAdjust: number;   // Added to base score threshold
  spreadThresholdMultiplier: number; // Multiplied with base min spread
  maxConcurrentTrades: number;
  positionSizeMultiplier: number; // Multiplied with Kelly output
}

export interface AgiStats extends EngineStats {
  currentRegime: MarketRegime;
  regimeConfidence: number;
  kellyFraction: number;
  currentPositionSize: number;
  effectiveScoreThreshold: number;
  effectiveSpreadThreshold: number;
  emaProfitability: number;
  regimeHistory: { regime: MarketRegime; count: number }[];
  totalRegimeShifts: number;
}

const DEFAULT_REGIME_PARAMS: Record<MarketRegime, RegimeExecutionParams> = {
  'trending': {
    scoreThresholdAdjust: -5,       // More aggressive
    spreadThresholdMultiplier: 0.8,  // Accept tighter spreads
    maxConcurrentTrades: 5,
    positionSizeMultiplier: 1.2,
  },
  'mean-reverting': {
    scoreThresholdAdjust: -10,      // Most aggressive (arb thrives)
    spreadThresholdMultiplier: 0.7,
    maxConcurrentTrades: 5,
    positionSizeMultiplier: 1.0,
  },
  'volatile': {
    scoreThresholdAdjust: 10,       // Conservative
    spreadThresholdMultiplier: 1.5,  // Need wider spreads
    maxConcurrentTrades: 2,
    positionSizeMultiplier: 0.6,
  },
  'quiet': {
    scoreThresholdAdjust: 0,
    spreadThresholdMultiplier: 1.0,
    maxConcurrentTrades: 3,
    positionSizeMultiplier: 0.8,
  },
};

const DEFAULT_AGI_CONFIG: AgiConfig = {
  engine: {},
  enableRegimeDetection: true,
  enableKellySizing: true,
  enableSelfTuning: true,
  regimeIntervalMs: 30000,
  tuningAlpha: 0.1,
  minScoreThreshold: 40,
  maxScoreThreshold: 90,
  initialEquity: 10000,
  regimeParams: DEFAULT_REGIME_PARAMS,
};

export class AgiArbitrageEngine {
  private config: AgiConfig;
  private engine: SpreadDetectorEngine;
  private regimeDetector: RegimeDetector;
  private kellySizer: KellyPositionSizer;

  private isRunning = false;
  private regimeTimer: ReturnType<typeof setInterval> | null = null;
  private currentRegime: MarketRegime = 'quiet';
  private regimeConfidence = 0;
  private emaProfitability = 0;
  private baseScoreThreshold: number;
  private baseSpreadThreshold: number;
  private totalRegimeShifts = 0;
  private lastTradeCount = 0;
  private currentEquity: number;

  constructor(config?: Partial<AgiConfig>) {
    this.config = {
      ...DEFAULT_AGI_CONFIG,
      ...config,
      regimeParams: {
        ...DEFAULT_REGIME_PARAMS,
        ...config?.regimeParams,
      },
    };

    this.currentEquity = this.config.initialEquity;
    this.baseScoreThreshold = this.config.engine.scorer?.executeThreshold ?? 65;
    this.baseSpreadThreshold = this.config.engine.scanner?.minSpreadPercent ?? 0.05;

    this.engine = new SpreadDetectorEngine(this.config.engine);
    this.regimeDetector = new RegimeDetector();
    this.kellySizer = new KellyPositionSizer({
      maxPositionUsd: this.config.engine.executor?.maxPositionSizeUsd ?? 5000,
    });
  }

  /** Initialize exchange connections. */
  async init(): Promise<string[]> {
    const log = getArbLogger();
    log.info('[AGI] Initializing AgiArbitrageEngine...');
    const connected = await this.engine.init();
    log.info(`[AGI] Connected: ${connected.join(', ')} | Regime: ${this.config.enableRegimeDetection ? 'ON' : 'OFF'} | Kelly: ${this.config.enableKellySizing ? 'ON' : 'OFF'} | Self-tune: ${this.config.enableSelfTuning ? 'ON' : 'OFF'}`);
    return connected;
  }

  /** Start the AGI engine with regime detection loop. */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    const log = getArbLogger();
    log.info('[AGI] Starting AGI arbitrage engine...');

    await this.engine.start();

    if (this.config.enableRegimeDetection) {
      this.regimeTimer = setInterval(() => this.regimeTick(), this.config.regimeIntervalMs);
    }

    log.info('[AGI] AGI engine ACTIVE — intelligent spread detection running');
  }

  /** Stop engine and cleanup. */
  stop(): void {
    this.isRunning = false;
    if (this.regimeTimer) {
      clearInterval(this.regimeTimer);
      this.regimeTimer = null;
    }
    this.engine.stop();
    getArbLogger().info('[AGI] Engine STOPPED');
  }

  /** Periodic regime detection + parameter tuning tick. */
  private regimeTick(): void {
    if (!this.isRunning) return;
    const log = getArbLogger();

    // Feed spread data from recent events
    const events = this.engine.getEvents(20);
    for (const ev of events) {
      this.regimeDetector.addSpread(ev.opportunity.spreadPercent);
    }

    // Detect regime
    const signal = this.regimeDetector.detect();
    const prevRegime = this.currentRegime;
    this.currentRegime = signal.regime;
    this.regimeConfidence = signal.confidence;

    if (prevRegime !== this.currentRegime) {
      this.totalRegimeShifts++;
      log.info(`[AGI] Regime shift: ${prevRegime} → ${this.currentRegime} (confidence: ${(signal.confidence * 100).toFixed(0)}%, hurst: ${signal.hurstExponent.toFixed(2)})`);
    }

    // Self-tune based on recent profitability
    if (this.config.enableSelfTuning) {
      this.selfTune();
    }

    // Update Kelly sizing
    if (this.config.enableKellySizing) {
      this.updateKelly();
    }
  }

  /** Self-tune score/spread thresholds based on EMA of profitability. */
  private selfTune(): void {
    const profit = this.engine.getProfitSummary();
    const stats = this.engine.getStats();

    // Track trade outcomes for Kelly
    const currentTradeCount = stats.totalExecuted;
    if (currentTradeCount > this.lastTradeCount) {
      const recentEvents = this.engine.getEvents(currentTradeCount - this.lastTradeCount);
      for (const ev of recentEvents) {
        if (ev.executed && ev.result) {
          this.kellySizer.recordTrade(ev.result.actualProfitUsd);
        }
      }
      this.lastTradeCount = currentTradeCount;
    }

    // Update EMA profitability
    const currentPnl = profit.cumulativePnl;
    this.emaProfitability = this.config.tuningAlpha * currentPnl +
      (1 - this.config.tuningAlpha) * this.emaProfitability;

    // Update equity for Kelly
    this.currentEquity = this.config.initialEquity + currentPnl;
  }

  /** Update Kelly position sizing. */
  private updateKelly(): void {
    const kelly = this.kellySizer.calculate(this.currentEquity, this.currentRegime);

    if (kelly.tradesAnalyzed >= 10) {
      getArbLogger().info(
        `[AGI] Kelly: f*=${(kelly.kellyFraction * 100).toFixed(1)}% | adj=${(kelly.adjustedFraction * 100).toFixed(1)}% | size=$${kelly.positionSizeUsd.toFixed(0)} | WR=${(kelly.winRate * 100).toFixed(0)}% | edge=${kelly.edgePercent.toFixed(1)}%`
      );
    }
  }

  /** Get effective score threshold after regime adjustment. */
  getEffectiveScoreThreshold(): number {
    const params = this.config.regimeParams[this.currentRegime];
    const adjusted = this.baseScoreThreshold + params.scoreThresholdAdjust;

    // Self-tuning: lower threshold if profitable, raise if losing
    let tuningAdjust = 0;
    if (this.config.enableSelfTuning) {
      tuningAdjust = this.emaProfitability > 0 ? -3 : 3;
    }

    return Math.max(
      this.config.minScoreThreshold,
      Math.min(this.config.maxScoreThreshold, adjusted + tuningAdjust)
    );
  }

  /** Get effective spread threshold after regime adjustment. */
  getEffectiveSpreadThreshold(): number {
    const params = this.config.regimeParams[this.currentRegime];
    return this.baseSpreadThreshold * params.spreadThresholdMultiplier;
  }

  /** Get Kelly position sizing result. */
  getKellyResult(): KellyResult {
    return this.kellySizer.calculate(this.currentEquity, this.currentRegime);
  }

  /** Get current regime signal. */
  getRegimeSignal(): RegimeSignal {
    return this.regimeDetector.detect();
  }

  /** Get comprehensive AGI stats. */
  getStats(): AgiStats {
    const baseStats = this.engine.getStats();
    const regimeDist = this.regimeDetector.getRegimeDistribution();
    const kelly = this.kellySizer.calculate(this.currentEquity, this.currentRegime);

    return {
      ...baseStats,
      currentRegime: this.currentRegime,
      regimeConfidence: this.regimeConfidence,
      kellyFraction: kelly.adjustedFraction,
      currentPositionSize: kelly.positionSizeUsd,
      effectiveScoreThreshold: this.getEffectiveScoreThreshold(),
      effectiveSpreadThreshold: this.getEffectiveSpreadThreshold(),
      emaProfitability: this.emaProfitability,
      regimeHistory: Object.entries(regimeDist).map(([regime, count]) => ({
        regime: regime as MarketRegime, count,
      })),
      totalRegimeShifts: this.totalRegimeShifts,
    };
  }

  /** Get underlying engine for advanced access. */
  getEngine(): SpreadDetectorEngine { return this.engine; }

  /** Get profit summary. */
  getProfitSummary() { return this.engine.getProfitSummary(); }

  /** Get detection events. */
  getEvents(limit?: number): DetectionEvent[] { return this.engine.getEvents(limit); }

  /** Emergency stop. */
  emergencyStop(reason: string): void {
    this.engine.emergencyStop(reason);
    this.stop();
    getArbLogger().warn(`[AGI] EMERGENCY STOP: ${reason}`);
  }

  /** Check if running. */
  isActive(): boolean { return this.isRunning; }
}
