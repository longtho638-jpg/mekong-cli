/**
 * Kalshi WebSocket Connection Manager
 *
 * Handles WebSocket connection, reconnection, and heartbeat.
 */

import WebSocket from 'ws';
import { KalshiWebSocketConfig } from '../interfaces/IKalshi';

const DEFAULT_WS_URL = 'wss://api.elections.kalshi.com/trade-api/ws/v2';
const DEFAULT_RECONNECT_DELAY = 1000;
const DEFAULT_MAX_RECONNECT_DELAY = 30000;
const DEFAULT_HEARTBEAT_INTERVAL = 5000;

export type WsMessageHandler = (msg: Record<string, unknown>) => void;
export type WsState = 'disconnected' | 'connecting' | 'connected';

export interface ConnectionCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Error) => void;
  onMessage?: WsMessageHandler;
}

export class KalshiWsConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private config: Required<KalshiWebSocketConfig>;
  private reconnectDelay: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private callbacks: ConnectionCallbacks = {};
  private state: WsState = 'disconnected';

  constructor(url?: string, config: KalshiWebSocketConfig = {}) {
    this.url = url ?? DEFAULT_WS_URL;
    this.config = {
      autoReconnect: true,
      reconnectDelay: DEFAULT_RECONNECT_DELAY,
      maxReconnectDelay: DEFAULT_MAX_RECONNECT_DELAY,
      heartbeatInterval: DEFAULT_HEARTBEAT_INTERVAL,
      ...config,
    };
    this.reconnectDelay = this.config.reconnectDelay;
  }

  connect(callbacks: ConnectionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.state = 'connecting';

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.once('open', () => {
        this.state = 'connected';
        this.reconnectDelay = this.config.reconnectDelay;
        this.startHeartbeat();
        this.callbacks.onOpen?.();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        const msg = data.toString();
        if (msg === 'pong') return;
        try {
          this.callbacks.onMessage?.(JSON.parse(msg));
        } catch (err) {
          console.error('[KalshiWS] Parse error:', err);
        }
      });

      this.ws.on('close', () => {
        this.state = 'disconnected';
        this.stopHeartbeat();
        this.callbacks.onClose?.();
        if (this.config.autoReconnect) {
          console.log(`[KalshiWS] Reconnecting in ${this.reconnectDelay}ms...`);
          setTimeout(() => {
            this.reconnectDelay = Math.min(
              this.reconnectDelay * 2,
              this.config.maxReconnectDelay
            );
            this.connect(this.callbacks);
          }, this.reconnectDelay);
        }
      });

      this.ws.on('error', (err) => {
        this.state = 'disconnected';
        this.callbacks.onError?.(err);
        reject(err);
      });
    });
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  close(): void {
    this.config.autoReconnect = false;
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.state = 'disconnected';
  }

  getState(): WsState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }
}
