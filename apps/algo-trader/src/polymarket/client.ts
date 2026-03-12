/**
 * Polymarket CLOB Client
 *
 * Wrapper around @polymarket/clob-client for L1/L2 authenticated trading.
 * Supports EOA (signatureType=0), POLY_PROXY (1), and POLY_GNOSIS_SAFE (2).
 */

import {
  ClobClient,
  ApiKeyCreds,
  Side,
  OrderType,
  UserOrder,
  UserMarketOrder,
  OrderResponse,
  CreateOrderOptions,
  OpenOrder,
  Trade,
} from "@polymarket/clob-client";
import { Wallet } from "ethers";

// Polygon mainnet chain ID
const POLYGON_CHAIN_ID = 137;
const CLOB_HOST = "https://clob.polymarket.com";

// Contract addresses (Polygon mainnet)
export const CONTRACTS = {
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  NEG_RISK_CTF_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a",
  NEG_RISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
  CONDITIONAL_TOKENS: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  USDC_E: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  GNOSIS_SAFE_FACTORY: "0xaacfeea03eb1561c4e67d661e40682bd20e3541b",
  PROXY_FACTORY: "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052",
} as const;

export type TickSize = "0.1" | "0.01" | "0.001" | "0.0001";

export interface PolymarketClientConfig {
  privateKey?: string;
  apiKey?: string;
  apiSecret?: string;
  apiPassphrase?: string;
  funderAddress?: string;
  signatureType?: 0 | 1 | 2; // EOA, POLY_PROXY, POLY_GNOSIS_SAFE
  useServerTime?: boolean;
  throwOnError?: boolean;
}

export class PolymarketClobClient {
  private client: ClobClient;
  private wallet?: Wallet;
  private creds?: ApiKeyCreds;
  private config: PolymarketClientConfig;

  constructor(config: PolymarketClientConfig = {}) {
    this.config = {
      signatureType: 0,
      useServerTime: false,
      throwOnError: true,
      ...config,
    };

    // Initialize wallet if private key provided
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey);
    }

    // Build credentials if API key provided
    if (config.apiKey && config.apiSecret && config.apiPassphrase) {
      this.creds = {
        key: config.apiKey,
        secret: config.apiSecret,
        passphrase: config.apiPassphrase,
      };
    }

    // Initialize ClobClient
    this.client = new ClobClient(
      CLOB_HOST,
      POLYGON_CHAIN_ID,
      this.wallet,
      this.creds,
      this.config.signatureType,
      this.config.funderAddress,
      undefined, // geoBlockToken
      this.config.useServerTime,
      undefined, // builderConfig
      undefined, // getSigner
      true, // retryOnError
      60000, // tickSizeTtlMs (1 min cache)
      this.config.throwOnError,
    );
  }

  // ==================== L1 Authentication ====================

  /**
   * Create or derive API key (requires signer wallet)
   * Only one active API key per wallet - creating new invalidates old
   */
  async createOrDeriveApiKey(): Promise<ApiKeyCreds> {
    if (!this.wallet) {
      throw new Error("Wallet required for L1 auth - provide privateKey in config");
    }
    this.creds = await this.client.createOrDeriveApiKey();
    return this.creds;
  }

  // ==================== L2 Trading Methods ====================

  /**
   * Sign and post a limit order in one call
   */
  async createAndPostLimitOrder(
    tokenId: string,
    price: number,
    size: number,
    side: "BUY" | "SELL",
    orderType: OrderType.GTC | OrderType.GTD = OrderType.GTC,
    expiration?: number,
    tickSize?: TickSize,
    negRisk?: boolean,
  ): Promise<OrderResponse> {
    if (!this.creds) {
      throw new Error("L2 credentials required - call createOrDeriveApiKey() first or provide API creds");
    }

    const feeRateBps = await this.client.getFeeRateBps(tokenId);
    const resolvedTickSize = tickSize || (await this.client.getTickSize(tokenId));
    const resolvedNegRisk = negRisk ?? (await this.client.getNegRisk(tokenId));

    const userOrder: UserOrder = {
      tokenID: tokenId,
      price,
      size,
      side: side as Side,
      feeRateBps,
      expiration,
      taker: "0x0000000000000000000000000000000000000000", // public order
    };

    const options: CreateOrderOptions = {
      tickSize: resolvedTickSize,
      negRisk: resolvedNegRisk,
    };

    return this.client.createAndPostOrder(userOrder, options, orderType);
  }

  /**
   * Sign and post a market order
   */
  async createAndPostMarketOrder(
    tokenId: string,
    amount: number,
    side: "BUY" | "SELL",
    orderType: OrderType.FOK | OrderType.FAK = OrderType.FOK,
    price?: number,
    tickSize?: TickSize,
    negRisk?: boolean,
  ): Promise<OrderResponse> {
    if (!this.creds) {
      throw new Error("L2 credentials required");
    }

    const feeRateBps = await this.client.getFeeRateBps(tokenId);
    const resolvedTickSize = tickSize || (await this.client.getTickSize(tokenId));
    const resolvedNegRisk = negRisk ?? (await this.client.getNegRisk(tokenId));

    const userOrder: UserMarketOrder = {
      tokenID: tokenId,
      amount,
      side: side as Side,
      price,
      feeRateBps,
    };

    const options: CreateOrderOptions = {
      tickSize: resolvedTickSize,
      negRisk: resolvedNegRisk,
    };

    return this.client.createAndPostMarketOrder(userOrder as any, options, orderType);
  }

  /**
   * Cancel single order
   */
  async cancelOrder(orderId: string): Promise<any> {
    return this.client.cancelOrder(orderId);
  }

  /**
   * Cancel multiple orders
   */
  async cancelOrders(orderIds: string[]): Promise<any> {
    return this.client.cancelOrders(orderIds);
  }

  /**
   * Cancel all open orders
   */
  async cancelAll(): Promise<any> {
    return this.client.cancelAll();
  }

  /**
   * Cancel orders by market or asset
   */
  async cancelMarketOrders(payload: {
    market?: string;
    asset?: string;
  }): Promise<void> {
    return this.client.cancelMarketOrders(payload);
  }

  // ==================== Query Methods ====================

  /**
   * Get single order
   */
  async getOrder(orderId: string): Promise<OpenOrder> {
    return this.client.getOrder(orderId);
  }

  /**
   * Get all open orders
   */
  async getOpenOrders(params?: {
    market?: string;
    asset_id?: string;
    id?: string;
  }): Promise<OpenOrder[]> {
    return this.client.getOpenOrders(params as any);
  }

  /**
   * Get trade history
   */
  async getTrades(params?: {
    market?: string;
    asset_id?: string;
    id?: string;
    before?: string;
    after?: string;
  }): Promise<Trade[]> {
    return this.client.getTrades(params as any);
  }

  /**
   * Get balance and allowance
   */
  async getBalanceAllowance(params?: {
    asset_type: "COLLATERAL" | "CONDITIONAL";
    token_id?: string;
  }): Promise<{ balance: string; allowance: string }> {
    return this.client.getBalanceAllowance(params as any);
  }

  // ==================== Market Data (L0 - no auth) ====================

  /**
   * Get orderbook for a token
   */
  async getOrderBook(tokenId: string) {
    return this.client.getOrderBook(tokenId);
  }

  /**
   * Get current price
   */
  async getPrice(tokenId: string, side: "BUY" | "SELL") {
    return this.client.getPrice(tokenId, side as Side);
  }

  /**
   * Get spread
   */
  async getSpread(tokenId: string) {
    return this.client.getSpread(tokenId);
  }

  /**
   * Get tick size for a market
   */
  async getTickSize(tokenId: string): Promise<TickSize> {
    return this.client.getTickSize(tokenId) as Promise<TickSize>;
  }

  /**
   * Check if market uses neg-risk
   */
  async getNegRisk(tokenId: string): Promise<boolean> {
    return this.client.getNegRisk(tokenId);
  }

  /**
   * Get fee rate basis points
   */
  async getFeeRateBps(tokenId: string): Promise<number> {
    return this.client.getFeeRateBps(tokenId);
  }

  /**
   * Calculate market price for slippage estimation
   */
  async calculateMarketPrice(
    tokenId: string,
    side: "BUY" | "SELL",
    amount: number,
    orderType?: OrderType,
  ): Promise<number> {
    return this.client.calculateMarketPrice(tokenId, side as Side, amount, orderType);
  }

  /**
   * Send heartbeat to prevent stale order cancellation
   * Must be called every 10 seconds after activation
   */
  async sendHeartbeat(heartbeatId?: string): Promise<{ heartbeat_id: string }> {
    return this.client.postHeartbeat?.(heartbeatId || "");
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<number> {
    return this.client.getServerTime();
  }

  // ==================== Helpers ====================

  /**
   * Check if client is ready for trading
   */
  isReady(): boolean {
    return !!this.creds;
  }

  /**
   * Get current API key credentials
   */
  getCreds(): ApiKeyCreds | undefined {
    return this.creds;
  }
}

export { Side, OrderType };
