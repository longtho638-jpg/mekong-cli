/**
 * Kalshi API Type Definitions
 *
 * Types for Kalshi REST API and WebSocket for binary prediction markets.
 * Reference: https://kalshi.com/
 */

/**
 * Order side
 */
export enum KalshiSide {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Order type
 */
export enum KalshiOrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP_LIMIT = 'stop-limit',
}

/**
 * Order status
 */
export enum KalshiOrderStatus {
  PENDING = 'pending',
  LIVE = 'live',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * Market status
 */
export enum KalshiMarketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SETTLED = 'settled',
  SUSPENDED = 'suspended',
}

/**
 * Market outcome
 */
export enum KalshiOutcome {
  YES = 'yes',
  NO = 'no',
}

/**
 * Kalshi market data
 */
export interface KalshiMarket {
  marketId: string;
  eventId: string;
  title: string;
  subtitle: string;
  status: KalshiMarketStatus;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  lastPrice: number;
  volume: number;
  volume24h: number;
  openInterest: number;
  liquidity: number;
  tickSize: number;
  minYesPrice: number;
  maxYesPrice: number;
  expiresAt: number;
  settledAt?: number;
  outcome?: KalshiOutcome;
  category: string;
  rules: string;
}

/**
 * Order book level
 */
export interface OrderBookLevel {
  price: number;
  size: number;
}

/**
 * Order book for a market
 */
export interface OrderBook {
  marketId: string;
  yesBids: OrderBookLevel[];
  yesAsks: OrderBookLevel[];
  noBids: OrderBookLevel[];
  noAsks: OrderBookLevel[];
  timestamp: number;
}

/**
 * Balance info
 */
export interface Balance {
  availableBalance: number;
  portfolioValue: number;
  totalBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

/**
 * Order request params
 */
export interface CreateOrderParams {
  marketId: string;
  side: KalshiSide;
  type: KalshiOrderType;
  count: number;
  price?: number;
  stopPrice?: number;
  expiration?: number;
  clientOrderId?: string;
}

/**
 * Order response
 */
export interface OrderResponse {
  orderId: string;
  clientOrderId?: string;
  marketId: string;
  side: KalshiSide;
  type: KalshiOrderType;
  status: KalshiOrderStatus;
  count: number;
  filledCount: number;
  price?: number;
  stopPrice?: number;
  avgFillPrice?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

/**
 * Open order
 */
export interface OpenOrder {
  orderId: string;
  clientOrderId?: string;
  marketId: string;
  side: KalshiSide;
  type: KalshiOrderType;
  status: KalshiOrderStatus;
  count: number;
  remainingCount: number;
  price?: number;
  stopPrice?: number;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Trade execution
 */
export interface Trade {
  tradeId: string;
  orderId: string;
  marketId: string;
  side: KalshiSide;
  count: number;
  price: number;
  createdAt: number;
  isTaker: boolean;
}

/**
 * Kalshi WebSocket config
 */
export interface KalshiWebSocketConfig {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
}

/**
 * Kalshi API config
 */
export interface KalshiClientConfig {
  apiKey?: string;
  privateKey?: string;
  privateKeyPath?: string;
  baseUrl?: string;
  wsUrl?: string;
  rateLimitPerSecond?: number;
  rateLimitPerMinute?: number;
  useServerTime?: boolean;
  throwOnError?: boolean;
}
