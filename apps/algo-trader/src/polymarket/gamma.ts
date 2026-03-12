/**
 * Polymarket Gamma API Client
 *
 * Market discovery via https://gamma-api.polymarket.com
 * No authentication required - public API for market metadata
 */

import axios from "axios";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string; // JSON string: "[\"Yes\",\"No\"]"
  outcomePrices: string; // JSON string: "[\"0.545\",\"0.455\"]"
  clobTokenIds: string; // JSON string: "[\"21742...\",\"48331...\"]"
  active: boolean;
  closed: boolean;
  volumeNum: number;
  liquidityNum: number;
  category: string;
  endDate: string;
  startDate: string;
}

export interface ParsedMarket {
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
}

export interface GammaEvent {
  id: string;
  title: string;
  category: string;
  markets_count: number;
}

export class PolymarketGammaClient {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: GAMMA_BASE_URL,
      timeout: 10000,
    });
  }

  /**
   * Get list of markets with optional filters
   */
  async getMarkets(params?: {
    active?: boolean;
    closed?: boolean;
    limit?: number;
    offset?: number;
    order?: string;
    ascending?: boolean;
    category?: string;
    tag_id?: number;
    condition_ids?: string;
    clob_token_ids?: string;
    end_date_min?: string;
    end_date_max?: string;
    liquidity_num_min?: number;
    volume_num_min?: number;
  }): Promise<ParsedMarket[]> {
    const defaultParams = {
      active: true,
      closed: false,
      limit: 100,
      offset: 0,
      order: "volume24hr",
      ascending: false,
      ...params,
    };

    const response = await this.client.get<any, { data: GammaMarket[] }>("/markets", { params: defaultParams });
    return response.data.map((m: GammaMarket) => this.parseMarket(m));
  }

  async getMarket(id: string): Promise<ParsedMarket | null> {
    try {
      const response = await this.client.get<any, { data: GammaMarket }>(`/markets/${id}`);
      return this.parseMarket(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Search markets by keyword
   */
  async search(query: string, limit = 50): Promise<ParsedMarket[]> {
    const response = await this.client.get<any, { data: GammaMarket[] }>("/search", {
      params: { q: query, limit },
    });
    return response.data.map((m: GammaMarket) => this.parseMarket(m));
  }

  /**
   * Get list of events
   */
  async getEvents(params?: {
    limit?: number;
    offset?: number;
  }): Promise<GammaEvent[]> {
    const response = await this.client.get<any, { data: GammaEvent[] }>("/events", { params });
    return response.data;
  }

  /**
   * Get single event by ID
   */
  async getEvent(id: string): Promise<GammaEvent> {
    const response = await this.client.get<any, { data: GammaEvent }>(`/events/${id}`);
    return response.data;
  }

  /**
   * Find crypto short-duration markets (5-min, 15-min BTC/ETH up/down)
   */
  async findCryptoShortMarkets(): Promise<ParsedMarket[]> {
    const markets = await this.getMarkets({
      active: true,
      closed: false,
      limit: 200,
      order: "startDate",
      ascending: false,
    });

    return markets.filter((m) => {
      const q = m.question.toLowerCase();
      const isCrypto =
        q.includes("btc") ||
        q.includes("bitcoin") ||
        q.includes("eth") ||
        q.includes("crypto");
      const isShort =
        q.includes("up or down") ||
        q.includes("5 min") ||
        q.includes("15 min") ||
        q.includes("minute");
      return isCrypto && isShort;
    });
  }

  /**
   * Find weather markets
   */
  async findWeatherMarkets(): Promise<ParsedMarket[]> {
    const markets = await this.getMarkets({
      active: true,
      closed: false,
      limit: 100,
      category: "Weather",
    });

    return markets.filter((m) => m.category === "Weather");
  }

  /**
   * Find politics markets
   */
  async findPoliticsMarkets(): Promise<ParsedMarket[]> {
    const markets = await this.getMarkets({
      active: true,
      closed: false,
      limit: 100,
      category: "Politics",
    });

    return markets.filter((m) => m.category === "Politics");
  }

  /**
   * Parse raw Gamma market response
   * Critical: outcomes, outcomePrices, clobTokenIds are JSON strings!
   */
  private parseMarket(raw: GammaMarket): ParsedMarket {
    const outcomes = JSON.parse(raw.outcomes) as string[];
    const prices = JSON.parse(raw.outcomePrices) as string[];
    const tokenIds = JSON.parse(raw.clobTokenIds) as string[];

    return {
      id: raw.id,
      question: raw.question,
      conditionId: raw.conditionId,
      slug: raw.slug,
      outcomes,
      outcomePrices: prices.map((p) => parseFloat(p)),
      clobTokenIds: tokenIds,
      yesTokenId: tokenIds[0], // index 0 = YES
      noTokenId: tokenIds[1], // index 1 = NO
      yesPrice: parseFloat(prices[0]),
      noPrice: parseFloat(prices[1]),
      active: raw.active,
      closed: raw.closed,
      volume: raw.volumeNum,
      liquidity: raw.liquidityNum,
      category: raw.category,
      endDate: new Date(raw.endDate),
      startDate: new Date(raw.startDate),
    };
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.data === "OK";
    } catch {
      return false;
    }
  }
}
