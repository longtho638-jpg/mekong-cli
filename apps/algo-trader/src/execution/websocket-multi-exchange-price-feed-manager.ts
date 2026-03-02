/**
 * WebSocket Multi-Exchange Price Feed Manager.
 * Connects to Binance, OKX, Bybit WebSocket streams for real-time price ticks.
 * Emits 'tick' events with bid/ask data. Auto-reconnects with exponential backoff.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { logger } from '../utils/logger';

export interface PriceTick {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface PriceFeedConfig {
  exchanges: string[];           // ['binance', 'okx', 'bybit']
  symbols: string[];             // ['BTC/USDT', 'ETH/USDT']
  reconnectDelayMs?: number;     // default 5000
  maxReconnectAttempts?: number; // default 10
  heartbeatIntervalMs?: number;  // default 30000
}

interface ExchangeWsConfig {
  buildUrl: (symbols: string[]) => string;
  buildSubscribeMsg?: (symbols: string[]) => object;
  parseTick: (data: string, exchange: string) => PriceTick | null;
}

// Convert BTC/USDT → exchange-specific format
function toBinanceSymbol(s: string): string { return s.replace('/', '').toLowerCase(); }
function toOkxSymbol(s: string): string { return s.replace('/', '-'); }
function toBybitSymbol(s: string): string { return s.replace('/', ''); }

const EXCHANGE_CONFIGS: Record<string, ExchangeWsConfig> = {
  binance: {
    buildUrl: (symbols) => {
      const streams = symbols.map(s => `${toBinanceSymbol(s)}@bookTicker`).join('/');
      return `wss://stream.binance.com:9443/stream?streams=${streams}`;
    },
    parseTick: (raw, exchange) => {
      try {
        const msg = JSON.parse(raw) as { data?: { s: string; b: string; a: string } };
        const data = msg.data;
        if (!data?.b || !data?.a) return null;
        return { exchange, symbol: data.s, bid: parseFloat(data.b), ask: parseFloat(data.a), timestamp: Date.now() };
      } catch { return null; }
    },
  },
  okx: {
    buildUrl: () => 'wss://ws.okx.com:8443/ws/v5/public',
    buildSubscribeMsg: (symbols) => ({
      op: 'subscribe',
      args: symbols.map(s => ({ channel: 'tickers', instId: toOkxSymbol(s) })),
    }),
    parseTick: (raw, exchange) => {
      try {
        const msg = JSON.parse(raw) as { data?: Array<{ instId: string; bidPx: string; askPx: string }> };
        const d = msg.data?.[0];
        if (!d?.bidPx || !d?.askPx) return null;
        return { exchange, symbol: d.instId, bid: parseFloat(d.bidPx), ask: parseFloat(d.askPx), timestamp: Date.now() };
      } catch { return null; }
    },
  },
  bybit: {
    buildUrl: () => 'wss://stream.bybit.com/v5/public/spot',
    buildSubscribeMsg: (symbols) => ({
      op: 'subscribe',
      args: symbols.map(s => `tickers.${toBybitSymbol(s)}`),
    }),
    parseTick: (raw, exchange) => {
      try {
        const msg = JSON.parse(raw) as { topic?: string; data?: { bid1Price: string; ask1Price: string; symbol: string } };
        const d = msg.data;
        if (!d?.bid1Price || !d?.ask1Price) return null;
        return { exchange, symbol: d.symbol, bid: parseFloat(d.bid1Price), ask: parseFloat(d.ask1Price), timestamp: Date.now() };
      } catch { return null; }
    },
  },
};

interface FeedConnection {
  exchangeId: string;
  ws: WebSocket | null;
  reconnectAttempts: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

export class WebSocketPriceFeedManager extends EventEmitter {
  private connections = new Map<string, FeedConnection>();
  private latestPrices = new Map<string, PriceTick>(); // key: `${exchange}:${symbol}`
  private running = false;

  private readonly reconnectDelayMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly heartbeatIntervalMs: number;
  private readonly symbols: string[];
  private readonly exchanges: string[];

  constructor(config: PriceFeedConfig) {
    super();
    this.reconnectDelayMs = config.reconnectDelayMs ?? 5000;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30000;
    this.symbols = config.symbols;
    this.exchanges = config.exchanges;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    for (const exchangeId of this.exchanges) {
      if (!EXCHANGE_CONFIGS[exchangeId]) {
        logger.warn(`[PriceFeed] Unknown exchange: ${exchangeId}`);
        continue;
      }
      this.connect(exchangeId, 0);
    }
    logger.info(`[PriceFeed] Started feeds: ${this.exchanges.join(', ')} for ${this.symbols.join(', ')}`);
  }

  stop(): void {
    this.running = false;
    for (const [, conn] of this.connections) {
      this.clearTimers(conn);
      conn.ws?.close();
      conn.ws = null;
    }
    this.connections.clear();
    logger.info('[PriceFeed] Stopped all feeds');
  }

  getLatestPrices(): Map<string, PriceTick> {
    return new Map(this.latestPrices);
  }

  private connect(exchangeId: string, attempt: number): void {
    const cfg = EXCHANGE_CONFIGS[exchangeId];
    if (!cfg) return;

    const conn: FeedConnection = this.connections.get(exchangeId) ?? {
      exchangeId, ws: null, reconnectAttempts: attempt,
      heartbeatTimer: null, reconnectTimer: null,
    };
    this.connections.set(exchangeId, conn);
    conn.reconnectAttempts = attempt;

    const url = cfg.buildUrl(this.symbols);
    logger.info(`[PriceFeed] Connecting ${exchangeId} (attempt ${attempt + 1})`);

    const ws = new WebSocket(url);
    conn.ws = ws;

    ws.on('open', () => {
      conn.reconnectAttempts = 0;
      logger.info(`[PriceFeed] Connected: ${exchangeId}`);
      if (cfg.buildSubscribeMsg) {
        ws.send(JSON.stringify(cfg.buildSubscribeMsg(this.symbols)));
      }
      this.startHeartbeat(conn, ws);
    });

    ws.on('message', (data: WebSocket.RawData) => {
      const tick = cfg.parseTick(data.toString(), exchangeId);
      if (tick) {
        this.latestPrices.set(`${exchangeId}:${tick.symbol}`, tick);
        this.emit('tick', tick);
      }
    });

    ws.on('close', () => {
      logger.warn(`[PriceFeed] Disconnected: ${exchangeId}`);
      this.clearTimers(conn);
      if (this.running) this.scheduleReconnect(conn);
    });

    ws.on('error', (err) => {
      logger.error(`[PriceFeed] Error ${exchangeId}: ${err.message}`);
    });
  }

  private scheduleReconnect(conn: FeedConnection): void {
    if (conn.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`[PriceFeed] Max reconnect attempts reached: ${conn.exchangeId}`);
      this.emit('error', new Error(`Max reconnects for ${conn.exchangeId}`));
      return;
    }
    const delay = Math.min(this.reconnectDelayMs * Math.pow(2, conn.reconnectAttempts), 60000);
    logger.info(`[PriceFeed] Reconnecting ${conn.exchangeId} in ${delay}ms`);
    conn.reconnectTimer = setTimeout(() => {
      this.connect(conn.exchangeId, conn.reconnectAttempts + 1);
    }, delay);
  }

  private startHeartbeat(conn: FeedConnection, ws: WebSocket): void {
    conn.heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, this.heartbeatIntervalMs);
  }

  private clearTimers(conn: FeedConnection): void {
    if (conn.heartbeatTimer) { clearInterval(conn.heartbeatTimer); conn.heartbeatTimer = null; }
    if (conn.reconnectTimer) { clearTimeout(conn.reconnectTimer); conn.reconnectTimer = null; }
  }
}
