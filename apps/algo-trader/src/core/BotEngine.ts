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
}

export class BotEngine {
  private strategy: IStrategy;
  private dataProvider: IDataProvider;
  private exchange: IExchange;
  private orderManager: OrderManager;
  private config: BotConfig;
  private isRunning = false;
  private openPosition = false; // Simplified state tracking

  constructor(
    strategy: IStrategy,
    dataProvider: IDataProvider,
    exchange: IExchange,
    config: BotConfig
  ) {
    this.strategy = strategy;
    this.dataProvider = dataProvider;
    this.exchange = exchange;
    this.orderManager = new OrderManager();
    this.config = config;
  }

  async start() {
    logger.info('Starting Bot Engine...');
    await this.exchange.connect();
    await this.dataProvider.init();

    // Warm up strategy with history if possible, or just start listening
    // For now, let's assume we subscribe to live data
    this.dataProvider.subscribe(this.onCandle.bind(this));
    await this.dataProvider.start();

    this.isRunning = true;
    logger.info('Bot Engine Running.');
  }

  async stop() {
    logger.info('Stopping Bot Engine...');
    await this.dataProvider.stop();
    this.isRunning = false;
  }

  private async onCandle(candle: ICandle) {
    if (!this.isRunning) return;

    try {
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
    }
  }

  private async executeTrade(side: 'buy' | 'sell', currentPrice: number) {
    const isBuy = side === 'buy';
    const [baseCurrency, quoteCurrency] = this.config.symbol.split('/');
    const currency = isBuy ? quoteCurrency : baseCurrency;

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
