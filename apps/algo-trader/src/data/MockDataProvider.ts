import { IDataProvider } from '../interfaces/IDataProvider';
import { ICandle, ICandleMetadata } from '../interfaces/ICandle';

import { logger } from '../utils/logger';

export class MockDataProvider implements IDataProvider {
  private subscribers: ((candle: ICandle) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Mock data state
  private currentPrice = 100;
  private trend = 1; // 1 for up, -1 for down
  private volatility = 0.5;

  async init(): Promise<void> {
    logger.info('Mock Data Provider Initialized');
  }

  subscribe(callback: (candle: ICandle) => void): void {
    this.subscribers.push(callback);
  }

  async getHistory(limit: number): Promise<ICandle[]> {
    const history: ICandle[] = [];
    let price = this.currentPrice;
    const now = Date.now();
    const minute = 60 * 1000;

    for (let i = limit; i > 0; i--) {
      const candle = this.generateCandle(now - i * minute, price);
      price = candle.close;
      history.push(candle);
    }

    this.currentPrice = price;
    return history;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Mock Data Feed Started');

    this.interval = setInterval(() => {
      const candle = this.generateCandle(Date.now(), this.currentPrice);
      this.currentPrice = candle.close;
      this.notifySubscribers(candle);
    }, 1000); // Fast forward: 1 second = 1 candle for testing
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('Mock Data Feed Stopped');
  }

  private notifySubscribers(candle: ICandle): void {
    this.subscribers.forEach(sub => sub(candle));
  }

  private generateCandle(timestamp: number, startPrice: number): ICandle {
    // Random walk with trend
    if (Math.random() > 0.95) this.trend *= -1; // Change trend occasionally

    const change = (Math.random() - 0.5 + (this.trend * 0.1)) * this.volatility;
    const close = startPrice * (1 + change / 100);
    const high = Math.max(startPrice, close) * (1 + Math.random() * 0.002);
    const low = Math.min(startPrice, close) * (1 - Math.random() * 0.002);
    const volume = Math.floor(Math.random() * 1000) + 100;

    // Generate metadata for arbitrage testing
    // exchangeBPrice: Price for Cross-Exchange (slightly different from current)
    // priceETH_BTC, priceETH_USDT: Prices for Triangular (BTC/USDT -> ETH/BTC -> ETH/USDT)
    // priceB: Price for Statistical (correlated assets)
    const metadata: ICandleMetadata = {
      exchangeBPrice: close * (1 + (Math.random() - 0.5) * 0.005), // Spread up to 0.5%
      priceETH_BTC: 0.05 * (1 + (Math.random() - 0.5) * 0.002),
      priceETH_USDT: (close * 0.05) * (1 + (Math.random() - 0.5) * 0.002),
      priceB: close * 1.2 * (1 + (Math.random() - 0.5) * 0.001) // High correlation with price A
    };

    return {
      timestamp,
      open: startPrice,
      high,
      low,
      close,
      volume,
      metadata
    };
  }
}
