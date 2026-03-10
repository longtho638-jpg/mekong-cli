/**
 * Shared Trading Types
 *
 * Centralized type definitions for type safety across the codebase.
 * Replaces all `any` types with proper interfaces.
 */

// ============================================================================
// CCXT Exchange Types
// ============================================================================

/**
 * CCXT Exchange instance type
 * Represents the dynamically imported CCXT exchange
 */
export interface CCXTExchange {
  id: string;
  name: string;
  has: Record<string, boolean>;
  markets: Record<string, Market>;
  currencies: Record<string, Currency>;
  enableRateLimit: boolean;

  // Methods
  loadMarkets(reload?: boolean): Promise<Record<string, Market>>;
  fetchTicker(symbol: string, params?: object): Promise<Ticker>;
  fetchOrderBook(symbol: string, limit?: number, params?: object): Promise<OrderBook>;
  fetchBalance(params?: object): Promise<Balances>;
  createMarketOrder(symbol: string, side: OrderSide, amount: number, price?: number, params?: object): Promise<CCXTOrder>;
  createLimitOrder(symbol: string, side: OrderSide, amount: number, price: number, params?: object): Promise<CCXTOrder>;
  cancelOrder(id: string, symbol: string, params?: object): Promise<CCXTOrder>;
  fetchOrder(id: string, symbol: string, params?: object): Promise<CCXTOrder>;
  fetchOpenOrders(symbol?: string, since?: number, limit?: number, params?: object): Promise<CCXTOrder[]>;
  fetchMyTrades(symbol?: string, since?: number, limit?: number, params?: object): Promise<CCXTTrade[]>;
  fetchStatus(params?: object): Promise<string>;
  healthCheck?(params?: object): Promise<object>;
}

/**
 * CCXT Order structure
 */
export interface CCXTOrder {
  id: string;
  clientOrderId?: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price?: number;
  average?: number;
  amount?: number;
  filled?: number;
  remaining?: number;
  cost?: number;
  status: string;
  timestamp?: number;
  datetime?: string;
  lastTradeTimestamp?: number;
  fee?: Fee;
  info: Record<string, unknown>;
}

/**
 * CCXT Trade structure
 */
export interface CCXTTrade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  cost: number;
  timestamp?: number;
  datetime?: string;
  fee?: Fee;
  info: Record<string, unknown>;
}

/**
 * CCXT Ticker structure
 */
export interface Ticker {
  symbol: string;
  timestamp?: number;
  datetime?: string;
  high?: number;
  low?: number;
  bid?: number;
  ask?: number;
  vwap?: number;
  open?: number;
  close?: number;
  last?: number;
  previousClose?: number;
  change?: number;
  percentage?: number;
  average?: number;
  baseVolume?: number;
  quoteVolume?: number;
  info: Record<string, unknown>;
}

/**
 * CCXT Order Book structure
 */
export interface OrderBook {
  symbol: string;
  timestamp?: number;
  datetime?: string;
  nonce?: number;
  bids: [number, number][];
  asks: [number, number][];
  info: Record<string, unknown>;
}

/**
 * CCXT Balance structure
 */
export interface Balances {
  info: Record<string, unknown>;
  free: Record<string, number>;
  used: Record<string, number>;
  total: Record<string, number>;
}

/**
 * CCXT Market structure
 */
export interface Market {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  type?: string;
  spot?: boolean;
  margin?: boolean;
  swap?: boolean;
  future?: boolean;
  option?: boolean;
  active: boolean;
  precision: {
    amount: number;
    price: number;
    cost?: number;
  };
  limits: {
    amount: { min: number; max: number };
    price: { min: number; max: number };
    cost: { min: number; max: number };
  };
  info: Record<string, unknown>;
}

/**
 * CCXT Currency structure
 */
export interface Currency {
  id: string;
  code: string;
  name: string;
  active: boolean;
  precision: number;
  limits: {
    amount: { min: number; max: number };
    withdraw: { min: number; max: number };
  };
  info: Record<string, unknown>;
}

/**
 * CCXT Fee structure
 */
export interface Fee {
  currency?: string;
  cost?: number;
  rate?: number;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stopLimit' | 'stopMarket' | 'limitMaker';

/**
 * Order parameters for exchange methods
 * Provides flexibility while maintaining type safety
 */
export interface OrderParams {
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  postOnly?: boolean;
  reduceOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTX';
  clientOrderId?: string;
  [key: string]: unknown; // Allow exchange-specific params
}

// ============================================================================
// Price Data Types (for ABI Trade & Risk Analysis)
// ============================================================================

/**
 * Single price data point
 */
export interface PriceDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol?: string;
  exchange?: string;
}

/**
 * Array of price data points
 */
export type PriceDataSeries = PriceDataPoint[];

// ============================================================================
// Risk Analysis Types
// ============================================================================

/**
 * Risk factor identified by risk analyzer
 */
export interface RiskFactor {
  type: 'volatility' | 'liquidity' | 'volume' | 'latency' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  description: string;
  symbol: string;
  timestamp: number;
}

/**
 * Market correlation data
 */
export interface MarketCorrelation {
  symbol: string;
  correlation: number;
  period: number;
  significance: number;
}

// ============================================================================
// Backtest Types
// ============================================================================

/**
 * Backtest performance metrics
 */
export interface BacktestMetrics {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  averageTradeDuration: number;
  calmarRatio: number;
  informationRatio: number;
  tailRatio: number;
  commonSenseRatio: number;
  ulcerIndex: number;
  serenityRatio: number;
  percentileRank?: number;
}

/**
 * Monte Carlo simulation result
 */
export interface MonteCarloResult {
  baselinePerformance: BacktestMetrics;
  simulatedResults: BacktestMetrics[];
  worstCaseScenario: BacktestMetrics;
  bestCaseScenario: BacktestMetrics;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  robustnessScore: number;
}

/**
 * Walk forward segment
 */
export interface WalkForwardSegment {
  inSampleData: PriceDataSeries;
  outOfSampleData: PriceDataSeries;
  inSamplePerformance?: BacktestMetrics;
  outOfSamplePerformance?: BacktestMetrics;
  isOptimized: boolean;
}

/**
 * Walk forward analysis result
 */
export interface WalkForwardResult {
  segments: WalkForwardSegment[];
  overallPerformance: AggregateMetrics;
  outOfSampleConsistency: number;
  overfittingScore: number;
}

/**
 * Aggregate metrics across multiple segments
 */
export interface AggregateMetrics {
  averageReturn: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  outOfSampleHitRate: number;
  parameterStability: number;
}

/**
 * Slippage metrics
 */
export interface SlippageMetrics {
  averageSlippage: number;
  maxSlippage: number;
  slippageRate: number;
  impactCost: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook event payload
 */
export interface WebhookEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: Date;
  tenantId?: string;
}

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  webhookId: string;
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
  deliveredAt?: Date;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Retryable error with metadata
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly retryable: boolean = true,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Circuit breaker error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitState: 'open' | 'half-open' | 'closed',
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// ============================================================================
// PnL Snapshot Types
// ============================================================================

/**
 * PnL snapshot record
 */
export interface PnLSnapshot {
  id: bigint;
  tenantId: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openPositions: number;
  equity: number;
  snapshotAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract numeric value from unknown type
 */
export function toNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Type guard for CCXT order
 */
export function isCCXTOrder(order: unknown): order is CCXTOrder {
  return (
    typeof order === 'object' &&
    order !== null &&
    'id' in order &&
    'symbol' in order &&
    'side' in order &&
    'status' in order
  );
}

/**
 * Type guard for price data point
 */
export function isPriceDataPoint(data: unknown): data is PriceDataPoint {
  return (
    typeof data === 'object' &&
    data !== null &&
    'timestamp' in data &&
    'open' in data &&
    'high' in data &&
    'low' in data &&
    'close' in data &&
    'volume' in data
  );
}
