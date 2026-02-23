import { IStrategy, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { IExchange } from '../interfaces/IExchange';
import { RiskManager } from './RiskManager';
import { OrderManager } from './OrderManager';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';

export interface BotConfig {
  symbol: string;
  riskPercentage: number;
  pollInterval: number; // ms
  maxDrawdownPercent?: number; // Optional: stop bot when drawdown exceeds this % (e.g. 10 = 10%)
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

      const signal = await this.strategy.onCandle(candle);

      if (signal) {
        logger.info(`[SIGNAL] ${signal.type} @ ${signal.price} (${JSON.stringify(signal.metadata)})`);

        if (signal.type === SignalType.BUY && !this.openPosition) {
          await this.executeTrade('buy', signal.price);
        } else if (signal.type === SignalType.SELL && this.openPosition) {
          await this.executeTrade('sell', signal.price);
        }
      }
    } catch (error) {
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

    logger.info(`Executing ${side.toUpperCase()} for ${amount} ${this.config.symbol}...`);

    try {
      const order = await this.exchange.createMarketOrder(this.config.symbol, side, amount);
      this.orderManager.addOrder(order);
      this.openPosition = isBuy;
    } catch (error) {
      logger.error(`${side} order failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
