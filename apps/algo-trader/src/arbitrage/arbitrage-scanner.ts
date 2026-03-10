/**
 * Arbitrage Scanner — Multi-exchange poller + emitter
 */

import { EventEmitter } from 'events';
import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';
import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';
import { ArbitrageProfitCalculator } from './arbitrage-profit-calculator';
import { ArbitrageConfig, loadArbitrageConfig } from './arbitrage-config';
import { logger } from '../utils/logger';

export class ArbitrageScanner extends EventEmitter {
  private config: ArbitrageConfig;
  private calculator: ArbitrageProfitCalculator;
  private exchangeClients: Map<string, ExchangeClientBase> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;
  private running = false;

  constructor(config?: ArbitrageConfig) {
    super();
    this.config = config || loadArbitrageConfig();
    this.calculator = new ArbitrageProfitCalculator(
      this.config.positionSizeUsd,
      this.config.maxSlippagePercent
    );
  }

  /**
   * Initialize exchange clients
   */
  async initialize(): Promise<void> {
    logger.info(`[ArbitrageScanner] Initializing with ${this.config.exchanges.length} exchanges`);

    for (const exchangeId of this.config.exchanges) {
      try {
        const client = new ExchangeClientBase(exchangeId);
        await (client as any).initialize?.(); // Call initialize if available
        this.exchangeClients.set(exchangeId, client);
        logger.debug(`[ArbitrageScanner] Connected to ${exchangeId}`);
      } catch (error) {
        logger.error(`[ArbitrageScanner] Failed to connect to ${exchangeId}: ${error}`);
      }
    }

    if (this.exchangeClients.size === 0) {
      throw new Error('No exchanges connected');
    }
  }

  /**
   * Start scanning loop
   */
  start(): void {
    if (this.running) {
      logger.warn('[ArbitrageScanner] Already running');
      return;
    }

    if (!this.config.enabled) {
      logger.warn('[ArbitrageScanner] Disabled by config');
      return;
    }

    this.running = true;
    logger.info(`[ArbitrageScanner] Starting scan loop (interval: ${this.config.pollIntervalMs}ms)`);

    // Initial scan
    this.scanLoop();

    // Schedule next scan
    this.scanInterval = setInterval(() => this.scanLoop(), this.config.pollIntervalMs);
  }

  /**
   * Stop scanning loop
   */
  stop(): void {
    this.running = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    logger.info('[ArbitrageScanner] Stopped');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.stop();

    // Close all exchange connections
    for (const client of this.exchangeClients.values()) {
      await (client as any).close?.(); // Call close if available
    }
    this.exchangeClients.clear();
    logger.info('[ArbitrageScanner] Shutdown complete');
  }

  /**
   * Main scan loop
   */
  private async scanLoop(): Promise<void> {
    if (!this.running) return;

    try {
      for (const symbol of this.config.symbols) {
        await this.scanSymbol(symbol);
      }
    } catch (error) {
      logger.error(`[ArbitrageScanner] Scan error: ${error}`);
    }
  }

  /**
   * Scan single symbol across all exchanges
   */
  private async scanSymbol(symbol: string): Promise<void> {
    const clients = Array.from(this.exchangeClients.entries());

    // Fetch tickers from all exchanges in parallel
    const pricePromises = clients.map(async ([exchangeId, client]) => {
      try {
        const price = await client.fetchTicker(symbol);
        const fees = await this.getExchangeFees(client, exchangeId, symbol);
        return {
          exchange: exchangeId,
          price: price,
          makerFee: fees.maker,
          takerFee: fees.taker,
        };
      } catch (error) {
        logger.debug(`[ArbitrageScanner] ${exchangeId} ${symbol} fetch failed: ${error}`);
        return null;
      }
    });

    const results = await Promise.allSettled(pricePromises);
    const prices = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);

    if (prices.length < 2) {
      return; // Need at least 2 exchanges
    }

    // Find opportunities
    const opportunities = this.calculator.findOpportunities(
      prices,
      symbol,
      this.config.minNetProfitPercent
    );

    // Emit each opportunity
    for (const opp of opportunities) {
      logger.info(
        `[ArbitrageScanner] Opportunity: ${opp.symbol} | Buy ${opp.buyExchange} @ ${opp.buyPrice} | Sell ${opp.sellExchange} @ ${opp.sellPrice} | Net: ${opp.netProfitPercent.toFixed(2)}% ($${opp.estimatedProfitUsd.toFixed(2)})`
      );
      this.emit('opportunity', opp);
    }
  }

  /**
   * Get exchange fees
   */
  private async getExchangeFees(
    client: ExchangeClientBase,
    exchangeId: string,
    symbol: string
  ): Promise<{ maker: number; taker: number }> {
    try {
      // Try to fetch trading fees
      if (typeof (client as any).fetchTradingFee === 'function') {
        const fee = await (client as any).fetchTradingFee(symbol);
        return { maker: fee.maker, taker: fee.taker };
      }

      // Fallback to default fees from CCXT
      const exchange = (client as any).exchange;
      if (exchange && exchange.fees) {
        return {
          maker: exchange.fees.trading.maker,
          taker: exchange.fees.trading.taker,
        };
      }

      // Default fallback (0.1% each side)
      return { maker: 0.001, taker: 0.001 };
    } catch {
      return { maker: 0.001, taker: 0.001 };
    }
  }

  /**
   * Get connected exchanges
   */
  getConnectedExchanges(): string[] {
    return Array.from(this.exchangeClients.keys());
  }

  /**
   * Check if scanner is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
