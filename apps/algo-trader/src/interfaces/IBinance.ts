/**
 * Binance Listing Detection Types
 *
 * Interfaces for Binance CMS WebSocket announcements and listing events
 * Reference: https://www.binance.com/en/support/announcement
 */

/**
 * Binance announcement category
 */
export enum BinanceAnnouncementCategory {
  LISTING = 'listing',
  DELISTING = 'delisting',
  TRADING_PAIR = 'trading_pair',
  STAKING = 'staking',
  LAUNCHPAD = 'launchpad',
  OTHER = 'other',
}

/**
 * Binance listing announcement data
 */
export interface BinanceListingAnnouncement {
  id: number;
  title: string;
  content: string;
  category: BinanceAnnouncementCategory;
  coin: string;           // Token symbol (e.g., "BTC", "ETH")
  tradingPairs?: string[] // Array of trading pairs (e.g., ["BTC/USDT", "BTC/BUSD"])
  listedAt: number;       // Unix timestamp when listing was announced
  parsedAt: number;       // Unix timestamp when we parsed the announcement
  source: 'websocket' | 'rest';
  rawUrl?: string;        // Link to announcement
}

/**
 * Parsed token info from listing announcement
 */
export interface ParsedTokenInfo {
  symbol: string;         // Token symbol
  name?: string;          // Full name if available
  network?: string;       // Blockchain network (e.g., "ERC20", "BEP20")
  depositOpenTime?: number;
  tradingOpenTime?: number;
  withdrawOpenTime?: number;
}

/**
 * Binance CMS WebSocket message structure
 */
export interface BinanceWSMessage {
  messageType: string;
  data: {
    id: number;
    title: string;
    content: string;
    category: string;
    releaseDate: string;
    url?: string;
  };
}

/**
 * REST API response for announcements
 */
export interface BinanceAnnouncementsResponse {
  code: string;
  message: string;
  data: {
    title: string;
    id: number;
    releaseDate: string;
    type?: number;
    typeId?: number;
  }[];
  success: boolean;
}

/**
 * Gamma API token mapping (Polymarket token lookup)
 */
export interface GammaTokenMapping {
  coin: string;           // Coin symbol from Binance
  tokenId?: string;       // Polymarket conditional token ID
  marketId?: string;      // Polymarket market/condition ID
  slug?: string;          // Polymarket market slug
  question?: string;      // Market question
  yesPrice?: number;      // Current YES price
  noPrice?: number;       // Current NO price
  volume?: number;        // 24h volume
  liquidity?: number;     // Available liquidity
  lastUpdated?: number;   // Last update timestamp
}

/**
 * Listing event for strategy consumption
 */
export interface ListingEvent {
  coin: string;
  tradingPairs: string[];
  announcedAt: number;
  detectedAt: number;
  latency: number;        // ms between announcement and detection
  source: 'websocket' | 'rest';
  announcementId: number;
  parsedTokens: ParsedTokenInfo[];
}

/**
 * ListingArbStrategy configuration
 */
export interface ListingArbConfig {
  minVolumeUsd: number;       // Minimum 24h volume on Polymarket
  maxAgeMs: number;           // Max age of listing to act on
  positionSizeUsd: number;    // Default position size per trade
  confidenceThreshold: number; // Min confidence to trade (0-1)
  excludedCoins: string[];    // Coins to ignore (e.g., stablecoins)
  includedCategories: string[]; // Announcement categories to monitor
}

/**
 * Default configuration values
 */
export const DEFAULT_LISTING_ARB_CONFIG: ListingArbConfig = {
  minVolumeUsd: 1000,
  maxAgeMs: 120000,           // 2 minutes
  positionSizeUsd: 100,
  confidenceThreshold: 0.7,
  excludedCoins: ['USDT', 'USDC', 'BUSD', 'FDUSD'],
  includedCategories: [BinanceAnnouncementCategory.LISTING],
};
