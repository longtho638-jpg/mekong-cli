import { IStrategy, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { IExchange } from '../interfaces/IExchange';
import { RiskManager, StopLossTakeProfitConfig } from './RiskManager';
import { OrderManager } from './OrderManager';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';

export interface BotConfig {
  symbol: string;
  riskPercentage: number;
  pollInterval: number; // ms
  maxDrawdownPercent?: number; // Optional: stop bot when drawdown exceeds this % (e.g. 10 = 10%)
  minPositionValueUsd?: number; // Minimum USD value to consider position open (default: 10)
  feeRate?: number; // Trading fee rate per side (default: 0.001 = 0.1%)
  stopLoss?: StopLossTakeProfitConfig; // Hard stop-loss + take-profit config
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
  }

  async start() {
    logger.info('Starting Bot Engine...');
    await this.exchange.connect();
    await this.dataProvider.init();

    // Sync position state before starting
    await this.syncPositionState();

    // Seed initial peak balance for drawdown tracking
    if (this.config.maxDrawdownPercent !== undefined) {
      const balances = await this.exchange.fetchBalance();
      this.peakBalance = balances[this.quoteCurrency]?.free || 0;
      logger.info(`Drawdown protection active: max ${this.config.maxDrawdownPercent}%, initial balance ${this.peakBalance}`);
    }

    this.dataProvider.subscribe(this.onCandle.bind(this));
    await this.dataProvider.start();

    this.isRunning = true;
    logger.info('Bot Engine Running.');
  }

  async stop() {
    logger.info('Stopping Bot Engine...');
    try {
      await this.dataProvider.stop();
    } catch (error) {
      logger.error(`Error stopping data provider: ${error instanceof Error ? error.message : String(error)}`);
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
      return true;
    }

    return false;
  }

  private async onCandle(candle: ICandle) {
    if (!this.isRunning || this.isProcessingSignal) return;

    try {
      this.isProcessingSignal = true;

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
        logger.info(`[SIGNAL] ${signal.type} @ ${signal.price} (${JSON.stringify(signal.metadata || {})})`);

        if (signal.type === SignalType.BUY && !this.openPosition) {
          await this.executeTrade('buy', signal.price);
        } else if (signal.type === SignalType.SELL && this.openPosition) {
          await this.executeTrade('sell', signal.price);
        }
      }
    } catch (error: unknown) {
      logger.error(`Error in onCandle processing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isProcessingSignal = false;
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
        if (isBuy) {
          this.entryPrice = order.price || currentPrice;
        } else {
          const pnl = (order.price - this.entryPrice) * order.amount;
          logger.info(`[P&L] Trade closed: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (entry: $${this.entryPrice}, exit: $${order.price})`);
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
