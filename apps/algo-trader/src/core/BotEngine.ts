import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { IExchange } from '../interfaces/IExchange';
import { RiskManager, StopLossTakeProfitConfig } from './RiskManager';
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

export interface BotConfig {
  tenantId: string; // Multi-tenant isolation
  symbol: string;
  riskPercentage: number;
  pollInterval: number; // ms
  maxDrawdownPercent?: number; // Optional: stop bot when drawdown exceeds this % (e.g. 10 = 10%)
  minPositionValueUsd?: number; // Minimum USD value to consider position open (default: 10)
  feeRate?: number; // Trading fee rate per side (default: 0.001 = 0.1%)
  stopLoss?: StopLossTakeProfitConfig; // Hard stop-loss + take-profit config
  autonomyLevel?: AutonomyLevel; // A2UI autonomy dial (default: ACT_CONFIRM)
}

export class BotEngine {
  private strategy: IStrategy;
  private dataProvider: IDataProvider;
  private exchange: IExchange;
  private orderManager: OrderManager;
  private config: BotConfig;
  private isRunning = false;
  private openPosition = false; // Simplified state tracking
  private baseCurrency: string;
  private quoteCurrency: string;
  private isProcessingSignal = false; // Prevent race conditions during async trade execution
  private peakBalance = 0; // Drawdown protection: track highest balance seen
  private entryPrice = 0; // Track entry price for P&L calculation

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
    this.orderManager = orderManager ?? new OrderManager();
    this.config = config;
    const [base, quote] = this.config.symbol.split('/');
    this.baseCurrency = base;
    this.quoteCurrency = quote;

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
  }

  /**
   * Register a plugin with the engine
   */
  registerPlugin(plugin: BotPlugin) {
    this.pluginManager.register(plugin);
  }

  async start() {
    logger.info('Starting Bot Engine with Netdata-inspired architecture + Plugin System...');
    await this.exchange.connect();
    await this.dataProvider.init();

    // Strategy onStart lifecycle
    if (this.strategy.onStart) {
      await this.strategy.onStart();
    }

    // Plugin onStart lifecycle
    await this.pluginManager.onStart();

    // Sync position state before starting
    await this.syncPositionState();

    // Seed initial peak balance for drawdown tracking
    if (this.config.maxDrawdownPercent !== undefined) {
      const balances = await this.exchange.fetchBalance();
      this.peakBalance = balances[this.quoteCurrency]?.free || 0;
      logger.info(`Drawdown protection active: max ${this.config.maxDrawdownPercent}%, initial balance ${this.peakBalance}`);
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

      // Strategy onFinish lifecycle
      if (this.strategy.onFinish) {
        await this.strategy.onFinish();
      }

      // Plugin onFinish/onStop lifecycle
      await this.pluginManager.onStop();
      await this.pluginManager.onFinish();
    } catch (error) {
      logger.error(`Error stopping bot components: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.isRunning = false;
  }

  /**
   * Syncs the local openPosition state with the actual exchange balance.
   */
  private async syncPositionState() {
    try {
      const balances = await this.exchange.fetchBalance();
      const ticker = await this.exchange.fetchTicker(this.config.symbol);
      const baseBalance = balances[this.baseCurrency]?.total || 0;

      const minValue = this.config.minPositionValueUsd ?? 10;
      const valueInQuote = baseBalance * ticker;
      this.openPosition = valueInQuote > minValue;

      if (this.openPosition) {
        this.entryPrice = ticker; // Approximate entry as current price on startup
      }

      logger.info(`[SYNC] Position: ${this.openPosition ? 'OPEN' : 'CLOSED'} (${baseBalance} ${this.baseCurrency} = $${valueInQuote.toFixed(2)}, threshold: $${minValue})`);
    } catch (error) {
      logger.error(`Failed to sync position state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if current balance has breached the max drawdown threshold.
   * Returns true if drawdown protection triggered (bot should stop).
   */
  private async checkDrawdown(): Promise<boolean> {
    if (this.config.maxDrawdownPercent === undefined) return false;

    const balances = await this.exchange.fetchBalance();
    const currentBalance = balances[this.quoteCurrency]?.free || 0;

    if (currentBalance > this.peakBalance) {
      this.peakBalance = currentBalance;
    }

    if (this.peakBalance === 0) return false;

    const drawdown = ((this.peakBalance - currentBalance) / this.peakBalance) * 100;
    if (drawdown >= this.config.maxDrawdownPercent) {
      logger.warn(`[DRAWDOWN] ${drawdown.toFixed(2)}% drawdown hit (limit: ${this.config.maxDrawdownPercent}%). Stopping bot.`);
      // A2UI: Risk alert + escalation
      this.eventBus.emit({
        type: AgentEventType.RISK_ALERT,
        tenantId: this.config.tenantId,
        timestamp: Date.now(),
        alertType: 'drawdown',
        value: drawdown,
        threshold: this.config.maxDrawdownPercent,
        message: `Drawdown ${drawdown.toFixed(2)}% exceeded limit ${this.config.maxDrawdownPercent}%`,
      });
      this.eventBus.emit({
        type: AgentEventType.ESCALATION,
        tenantId: this.config.tenantId,
        timestamp: Date.now(),
        severity: 'critical',
        reason: `Max drawdown breached: ${drawdown.toFixed(2)}%`,
        suggestedAction: 'Bot halted. Review positions and risk parameters.',
        autoHalted: true,
      });
      this.autonomyController.escalate(this.strategy.name, 'Drawdown limit breached');
      return true;
    }

    return false;
  }

  private async onCandle(candle: ICandle) {
    if (!this.isRunning || this.isProcessingSignal) return;

    try {
      this.isProcessingSignal = true;

      // Plugin onCandle hook
      await this.pluginManager.onCandle(candle);

      // Drawdown check before processing any signal
      const drawdownTriggered = await this.checkDrawdown();
      if (drawdownTriggered) {
        await this.stop();
        return;
      }

      // Check hard SL/TP before strategy signals
      if (this.openPosition && this.entryPrice > 0 && this.config.stopLoss) {
        const sltp = RiskManager.checkStopLossTakeProfit(
          candle.close, this.entryPrice, 'buy', this.config.stopLoss
        );
        if (sltp.stopLossHit) {
          logger.warn(`[SL] Stop-loss triggered @ $${candle.close} (entry: $${this.entryPrice}, SL: $${sltp.stopLossPrice.toFixed(2)})`);
          await this.executeTrade('sell', candle.close);
          return;
        }
        if (sltp.takeProfitHit) {
          logger.info(`[TP] Take-profit triggered @ $${candle.close} (entry: $${this.entryPrice}, TP: $${sltp.takeProfitPrice.toFixed(2)})`);
          await this.executeTrade('sell', candle.close);
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

  /**
   * Handle a signal generated by a strategy (either from candle or tick)
   */
  private async onSignalGenerated(rawSignal: ISignal) {
    // Strategy onSignal hook
    let signal: ISignal = rawSignal;
    if (this.strategy.onSignal) {
      const strategyResult = await this.strategy.onSignal(rawSignal);
      if (!strategyResult) return;
      signal = strategyResult;
    }

    // Plugin onSignal hook
    const pluginResult = await this.pluginManager.onSignal(signal);
    if (!pluginResult) return;
    signal = pluginResult;

    // A2UI: Explain signal rationale
    const indicators: Record<string, number> = { price: signal.price, ...(signal.metadata as Record<string, number> || {}) };
    this.signalExplainer.explainSignal(this.strategy.name, signal.type as 'BUY' | 'SELL' | 'NONE', indicators);

    logger.info(`[SIGNAL] ${signal.type} @ ${signal.price} (${JSON.stringify(signal.metadata || {})})`);

    // A2UI: Emit intent preview before execution
    if (signal.type === SignalType.BUY && !this.openPosition) {
      this.eventBus.emit({
        type: AgentEventType.INTENT_PREVIEW,
        tenantId: this.config.tenantId,
        timestamp: Date.now(),
        action: 'BUY',
        symbol: this.config.symbol,
        amount: 0, // Calculated in executeTrade
        price: signal.price,
        rationale: `Strategy ${this.strategy.name} generated BUY signal`,
        confidence: 0.7,
        requiresConfirmation: this.autonomyController.requiresConfirmation(this.strategy.name),
      });
      await this.executeTrade('buy', signal.price);
    } else if (signal.type === SignalType.SELL && this.openPosition) {
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
      await this.executeTrade('sell', signal.price);
    }
  }

  private async executeTrade(side: 'buy' | 'sell', currentPrice: number) {
    const isBuy = side === 'buy';
    const currency = isBuy ? this.quoteCurrency : this.baseCurrency;

    const balances = await this.exchange.fetchBalance();
    const balance = balances[currency]?.free || 0;

    if (balance === 0) {
      logger.warn(`Insufficient ${currency} balance for ${side}.`);
      return;
    }

    const amount = isBuy
      ? RiskManager.calculatePositionSize(balance, this.config.riskPercentage, currentPrice)
      : balance;

    if (amount <= 0 || !isFinite(amount)) {
      logger.warn(`Invalid position size: ${amount}. Skipping ${side}.`);
      return;
    }

    const feeRate = this.config.feeRate ?? 0.001;
    const estimatedFee = amount * currentPrice * feeRate;
    logger.info(`Executing ${side.toUpperCase()} ${amount} ${this.config.symbol} @ ~$${currentPrice} (est. fee: $${estimatedFee.toFixed(4)})`);

    try {
      const order = await this.exchange.createMarketOrder(this.config.symbol, side, amount);

      // Only update position state AFTER order confirmed filled
      if (order.status === 'closed' || order.amount > 0) {
        this.orderManager.addOrder(order);
        this.openPosition = isBuy;

        // A2UI: Audit trade execution
        const pnl = isBuy ? undefined : (order.price - this.entryPrice) * order.amount;
        this.eventBus.emit({
          type: AgentEventType.TRADE_EXECUTED,
          tenantId: this.config.tenantId,
          timestamp: Date.now(),
          orderId: order.id,
          side,
          symbol: this.config.symbol,
          amount: order.amount,
          price: order.price,
          fee: estimatedFee,
          pnl,
        });
        this.auditLogger.log(
          `TRADE_${side.toUpperCase()}`,
          `${side.toUpperCase()} ${order.amount} ${this.config.symbol} @ $${order.price}`,
          false,
          { orderId: order.id, pnl }
        );

        if (isBuy) {
          this.entryPrice = order.price || currentPrice;
        } else {
          const closePnl = (order.price - this.entryPrice) * order.amount;
          logger.info(`[P&L] Trade closed: ${closePnl >= 0 ? '+' : ''}$${closePnl.toFixed(2)} (entry: $${this.entryPrice}, exit: $${order.price})`);
          this.autonomyController.recordSuccess(this.strategy.name);
          this.entryPrice = 0;
        }
      } else {
        logger.warn(`Order ${order.id} status: ${order.status} — position state NOT updated. Manual check required.`);
      }
    } catch (error) {
      logger.error(`${side} order FAILED: ${error instanceof Error ? error.message : String(error)}`);
      // Re-sync position state after failed order to prevent desync
      await this.syncPositionState();
    }
  }
}
