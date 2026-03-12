/**
 * Kalshi WebSocket Event Types
 */

import { KalshiSide, KalshiOrderStatus } from '../interfaces/IKalshi';

export interface KalshiOrderBookEvent {
  type: 'orderbook';
  marketId: string;
  yesBids: Array<{ price: number; size: number }>;
  yesAsks: Array<{ price: number; size: number }>;
  timestamp: number;
}

export interface KalshiTickerEvent {
  type: 'ticker';
  marketId: string;
  lastPrice: number;
  yesBid: number;
  yesAsk: number;
  volume: number;
  timestamp: number;
}

export interface KalshiOrderEvent {
  type: 'order';
  orderId: string;
  marketId: string;
  side: KalshiSide;
  status: KalshiOrderStatus;
  count: number;
  filledCount: number;
  price?: number;
  createdAt: number;
}

export interface KalshiTradeEvent {
  type: 'trade';
  tradeId: string;
  marketId: string;
  side: KalshiSide;
  count: number;
  price: number;
  isTaker: boolean;
  createdAt: number;
}

export type KalshiWebSocketEvent =
  | KalshiOrderBookEvent
  | KalshiTickerEvent
  | KalshiOrderEvent
  | KalshiTradeEvent;

export type KalshiWebSocketHandler<T extends KalshiWebSocketEvent> = (event: T) => void;
