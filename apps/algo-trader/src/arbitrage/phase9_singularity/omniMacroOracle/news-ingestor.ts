/**
 * NewsIngestor — streams mock news headlines in real time.
 * Rate-limited queue; subscribers receive headlines as they arrive.
 * In production: replace mock feed with real news API (e.g., Alpaca, Polygon).
 */

import { EventEmitter } from 'events';

export interface NewsHeadline {
  id: string;
  source: NewsSource;
  headline: string;
  timestamp: number;
  url: string;
  relevanceScore: number;
}

export type NewsSource = 'reuters' | 'bloomberg' | 'twitter' | 'coindesk' | 'cnn';

export interface NewsIngestorConfig {
  enabled: boolean;
  sources: NewsSource[];
  /** Max headlines per second across all sources. */
  rateLimit: number;
  /** Max headlines held in queue before oldest is dropped. */
  maxQueueSize: number;
  /** Interval in ms between mock ticks. */
  tickIntervalMs: number;
}

const DEFAULT_CONFIG: NewsIngestorConfig = {
  enabled: false,
  sources: ['reuters', 'bloomberg'],
  rateLimit: 10,
  maxQueueSize: 500,
  tickIntervalMs: 1_000,
};

const MOCK_HEADLINES: Record<NewsSource, string[]> = {
  reuters: ['Fed raises rates by 25bps', 'Oil prices surge on OPEC cut', 'Tech stocks rally'],
  bloomberg: ['BTC breaks $100k resistance', 'ETH ETF approved', 'DXY weakens on CPI data'],
  twitter: ['#Bitcoin trending globally', 'Whale alert: 10k BTC moved', 'Markets in fear'],
  coindesk: ['Layer 2 volumes hit record', 'Stablecoin cap surpasses $200B', 'DeFi TVL rebounds'],
  cnn: ['Recession fears ease', 'Jobs report beats expectations', 'Inflation cools to 2.1%'],
};

type Subscriber = (headline: NewsHeadline) => void;

export class NewsIngestor extends EventEmitter {
  private readonly cfg: NewsIngestorConfig;
  private queue: NewsHeadline[] = [];
  private readonly subscribers = new Set<Subscriber>();
  private ticker: ReturnType<typeof setInterval> | null = null;
  private headlineCounter = 0;

  constructor(config: Partial<NewsIngestorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }
    if (this.ticker) return;

    this.ticker = setInterval(() => this.tick(), this.cfg.tickIntervalMs);
    this.emit('started', { sources: this.cfg.sources });
  }

  stop(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.emit('stopped');
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getQueue(): NewsHeadline[] {
    return [...this.queue];
  }

  private tick(): void {
    const batchSize = Math.min(this.cfg.rateLimit, this.cfg.sources.length);

    for (let i = 0; i < batchSize; i++) {
      const source = this.cfg.sources[i % this.cfg.sources.length];
      const headlines = MOCK_HEADLINES[source];
      const headline = headlines[this.headlineCounter % headlines.length];

      const item: NewsHeadline = {
        id: `${source}-${this.headlineCounter}`,
        source,
        headline,
        timestamp: Date.now(),
        url: `https://mock.${source}.com/${this.headlineCounter}`,
        relevanceScore: Math.random(),
      };

      this.headlineCounter++;

      // Enforce queue size
      if (this.queue.length >= this.cfg.maxQueueSize) {
        this.queue.shift();
        this.emit('queue:overflow');
      }

      this.queue.push(item);
      this.notifySubscribers(item);
      this.emit('headline', item);
    }
  }

  private notifySubscribers(headline: NewsHeadline): void {
    for (const fn of this.subscribers) {
      try { fn(headline); } catch { /* isolate subscriber errors */ }
    }
  }

  isRunning(): boolean {
    return this.ticker !== null;
  }
}
