/**
 * ShadowLayeringEngine — orchestrates ExchangeSimulator, ShadowLayeringStrategy,
 * ImpactAnalyzer, and DefensiveDetector into a single composable engine.
 * SIMULATION ONLY — no real exchange connections.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { ExchangeSimulator } from './exchange-simulator';
import type { Trade, OrderbookSnapshot } from './exchange-simulator';
import { ShadowLayeringStrategy } from './shadow-layering-strategy';
import { ImpactAnalyzer } from './impact-analyzer';
import { DefensiveDetector } from './defensive-detector';

export interface ShadowLayeringConfig {
  simulatedLatencyMs?: number;
  icebergSizes?: number[];
  cancelThresholdPct?: number;
  maxLayers?: number;
}

interface ShadowLayeringStatus {
  running: boolean;
  orderbookDepth: number;
  layersActive: number;
  tradesExecuted: number;
  impactReports: number;
  spoofingAlerts: number;
}

const DEFAULT_CONFIG: Required<ShadowLayeringConfig> = {
  simulatedLatencyMs: 200,
  icebergSizes: [50, 100, 200],
  cancelThresholdPct: 0.5,
  maxLayers: 5,
};

const MARKET_MAKER_OWNER = 'market-maker';
const STRATEGY_OWNER = 'spoofer';
const LOOP_INTERVAL_MS = 1_000;

export class ShadowLayeringEngine extends EventEmitter {
  private config: Required<ShadowLayeringConfig>;
  private exchange: ExchangeSimulator;
  private strategy: ShadowLayeringStrategy;
  private impactAnalyzer: ImpactAnalyzer;
  private detector: DefensiveDetector;

  private running = false;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private tradesExecuted = 0;
  private preSnapshot: OrderbookSnapshot | null = null;
  private preTrades: Trade[] = [];

  constructor(config?: ShadowLayeringConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.exchange = new ExchangeSimulator();
    this.strategy = new ShadowLayeringStrategy({
      layerSizes: this.config.icebergSizes,
      cancelThresholdPct: this.config.cancelThresholdPct,
      maxLayers: this.config.maxLayers,
    });
    this.impactAnalyzer = new ImpactAnalyzer();
    this.detector = new DefensiveDetector();
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.exchange.on('trade', (trade: Trade) => {
      this.tradesExecuted++;
      logger.debug(`[ShadowLayeringEngine] Trade id=${trade.id} price=${trade.price}`);
    });

    this.exchange.on('orderbook_update', (snapshot: OrderbookSnapshot) => {
      this.emit('ws:message', { type: 'phase4:orderbook_snapshot', payload: snapshot });
    });

    this.seedMarketMakers();
    this.preSnapshot = this.exchange.getSnapshot();
    this.preTrades = this.exchange.getTrades().slice();

    this.loopTimer = setInterval(() => this.tick(), LOOP_INTERVAL_MS);
    logger.info('[ShadowLayeringEngine] Started');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    this.exchange.removeAllListeners('trade');
    this.exchange.removeAllListeners('orderbook_update');
    logger.info('[ShadowLayeringEngine] Stopped');
  }

  getStatus(): ShadowLayeringStatus {
    const snapshot = this.exchange.getSnapshot();
    return {
      running: this.running,
      orderbookDepth: snapshot.bids.length + snapshot.asks.length,
      layersActive: this.strategy.getActiveOrders().length,
      tradesExecuted: this.tradesExecuted,
      impactReports: this.impactAnalyzer.getReports().length,
      spoofingAlerts: this.detector.getAlerts().length,
    };
  }

  /** Expose sub-components for test access */
  getExchange(): ExchangeSimulator { return this.exchange; }
  getStrategy(): ShadowLayeringStrategy { return this.strategy; }
  getImpactAnalyzer(): ImpactAnalyzer { return this.impactAnalyzer; }
  getDetector(): DefensiveDetector { return this.detector; }

  private tick(): void {
    const snapshot = this.exchange.getSnapshot();
    const volatility = snapshot.spread > 0 && snapshot.midPrice > 0
      ? snapshot.spread / snapshot.midPrice
      : 0.001;

    // Run strategy evaluation
    const actions = this.strategy.evaluate(snapshot, volatility);

    for (const action of actions) {
      if (action.type === 'cancel') {
        this.exchange.cancelOrder(action.orderId);
        this.strategy.removeOrder(action.orderId);
      } else if (action.type === 'place') {
        const side = action.price > snapshot.midPrice ? 'sell' : 'buy';
        const order = this.exchange.placeOrder({
          side,
          price: action.price,
          size: action.size,
          type: 'iceberg',
          visibleSize: Math.max(1, Math.floor(action.size * 0.1)),
          owner: STRATEGY_OWNER,
        });
        this.strategy.registerOrder(order);
        // Re-tag action with real id for tracking
        action.orderId = order.id;
      }
      this.emit('ws:message', { type: 'phase4:layering_action', payload: action });
    }

    // Defensive detection pass
    const allActions = this.strategy.getActionHistory().slice(-20);
    this.detector.detect(allActions, snapshot);

    // Periodic impact analysis (every ~5 ticks proxy)
    if (this.tradesExecuted > 0 && this.preSnapshot) {
      const postTrades = this.exchange.getTrades().slice(this.preTrades.length);
      if (postTrades.length >= 3) {
        this.impactAnalyzer.analyze(
          this.preTrades,
          postTrades,
          this.preSnapshot,
          snapshot,
        );
        this.preSnapshot = snapshot;
        this.preTrades = this.exchange.getTrades().slice();
      }
    }

    // Simulate market-maker noise orders to keep book alive
    this.addMarketMakerNoise(snapshot.midPrice);
  }

  /** Seed initial orderbook with synthetic market-maker resting orders. */
  private seedMarketMakers(): void {
    const mid = 1_000;
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      this.exchange.placeOrder({
        side: 'buy',
        price: mid - i * 0.5,
        size: 10 + Math.random() * 20,
        type: 'limit',
        owner: MARKET_MAKER_OWNER,
      });
      this.exchange.placeOrder({
        side: 'sell',
        price: mid + i * 0.5,
        size: 10 + Math.random() * 20,
        type: 'limit',
        owner: MARKET_MAKER_OWNER,
      });
    }
    logger.debug(`[ShadowLayeringEngine] Seeded ${levels * 2} market-maker orders`);
  }

  /** Add one random resting order to keep the book dynamic. */
  private addMarketMakerNoise(midPrice: number): void {
    if (midPrice <= 0) return;
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const offset = (0.5 + Math.random() * 2) * (side === 'buy' ? -1 : 1);
    this.exchange.placeOrder({
      side,
      price: midPrice + offset,
      size: 5 + Math.random() * 15,
      type: 'limit',
      owner: MARKET_MAKER_OWNER,
    });
  }
}

export type { Order, OrderbookSnapshot, Trade } from './exchange-simulator';
export type { StrategyConfig, StrategyAction } from './shadow-layering-strategy';
export type { ImpactReport } from './impact-analyzer';
export type { SpoofingAlert } from './defensive-detector';
