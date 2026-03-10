/**
 * Exchange Client
 *
 * Abstracts interaction with cryptocurrency exchanges using CCXT.
 * Provides a unified interface for trading operations across different exchanges.
 *
 * Security features:
 * - Input validation (symbol, amount, price)
 * - Max order size limits
 * - Daily volume limits
 * - Audit logging for all trades
 */

import { IOrder, IBalance } from '../interfaces/IExchange';
import { logger } from '../utils/logger';
import type { CCXTExchange, CCXTOrder, CCXTTrade, OrderParams, Balances, Ticker, OrderBook } from '../types/trading.types';
import {
  validateSymbol,
  validateAmount,
  validatePrice,
  validateSide,
  TradingValidationError,
} from './trading-validation';
import {
  AuditLogger,
  createAuditLogger,
  TradeExecutionMetadata,
} from './audit-logger';
import {
  MaxOrderLimitsChecker,
  createMaxOrderLimitsChecker,
  OrderLimitsConfig,
  DEFAULT_LIMITS,
} from './max-order-limits';

export interface IExchangeConfig {
  apiKey: string;
  secret: string;
  password?: string;
  uid?: string;
  sandbox?: boolean;
  tenantId?: string;
  orderLimits?: Partial<OrderLimitsConfig>;
  auditWebhookUrl?: string;
}

export class ExchangeClient {
  private exchange: CCXTExchange;
  private exchangeId: string;
  private config: IExchangeConfig;
  private tenantId: string;
  private auditLogger: AuditLogger;
  private limitsChecker: MaxOrderLimitsChecker;

  constructor(exchangeId: string, config: IExchangeConfig) {
    this.exchangeId = exchangeId;
    this.config = config;
    this.tenantId = config.tenantId || 'default-tenant';

    // Initialize security modules
    this.limitsChecker = createMaxOrderLimitsChecker(
      config.orderLimits ? { ...DEFAULT_LIMITS, ...config.orderLimits } : DEFAULT_LIMITS
    );
    this.auditLogger = createAuditLogger(
      this.tenantId,
      this.exchangeId,
      config.auditWebhookUrl
    );

    const ccxt = require('ccxt');

    this.exchange = new ccxt[exchangeId]({
      apiKey: config.apiKey,
      secret: config.secret,
      password: config.password,
      uid: config.uid,
      sandbox: config.sandbox || false,
      enableRateLimit: true,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.exchange.loadMarkets();
      logger.info(`Connected to ${this.exchangeId} exchange`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize ${this.exchangeId} exchange: ${msg}`);
    }
  }

  async close(): Promise<void> {
    // CCXT doesn't require explicit closing
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    try {
      return await this.exchange.fetchTicker(symbol);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch ticker for ${symbol} on ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch ticker for ${symbol} on ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook> {
    try {
      return await this.exchange.fetchOrderBook(symbol, limit);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch order book for ${symbol} on ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch order book for ${symbol} on ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async getBalance(): Promise<Record<string, IBalance>> {
    try {
      const rawBalance: Balances = await this.exchange.fetchBalance();
      const transformedBalance: Record<string, IBalance> = {};

      for (const [currency, amount] of Object.entries(rawBalance.total)) {
        transformedBalance[currency] = {
          currency: currency as string,
          free: rawBalance.free?.[currency as string] || 0,
          used: rawBalance.used?.[currency as string] || 0,
          total: rawBalance.total?.[currency as string] || Number(amount) || 0,
        };
      }

      return transformedBalance;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch balance from ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch balance from ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async marketOrder(side: 'buy' | 'sell', symbol: string, amount: number, params: OrderParams = {}): Promise<IOrder> {
    // Step 1: Validate inputs
    let validatedSide: 'buy' | 'sell';
    let validatedSymbol: string;
    let validatedAmount: number;

    try {
      validatedSide = validateSide(side);
      validatedSymbol = validateSymbol(symbol).normalizedSymbol;
      validatedAmount = validateAmount(amount);
    } catch (error) {
      if (error instanceof TradingValidationError) {
        this.auditLogger.logTradeFailure(symbol, side, amount, error.message);
      }
      throw error;
    }

    // Step 2: Check max order limits
    const limitsCheck = this.limitsChecker.validateOrder(
      this.tenantId,
      validatedSymbol,
      validatedSide,
      validatedAmount
    );

    if (!limitsCheck.passed) {
      this.auditLogger.logMaxOrderSizeExceeded(
        validatedSymbol,
        validatedSide,
        validatedAmount,
        limitsCheck.currentUsage?.dailyLimit || 0
      );
      throw new Error(`Order rejected: ${limitsCheck.rejectedReason}`);
    }

    // Step 3: Execute order
    try {
      const order: CCXTOrder = await this.exchange.createMarketOrder(
        validatedSymbol,
        validatedSide,
        validatedAmount,
        undefined,
        params
      );

      const result: IOrder = {
        id: order.id || `order_${Date.now()}`,
        symbol: order.symbol || validatedSymbol,
        side: validatedSide,
        amount: order.amount || validatedAmount,
        price: order.price || order.average || 0,
        status: (order.status as 'open' | 'closed' | 'canceled') || 'closed',
        timestamp: order.timestamp || Date.now(),
      };

      // Step 4: Record volume and log audit
      this.limitsChecker.recordExecution(
        this.tenantId,
        validatedSymbol,
        validatedSide,
        result.amount,
        result.price
      );

      const metadata: TradeExecutionMetadata = {
        strategyId: params.strategyId as string | undefined,
        signalId: params.signalId as string | undefined,
      };

      this.auditLogger.logTradeExecution(result, metadata);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogger.logTradeFailure(validatedSymbol, validatedSide, validatedAmount, errorMsg);
      throw new Error(`Failed to place ${validatedSide} market order for ${validatedSymbol} on ${this.exchangeId}: ${errorMsg}`);
    }
  }

  async limitOrder(side: 'buy' | 'sell', symbol: string, amount: number, price: number, params: OrderParams = {}): Promise<IOrder> {
    // Step 1: Validate inputs
    let validatedSide: 'buy' | 'sell';
    let validatedSymbol: string;
    let validatedAmount: number;
    let validatedPrice: number;

    try {
      validatedSide = validateSide(side);
      validatedSymbol = validateSymbol(symbol).normalizedSymbol;
      validatedAmount = validateAmount(amount);
      validatedPrice = validatePrice(price);
    } catch (error) {
      if (error instanceof TradingValidationError) {
        this.auditLogger.logTradeFailure(symbol, side, amount, error.message);
      }
      throw error;
    }

    // Step 2: Check max order limits (with price for value calculation)
    const limitsCheck = this.limitsChecker.validateOrder(
      this.tenantId,
      validatedSymbol,
      validatedSide,
      validatedAmount,
      validatedPrice
    );

    if (!limitsCheck.passed) {
      this.auditLogger.logMaxOrderSizeExceeded(
        validatedSymbol,
        validatedSide,
        validatedAmount,
        limitsCheck.currentUsage?.dailyLimit || 0
      );
      throw new Error(`Order rejected: ${limitsCheck.rejectedReason}`);
    }

    // Step 3: Execute order
    try {
      const order: CCXTOrder = await this.exchange.createLimitOrder(
        validatedSymbol,
        validatedSide,
        validatedAmount,
        validatedPrice,
        params
      );

      const result: IOrder = {
        id: order.id || `order_${Date.now()}`,
        symbol: order.symbol || validatedSymbol,
        side: validatedSide,
        amount: order.amount || validatedAmount,
        price: order.price || validatedPrice,
        status: (order.status as 'open' | 'closed' | 'canceled') || 'open',
        timestamp: order.timestamp || Date.now(),
      };

      // Step 4: Record volume and log audit
      this.limitsChecker.recordExecution(
        this.tenantId,
        validatedSymbol,
        validatedSide,
        result.amount,
        result.price
      );

      const metadata: TradeExecutionMetadata = {
        strategyId: params.strategyId as string | undefined,
        signalId: params.signalId as string | undefined,
      };

      this.auditLogger.logTradeExecution(result, metadata);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogger.logTradeFailure(validatedSymbol, validatedSide, validatedAmount, errorMsg);
      throw new Error(`Failed to place ${validatedSide} limit order for ${validatedSymbol} at $${validatedPrice} on ${this.exchangeId}: ${errorMsg}`);
    }
  }

  async cancelOrder(orderId: string, symbol: string, params: OrderParams = {}): Promise<IOrder> {
    try {
      const order: CCXTOrder = await this.exchange.cancelOrder(orderId, symbol, params);

      const result: IOrder = {
        id: order.id || orderId,
        symbol: order.symbol || symbol,
        side: order.side as 'buy' | 'sell',
        amount: order.amount || 0,
        price: order.price || 0,
        status: 'canceled',
        timestamp: order.timestamp || Date.now(),
      };

      // Log cancellation for audit trail
      this.auditLogger.logTradeCancellation(orderId, symbol, params.reason as string || 'User requested');

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogger.logTradeFailure(symbol, 'buy', 0, `Cancel failed: ${errorMsg}`);
      throw new Error(`Failed to cancel order ${orderId} on ${this.exchangeId}: ${errorMsg}`);
    }
  }

  async fetchOrder(orderId: string, symbol: string, params: OrderParams = {}): Promise<IOrder> {
    try {
      const order: CCXTOrder = await this.exchange.fetchOrder(orderId, symbol, params);

      return {
        id: order.id || orderId,
        symbol: order.symbol || symbol,
        side: order.side as 'buy' | 'sell',
        amount: order.amount || 0,
        price: order.price || 0,
        status: (order.status as 'open' | 'closed' | 'canceled') || 'open',
        timestamp: order.timestamp || Date.now(),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch order ${orderId} on ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch order ${orderId} on ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async fetchOpenOrders(symbol?: string, params: OrderParams = {}): Promise<IOrder[]> {
    try {
      const orders: CCXTOrder[] = await this.exchange.fetchOpenOrders(symbol, undefined, undefined, params);

      return orders.map((order) => ({
        id: order.id || `order_${Date.now()}`,
        symbol: order.symbol || symbol || '',
        side: order.side as 'buy' | 'sell',
        amount: order.amount || 0,
        price: order.price || 0,
        status: (order.status as 'open' | 'closed' | 'canceled') || 'open',
        timestamp: order.timestamp || Date.now(),
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch open orders on ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch open orders on ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async fetchMyTrades(symbol?: string, params: OrderParams = {}): Promise<CCXTTrade[]> {
    try {
      return await this.exchange.fetchMyTrades(symbol, undefined, undefined, params);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch trades from ${this.exchangeId}: ${error.message}`);
      } else {
        throw new Error(`Failed to fetch trades from ${this.exchangeId}: Unknown error`);
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.exchange.fetchStatus();
      return this.exchange.has?.fetchTicker === true;
    } catch {
      return false;
    }
  }

  getExchangeId(): string {
    return this.exchangeId;
  }

  /**
   * Get audit logger for external access
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Get daily volume usage stats
   */
  getDailyUsage(): { volume: number; limit: number; percent: number } {
    return this.limitsChecker.getDailyUsage(this.tenantId);
  }

  /**
   * Update order limits configuration
   */
  updateOrderLimits(limits: Partial<OrderLimitsConfig>): void {
    this.limitsChecker.updateConfig(limits);
  }

  /**
   * Get recent audit events
   */
  getRecentAuditEvents(limit: number = 100): ReturnType<typeof this.auditLogger.getRecentEvents> {
    return this.auditLogger.getRecentEvents(limit);
  }
}
