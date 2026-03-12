/**
 * Kalshi WebSocket Client - Real-time orderbook and ticker updates
 * WS: wss://api.elections.kalshi.com/trade-api/ws/v2
 */

import { KalshiWebSocketConfig, KalshiSide, KalshiOrderStatus } from '../interfaces/IKalshi';
import { KalshiOrderBookEvent, KalshiTickerEvent, KalshiOrderEvent, KalshiTradeEvent, KalshiWebSocketHandler } from './kalshi-ws-types';
import { KalshiWsConnection, WsState } from './kalshi-ws-connection';

export class KalshiWebSocket {
  private connection: KalshiWsConnection;
  private subscribedMarkets = new Set<string>();
  private apiKey?: string;
  private privateKey?: string;

  private orderbookHandlers: Array<KalshiWebSocketHandler<KalshiOrderBookEvent>> = [];
  private tickerHandlers: Array<KalshiWebSocketHandler<KalshiTickerEvent>> = [];
  private orderHandlers: Array<KalshiWebSocketHandler<KalshiOrderEvent>> = [];
  private tradeHandlers: Array<KalshiWebSocketHandler<KalshiTradeEvent>> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private connectHandlers: Array<() => void> = [];
  private disconnectHandlers: Array<() => void> = [];

  constructor(url?: string, config: KalshiWebSocketConfig = {}) {
    this.connection = new KalshiWsConnection(url, config);
  }

  connect(apiKey?: string, privateKey?: string): Promise<void> {
    this.apiKey = apiKey;
    this.privateKey = privateKey;

    return this.connection.connect({
      onOpen: () => {
        this.resubscribe();
        this.connectHandlers.forEach((h) => h());
      },
      onClose: () => {
        this.disconnectHandlers.forEach((h) => h());
      },
      onError: (err) => {
        this.errorHandlers.forEach((h) => h(err));
      },
      onMessage: (msg) => this.handleMessage(msg),
    });
  }

  subscribe(marketIds: string[]): void {
    marketIds.forEach((id) => this.subscribedMarkets.add(id));
    if (this.connection.isConnected()) {
      this.connection.send(JSON.stringify({ type: 'subscribe', markets: marketIds }));
    }
  }

  unsubscribe(marketIds: string[]): void {
    marketIds.forEach((id) => this.subscribedMarkets.delete(id));
    if (this.connection.isConnected()) {
      this.connection.send(JSON.stringify({ type: 'unsubscribe', markets: marketIds }));
    }
  }

  on(event: 'orderbook', handler: KalshiWebSocketHandler<KalshiOrderBookEvent>): void;
  on(event: 'ticker', handler: KalshiWebSocketHandler<KalshiTickerEvent>): void;
  on(event: 'order', handler: KalshiWebSocketHandler<KalshiOrderEvent>): void;
  on(event: 'trade', handler: KalshiWebSocketHandler<KalshiTradeEvent>): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'connect', handler: () => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: string, handler: unknown): void {
    switch (event) {
      case 'orderbook':
        this.orderbookHandlers.push(handler as KalshiWebSocketHandler<KalshiOrderBookEvent>);
        break;
      case 'ticker':
        this.tickerHandlers.push(handler as KalshiWebSocketHandler<KalshiTickerEvent>);
        break;
      case 'order':
        this.orderHandlers.push(handler as KalshiWebSocketHandler<KalshiOrderEvent>);
        break;
      case 'trade':
        this.tradeHandlers.push(handler as KalshiWebSocketHandler<KalshiTradeEvent>);
        break;
      case 'error':
        this.errorHandlers.push(handler as (error: Error) => void);
        break;
      case 'connect':
        this.connectHandlers.push(handler as () => void);
        break;
      case 'disconnect':
        this.disconnectHandlers.push(handler as () => void);
        break;
    }
  }

  off(event: 'orderbook', handler: KalshiWebSocketHandler<KalshiOrderBookEvent>): void;
  off(event: 'ticker', handler: KalshiWebSocketHandler<KalshiTickerEvent>): void;
  off(event: 'order', handler: KalshiWebSocketHandler<KalshiOrderEvent>): void;
  off(event: 'trade', handler: KalshiWebSocketHandler<KalshiTradeEvent>): void;
  off(event: 'error', handler: (error: Error) => void): void;
  off(event: 'connect', handler: () => void): void;
  off(event: 'disconnect', handler: () => void): void;
  off(event: string, handler: unknown): void {
    const map: Record<string, Array<unknown>> = {
      orderbook: this.orderbookHandlers,
      ticker: this.tickerHandlers,
      order: this.orderHandlers,
      trade: this.tradeHandlers,
      error: this.errorHandlers,
      connect: this.connectHandlers,
      disconnect: this.disconnectHandlers,
    };
    const arr = map[event];
    if (arr) {
      const idx = arr.indexOf(handler);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  private resubscribe(): void {
    if (this.subscribedMarkets.size > 0) {
      this.subscribe(Array.from(this.subscribedMarkets));
    }
  }

  private handleMessage(msg: Record<string, unknown>): void {
    const type = msg.type as string;
    const ts = (msg.timestamp as number) ?? Date.now();

    switch (type) {
      case 'orderbook': {
        const event: KalshiOrderBookEvent = {
          type: 'orderbook',
          marketId: msg.marketId as string,
          yesBids: (msg.yesBids as Array<{ price: number; size: number }>) ?? [],
          yesAsks: (msg.yesAsks as Array<{ price: number; size: number }>) ?? [],
          timestamp: ts,
        };
        this.orderbookHandlers.forEach((h) => h(event));
        break;
      }
      case 'ticker': {
        const event: KalshiTickerEvent = {
          type: 'ticker',
          marketId: msg.marketId as string,
          lastPrice: msg.lastPrice as number,
          yesBid: msg.yesBid as number,
          yesAsk: msg.yesAsk as number,
          volume: msg.volume as number,
          timestamp: ts,
        };
        this.tickerHandlers.forEach((h) => h(event));
        break;
      }
      case 'order': {
        const event: KalshiOrderEvent = {
          type: 'order',
          orderId: msg.orderId as string,
          marketId: msg.marketId as string,
          side: msg.side as KalshiSide,
          status: msg.status as KalshiOrderStatus,
          count: msg.count as number,
          filledCount: msg.filledCount as number,
          price: msg.price as number | undefined,
          createdAt: ts,
        };
        this.orderHandlers.forEach((h) => h(event));
        break;
      }
      case 'trade': {
        const event: KalshiTradeEvent = {
          type: 'trade',
          tradeId: msg.tradeId as string,
          marketId: msg.marketId as string,
          side: msg.side as KalshiSide,
          count: msg.count as number,
          price: msg.price as number,
          isTaker: msg.isTaker as boolean,
          createdAt: ts,
        };
        this.tradeHandlers.forEach((h) => h(event));
        break;
      }
    }
  }

  disconnect(): void {
    this.connection.close();
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }

  getSubscribedMarkets(): string[] {
    return Array.from(this.subscribedMarkets);
  }

  getState(): WsState {
    return (this.connection as unknown as { getState: () => WsState }).getState();
  }
}
