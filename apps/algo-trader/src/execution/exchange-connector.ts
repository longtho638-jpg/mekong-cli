/**
 * Binance Exchange Connector - WebSocket + CCXT
 *
 * Handles WebSocket connections for real-time market data streaming.
 * Supports order book, trades, and ticker updates.
 */

import ccxt, { binance } from 'ccxt';
import { EventEmitter } from 'events';

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface OrderBookUpdate {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface TradeUpdate {
  symbol: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

interface ConnectionConfig {
  apiKey?: string;
  secret?: string;
  options?: {
    defaultType: 'spot' | 'margin' | 'future';
  };
}

/**
 * Binance WebSocket Connector
 *
 * Manages WebSocket connections for real-time market data.
 * Auto-reconnects on connection loss.
 */
export class BinanceWebSocket extends EventEmitter {
  private exchange: binance;
  private wsConnections: Map<string, any> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;
  private isRunning: boolean = false;

  constructor(config: ConnectionConfig = {}) {
    super();
    this.exchange = new ccxt.binance({
      apiKey: config.apiKey,
      secret: config.secret,
      enableRateLimit: true,
      options: {
        defaultType: config.options?.defaultType || 'spot',
      },
    });
  }

  /**
   * Initialize exchange connection
   */
  async initialize(): Promise<void> {
    try {
      await this.exchange.loadMarkets();
      this.emit('initialized', {
        markets: Object.keys(this.exchange.markets),
        timestamp: Date.now(),
      });
    } catch (error) {
      this.emit('error', {
        type: 'initialization',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Subscribe to order book updates
   */
  async subscribeOrderBook(symbol: string, depth: number = 20): Promise<void> {
    const key = `orderbook:${symbol}`;

    if (!symbol || this.wsConnections.has(key)) {
      return; // Skip empty symbol or already subscribed
    }

    try {
      const ws: any = await this.exchange.watchOrderBook(symbol, depth);
      this.wsConnections.set(key, ws);
      this.reconnectAttempts.set(key, 0);

      if (ws && typeof ws.on === 'function') {
        ws.on('update', (update: any) => {
          this.emit('orderbook', {
            symbol,
            bids: (update.bids as any[]).slice(0, depth).map(([price, amount]: any) => [Number(price), Number(amount)]),
            asks: (update.asks as any[]).slice(0, depth).map(([price, amount]: any) => [Number(price), Number(amount)]),
            timestamp: Date.now(),
          } as OrderBookUpdate);
        });

        this.handleReconnect(key, symbol, depth);
      }
    } catch (error) {
      this.emit('error', {
        type: 'orderbook_subscription',
        symbol,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to trade updates
   */
  async subscribeTrades(symbol: string): Promise<void> {
    const key = `trades:${symbol}`;

    if (!symbol || this.wsConnections.has(key)) {
      return;
    }

    try {
      const ws: any = await this.exchange.watchTrades(symbol);
      this.wsConnections.set(key, ws);
      this.reconnectAttempts.set(key, 0);

      if (ws && typeof ws.on === 'function') {
        ws.on('update', (trades: any[]) => {
          trades.forEach(trade => {
            this.emit('trade', {
              symbol,
              price: Number(trade.price),
              amount: Number(trade.amount),
              side: trade.side,
              timestamp: Number(trade.timestamp),
            } as TradeUpdate);
          });
        });

        this.handleReconnect(key, symbol);
      }
    } catch (error) {
      this.emit('error', {
        type: 'trades_subscription',
        symbol,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to ticker updates
   */
  async subscribeTicker(symbol: string): Promise<void> {
    const key = `ticker:${symbol}`;

    if (!symbol || this.wsConnections.has(key)) {
      return;
    }

    try {
      const ws: any = await this.exchange.watchTicker(symbol);
      this.wsConnections.set(key, ws);
      this.reconnectAttempts.set(key, 0);

      if (ws && typeof ws.on === 'function') {
        ws.on('update', (ticker: any) => {
          this.emit('ticker', {
            symbol,
            bid: Number(ticker.bid),
            ask: Number(ticker.ask),
            last: Number(ticker.last),
            timestamp: Number(ticker.timestamp),
          } as MarketData);
        });

        this.handleReconnect(key, symbol);
      }
    } catch (error) {
      this.emit('error', {
        type: 'ticker_subscription',
        symbol,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnect(key: string, symbol: string, depth?: number): void {
    const attempt = this.reconnectAttempts.get(key) || 0;

    if (attempt >= this.MAX_RECONNECT_ATTEMPTS) {
      this.emit('error', {
        type: 'max_reconnect_attempts',
        key,
        symbol,
        timestamp: Date.now(),
      });
      return;
    }

    setTimeout(async () => {
      this.reconnectAttempts.set(key, attempt + 1);

      try {
        if (key.startsWith('orderbook:')) {
          await this.subscribeOrderBook(symbol, depth);
        } else if (key.startsWith('trades:')) {
          await this.subscribeTrades(symbol);
        } else if (key.startsWith('ticker:')) {
          await this.subscribeTicker(symbol);
        }

        this.emit('reconnected', { key, symbol, attempt: attempt + 1 });
      } catch (error) {
        this.handleReconnect(key, symbol, depth);
      }
    }, this.RECONNECT_DELAY);
  }

  /**
   * Get current order book snapshot
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBookUpdate> {
    try {
      const orderbook: any = await this.exchange.fetchOrderBook(symbol, limit);
      return {
        symbol,
        bids: (orderbook.bids as any[]).map(([price, amount]: any) => [Number(price), Number(amount)]),
        asks: (orderbook.asks as any[]).map(([price, amount]: any) => [Number(price), Number(amount)]),
        timestamp: Number(orderbook.timestamp),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch order book: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(symbol: string, limit: number = 50): Promise<TradeUpdate[]> {
    try {
      const trades: any[] = await this.exchange.fetchTrades(symbol, undefined, limit);
      return trades.map(trade => ({
        symbol,
        price: Number(trade.price),
        amount: Number(trade.amount),
        side: trade.side,
        timestamp: Number(trade.timestamp),
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch trades: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Close all WebSocket connections
   */
  async close(): Promise<void> {
    this.isRunning = false;

    for (const [key, ws] of this.wsConnections.entries()) {
      try {
        if (ws && typeof ws.close === 'function') {
          ws.close();
        }
      } catch (error) {
        this.emit('error', {
          type: 'close_error',
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.wsConnections.clear();
    this.reconnectAttempts.clear();

    this.emit('closed', { timestamp: Date.now() });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isRunning: boolean;
    activeConnections: number;
    subscriptions: string[];
  } {
    return {
      isRunning: this.isRunning,
      activeConnections: this.wsConnections.size,
      subscriptions: Array.from(this.wsConnections.keys()),
    };
  }
}

/**
 * Factory function to create Binance WebSocket connector
 */
export function createBinanceWebSocket(config?: ConnectionConfig): BinanceWebSocket {
  return new BinanceWebSocket(config);
}
