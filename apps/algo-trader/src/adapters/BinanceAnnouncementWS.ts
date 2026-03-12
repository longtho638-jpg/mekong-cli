/**
 * Binance Announcement WebSocket Adapter
 *
 * Real-time monitoring of Binance CMS announcements for listing detection
 * - Primary: WebSocket connection to Binance CMS
 * - Fallback: REST polling (60s interval) when WS unavailable
 *
 * References:
 * - Binance CMS: https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1
 * - No authentication required for public announcements
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import {
  BinanceListingAnnouncement,
  BinanceAnnouncementCategory,
  ListingEvent,
  ParsedTokenInfo,
  BinanceWSMessage,
  BinanceAnnouncementsResponse,
} from '../interfaces/IBinance';
import { logger } from '../utils/logger';

// Binance CMS endpoints (public, no auth required)
const BINANCE_ANNOUNCEMENT_WS = 'wss://ws.binance.com:9443/ws/announcement';
const BINANCE_ANNOUNCEMENT_REST = 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query';

// WebSocket reconnect config
const WS_RECONNECT_DELAY_MS = 5000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;
const WS_HEARTBEAT_INTERVAL_MS = 30000;

// REST polling config (respect rate limits: max 1 request per 5 seconds)
const REST_POLL_INTERVAL_MS = 60000; // 60 seconds (conservative)
const REST_POLL_LIMIT = 10; // Number of articles to fetch per poll

export interface BinanceAnnouncementWSConfig {
  useWebSocket: boolean;
  restPollIntervalMs: number;
  reconnectionDelayMs: number;
  maxReconnectAttempts: number;
}

const DEFAULT_CONFIG: BinanceAnnouncementWSConfig = {
  useWebSocket: true,
  restPollIntervalMs: REST_POLL_INTERVAL_MS,
  reconnectionDelayMs: WS_RECONNECT_DELAY_MS,
  maxReconnectAttempts: WS_MAX_RECONNECT_ATTEMPTS,
};

export class BinanceAnnouncementWS extends EventEmitter {
  private config: BinanceAnnouncementWSConfig;
  private ws: WebSocket | null = null;
  private httpClient: AxiosInstance;
  private isConnecting = false;
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private pollTimer?: NodeJS.Timeout;
  private lastAnnouncementId = 0;
  private announcementHistory = new Map<number, BinanceListingAnnouncement>();

  constructor(config: Partial<BinanceAnnouncementWSConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoTrader/1.0)',
      },
    });
  }

  /**
   * Connect to Binance announcement feed
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      logger.debug('[BinanceAnnouncementWS] Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      if (this.config.useWebSocket) {
        await this.connectWebSocket();
      } else {
        this.startRestPolling();
      }
    } catch (error) {
      logger.error('[BinanceAnnouncementWS] Connection failed:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from Binance announcement feed
   */
  disconnect(): void {
    this.stopWebSocket();
    this.stopRestPolling();
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    logger.info('[BinanceAnnouncementWS] Disconnected');
  }

  /**
   * Get connection status
   */
  isConnectionAlive(): boolean {
    return this.isConnected;
  }

  /**
   * Get recent announcements
   */
  getRecentAnnouncements(): BinanceListingAnnouncement[] {
    return Array.from(this.announcementHistory.values())
      .filter(a => a.category === BinanceAnnouncementCategory.LISTING)
      .sort((a, b) => b.listedAt - a.listedAt)
      .slice(0, 50);
  }

  /**
   * WebSocket connection
   */
  private async connectWebSocket(): Promise<void> {
    try {
      // Note: Binance may not have a public WS for announcements
      // This is a fallback pattern - in practice, REST polling is more reliable
      logger.info('[BinanceAnnouncementWS] Attempting WebSocket connection...');

      // For now, we'll use REST polling as primary since Binance CMS doesn't have public WS
      // Keeping WS code structure for future compatibility
      logger.warn('[BinanceAnnouncementWS] WebSocket not available, using REST polling');
      this.startRestPolling();

    } catch (error) {
      logger.error('[BinanceAnnouncementWS] WebSocket connection failed:', error);
      this.startRestPolling();
    }
  }

  /**
   * Stop WebSocket connection
   */
  private stopWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Start REST polling for announcements
   */
  private startRestPolling(): void {
    logger.info('[BinanceAnnouncementWS] Starting REST polling...');
    this.isConnected = true;
    this.isConnecting = false;

    // Initial poll
    this.pollAnnouncements();

    // Set up polling interval
    this.pollTimer = setInterval(
      () => this.pollAnnouncements(),
      this.config.restPollIntervalMs
    );
  }

  /**
   * Stop REST polling
   */
  private stopRestPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  /**
   * Poll Binance CMS REST API for new announcements
   */
  private async pollAnnouncements(): Promise<void> {
    try {
      const response = await this.httpClient.get<BinanceAnnouncementsResponse>(
        BINANCE_ANNOUNCEMENT_REST,
        {
          params: {
            type: 1, // Listing announcements
            page: 1,
            limit: REST_POLL_LIMIT,
          },
        }
      );

      if (response.data.code !== '000000') {
        logger.warn('[BinanceAnnouncementWS] API returned non-success code:', response.data.code);
        return;
      }

      const announcements = response.data.data || [];

      for (const article of announcements) {
        // Skip if already processed
        if (article.id <= this.lastAnnouncementId) {
          continue;
        }

        this.lastAnnouncementId = article.id;

        // Parse announcement
        const parsed = this.parseAnnouncement(article, 'rest');

        // Store in history
        this.announcementHistory.set(parsed.id, parsed);

        // Check if it's a listing announcement
        if (parsed.category === BinanceAnnouncementCategory.LISTING) {
          logger.info(
            `[BinanceAnnouncementWS] New listing detected: ${parsed.coin}`
          );

          // Parse token info from content
          const parsedTokens = this.parseTokenInfo(parsed.content);

          // Emit listing event
          const event: ListingEvent = {
            coin: parsed.coin,
            tradingPairs: parsed.tradingPairs || [],
            announcedAt: parsed.listedAt,
            detectedAt: Date.now(),
            latency: Date.now() - parsed.parsedAt,
            source: 'rest',
            announcementId: parsed.id,
            parsedTokens,
          };

          this.emit('listing', event);
        }
      }

      logger.debug(`[BinanceAnnouncementWS] Polled ${announcements.length} announcements`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[BinanceAnnouncementWS] Poll failed:', errorMsg);

      // Don't throw - continue polling on next interval
    }
  }

  /**
   * Parse announcement article
   */
  private parseAnnouncement(
    article: {
      title: string;
      id: number;
      releaseDate: string;
      type?: number;
      typeId?: number;
    },
    source: 'websocket' | 'rest'
  ): BinanceListingAnnouncement {
    const releaseDate = new Date(article.releaseDate);
    const now = Date.now();

    // Extract coin symbol from title using regex
    const coinMatch = article.title.match(/["']?([A-Z]{2,10})["']?\s*(?:Token|\(.*\))?/i);
    const coin = coinMatch ? coinMatch[1] : 'UNKNOWN';

    // Determine category based on type or title keywords
    let category = BinanceAnnouncementCategory.OTHER;
    const titleLower = article.title.toLowerCase();

    if (titleLower.includes('list') || titleLower.includes('add')) {
      category = BinanceAnnouncementCategory.LISTING;
    } else if (titleLower.includes('delist')) {
      category = BinanceAnnouncementCategory.DELISTING;
    } else if (titleLower.includes('trading pair')) {
      category = BinanceAnnouncementCategory.TRADING_PAIR;
    }

    // Extract trading pairs from title if present
    const tradingPairs = this.extractTradingPairs(article.title);

    return {
      id: article.id,
      title: article.title,
      content: '', // Content would require additional API call
      category,
      coin,
      tradingPairs,
      listedAt: releaseDate.getTime(),
      parsedAt: now,
      source,
      rawUrl: `https://www.binance.com/en/support/announcement/${article.id}`,
    };
  }

  /**
   * Extract trading pairs from announcement title
   */
  private extractTradingPairs(title: string): string[] {
    const pairs: string[] = [];

    // Match patterns like "BTC/USDT", "ETH/BUSD", etc.
    const pairRegex = /([A-Z]{2,10})\/([A-Z]{3,6})/g;
    let match;
    while ((match = pairRegex.exec(title)) !== null) {
      pairs.push(match[0]);
    }

    // Also check for comma-separated pairs
    if (pairs.length === 0) {
      const commaPairs = title.match(/([A-Z]{2,10}[.,]\s*[A-Z]{3,6})/g);
      if (commaPairs) {
        commaPairs.forEach(p => {
          const normalized = p.replace(/[.,]/g, '/').replace(/\s/g, '');
          if (!pairs.includes(normalized)) {
            pairs.push(normalized);
          }
        });
      }
    }

    return pairs;
  }

  /**
   * Parse token info from announcement content
   */
  private parseTokenInfo(content: string): ParsedTokenInfo[] {
    const tokens: ParsedTokenInfo[] = [];

    // Try to extract symbol
    const symbolMatch = content.match(/Symbol:\s*([A-Z]{2,10})/i) ||
                        content.match(/Token:\s*([A-Z]{2,10})/i);

    if (symbolMatch) {
      tokens.push({
        symbol: symbolMatch[1],
      });
    }

    // Try to extract network
    const networkMatch = content.match(/Network:\s*([A-Za-z0-9]+)/i);
    if (networkMatch && tokens.length > 0) {
      tokens[0].network = networkMatch[1];
    }

    return tokens;
  }

  /**
   * Handle WebSocket message (for future compatibility)
   */
  private handleWSMessage(message: BinanceWSMessage): void {
    try {
      const parsed = this.parseAnnouncement(
        {
          title: message.data.title,
          id: message.data.id,
          releaseDate: message.data.releaseDate,
          type: undefined,
          typeId: undefined,
        },
        'websocket'
      );

      this.announcementHistory.set(parsed.id, parsed);

      if (parsed.category === BinanceAnnouncementCategory.LISTING) {
        const event: ListingEvent = {
          coin: parsed.coin,
          tradingPairs: parsed.tradingPairs || [],
          announcedAt: parsed.listedAt,
          detectedAt: Date.now(),
          latency: Date.now() - parsed.parsedAt,
          source: 'websocket',
          announcementId: parsed.id,
          parsedTokens: this.parseTokenInfo(parsed.content),
        };

        this.emit('listing', event);
      }
    } catch (error) {
      logger.error('[BinanceAnnouncementWS] Failed to handle WS message:', error);
    }
  }
}

export default BinanceAnnouncementWS;
