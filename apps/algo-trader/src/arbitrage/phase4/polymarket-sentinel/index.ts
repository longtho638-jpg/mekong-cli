/**
 * PolymarketSentinelEngine — Dark AI Polymarket Sentinel orchestrator.
 * Combines news ingestion, prediction market data, NLP, signal fusion,
 * asset correlation and simulated execution into a single composable engine.
 * SIMULATION MODE ONLY — no real API connections.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { NewsIngestor } from './news-ingestor';
import type { NewsItem } from './news-ingestor';
import { PredictionMarketFetcher } from './prediction-market-fetcher';
import type { PredictionContract } from './prediction-market-fetcher';
import { NlpProcessor } from './nlp-processor';
import { SignalFusionEngine } from './signal-fusion-engine';
import type { MacroDriftSignal } from './signal-fusion-engine';
import { AssetCorrelator } from './asset-correlator';
import { SentinelExecutor } from './executor';
import type { SimulatedTrade } from './executor';

export interface PolymarketSentinelConfig {
  pollIntervalMs?: number;
  signalThreshold?: number;
  nlpWeight?: number;
  marketWeight?: number;
}

interface SentinelStatus {
  running: boolean;
  newsProcessed: number;
  signalsGenerated: number;
  simulatedTrades: number;
  currentDrift: MacroDriftSignal | null;
}

const DEFAULT_CONFIG: Required<PolymarketSentinelConfig> = {
  pollIntervalMs: 5000,
  signalThreshold: 0.35,
  nlpWeight: 0.45,
  marketWeight: 0.55,
};

export class PolymarketSentinelEngine extends EventEmitter {
  private config: Required<PolymarketSentinelConfig>;
  private ingestor: NewsIngestor;
  private fetcher: PredictionMarketFetcher;
  private nlp: NlpProcessor;
  private fusionEngine: SignalFusionEngine;
  private correlator: AssetCorrelator;
  private executor: SentinelExecutor;

  private running = false;
  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private signalsGenerated = 0;
  private currentDrift: MacroDriftSignal | null = null;

  // Buffers accumulate between fusion ticks
  private nlpBuffer: number[] = [];
  private marketProbBuffer: number[] = [];

  constructor(config?: PolymarketSentinelConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.ingestor = new NewsIngestor(this.config.pollIntervalMs);
    this.fetcher = new PredictionMarketFetcher(this.config.pollIntervalMs);
    this.nlp = new NlpProcessor();
    this.fusionEngine = new SignalFusionEngine({
      nlpWeight: this.config.nlpWeight,
      marketWeight: this.config.marketWeight,
    });
    this.correlator = new AssetCorrelator();
    this.executor = new SentinelExecutor();
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Wire up sub-component events
    this.ingestor.on('news', (item: NewsItem) => this.handleNews(item));
    this.fetcher.on('contracts', (contracts: PredictionContract[]) => this.handleContracts(contracts));
    this.executor.on('trade', (trade: SimulatedTrade) => {
      this.emit('ws:message', { type: 'phase4:sentinel_trade', payload: trade });
    });

    this.ingestor.start();
    this.fetcher.start();

    // Main fusion loop
    this.loopHandle = setInterval(() => this.runFusionCycle(), this.config.pollIntervalMs);

    logger.info('[PolymarketSentinelEngine] Started — simulation mode active');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (this.loopHandle) {
      clearInterval(this.loopHandle);
      this.loopHandle = null;
    }

    this.ingestor.stop();
    this.fetcher.stop();
    this.ingestor.removeAllListeners();
    this.fetcher.removeAllListeners();
    this.executor.removeAllListeners();

    logger.info('[PolymarketSentinelEngine] Stopped');
  }

  getStatus(): SentinelStatus {
    const { trades } = this.executor.getStats();
    return {
      running: this.running,
      newsProcessed: this.ingestor.getStats().itemsProcessed,
      signalsGenerated: this.signalsGenerated,
      simulatedTrades: trades,
      currentDrift: this.currentDrift,
    };
  }

  private handleNews(item: NewsItem): void {
    const result = this.nlp.analyzeSentiment(item.headline);
    this.nlpBuffer.push(result.score);
  }

  private handleContracts(contracts: PredictionContract[]): void {
    const probs = contracts.map(c => c.yesPrice);
    this.marketProbBuffer.push(...probs);
  }

  private runFusionCycle(): void {
    if (this.nlpBuffer.length === 0 && this.marketProbBuffer.length === 0) return;

    const signal = this.fusionEngine.fuse(
      [...this.nlpBuffer],
      [...this.marketProbBuffer],
    );
    this.nlpBuffer = [];
    this.marketProbBuffer = [];

    this.currentDrift = signal;
    this.signalsGenerated++;

    this.emit('ws:message', { type: 'phase4:sentinel_signal', payload: signal });

    const trade = this.executor.evaluateAndExecute(signal, this.config.signalThreshold);
    if (trade) {
      // Adaptive correlation update with mock realised return
      const mockReturn = (Math.random() - 0.45) * 0.03;
      this.correlator.updateCorrelation(trade.asset, mockReturn, signal);
    }

    logger.debug(`[PolymarketSentinelEngine] Cycle done — ${signal.direction} strength=${signal.strength.toFixed(3)}`);
  }
}

export type { MacroDriftSignal, SimulatedTrade, NewsItem, PredictionContract };
export { NewsIngestor, PredictionMarketFetcher, NlpProcessor, SignalFusionEngine, AssetCorrelator, SentinelExecutor };
