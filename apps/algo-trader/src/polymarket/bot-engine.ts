/**
 * Polymarket Bot Engine
 *
 * Main orchestrator for all 9 Polymarket trading strategies:
 * 1. ComplementaryArb - YES+NO != 1.0 arbitrage
 * 2. MakerBot - Two-sided market making
 * 3. WeatherBot - Weather event prediction
 * 4. AI Reasoning - LLM ensemble predictions
 * 5. Hedge Discovery - Related market inconsistencies
 * 6. Whale Tracking - Copy successful traders
 * 7. ListingArb - Binance listing arbitrage
 * 8. CrossPlatformArb - Polymarket vs Kalshi arb
 * 9. MarketMaker - Two-sided liquidity provision
 *
 * Architecture:
 * - PolymarketAdapter → Real-time price feeds
 * - StrategyManager → Runs all strategies
 * - SignalRouter → Routes signals to execution
 * - RiskManager → Position limits, daily stops
 * - PortfolioManager → Track positions across markets
 */

import { EventEmitter } from 'events';
import { PolymarketAdapter, PolymarketTick } from '../execution/polymarket-adapter';
import {
  ComplementaryArbStrategy,
  MakerBotStrategy,
  WeatherBotStrategy,
  AIReasoningStrategy,
  HedgeDiscoveryStrategy,
  WhaleTrackingStrategy,
  ListingArbStrategy,
  CrossPlatformArbStrategy,
  MarketMakerStrategy,
} from '../strategies/polymarket';
import { IPolymarketSignal, IPolymarketOrder } from '../interfaces/IPolymarket';
import { logger } from '../utils/logger';

interface BotStatus {
  running: boolean;
  uptimeMs: number;
  uptimeHuman: string;
  mode: 'DRY_RUN' | 'LIVE';
  totalSignals: number;
  executedTrades: number;
  rejectedTrades: number;
  dailyPnL: number;
  dailyVolume: number;
  strategies: Array<{ name: string; enabled: boolean; signalCount: number }>;
}

export interface PolymarketBotConfig {
  dryRun: boolean;
  maxBankroll: number;         // Max total capital (default $10,000)
  maxPositionPct: number;      // Max per position (default 6%)
  maxDailyLoss: number;        // Max daily loss (default 5%)
  minEdgeThreshold: number;    // Minimum edge to trade (default 3%)
  enabledStrategies: string[]; // Which strategies to run
}

interface StrategyInstance {
  name: string;
  instance: unknown;
  enabled: boolean;
  lastSignal: number;
  signalCount: number;
}

interface BotState {
  running: boolean;
  startTime: number;
  totalSignals: number;
  executedTrades: number;
  rejectedTrades: number;
  dailyPnL: number;
  dailyVolume: number;
}

export class PolymarketBotEngine extends EventEmitter {
  private adapter: PolymarketAdapter;
  private config: Required<PolymarketBotConfig>;
  private strategies = new Map<string, StrategyInstance>();
  private state: BotState = {
    running: false,
    startTime: 0,
    totalSignals: 0,
    executedTrades: 0,
    rejectedTrades: 0,
    dailyPnL: 0,
    dailyVolume: 0,
  };

  // Risk tracking
  private dailyLoss = 0;

  constructor(config: Partial<PolymarketBotConfig> = {}) {
    super();
    this.config = {
      dryRun: config.dryRun ?? true,
      maxBankroll: config.maxBankroll ?? 10000,
      maxPositionPct: config.maxPositionPct ?? 0.06,
      maxDailyLoss: config.maxDailyLoss ?? 0.05,
      minEdgeThreshold: config.minEdgeThreshold ?? 0.03,
      enabledStrategies: config.enabledStrategies ?? [
        'ComplementaryArb',
        'MakerBot',
        'WeatherBot',
        'AI Reasoning',
        'Hedge Discovery',
        'Whale Tracking',
        'ListingArb',
        'CrossPlatformArb',
        'MarketMaker',
      ],
    };

    // Initialize Polymarket adapter
    this.adapter = new PolymarketAdapter({
      privateKey: process.env.PRIVATE_KEY,
      apiKey: process.env.POLYMARKET_API_KEY,
      apiSecret: process.env.POLYMARKET_API_SECRET,
      apiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
    });

    // Initialize strategies
    this.initStrategies();
  }

  private initStrategies(): void {
    // 1. Complementary Arbitrage
    const arbStrategy = new ComplementaryArbStrategy();
    arbStrategy.updateConfig({
      minEdgeThreshold: this.config.minEdgeThreshold,
      maxPositionSize: Math.floor(this.config.maxBankroll * this.config.maxPositionPct / 10),
    });
    this.strategies.set('ComplementaryArb', {
      name: 'ComplementaryArb',
      instance: arbStrategy,
      enabled: this.config.enabledStrategies.includes('ComplementaryArb'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 2. Maker Bot
    const makerStrategy = new MakerBotStrategy();
    makerStrategy.updateConfig({
      spreadBps: 200,
      orderSize: 50,
      maxInventory: 200,
    });
    this.strategies.set('MakerBot', {
      name: 'MakerBot',
      instance: makerStrategy,
      enabled: this.config.enabledStrategies.includes('MakerBot'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 3. Weather Bot
    const weatherStrategy = new WeatherBotStrategy();
    weatherStrategy.updateConfig({
      minEdgeThreshold: 0.05,
      maxPositionSize: 50,
    });
    this.strategies.set('WeatherBot', {
      name: 'WeatherBot',
      instance: weatherStrategy,
      enabled: this.config.enabledStrategies.includes('WeatherBot'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 4. AI Reasoning
    const aiStrategy = new AIReasoningStrategy();
    aiStrategy.updateConfig({
      minEdgeThreshold: 0.08,
      maxPositionSize: 30,
    });
    this.strategies.set('AI Reasoning', {
      name: 'AI Reasoning',
      instance: aiStrategy,
      enabled: this.config.enabledStrategies.includes('AI Reasoning'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 5. Hedge Discovery
    const hedgeStrategy = new HedgeDiscoveryStrategy();
    hedgeStrategy.updateConfig({
      minEdgeThreshold: 0.03,
      maxPositionSize: 40,
    });
    this.strategies.set('Hedge Discovery', {
      name: 'Hedge Discovery',
      instance: hedgeStrategy,
      enabled: this.config.enabledStrategies.includes('Hedge Discovery'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 6. Whale Tracking
    const whaleStrategy = new WhaleTrackingStrategy();
    whaleStrategy.updateConfig({
      minWinRate: 0.55,
      maxPositionSize: 25,
    });
    this.strategies.set('Whale Tracking', {
      name: 'Whale Tracking',
      instance: whaleStrategy,
      enabled: this.config.enabledStrategies.includes('Whale Tracking'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 7. Listing Arbitrage
    const listingStrategy = new ListingArbStrategy();
    listingStrategy.updateConfig({
      minEdgeThreshold: 0.03,
      maxPositionSize: 50,
    });
    this.strategies.set('ListingArb', {
      name: 'ListingArb',
      instance: listingStrategy,
      enabled: this.config.enabledStrategies.includes('ListingArb'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 8. Cross-Platform Arbitrage
    const crossPlatformStrategy = new CrossPlatformArbStrategy();
    crossPlatformStrategy.updateConfig({
      minEdgeThreshold: 0.01,
      maxPositionSize: 100,
      feeRateBps: 25,
    });
    this.strategies.set('CrossPlatformArb', {
      name: 'CrossPlatformArb',
      instance: crossPlatformStrategy,
      enabled: this.config.enabledStrategies.includes('CrossPlatformArb'),
      lastSignal: 0,
      signalCount: 0,
    });

    // 9. Market Maker
    const mmStrategy = new MarketMakerStrategy();
    mmStrategy.updateConfig({
      targetSpread: 0.10,
      orderSize: 50,
      maxInventory: 200,
      cancelReplaceMs: 5000,
    });
    this.strategies.set('MarketMaker', {
      name: 'MarketMaker',
      instance: mmStrategy,
      enabled: this.config.enabledStrategies.includes('MarketMaker'),
      lastSignal: 0,
      signalCount: 0,
    });

    logger.info(`[BotEngine] Initialized ${this.strategies.size} strategies`);
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.state.running) return;

    logger.info('[BotEngine] Starting...');

    // Connect to Polymarket
    await this.adapter.connect();

    // Wire up tick handler
    this.adapter.on('tick', (tick: PolymarketTick) => {
      this.handleTick(tick);
    });

    // Wire up order events
    this.adapter.on('order:placed', (order: IPolymarketOrder) => {
      this.state.executedTrades++;
      this.emit('trade:executed', order);
    });

    this.state.running = true;
    this.state.startTime = Date.now();

    logger.info(`[BotEngine] Started in ${this.config.dryRun ? 'DRY RUN' : 'LIVE'} mode`);
    this.emit('started', { dryRun: this.config.dryRun });
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (!this.state.running) return;

    logger.info('[BotEngine] Stopping...');

    // Cancel all open orders
    await this.adapter.cancelAllOrders();

    // Disconnect
    await this.adapter.disconnect();

    this.state.running = false;
    this.emit('stopped');

    logger.info('[BotEngine] Stopped');
  }

  /**
   * Handle price tick from adapter
   */
  private handleTick(tick: PolymarketTick): void {
    if (!this.state.running) return;

    // Run each enabled strategy on the tick
    for (const [, strategy] of this.strategies) {
      if (!strategy.enabled) continue;

      try {
        const signals = this.runStrategy(strategy, tick);
        for (const signal of signals) {
          this.processSignal(signal);
        }
      } catch (err) {
        logger.error(`[BotEngine] Strategy error (${strategy.name}):`, err instanceof Error ? err.message : String(err));
      }
    }
  }

  /**
   * Run strategy on tick
   */
  private runStrategy(strategy: StrategyInstance, tick: PolymarketTick): IPolymarketSignal[] {
    const signals: IPolymarketSignal[] = [];

    // Try processTick method
    if (typeof strategy.instance.processTick === 'function') {
      const signal = strategy.instance.processTick(tick);
      if (signal) signals.push(signal);
    }

    return signals;
  }

  /**
   * Process signal through risk checks
   */
  private processSignal(signal: IPolymarketSignal): void {
    this.state.totalSignals++;

    // Risk check 1: Daily loss limit
    if (this.dailyLoss >= this.config.maxDailyLoss * this.config.maxBankroll) {
      logger.warn('[BotEngine] Daily loss limit reached - rejecting signal');
      this.state.rejectedTrades++;
      this.emit('signal:rejected', { signal, reason: 'daily_loss_limit' });
      return;
    }

    // Risk check 2: Position size
    const maxPosition = this.config.maxBankroll * this.config.maxPositionPct;
    const notionalValue = signal.price * signal.size;
    if (notionalValue > maxPosition) {
      logger.warn('[BotEngine] Position size exceeded - rejecting signal');
      this.state.rejectedTrades++;
      this.emit('signal:rejected', { signal, reason: 'position_size' });
      return;
    }

    // Risk check 3: Minimum edge
    if (signal.expectedValue && signal.expectedValue < notionalValue * this.config.minEdgeThreshold) {
      logger.warn('[BotEngine] Edge too small - rejecting signal');
      this.state.rejectedTrades++;
      this.emit('signal:rejected', { signal, reason: 'insufficient_edge' });
      return;
    }

    // Execute signal
    this.executeSignal(signal);
  }

  /**
   * Execute signal (place order)
   */
  private async executeSignal(signal: IPolymarketSignal): Promise<void> {
    if (this.config.dryRun) {
      logger.info(`[BotEngine] DRY RUN: ${signal.action} ${signal.size} ${signal.side} @ ${signal.price}`);
      this.emit('signal:executed', { signal, dryRun: true });
      return;
    }

    try {
      if (signal.action === 'CANCEL') {
        await this.adapter.cancelOrder(signal.tokenId);
      } else if (signal.action === 'BUY') {
        const order = await this.adapter.placeLimitOrder(
          signal.tokenId,
          signal.price,
          signal.size,
          signal.side === 'YES' ? 'BUY' : 'SELL',
        );
        logger.info(`[BotEngine] Order placed: ${order.orderId}`);
        this.emit('order:placed', order);
      }
    } catch (err) {
      logger.error('[BotEngine] Execution error:', err instanceof Error ? err.message : String(err));
      this.emit('execution:error', { signal, error: err });
    }
  }

  /**
   * Get bot status
   */
  getStatus(): BotStatus {
    const uptime = Date.now() - this.state.startTime;
    return {
      running: this.state.running,
      uptimeMs: uptime,
      uptimeHuman: this.formatUptime(uptime),
      mode: this.config.dryRun ? 'DRY_RUN' : 'LIVE',
      totalSignals: this.state.totalSignals,
      executedTrades: this.state.executedTrades,
      rejectedTrades: this.state.rejectedTrades,
      dailyPnL: this.state.dailyPnL,
      dailyVolume: this.state.dailyVolume,
      strategies: Array.from(this.strategies.values()).map(s => ({
        name: s.name,
        enabled: s.enabled,
        signalCount: s.signalCount,
      })),
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
}
