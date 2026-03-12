/**
 * Kalshi REST API Client
 *
 * HTTP client for Kalshi trading API with RSA-PSS authentication.
 * REST: https://api.elections.kalshi.com/trade-api/v2
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  KalshiClientConfig,
  KalshiMarket,
  OrderBook,
  Balance,
  CreateOrderParams,
  OrderResponse,
  OpenOrder,
  Trade,
} from '../interfaces/IKalshi';
import { loadPrivateKey, createKeyObject, buildAuthHeaders, AuthConfig } from './kalshi-auth';

const DEFAULT_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';
const DEFAULT_RATE_LIMIT = 100;
const DEFAULT_RATE_LIMIT_MINUTE = 1000;

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  refillRate: number;
  capacity: number;
}

export class KalshiClient {
  private client: AxiosInstance;
  private authConfig: AuthConfig;
  private bucket: TokenBucket;
  private minuteBucket: TokenBucket;

  constructor(config: KalshiClientConfig) {
    if (!config.apiKey) throw new Error('KalshiClient: apiKey required');
    if (!config.privateKey && !config.privateKeyPath) {
      throw new Error('KalshiClient: privateKey or privateKeyPath required');
    }

    const keyData = config.privateKey ?? loadPrivateKey(config.privateKeyPath!);
    const privateKey = createKeyObject(keyData);

    this.authConfig = {
      apiKey: config.apiKey,
      privateKey,
      useServerTime: config.useServerTime ?? false,
      serverTimeOffset: 0,
    };

    this.bucket = {
      tokens: config.rateLimitPerSecond ?? DEFAULT_RATE_LIMIT,
      lastRefill: Date.now(),
      refillRate: (config.rateLimitPerSecond ?? DEFAULT_RATE_LIMIT) / 1000,
      capacity: config.rateLimitPerSecond ?? DEFAULT_RATE_LIMIT,
    };

    this.minuteBucket = {
      tokens: config.rateLimitPerMinute ?? DEFAULT_RATE_LIMIT_MINUTE,
      lastRefill: Date.now(),
      refillRate: (config.rateLimitPerMinute ?? DEFAULT_RATE_LIMIT_MINUTE) / 60000,
      capacity: config.rateLimitPerMinute ?? DEFAULT_RATE_LIMIT_MINUTE,
    };

    this.client = axios.create({
      baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.response.use((res) => res, (err) => this.handleError(err));
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillRate);
    bucket.lastRefill = now;
  }

  private async acquireToken(): Promise<void> {
    this.refillBucket(this.bucket);
    this.refillBucket(this.minuteBucket);

    if (this.bucket.tokens < 1 || this.minuteBucket.tokens < 1) {
      const waitMs = Math.max(
        this.bucket.tokens < 1 ? (1 - this.bucket.tokens) / this.bucket.refillRate : 0,
        this.minuteBucket.tokens < 1
          ? (1 - this.minuteBucket.tokens) / this.minuteBucket.refillRate
          : 0
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs + 1));
      return this.acquireToken();
    }

    this.bucket.tokens -= 1;
    this.minuteBucket.tokens -= 1;
  }

  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    await this.acquireToken();
    const body = data ? JSON.stringify(data) : undefined;
    const headers = buildAuthHeaders(method, path, body, this.authConfig);

    const response = await this.client.request<T>({ method, url: path, data: body, headers });
    return response.data;
  }

  private handleError(error: AxiosError): never {
    const status = error.response?.status;
    const message =
      (error.response?.data as { message?: string })?.message ?? error.message;
    throw new Error(`KalshiClient [${status}]: ${message}`);
  }

  async getMarket(eventId: string): Promise<KalshiMarket> {
    return this.request<KalshiMarket>('GET', `/events/${eventId}/market`);
  }

  async getOrderBook(marketId: string): Promise<OrderBook> {
    return this.request<OrderBook>('GET', `/markets/${marketId}/orderbook`);
  }

  async getBalance(): Promise<Balance> {
    return this.request<Balance>('GET', '/balance');
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResponse> {
    return this.request<OrderResponse>('POST', '/orders', params);
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request<void>('DELETE', `/orders/${orderId}`);
  }

  async cancelAllOrders(): Promise<void> {
    await this.request<void>('DELETE', '/orders');
  }

  async getOrder(orderId: string): Promise<OpenOrder> {
    return this.request<OpenOrder>('GET', `/orders/${orderId}`);
  }

  async getOpenOrders(marketId?: string): Promise<OpenOrder[]> {
    const path = marketId ? `/orders?market_id=${marketId}` : '/orders';
    return this.request<OpenOrder[]>('GET', path);
  }

  async getTrades(marketId?: string): Promise<Trade[]> {
    const path = marketId ? `/trades?market_id=${marketId}` : '/trades';
    return this.request<Trade[]>('GET', path);
  }

  async syncTime(): Promise<void> {
    const start = Date.now();
    const { server_time } = await this.request<{ server_time: number }>('GET', '/time');
    const end = Date.now();
    this.authConfig.serverTimeOffset = server_time - (start + end) / 2;
  }

  isReady(): boolean {
    return !!this.authConfig.apiKey && !!this.authConfig.privateKey;
  }
}
