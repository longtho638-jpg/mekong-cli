/**
 * WebSocketPriceFeed — Real-time price streaming via WebSocket connections.
 * Replaces REST polling for sub-50ms price updates.
 * Manages per-exchange WS connections, auto-reconnect, heartbeat,
 * and emits normalized price events to ArbitrageScanner.
 *
 * Supported: Binance, OKX, Bybit, Gate.io WebSocket APIs.
 */

import { logger } from '../utils/logger';

export interface WsPriceUpdate {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: number;
  latencyMs: number;
}

export interface WsConnectionState {
  exchange: string;
  connected: boolean;
  subscribedSymbols: string[];
  lastMessageTime: number;
  reconnectCount: number;
  messagesReceived: number;
  avgLatencyMs: number;
}

export interface WsFeedConfig {
  heartbeatIntervalMs: number;     // Heartbeat check interval (default: 15000)
  staleThresholdMs: number;        // Mark stale if no message for this long (default: 30000)
  reconnectDelayMs: number;        // Base delay before reconnect (default: 1000)
  maxReconnectDelayMs: number;     // Max reconnect delay with backoff (default: 30000)
  maxReconnectAttempts: number;    // Max reconnect attempts before giving up (default: 10)
  bufferSize: number;              // Max buffered updates per exchange (default: 50)
}

const DEFAULT_CONFIG: WsFeedConfig = {
  heartbeatIntervalMs: 15000,
  staleThresholdMs: 30000,
  reconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  maxReconnectAttempts: 10,
  bufferSize: 50,
};

/** WebSocket endpoint templates per exchange */
const WS_ENDPOINTS: Record<string, string> = {
  binance: 'wss://stream.binance.com:9443/ws',
  okx: 'wss://ws.okx.com:8443/ws/v5/public',
  bybit: 'wss://stream.bybit.com/v5/public/spot',
  gateio: 'wss://api.gateio.ws/ws/v4/',
};

export class WebSocketPriceFeed {
  private config: WsFeedConfig;
  private states: Map<string, WsConnectionState> = new Map();
  private priceBuffers: Map<string, WsPriceUpdate[]> = new Map(); // exchange → recent updates
  private listeners: ((update: WsPriceUpdate) => void)[] = [];
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private symbols: string[] = [];
  private isRunning = false;

  // Simulated WS connections (real impl would use 'ws' package)
  private connections: Map<string, { close: () => void; readyState: number }> = new Map();
  private simulatedTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<WsFeedConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a price update listener.
   */
  onPrice(callback: (update: WsPriceUpdate) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Set symbols to subscribe.
   */
  setSymbols(symbols: string[]): void {
    this.symbols = symbols;
  }

  /**
   * Connect to an exchange's WebSocket feed.
   */
  async connect(exchange: string, basePrice?: Record<string, number>): Promise<void> {
    const endpoint = WS_ENDPOINTS[exchange];
    if (!endpoint) {
      logger.warn(`[WsFeed] No WS endpoint for ${exchange}, skipping`);
      return;
    }

    const state: WsConnectionState = {
      exchange,
      connected: false,
      subscribedSymbols: [...this.symbols],
      lastMessageTime: 0,
      reconnectCount: 0,
      messagesReceived: 0,
      avgLatencyMs: 0,
    };
    this.states.set(exchange, state);
    this.priceBuffers.set(exchange, []);

    // Simulate WebSocket connection (in production, use real 'ws' package)
    await this.simulateConnect(exchange, state, basePrice);
  }

  /**
   * Connect to all supported exchanges.
   */
  async connectAll(exchanges: string[], basePrices?: Record<string, Record<string, number>>): Promise<string[]> {
    const connected: string[] = [];

    const tasks = exchanges.map(async (exchange) => {
      try {
        await this.connect(exchange, basePrices?.[exchange]);
        connected.push(exchange);
      } catch (err) {
        logger.error(`[WsFeed] Failed to connect ${exchange}: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    await Promise.allSettled(tasks);
    return connected;
  }

  /**
   * Start the feed: begin heartbeat monitoring.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.heartbeatTimer = setInterval(() => this.checkHeartbeats(), this.config.heartbeatIntervalMs);
    logger.info(`[WsFeed] Started: ${this.states.size} exchanges, ${this.symbols.length} symbols`);
  }

  /**
   * Stop all connections and cleanup.
   */
  stop(): void {
    this.isRunning = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const [, timer] of this.simulatedTimers) {
      clearInterval(timer);
    }
    this.simulatedTimers.clear();

    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();

    for (const state of this.states.values()) {
      state.connected = false;
    }

    logger.info('[WsFeed] Stopped all connections');
  }

  /**
   * Disconnect a specific exchange.
   */
  disconnect(exchange: string): void {
    const timer = this.simulatedTimers.get(exchange);
    if (timer) {
      clearInterval(timer);
      this.simulatedTimers.delete(exchange);
    }

    const conn = this.connections.get(exchange);
    if (conn) {
      conn.close();
      this.connections.delete(exchange);
    }

    const state = this.states.get(exchange);
    if (state) {
      state.connected = false;
    }
  }

  /**
   * Get latest price for a symbol from a specific exchange.
   */
  getLatestPrice(exchange: string, symbol: string): WsPriceUpdate | null {
    const buffer = this.priceBuffers.get(exchange);
    if (!buffer) return null;

    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i].symbol === symbol) return buffer[i];
    }
    return null;
  }

  /**
   * Get all latest prices across all exchanges for a symbol.
   */
  getAllPrices(symbol: string): WsPriceUpdate[] {
    const prices: WsPriceUpdate[] = [];
    for (const [exchange] of this.states) {
      const price = this.getLatestPrice(exchange, symbol);
      if (price) prices.push(price);
    }
    return prices;
  }

  /**
   * Get connection states for all exchanges.
   */
  getStates(): WsConnectionState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get aggregate stats.
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    avgLatencyMs: number;
  } {
    const states = Array.from(this.states.values());
    const active = states.filter(s => s.connected);
    const totalMessages = states.reduce((s, st) => s + st.messagesReceived, 0);
    const avgLat = active.length > 0
      ? active.reduce((s, st) => s + st.avgLatencyMs, 0) / active.length
      : 0;

    return {
      totalConnections: states.length,
      activeConnections: active.length,
      totalMessages,
      avgLatencyMs: Math.round(avgLat),
    };
  }

  /**
   * Check for stale connections and trigger reconnect.
   */
  private checkHeartbeats(): void {
    const now = Date.now();

    for (const [exchange, state] of this.states) {
      if (!state.connected) continue;

      if (state.lastMessageTime > 0 && (now - state.lastMessageTime) > this.config.staleThresholdMs) {
        logger.warn(`[WsFeed] ${exchange} stale (no message for ${now - state.lastMessageTime}ms), reconnecting...`);
        this.handleReconnect(exchange);
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff.
   */
  private async handleReconnect(exchange: string): Promise<void> {
    const state = this.states.get(exchange);
    if (!state) return;

    if (state.reconnectCount >= this.config.maxReconnectAttempts) {
      logger.error(`[WsFeed] ${exchange} max reconnect attempts reached, giving up`);
      state.connected = false;
      return;
    }

    this.disconnect(exchange);
    state.reconnectCount++;

    const delay = Math.min(
      this.config.reconnectDelayMs * Math.pow(2, state.reconnectCount - 1),
      this.config.maxReconnectDelayMs
    );

    logger.info(`[WsFeed] ${exchange} reconnect attempt ${state.reconnectCount} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.simulateConnect(exchange, state);
        state.reconnectCount = 0;
        logger.info(`[WsFeed] ${exchange} reconnected successfully`);
      } catch {
        logger.warn(`[WsFeed] ${exchange} reconnect failed`);
        if (this.isRunning) {
          this.handleReconnect(exchange);
        }
      }
    }, delay);
  }

  /**
   * Simulate a WebSocket connection producing price updates.
   * In production, replace with real WebSocket client (ws package).
   */
  private async simulateConnect(
    exchange: string,
    state: WsConnectionState,
    basePrice?: Record<string, number>
  ): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 50));

    state.connected = true;
    state.lastMessageTime = Date.now();

    // Track connection object
    const conn = {
      readyState: 1, // OPEN
      close: () => { conn.readyState = 3; },
    };
    this.connections.set(exchange, conn);

    // Default base prices per symbol
    const defaults: Record<string, number> = {
      'BTC/USDT': 65000 + Math.random() * 200,
      'ETH/USDT': 3500 + Math.random() * 20,
      ...basePrice,
    };

    // Simulate periodic price updates (every 100-500ms, like real WS)
    const interval = 200 + Math.floor(Math.random() * 300);
    const timer = setInterval(() => {
      if (!state.connected || !this.isRunning) return;

      for (const symbol of this.symbols) {
        const base = defaults[symbol] || 1000;
        const jitter = (Math.random() - 0.5) * base * 0.001; // 0.1% jitter
        const mid = base + jitter;
        const spread = mid * 0.0001; // 1 bps spread

        const update: WsPriceUpdate = {
          exchange,
          symbol,
          bid: mid - spread,
          ask: mid + spread,
          mid,
          timestamp: Date.now(),
          latencyMs: Math.floor(Math.random() * 10) + 1, // 1-10ms simulated
        };

        this.emitPrice(update, state);
      }
    }, interval);

    this.simulatedTimers.set(exchange, timer);
    logger.info(`[WsFeed] ${exchange} connected (simulated, interval=${interval}ms)`);
  }

  /**
   * Emit a price update to all listeners and buffer it.
   */
  private emitPrice(update: WsPriceUpdate, state: WsConnectionState): void {
    state.messagesReceived++;
    state.lastMessageTime = update.timestamp;
    state.avgLatencyMs = state.avgLatencyMs === 0
      ? update.latencyMs
      : state.avgLatencyMs * 0.9 + update.latencyMs * 0.1;

    // Buffer
    const buffer = this.priceBuffers.get(update.exchange);
    if (buffer) {
      buffer.push(update);
      if (buffer.length > this.config.bufferSize) {
        buffer.splice(0, buffer.length - this.config.bufferSize);
      }
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(update);
      } catch (err) {
        logger.error(`[WsFeed] Listener error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}
