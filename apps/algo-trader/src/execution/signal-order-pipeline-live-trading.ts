/**
 * Signal-Order Pipeline for Live Trading — Orchestrates the full flow:
 * LiveExchangeManager ticks → candle aggregation → multi-strategy signal
 * generation → order execution through exchange router.
 *
 * Composes: LiveExchangeManager, TickToCandleAggregator, IStrategy[], ExchangeRouter
 */

import { EventEmitter } from 'events';
import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { LiveExchangeManager } from './live-exchange-manager';
import { TickToCandleAggregator } from './tick-to-candle-aggregator';
import { RouteResult } from './exchange-router-with-fallback';
import { PriceTick } from './websocket-multi-exchange-price-feed-manager';
import { logger } from '../utils/logger';

export interface SignalOrderPipelineConfig {
  manager: LiveExchangeManager;
  strategies: IStrategy[];
  symbol: string;
  candleIntervalMs?: number;      // default 60s
  minConfirmations?: number;      // min strategies agreeing, default 1
  dryRun?: boolean;               // log only, no real orders, default true
  maxPositionUsd?: number;        // max position size, default 1000
}

export interface PipelineSignal {
  strategy: string;
  signal: ISignal;
  timestamp: number;
}

export interface PipelineOrderResult {
  side: 'buy' | 'sell';
  symbol: string;
  confirmations: number;
  routeResult?: RouteResult;
  dryRun: boolean;
}

export class SignalOrderPipeline extends EventEmitter {
  private readonly manager: LiveExchangeManager;
  private readonly strategies: IStrategy[];
  private readonly symbol: string;
  private readonly candleIntervalMs: number;
  private readonly minConfirmations: number;
  private readonly dryRun: boolean;
  private readonly maxPositionUsd: number;

  private aggregator: TickToCandleAggregator;
  private running = false;
  private candleHistory: ICandle[] = [];
  private readonly maxHistory = 200;
  private position: 'flat' | 'long' = 'flat';

  constructor(config: SignalOrderPipelineConfig) {
    super();
    this.manager = config.manager;
    this.strategies = config.strategies;
    this.symbol = config.symbol;
    this.candleIntervalMs = config.candleIntervalMs ?? 60_000;
    this.minConfirmations = config.minConfirmations ?? 1;
    this.dryRun = config.dryRun ?? true;
    this.maxPositionUsd = config.maxPositionUsd ?? 1000;
    this.aggregator = new TickToCandleAggregator(this.candleIntervalMs);
  }

  async start(): Promise<void> {
    if (this.running) return;

    // Init strategies with empty history (live mode)
    for (const s of this.strategies) {
      await s.init([], {});
    }

    // Wire: WS ticks → aggregator
    const wsFeed = this.manager.getWsFeed();
    wsFeed?.on('tick', (tick: PriceTick) => this.onTick(tick));

    // Wire: aggregator candles → strategy evaluation
    this.aggregator.on('candle', (candle: ICandle) => this.onCandle(candle));

    this.aggregator.start();
    this.running = true;
    logger.info(`[Pipeline] Started: ${this.strategies.map(s => s.name).join(', ')} | ${this.symbol} | interval=${this.candleIntervalMs}ms | dryRun=${this.dryRun}`);
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    this.aggregator.stop();
    this.aggregator.removeAllListeners();
    logger.info('[Pipeline] Stopped');
    this.emit('stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  getPosition(): 'flat' | 'long' {
    return this.position;
  }

  getCandleHistory(): ICandle[] {
    return [...this.candleHistory];
  }

  private onTick(tick: PriceTick): void {
    // Only aggregate ticks for our target symbol
    if (this.normalizeSymbol(tick.symbol) === this.normalizeSymbol(this.symbol)) {
      this.aggregator.addTick(tick);
      this.emit('tick', tick);
    }
  }

  private async onCandle(candle: ICandle): Promise<void> {
    // Buffer history for strategies
    this.candleHistory.push(candle);
    if (this.candleHistory.length > this.maxHistory) {
      this.candleHistory.shift();
    }

    // Run all strategies in parallel
    const signals = await this.evaluateStrategies(candle);
    if (signals.length === 0) return;

    // Count confirmations per direction
    const buys = signals.filter(s => s.signal.type === SignalType.BUY);
    const sells = signals.filter(s => s.signal.type === SignalType.SELL);

    this.emit('signals', signals);

    // Execute if enough confirmations
    if (buys.length >= this.minConfirmations && this.position === 'flat') {
      await this.executeOrder('buy', candle.close, buys);
    } else if (sells.length >= this.minConfirmations && this.position === 'long') {
      await this.executeOrder('sell', candle.close, sells);
    }
  }

  private async evaluateStrategies(candle: ICandle): Promise<PipelineSignal[]> {
    const results: PipelineSignal[] = [];

    const promises = this.strategies.map(async (strategy) => {
      try {
        const signal = await strategy.onCandle(candle);
        if (signal && signal.type !== SignalType.NONE) {
          return { strategy: strategy.name, signal, timestamp: Date.now() };
        }
        return null;
      } catch (err) {
        logger.error(`[Pipeline] Strategy ${strategy.name} error: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }
    });

    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    return results;
  }

  private async executeOrder(
    side: 'buy' | 'sell',
    price: number,
    confirmations: PipelineSignal[],
  ): Promise<void> {
    const result: PipelineOrderResult = {
      side,
      symbol: this.symbol,
      confirmations: confirmations.length,
      dryRun: this.dryRun,
    };

    const strategyNames = confirmations.map(c => c.strategy).join(', ');

    if (this.dryRun) {
      logger.info(`[Pipeline][DRY-RUN] ${side.toUpperCase()} ${this.symbol} @ $${price.toFixed(2)} | Confirmed by: ${strategyNames}`);
      this.position = side === 'buy' ? 'long' : 'flat';
      this.emit('order', result);
      return;
    }

    // Live execution via ExchangeRouter
    const router = this.manager.getRouter();
    const amount = this.maxPositionUsd / price;

    try {
      const routeResult = await router.route<unknown>(
        'pipeline',
        async (exchangeId: string) => {
          logger.info(`[Pipeline] ${side.toUpperCase()} ${amount.toFixed(6)} ${this.symbol} on ${exchangeId} @ ~$${price.toFixed(2)}`);
          // Exchange-specific order creation would go here
          // For now, return execution info
          return { exchangeId, side, amount, price, timestamp: Date.now() };
        },
        amount * price,
        amount * price * 0.001,
      );

      result.routeResult = routeResult;
      if (routeResult.success) {
        this.position = side === 'buy' ? 'long' : 'flat';
        logger.info(`[Pipeline] Order filled on ${routeResult.exchangeId} (${routeResult.latency}ms) | ${strategyNames}`);
      } else {
        logger.error(`[Pipeline] Order failed: ${routeResult.error}`);
      }
    } catch (err) {
      logger.error(`[Pipeline] Execution error: ${err instanceof Error ? err.message : String(err)}`);
    }

    this.emit('order', result);
  }

  private normalizeSymbol(symbol: string): string {
    return symbol.replace(/[-_]/g, '/').toUpperCase();
  }
}
