/**
 * Polymarket WebSocket Client
 *
 * Real-time orderbook and trade updates via wss://ws-subscriptions-clob.polymarket.com
 * Supports market channel (public) and user channel (authenticated)
 */

import WebSocket from "ws";

const MARKET_WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const USER_WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/user";

// Market channel event types
export type MarketEventType =
  | "book"
  | "price_change"
  | "last_trade_price"
  | "best_bid_ask"
  | "tick_size_change"
  | "new_market"
  | "market_resolved";

// User channel event types
export type UserEventType = "trade" | "order";

// WebSocket message type
export type WebSocketMessage = {
  event_type: MarketEventType | UserEventType;
  [key: string]: unknown;
};

export interface BookEvent {
  event_type: "book";
  asset_id: string;
  market: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: string;
  hash: string;
}

export interface PriceChangeEvent {
  event_type: "price_change";
  market: string;
  price_changes: Array<{
    asset_id: string;
    price: string;
    size: string;
    side: string;
    hash: string;
    best_bid?: string;
    best_ask?: string;
  }>;
  timestamp: string;
}

export interface LastTradePriceEvent {
  event_type: "last_trade_price";
  asset_id: string;
  market: string;
  price: string;
  side: string;
  size: string;
  fee_rate_bps: string;
  timestamp: string;
}

export interface BestBidAskEvent {
  event_type: "best_bid_ask";
  market: string;
  asset_id: string;
  best_bid: string;
  best_ask: string;
  spread: string;
  timestamp: string;
}

export interface TradeEvent {
  event_type: "trade";
  asset_id: string;
  market: string;
  id: string;
  side: string;
  size: string;
  price: string;
  status: string;
  taker_order_id: string;
  maker_orders: Array<{
    order_id: string;
    matched_amount: string;
    price: string;
  }>;
  type: "TRADE";
}

export interface OrderEvent {
  event_type: "order";
  id: string;
  market: string;
  asset_id: string;
  side: string;
  price: string;
  original_size: string;
  size_matched: string;
  type: "PLACEMENT" | "UPDATE" | "CANCELLATION";
}

export type MarketEvent =
  | BookEvent
  | PriceChangeEvent
  | LastTradePriceEvent
  | BestBidAskEvent;

export type UserEvent = TradeEvent | OrderEvent;

export interface WebSocketConfig {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  pingInterval?: number;
  heartbeatEnabled?: boolean;
}

export class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private config: Required<WebSocketConfig>;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectDelay: number;
  private subscribedAssets = new Set<string>();
  private subscribedMarkets = new Set<string>();

  // Event handlers
  onBook?: (event: BookEvent) => void;
  onPriceChange?: (event: PriceChangeEvent) => void;
  onLastTradePrice?: (event: LastTradePriceEvent) => void;
  onBestBidAsk?: (event: BestBidAskEvent) => void;
  onTrade?: (event: TradeEvent) => void;
  onOrder?: (event: OrderEvent) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;

  constructor(
    type: "market" | "user" = "market",
    config: WebSocketConfig = {},
  ) {
    this.url = type === "market" ? MARKET_WS_URL : USER_WS_URL;
    this.config = {
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pingInterval: 5000, // Send PING every 5s (server expects every 10s)
      heartbeatEnabled: true,
      ...config,
    };
    this.reconnectDelay = this.config.reconnectDelay;
  }

  /**
   * Connect to WebSocket
   */
  connect(auth?: { apiKey: string; secret: string; passphrase: string }, markets?: string[]): void {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      console.log("[PolyWS] Connected");
      this.reconnectDelay = this.config.reconnectDelay;

      // Send subscription message
      const isUserChannel = this.url === USER_WS_URL;
      if (isUserChannel && auth) {
        this.subscribeUser(auth, markets);
      } else {
        this.subscribeMarket();
      }

      // Start heartbeat
      if (this.config.heartbeatEnabled) {
        this.startPing();
      }
    });

    this.ws.on("message", (data: WebSocket.RawData) => {
      const msg = data.toString();
      if (msg === "PONG") return;

      try {
        this.handleMessage(JSON.parse(msg));
      } catch (err) {
        console.error("[PolyWS] Parse error:", err);
      }
    });

    this.ws.on("close", () => {
      console.log("[PolyWS] Disconnected");
      this.stopPing();
      this.onDisconnect?.();

      if (this.config.autoReconnect) {
        console.log(`[PolyWS] Reconnecting in ${this.reconnectDelay}ms...`);
        setTimeout(() => {
          this.onReconnect?.();
          this.connect(auth, markets);
        }, this.reconnectDelay);
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.config.maxReconnectDelay,
        );
      }
    });

    this.ws.on("error", (err) => {
      console.error("[PolyWS] Error:", err.message);
      this.onError?.(err);
    });
  }

  /**
   * Subscribe to market channel
   */
  private subscribeMarket(): void {
    const assetsIds = Array.from(this.subscribedAssets);
    if (assetsIds.length === 0) return;

    const msg = {
      assets_ids: assetsIds,
      type: "market",
      custom_feature_enabled: true, // Enables best_bid_ask, new_market, market_resolved
    };

    this.ws?.send(JSON.stringify(msg));
    console.log("[PolyWS] Subscribed to market:", assetsIds);
  }

  /**
   * Subscribe to user channel
   */
  private subscribeUser(
    auth: { apiKey: string; secret: string; passphrase: string },
    markets?: string[],
  ): void {
    const msg = {
      auth: {
        apiKey: auth.apiKey,
        secret: auth.secret,
        passphrase: auth.passphrase,
      },
      markets: markets || [],
      type: "user",
    };

    this.ws?.send(JSON.stringify(msg));
    console.log("[PolyWS] Subscribed to user channel");
  }

  /**
   * Add asset to subscription (dynamic)
   */
  addAsset(tokenId: string): void {
    this.subscribedAssets.add(tokenId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          assets_ids: [tokenId],
          operation: "subscribe",
          custom_feature_enabled: true,
        }),
      );
    }
  }

  /**
   * Remove asset from subscription
   */
  removeAsset(tokenId: string): void {
    this.subscribedAssets.delete(tokenId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          assets_ids: [tokenId],
          operation: "unsubscribe",
        }),
      );
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(msg: WebSocketMessage): void {
    const eventType = msg.event_type as MarketEventType | UserEventType;

    switch (eventType) {
      case "book":
        this.onBook?.(msg as BookEvent);
        break;
      case "price_change":
        this.onPriceChange?.(msg as PriceChangeEvent);
        break;
      case "last_trade_price":
        this.onLastTradePrice?.(msg as LastTradePriceEvent);
        break;
      case "best_bid_ask":
        this.onBestBidAsk?.(msg as BestBidAskEvent);
        break;
      case "tick_size_change":
        // Handle tick size changes if needed
        break;
      case "new_market":
        // New market notification
        break;
      case "market_resolved":
        // Market resolution notification
        break;
      case "trade":
        this.onTrade?.(msg as TradeEvent);
        break;
      case "order":
        this.onOrder?.(msg as OrderEvent);
        break;
      default:
        console.log("[PolyWS] Unknown event:", eventType);
    }
  }

  /**
   * Start heartbeat (PING/PONG)
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("PING");
      }
    }, this.config.pingInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.config.autoReconnect = false;
    this.stopPing();
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscribed assets
   */
  getSubscribedAssets(): string[] {
    return Array.from(this.subscribedAssets);
  }
}
