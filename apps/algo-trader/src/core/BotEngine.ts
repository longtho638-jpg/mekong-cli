import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { IExchange } from '../interfaces/IExchange';
import { RiskManager } from './RiskManager';
import { OrderManager } from './OrderManager';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';
import { PluginManager, BotPlugin } from './bot-engine-plugins';
import {
  AgentEventBus,
  SignalExplainer,
  TradeAuditLogger,
  AutonomyController,
  AgentEventType,
  AutonomyLevel,
} from '../a2ui';
import { SignalMesh } from '../netdata/SignalMesh';
import { TickStore } from '../netdata/TickStore';
import { HealthManager } from '../netdata/HealthManager';
import { BotConfig } from './bot-engine-config-and-state-types';
import { BotTradeExecutor } from './bot-engine-trade-executor-and-position-manager';
import { AGIAdapter } from '../agi/integration/agi-adapter';
import { loadAGIConfig } from '../agi/integration/agi-config';

export type { BotConfig };

export class BotEngine {
  private strategy: IStrategy;
  private dataProvider: IDataProvider;
  private exchange: IExchange;
  private config: BotConfig;
  private isRunning = false;
  private isProcessingSignal = false; // Prevent race conditions during async trade execution
  private tradeExecutor: BotTradeExecutor;
  private agiAdapter?: AGIAdapter;

  // A2UI subsystem
  readonly eventBus: AgentEventBus;
  readonly signalExplainer: SignalExplainer;
  readonly auditLogger: TradeAuditLogger;
  readonly autonomyController: AutonomyController;

  // Netdata-inspired subsystem
  readonly signalMesh: SignalMesh;
  readonly tickStore: TickStore;
  readonly healthManager: HealthManager;
  readonly pluginManager: PluginManager;

  constructor(
    strategy: IStrategy,
    dataProvider: IDataProvider,
    exchange: IExchange,
    config: BotConfig,
    orderManager?: OrderManager
  ) {
    this.strategy = strategy;
    this.dataProvider = dataProvider;
    this.exchange = exchange;
    this.config = config;

    // Initialize A2UI subsystem
    this.eventBus = new AgentEventBus();
    this.signalExplainer = new SignalExplainer(this.eventBus);
    this.auditLogger = new TradeAuditLogger(this.eventBus);
    this.autonomyController = new AutonomyController(this.eventBus, {
      defaultLevel: config.autonomyLevel ?? AutonomyLevel.ACT_CONFIRM,
    });

    // Initialize Netdata-inspired subsystem
    this.signalMesh = new SignalMesh();
    this.tickStore = new TickStore(10000); // Store 10k ticks in hot storage
    this.healthManager = new HealthManager(this.signalMesh);
    this.pluginManager = new PluginManager(this.eventBus, config as unknown as Record<string, unknown>);

    // Initialize trade executor (owns executeTrade, syncPositionState, checkDrawdown)
    this.tradeExecutor = new BotTradeExecutor(
      exchange,
      orderManager ?? new OrderManager(),
      config,
      this.eventBus,
      this.auditLogger,
      this.autonomyController,
    );

    // Initialize AGI adapter if enabled
    const agiConfig = loadAGIConfig();
    if (agiConfig.agiEnabled) {
      this.agiAdapter = new AGIAdapter({
        enabled: agiConfig.agiEnabled,
        ollamaBaseUrl: agiConfig.agiBaseUrl,
        model: agiConfig.agiModel,
        timeoutMs: agiConfig.agiTimeoutMs,
        minConfidence: agiConfig.agiMinConfidence,
        fallbackToRules: agiConfig.agiFallbackToRules,
      });
      logger.info('[AGI] AGI Adapter initialized with model:', agiConfig.agiModel);
    }
  }

  /** Register a plugin with the engine */
  registerPlugin(plugin: BotPlugin) {
    this.pluginManager.register(plugin);
  }

  async start() {
    logger.info('Starting Bot Engine with Netdata-inspired architecture + Plugin System...');
    await this.exchange.connect();
    await this.dataProvider.init();

    if (this.strategy.onStart) {
      await this.strategy.onStart();
    }
    await this.pluginManager.onStart();
    await this.tradeExecutor.syncPositionState();

    if (this.config.maxDrawdownPercent !== undefined) {
      await this.tradeExecutor.seedPeakBalance();
    }

    // Subscribe BotEngine to SignalMesh instead of directly to dataProvider
    this.signalMesh.subscribe('tick', (signal) => {
      const candle = signal.payload as ICandle;
      this.onCandle(candle);
      this.pluginManager.onTick({ price: candle.close, timestamp: candle.timestamp });
      if (this.strategy.onTick) {
        this.strategy.onTick({ price: candle.close, timestamp: candle.timestamp }).then(tickSignal => {
          if (tickSignal) this.onSignalGenerated(tickSignal);
        });
      }
    });

    // Proxy dataProvider ticks to SignalMesh
    this.dataProvider.subscribe((candle) => {
      this.tickStore.addTick(candle);
      this.signalMesh.publish('tick', { ...candle }, 'data-provider');
    });

    await this.dataProvider.start();
    this.healthManager.startMonitoring(5000);
    this.isRunning = true;
    logger.info('Bot Engine Running.');
  }

  async stop() {
    logger.info('Stopping Bot Engine...');
    try {
      await this.dataProvider.stop();
      this.healthManager.stopMonitoring();
      if (this.strategy.onFinish) {
        await this.strategy.onFinish();
      }
      await this.pluginManager.onStop();
      await this.pluginManager.onFinish();
    } catch (error) {
      logger.error(`Error stopping bot components: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.isRunning = false;
  }

  private async onCandle(candle: ICandle) {
    if (!this.isRunning || this.isProcessingSignal) return;

    try {
      this.isProcessingSignal = true;
      await this.pluginManager.onCandle(candle);

      const drawdownTriggered = await this.tradeExecutor.checkDrawdown();
      if (drawdownTriggered) {
        await this.stop();
        return;
      }

      // Check hard SL/TP before strategy signals
      const { openPosition, entryPrice } = this.tradeExecutor.state;
      if (openPosition && entryPrice > 0 && this.config.stopLoss) {
        const sltp = RiskManager.checkStopLossTakeProfit(
          candle.close, entryPrice, 'buy', this.config.stopLoss
        );
        if (sltp.stopLossHit) {
          logger.warn(`[SL] Stop-loss triggered @ $${candle.close} (entry: $${entryPrice}, SL: $${sltp.stopLossPrice.toFixed(2)})`);
          await this.tradeExecutor.executeTrade('sell', candle.close, this.strategy.name);
          return;
        }
        if (sltp.takeProfitHit) {
          logger.info(`[TP] Take-profit triggered @ $${candle.close} (entry: $${entryPrice}, TP: $${sltp.takeProfitPrice.toFixed(2)})`);
          await this.tradeExecutor.executeTrade('sell', candle.close, this.strategy.name);
          return;
        }
      }

      const signal = await this.strategy.onCandle(candle);
      if (signal) {
        await this.onSignalGenerated(signal);
      }
    } catch (error: unknown) {
      logger.error(`Error in onCandle processing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isProcessingSignal = false;
    }
  }

  /** Handle a signal generated by a strategy (either from candle or tick) */
  private async onSignalGenerated(rawSignal: ISignal) {
    let signal: ISignal = rawSignal;
    if (this.strategy.onSignal) {
      const strategyResult = await this.strategy.onSignal(rawSignal);
      if (!strategyResult) return;
      signal = strategyResult;
    }

    const pluginResult = await this.pluginManager.onSignal(signal);
    if (!pluginResult) return;
    signal = pluginResult;

    // AGI enhancement step
    let agiEnhanced = false;
    let agiConfidence = 0;
    if (this.agiAdapter) {
      try {
        const indicators: Record<string, number> = {
          price: signal.price,
          ...(signal.metadata as Record<string, number> || {})
        };
        const enhanced = await this.agiAdapter.enhanceSignal({
          type: signal.type as 'BUY' | 'SELL' | 'HOLD',
          symbol: this.config.symbol,
          timestamp: Date.now(),
          indicators,
          price: signal.price,
        });

        agiEnhanced = enhanced.agiEnhanced;
        agiConfidence = enhanced.confidence;

        // If AGI overrides signal, use AGI decision
        if (agiEnhanced && enhanced.combinedAction !== signal.type) {
          logger.info(`[AGI] Override: ${signal.type} → ${enhanced.combinedAction} (confidence: ${agiConfidence.toFixed(2)})`);
          signal.type = enhanced.combinedAction === 'BUY' ? SignalType.BUY
            : enhanced.combinedAction === 'SELL' ? SignalType.SELL
            : SignalType.NONE;
        }
      } catch (error) {
        logger.error(`[AGI] Enhancement failed: ${error instanceof Error ? error.message : String(error)}`);
        // Fallback to original signal (already in place)
      }
    }

    const indicators: Record<string, number> = { price: signal.price, ...(signal.metadata as Record<string, number> || {}) };
    this.signalExplainer.explainSignal(this.strategy.name, signal.type as 'BUY' | 'SELL' | 'NONE', indicators);
    logger.info(`[SIGNAL] ${signal.type} @ ${signal.price} (${JSON.stringify(signal.metadata || {})})${agiEnhanced ? ` [AGI:${agiConfidence.toFixed(2)}]` : ''}`);

    const { openPosition } = this.tradeExecutor.state;

    if (signal.type === SignalType.BUY && !openPosition) {
      this.eventBus.emit({
        type: AgentEventType.INTENT_PREVIEW,
        tenantId: this.config.tenantId,
        timestamp: Date.now(),
        action: 'BUY',
        symbol: this.config.symbol,
        amount: 0,
        price: signal.price,
        rationale: `Strategy ${this.strategy.name} generated BUY signal`,
        confidence: 0.7,
        requiresConfirmation: this.autonomyController.requiresConfirmation(this.strategy.name),
      });
      await this.tradeExecutor.executeTrade('buy', signal.price, this.strategy.name);
    } else if (signal.type === SignalType.SELL && openPosition) {
      this.eventBus.emit({
        type: AgentEventType.INTENT_PREVIEW,
        tenantId: this.config.tenantId,
        timestamp: Date.now(),
        action: 'SELL',
        symbol: this.config.symbol,
        amount: 0,
        price: signal.price,
        rationale: `Strategy ${this.strategy.name} generated SELL signal`,
        confidence: 0.7,
        requiresConfirmation: this.autonomyController.requiresConfirmation(this.strategy.name),
      });
      await this.tradeExecutor.executeTrade('sell', signal.price, this.strategy.name);
    }
  }
}
