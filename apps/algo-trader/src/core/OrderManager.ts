/**
 * OrderManager - Polymarket CLOB Order Management with EIP-712 Signing
 *
 * Handles order creation, cancellation, and tracking for Polymarket CLOB.
 * Supports GTC, GTD, FOK, FAK order types with post-only and rate limiting.
 */

import { Wallet, utils, providers } from "ethers";
import {
  ClobClient,
  OrderType,
  Side,
  SignedOrder as ClobSignedOrder,
  OrderData,
  SignatureType,
  Chain,
  CreateOrderOptions,
  UserOrder,
  OrderResponse,
  OpenOrder,
} from "@polymarket/clob-client";
import { CONTRACTS, PolymarketClientConfig } from "../polymarket/client";

// ============================================================================
// Constants
// ============================================================================

const POLYGON_CHAIN_ID = 137;
const CLOB_HOST = "https://clob.polymarket.com";

// Rate limiting: 3500 POST requests per 10 second burst
const RATE_LIMIT_MAX_REQUESTS = 3500;
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds

// Heartbeat interval to prevent stale order cancellation
const HEARTBEAT_INTERVAL_MS = 8000; // 8 seconds (must be < 10s)

// EIP-712 Domain for CTF Exchange
const CTF_EXCHANGE_DOMAIN = {
  name: "CTF Exchange",
  version: "1",
  chainId: POLYGON_CHAIN_ID,
  verifyingContract: CONTRACTS.CTF_EXCHANGE,
} as const;

// EIP-712 Domain for Neg Risk Exchange
const NEG_RISK_DOMAIN = {
  name: "Polymarket CTF Exchange - Neg Risk",
  version: "1",
  chainId: POLYGON_CHAIN_ID,
  verifyingContract: CONTRACTS.NEG_RISK_CTF_EXCHANGE,
} as const;

// EIP-712 Order type definition
const ORDER_TYPE = [
  { name: "salt", type: "uint256" },
  { name: "maker", type: "address" },
  { name: "signer", type: "address" },
  { name: "taker", type: "address" },
  { name: "tokenId", type: "uint256" },
  { name: "makerAmount", type: "uint256" },
  { name: "takerAmount", type: "uint256" },
  { name: "expiration", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "feeRateBps", type: "uint256" },
  { name: "side", type: "uint8" },
  { name: "signatureType", type: "uint8" },
];

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrderManagerConfig extends PolymarketClientConfig {
  /** Rate limiting enabled (default: true) */
  enableRateLimit?: boolean;
  /** Auto heartbeat enabled (default: true) */
  enableHeartbeat?: boolean;
}

export interface CreateOrderParams {
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  orderType: OrderType.GTC | OrderType.GTD | OrderType.FOK | OrderType.FAK;
  expiration?: number; // For GTD orders
  postOnly?: boolean; // For maker rebate
  negRisk?: boolean; // Use neg-risk exchange
}

export interface SignedOrder {
  orderId: string;
  tokenId: string;
  marketId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  orderType: OrderType;
  status: "pending" | "live" | "matched" | "cancelled" | "expired";
  signature: string;
  maker: string;
  createdAt: number;
  expiration?: number;
  postOnly: boolean;
  negRisk: boolean;
  filledSize?: number;
  avgFillPrice?: number;
}

export interface RateLimitState {
  requestCount: number;
  windowStart: number;
}

// ============================================================================
// OrderManager Class
// ============================================================================

export class OrderManager {
  private client: ClobClient;
  private wallet: Wallet;
  private config: OrderManagerConfig;
  private signatureType: SignatureType;
  private rateLimitState: RateLimitState;
  private heartbeatInterval?: NodeJS.Timeout;
  private heartbeatId?: string;
  private orderBook: Map<string, SignedOrder>;

  constructor(config: OrderManagerConfig) {
    if (!config.privateKey) {
      throw new Error("PrivateKey required for OrderManager");
    }

    this.config = {
      signatureType: SignatureType.EOA,
      enableRateLimit: true,
      enableHeartbeat: true,
      ...config,
    };

    // Initialize wallet
    this.wallet = new Wallet(config.privateKey);

    // Initialize signature type from config
    this.signatureType = config.signatureType ?? SignatureType.EOA;

    // Initialize rate limiting
    this.rateLimitState = {
      requestCount: 0,
      windowStart: Date.now(),
    };

    // Initialize order tracking
    this.orderBook = new Map();

    // Initialize CLOB client
    this.client = new ClobClient(
      CLOB_HOST,
      POLYGON_CHAIN_ID,
      this.wallet,
      undefined, // creds will be derived
      this.signatureType,
      config.funderAddress,
      undefined, // geoBlockToken
      config.useServerTime ?? false,
      undefined, // builderConfig
      undefined, // getSigner
      true, // retryOnError
      60000, // tickSizeTtlMs
      config.throwOnError ?? true,
    );
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize API credentials (L1 auth)
   * Must be called before any trading operations
   */
  async initialize(): Promise<void> {
    // Derive API key from wallet
    await this.client.createOrDeriveApiKey();

    // Start heartbeat if enabled
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private async checkRateLimit(): Promise<void> {
    if (!this.config.enableRateLimit) {
      return;
    }

    const now = Date.now();
    const windowElapsed = now - this.rateLimitState.windowStart;

    // Reset window if expired
    if (windowElapsed >= RATE_LIMIT_WINDOW_MS) {
      this.rateLimitState = {
        requestCount: 1,
        windowStart: now,
      };
      return;
    }

    // Check if at limit
    if (this.rateLimitState.requestCount >= RATE_LIMIT_MAX_REQUESTS) {
      const waitTime = RATE_LIMIT_WINDOW_MS - windowElapsed;
      throw new Error(
        `Rate limit exceeded. Retry after ${waitTime}ms. ` +
        `(${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s)`
      );
    }

    // Increment counter
    this.rateLimitState.requestCount++;
  }

  // ============================================================================
  // EIP-712 Signing
  // ============================================================================

  /**
   * Build EIP-712 typed data for order signing
   */
  private buildEip712TypedData(orderData: OrderData, negRisk: boolean = false) {
    const domain = negRisk ? NEG_RISK_DOMAIN : CTF_EXCHANGE_DOMAIN;

    // Generate salt as proper hex string with 0x prefix
    const saltBytes = utils.randomBytes(32);
    const salt = utils.hexlify(saltBytes);

    // Helper to convert value to proper uint256 hex format
    const toUint256Hex = (value: string): string => {
      if (value.startsWith("0x")) return value;
      // Try parsing as decimal number, fallback to utf8 hex encoding for non-numeric strings
      try {
        // For numeric strings, use BigInt
        const bn = BigInt(value);
        return utils.hexZeroPad(utils.hexlify(bn), 32);
      } catch {
        // For non-numeric strings (like test tokenIds), convert to bytes32 hex
        const bytes = Buffer.from(value, "utf8");
        const hexBytes = Uint8Array.from(bytes);
        const hexString = "0x" + Array.from(hexBytes).map(b => b.toString(16).padStart(2, "0")).join("");
        return utils.hexZeroPad(hexString, 32);
      }
    };

    // Helper to convert value to proper uint8 hex format
    const toUint8Hex = (value: number): string => {
      return utils.hexlify(value);
    };

    const message = {
      salt,
      maker: this.wallet.address,
      signer: orderData.signer ?? this.wallet.address,
      taker: orderData.taker ?? "0x0000000000000000000000000000000000000000",
      tokenId: toUint256Hex(orderData.tokenId),
      makerAmount: toUint256Hex(orderData.makerAmount),
      takerAmount: toUint256Hex(orderData.takerAmount),
      expiration: toUint256Hex(orderData.expiration ?? "0"),
      nonce: toUint256Hex(orderData.nonce ?? Date.now().toString()),
      feeRateBps: toUint256Hex(orderData.feeRateBps),
      side: toUint8Hex(orderData.side === Side.BUY ? 0 : 1),
      signatureType: toUint8Hex(this.signatureType),
    };

    return {
      types: {
        Order: ORDER_TYPE,
      },
      domain,
      primaryType: "Order",
      message,
    };
  }

  /**
   * Sign order with EIP-712
   */
  private async signOrder(orderData: OrderData, negRisk: boolean = false): Promise<string> {
    const typedData = this.buildEip712TypedData(orderData, negRisk);

    // Use ethers signTypedData
    const signature = await this.wallet._signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );

    return signature;
  }

  // ============================================================================
  // Order Creation
  // ============================================================================

  /**
   * Create and sign an order
   */
  async createOrder(params: CreateOrderParams): Promise<SignedOrder> {
    // Rate limit check
    await this.checkRateLimit();

    const {
      tokenId,
      price,
      size,
      side,
      orderType,
      expiration,
      postOnly = false,
      negRisk = false,
    } = params;

    // Get fee rate and tick size
    const feeRateBps = await this.client.getFeeRateBps(tokenId);
    const tickSize = await this.client.getTickSize(tokenId);

    // Build user order
    const userOrder: UserOrder = {
      tokenID: tokenId,
      price,
      size,
      side: side as Side,
      feeRateBps,
      expiration: orderType === OrderType.GTD ? expiration : undefined,
      taker: "0x0000000000000000000000000000000000000000", // public order
      nonce: Date.now().toString(),
    };

    // Build order data for EIP-712
    const makerAmount = (size * 1e6).toString(); // Convert to smallest unit
    const takerAmount = (size * price * 1e6).toString();

    const orderData: OrderData = {
      maker: this.wallet.address,
      taker: userOrder.taker,
      tokenId,
      makerAmount,
      takerAmount,
      side: side as Side,
      feeRateBps: feeRateBps.toString(),
      nonce: userOrder.nonce!,
      expiration: expiration?.toString(),
      signer: this.wallet.address,
      signatureType: this.signatureType,
    };

    // Sign the order
    const signature = await this.signOrder(orderData, negRisk);

    // Create and post order via CLOB client
    const options: CreateOrderOptions = {
      tickSize,
      negRisk,
    };

    const response: OrderResponse = await this.client.createAndPostOrder(
      userOrder,
      options,
      orderType
    );

    // Build signed order object
    const signedOrder: SignedOrder = {
      orderId: response.orderID,
      tokenId,
      marketId: tokenId, // Market ID is same as token ID for Polymarket
      side,
      price,
      size,
      orderType,
      status: response.status as SignedOrder["status"],
      signature,
      maker: this.wallet.address,
      createdAt: Date.now(),
      expiration,
      postOnly,
      negRisk,
    };

    // Track order locally
    this.orderBook.set(signedOrder.orderId, signedOrder);

    return signedOrder;
  }

  /**
   * Create a GTC (Good-Til-Cancelled) order
   */
  async createGtcOrder(
    tokenId: string,
    price: number,
    size: number,
    side: "BUY" | "SELL",
    postOnly: boolean = false,
    negRisk: boolean = false
  ): Promise<SignedOrder> {
    return this.createOrder({
      tokenId,
      price,
      size,
      side,
      orderType: OrderType.GTC,
      postOnly,
      negRisk,
    });
  }

  /**
   * Create a GTD (Good-Til-Date) order
   */
  async createGtdOrder(
    tokenId: string,
    price: number,
    size: number,
    side: "BUY" | "SELL",
    expiration: number,
    postOnly: boolean = false,
    negRisk: boolean = false
  ): Promise<SignedOrder> {
    return this.createOrder({
      tokenId,
      price,
      size,
      side,
      orderType: OrderType.GTD,
      expiration,
      postOnly,
      negRisk,
    });
  }

  /**
   * Create a FOK (Fill-Or-Kill) market order
   */
  async createFokOrder(
    tokenId: string,
    amount: number,
    side: "BUY" | "SELL",
    negRisk: boolean = false
  ): Promise<SignedOrder> {
    return this.createOrder({
      tokenId,
      price: 0, // Market order
      size: amount,
      side,
      orderType: OrderType.FOK,
      negRisk,
    });
  }

  /**
   * Create a FAK (Fill-And-Kill) market order
   */
  async createFakOrder(
    tokenId: string,
    amount: number,
    side: "BUY" | "SELL",
    negRisk: boolean = false
  ): Promise<SignedOrder> {
    return this.createOrder({
      tokenId,
      price: 0, // Market order
      size: amount,
      side,
      orderType: OrderType.FAK,
      negRisk,
    });
  }

  // ============================================================================
  // Order Cancellation
  // ============================================================================

  /**
   * Cancel a single order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.checkRateLimit();

    const response = await this.client.cancelOrder(orderId);

    // Update local order book
    const order = this.orderBook.get(orderId);
    if (order) {
      order.status = "cancelled";
      this.orderBook.set(orderId, order);
    }

    return response;
  }

  /**
   * Cancel multiple orders
   */
  async cancelOrders(orderIds: string[]): Promise<void> {
    await this.checkRateLimit();

    const response = await this.client.cancelOrders(orderIds);

    // Update local order book
    for (const orderId of orderIds) {
      const order = this.orderBook.get(orderId);
      if (order) {
        order.status = "cancelled";
        this.orderBook.set(orderId, order);
      }
    }

    return response;
  }

  /**
   * Cancel all open orders
   */
  async cancelAll(): Promise<void> {
    await this.checkRateLimit();

    const response = await this.client.cancelAll();

    // Update all orders in local book
    for (const [orderId, order] of this.orderBook.entries()) {
      if (order.status === "live" || order.status === "pending") {
        order.status = "cancelled";
        this.orderBook.set(orderId, order);
      }
    }

    return response;
  }

  /**
   * Cancel orders by market
   */
  async cancelMarketOrders(market: string): Promise<void> {
    await this.checkRateLimit();

    const response = await this.client.cancelMarketOrders({
      market,
    });

    // Update orders in local book for this market
    for (const [orderId, order] of this.orderBook.entries()) {
      if (order.marketId === market && (order.status === "live" || order.status === "pending")) {
        order.status = "cancelled";
        this.orderBook.set(orderId, order);
      }
    }

    return response;
  }

  // ============================================================================
  // Batch Orders
  // ============================================================================

  /**
   * Batch create multiple orders
   * Respects rate limiting automatically
   */
  async batchOrders(orders: CreateOrderParams[]): Promise<SignedOrder[]> {
    const results: SignedOrder[] = [];

    for (const orderParams of orders) {
      try {
        const signedOrder = await this.createOrder(orderParams);
        results.push(signedOrder);
      } catch (error) {
        // Log error but continue with remaining orders
        console.error(`[OrderManager] Failed to create order:`, error);
        results.push({
          orderId: "",
          tokenId: orderParams.tokenId,
          marketId: orderParams.tokenId,
          side: orderParams.side,
          price: orderParams.price,
          size: orderParams.size,
          orderType: orderParams.orderType,
          status: "expired",
          signature: "",
          maker: this.wallet.address,
          createdAt: Date.now(),
          postOnly: orderParams.postOnly ?? false,
          negRisk: orderParams.negRisk ?? false,
        } as SignedOrder);
      }
    }

    return results;
  }

  // ============================================================================
  // Heartbeat
  // ============================================================================

  /**
   * Send heartbeat to prevent stale order cancellation
   * Must be called every 10 seconds after activation
   */
  async sendHeartbeat(): Promise<string> {
    try {
      const result = await this.client.sendHeartbeat?.(this.heartbeatId);
      if (result?.heartbeat_id) {
        this.heartbeatId = result.heartbeat_id;
      }
      return this.heartbeatId ?? "";
    } catch (error) {
      console.error("[OrderManager] Heartbeat failed:", error);
      return "";
    }
  }

  /**
   * Start automatic heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return;
    }

    // Send initial heartbeat
    this.sendHeartbeat();

    // Set interval (8 seconds to be safe under 10s limit)
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stop automatic heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  // ============================================================================
  // Order Tracking
  // ============================================================================

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<OpenOrder> {
    return this.client.getOrder(orderId);
  }

  /**
   * Get all open orders
   */
  async getOpenOrders(params?: { market?: string; assetId?: string }): Promise<OpenOrder[]> {
    return this.client.getOpenOrders({
      market: params?.market,
      asset_id: params?.assetId,
    });
  }

  /**
   * Get tracked order from local book
   */
  getTrackedOrder(orderId: string): SignedOrder | undefined {
    return this.orderBook.get(orderId);
  }

  /**
   * Get all tracked orders
   */
  getTrackedOrders(): Map<string, SignedOrder> {
    return new Map(this.orderBook);
  }

  /**
   * Update order status from CLOB
   */
  async refreshOrderStatus(orderId: string): Promise<void> {
    const openOrder = await this.getOrder(orderId);
    const trackedOrder = this.orderBook.get(orderId);

    if (trackedOrder && openOrder) {
      trackedOrder.status = openOrder.status as SignedOrder["status"];
      trackedOrder.filledSize = parseFloat(openOrder.size_matched);
      this.orderBook.set(orderId, trackedOrder);
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Check if manager is ready for trading
   */
  isReady(): boolean {
    return true; // Client initialized with wallet
  }

  /**
   * Get rate limit state
   */
  getRateLimitState(): RateLimitState {
    return { ...this.rateLimitState };
  }
}
