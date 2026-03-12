/**
 * MarketScanner — Polymarket market discovery via Gamma API
 *
 * Features:
 * - Continuous market scanning with Gamma API integration
 * - Market lifecycle tracking (upcoming/active/resolved)
 * - Volume + liquidity filtering
 * - Auto-refresh every 5 minutes
 * - Opportunity scoring (edge, volume, liquidity)
 *
 * @module core
 */

import { EventEmitter } from "events";
import { PolymarketGammaClient, ParsedMarket } from "../polymarket/gamma";
import { logger } from "../utils/logger";

// ============================================================================
// Constants
// ============================================================================

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MIN_VOLUME = 1000; // $1,000 minimum volume
const DEFAULT_MIN_LIQUIDITY = 500; // $500 minimum liquidity
const MAX_MARKETS = 200; // Maximum markets to track

// ============================================================================
// Type Definitions
// ============================================================================

export enum MarketLifecycle {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  RESOLVING = "RESOLVING",
  RESOLVED = "RESOLVED",
}

export interface Market {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds: string[];
  yesTokenId: string;
  noTokenId: string;
  yesPrice: number;
  noPrice: number;
  active: boolean;
  closed: boolean;
  volume: number;
  liquidity: number;
  category: string;
  endDate: Date;
  startDate: Date;
  lifecycle: MarketLifecycle;
}

export interface Opportunity {
  market: Market;
  score: number; // 0-100 opportunity score
  edge: number; // Estimated edge (0-1)
  volumeScore: number; // Normalized volume score
  liquidityScore: number; // Normalized liquidity score
  imbalancedProbability: number; // |yesPrice - 0.5|
  reason: string; // Why this is an opportunity
}

export interface ScannerConfig {
  minVolume?: number;
  minLiquidity?: number;
  maxMarkets?: number;
  refreshIntervalMs?: number;
  categories?: string[]; // Filter by categories
  autoRefresh?: boolean;
}

export interface ScanResult {
  markets: Market[];
  opportunities: Opportunity[];
  scannedAt: number;
  totalActive: number;
  totalUpcoming: number;
  totalResolved: number;
}

// ============================================================================
// MarketScanner Class
// ============================================================================

export class MarketScanner extends EventEmitter {
  private client: PolymarketGammaClient;
  private config: ScannerConfig;
  private markets: Map<string, Market>;
  private opportunities: Map<string, Opportunity>;
  private refreshTimer?: NodeJS.Timeout;
  private lastScanAt?: number;
  private isScanning: boolean = false;

  constructor(config: ScannerConfig = {}) {
    super();
    this.client = new PolymarketGammaClient();
    this.config = {
      minVolume: DEFAULT_MIN_VOLUME,
      minLiquidity: DEFAULT_MIN_LIQUIDITY,
      maxMarkets: MAX_MARKETS,
      refreshIntervalMs: REFRESH_INTERVAL_MS,
      autoRefresh: false,
      ...config,
    };
    this.markets = new Map();
    this.opportunities = new Map();
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Initialize scanner and optionally start auto-refresh
   */
  async initialize(): Promise<void> {
    logger.info("MarketScanner: Initializing...");

    // Initial scan
    await this.refreshActiveMarkets();

    // Start auto-refresh if enabled
    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }

    logger.info("MarketScanner: Initialized with auto-refresh=" + this.config.autoRefresh);
  }

  /**
   * Shutdown scanner and cleanup timers
   */
  shutdown(): void {
    this.stopAutoRefresh();
    this.markets.clear();
    this.opportunities.clear();
    logger.info("MarketScanner: Shutdown complete");
  }

  // ============================================================================
  // Market Scanning
  // ============================================================================

  /**
   * Scan markets by keyword query
   */
  async scanForMarkets(query: string): Promise<Market[]> {
    try {
      this.isScanning = true;

      const gammaMarkets = await this.client.search(query, this.config.maxMarkets);

      const markets = gammaMarkets
        .filter((m) => this.passesFilters(m))
        .map((m) => this.toMarket(m))
        .slice(0, this.config.maxMarkets);

      // Update internal cache
      for (const market of markets) {
        this.markets.set(market.id, market);
      }

      this.lastScanAt = Date.now();
      this.isScanning = false;

      logger.info(`MarketScanner: Found ${markets.length} markets for "${query}"`);
      return markets;
    } catch (error) {
      this.isScanning = false;
      logger.error("MarketScanner: scanForMarkets failed", error);
      return [];
    }
  }

  /**
   * Refresh all active markets from Gamma API
   */
  async refreshActiveMarkets(): Promise<void> {
    try {
      this.isScanning = true;

      const gammaMarkets = await this.client.getMarkets({
        active: true,
        closed: false,
        limit: this.config.maxMarkets,
        order: "volume24hr",
        ascending: false,
        volume_num_min: this.config.minVolume,
        liquidity_num_min: this.config.minLiquidity,
      });

      const markets = gammaMarkets
        .filter((m) => this.passesFilters(m))
        .map((m) => this.toMarket(m))
        .slice(0, this.config.maxMarkets);

      // Update internal cache
      this.markets.clear();
      for (const market of markets) {
        this.markets.set(market.id, market);
      }

      // Recalculate opportunities
      this.opportunities.clear();
      for (const market of markets) {
        const opp = this.calculateOpportunity(market);
        if (opp.score >= 50) {
          this.opportunities.set(market.id, opp);
        }
      }

      this.lastScanAt = Date.now();
      this.isScanning = false;

      // Emit scan complete event
      this.emit("scan-complete", {
        markets: Array.from(this.markets.values()),
        opportunities: this.getOpportunities(),
        scannedAt: this.lastScanAt,
      });

      logger.info(
        `MarketScanner: Refreshed ${markets.length} active markets, ${this.opportunities.size} opportunities`
      );
    } catch (error) {
      this.isScanning = false;
      logger.error("MarketScanner: refreshActiveMarkets failed", error);
      throw error;
    }
  }

  // ============================================================================
  // Market Lifecycle
  // ============================================================================

  /**
   * Get lifecycle stage for a market
   */
  getMarketLifecycle(conditionId: string): MarketLifecycle {
    const market = this.markets.get(conditionId);
    if (!market) {
      return MarketLifecycle.RESOLVED;
    }

    const now = new Date();
    const timeToStart = market.startDate.getTime() - now.getTime();
    const timeToEnd = market.endDate.getTime() - now.getTime();

    // Resolved: market is closed and end date has passed
    if (market.closed || timeToEnd < 0) {
      return MarketLifecycle.RESOLVED;
    }

    // Resolving: end date approaching (within 1 hour)
    if (timeToEnd < 60 * 60 * 1000) {
      return MarketLifecycle.RESOLVING;
    }

    // Active: market is open and trading
    if (market.active && timeToStart <= 0) {
      return MarketLifecycle.ACTIVE;
    }

    // Upcoming: market not yet started
    return MarketLifecycle.UPCOMING;
  }

  /**
   * Get markets by lifecycle stage
   */
  getMarketsByLifecycle(stage: MarketLifecycle): Market[] {
    return Array.from(this.markets.values()).filter(
      (m) => this.getMarketLifecycle(m.conditionId) === stage
    );
  }

  // ============================================================================
  // Opportunity Scoring
  // ============================================================================

  /**
   * Calculate opportunity score for a market
   * Score 0-100 based on edge, volume, liquidity
   */
  private calculateOpportunity(market: Market): Opportunity {
    // Imbalance score: how far from 50/50 (higher = more potential edge)
    const imbalancedProbability = Math.abs(market.yesPrice - 0.5);
    const edge = imbalancedProbability * 2; // Normalize to 0-1

    // Volume score: logarithmic scaling
    const volumeScore = Math.min(100, Math.log10(market.volume + 1) * 20);

    // Liquidity score: logarithmic scaling
    const liquidityScore = Math.min(100, Math.log10(market.liquidity + 1) * 20);

    // Combined score (weighted average)
    const score = edge * 40 + volumeScore * 30 + liquidityScore * 30;

    // Generate reason
    let reason = [];
    if (edge > 0.6) reason.push(`High edge (${(edge * 100).toFixed(0)}%)`);
    if (volumeScore > 60) reason.push(`High volume ($${(market.volume / 1000).toFixed(1)}k)`);
    if (liquidityScore > 60) reason.push(`High liquidity ($${(market.liquidity / 1000).toFixed(1)}k)`);
    if (market.yesPrice > 0.7) reason.push(`Strong YES bias (${(market.yesPrice * 100).toFixed(0)}%)`);
    if (market.yesPrice < 0.3) reason.push(`Strong NO bias (${((1 - market.yesPrice) * 100).toFixed(0)}%)`);

    return {
      market,
      score: Math.round(score),
      edge,
      volumeScore: Math.round(volumeScore),
      liquidityScore: Math.round(liquidityScore),
      imbalancedProbability,
      reason: reason.join(", ") || "Moderate opportunity",
    };
  }

  /**
   * Get all opportunities sorted by score
   */
  getOpportunities(): Opportunity[] {
    return Array.from(this.opportunities.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get top N opportunities
   */
  getTopOpportunities(limit: number = 10): Opportunity[] {
    return this.getOpportunities().slice(0, limit);
  }

  // ============================================================================
  // Auto Refresh
  // ============================================================================

  /**
   * Start automatic refresh timer
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      return;
    }

    const interval = this.config.refreshIntervalMs || REFRESH_INTERVAL_MS;

    this.refreshTimer = setInterval(() => {
      this.refreshActiveMarkets().catch((error) => {
        logger.error("MarketScanner: Auto-refresh failed", error);
        this.emit("scan-error", error);
      });
    }, interval);

    logger.info(`MarketScanner: Auto-refresh started (interval=${interval}ms)`);
  }

  /**
   * Stop automatic refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
      logger.info("MarketScanner: Auto-refresh stopped");
    }
  }

  // ============================================================================
  // Filter Helpers
  // ============================================================================

  /**
   * Check if market passes configured filters
   */
  private passesFilters(market: ParsedMarket): boolean {
    // Volume filter
    if (market.volume < (this.config.minVolume || DEFAULT_MIN_VOLUME)) {
      return false;
    }

    // Liquidity filter
    if (market.liquidity < (this.config.minLiquidity || DEFAULT_MIN_LIQUIDITY)) {
      return false;
    }

    // Category filter
    if (this.config.categories && this.config.categories.length > 0) {
      if (!this.config.categories.includes(market.category)) {
        return false;
      }
    }

    // Must be active and not closed
    if (!market.active || market.closed) {
      return false;
    }

    return true;
  }

  /**
   * Convert ParsedMarket to internal Market type
   */
  private toMarket(parsed: ParsedMarket): Market {
    return {
      ...parsed,
      lifecycle: this.getMarketLifecycle(parsed.conditionId),
    };
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Get all tracked markets
   */
  getMarkets(): Market[] {
    return Array.from(this.markets.values());
  }

  /**
   * Get market by ID
   */
  getMarket(conditionId: string): Market | undefined {
    return this.markets.get(conditionId);
  }

  /**
   * Get scan result summary
   */
  getScanResult(): ScanResult {
    const markets = this.getMarkets();
    const opportunities = this.getOpportunities();

    return {
      markets,
      opportunities,
      scannedAt: this.lastScanAt || 0,
      totalActive: markets.filter((m) => m.lifecycle === MarketLifecycle.ACTIVE).length,
      totalUpcoming: markets.filter((m) => m.lifecycle === MarketLifecycle.UPCOMING).length,
      totalResolved: markets.filter((m) => m.lifecycle === MarketLifecycle.RESOLVED).length,
    };
  }

  /**
   * Check if scanner is ready
   */
  isReady(): boolean {
    return !this.isScanning;
  }

  /**
   * Get last scan timestamp
   */
  getLastScanAt(): number | undefined {
    return this.lastScanAt;
  }
}

export default MarketScanner;
