/**
 * Market Event Types for Signal Mesh.
 * Supports multi-tenant routing and high-performance trading signals.
 */

export enum MarketEventType {
  TICK = 'TICK',
  CANDLE = 'CANDLE',
  ORDERBOOK = 'ORDERBOOK',
  SIGNAL = 'SIGNAL',
  ORDER_UPDATE = 'ORDER_UPDATE',
  POSITION_UPDATE = 'POSITION_UPDATE',
  RISK_EVENT = 'RISK_EVENT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface BaseMarketEvent {
  type: MarketEventType;
  tenantId: string; // Multi-tenant isolation
  symbol: string;
  timestamp: number;
  source: string;
}

export interface TickEvent extends BaseMarketEvent {
  type: MarketEventType.TICK;
  price: number;
  volume: number;
  side?: 'buy' | 'sell';
}

export interface CandleEvent extends BaseMarketEvent {
  type: MarketEventType.CANDLE;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalEvent extends BaseMarketEvent {
  type: MarketEventType.SIGNAL;
  strategyId: string;
  action: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  confidence: number;
  price: number;
  metadata?: Record<string, unknown>;
}

export interface OrderUpdateEvent extends BaseMarketEvent {
  type: MarketEventType.ORDER_UPDATE;
  orderId: string;
  status: 'open' | 'filled' | 'canceled' | 'rejected' | 'expired';
  side: 'buy' | 'sell';
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  averagePrice?: number;
}

export interface RiskEvent extends BaseMarketEvent {
  type: MarketEventType.RISK_EVENT;
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export type MarketEvent =
  | TickEvent
  | CandleEvent
  | SignalEvent
  | OrderUpdateEvent
  | RiskEvent;
