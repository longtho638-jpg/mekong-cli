/**
 * NewsIngestor — simulated news feed ingestor.
 * In production would connect to Reuters/Bloomberg WebSocket APIs.
 * Simulation mode: cycles through a static mock headline array.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface NewsItem {
  id: string;
  timestamp: number;
  headline: string;
  source: string;
  sentiment: number; // pre-labeled: -1.0 to 1.0
  category: string;
}

const MOCK_NEWS: NewsItem[] = [
  { id: 'n1', timestamp: 0, headline: 'Fed signals aggressive rate hikes amid inflation surge', source: 'Reuters', sentiment: -0.8, category: 'macro' },
  { id: 'n2', timestamp: 0, headline: 'Bitcoin ETF approval boosts crypto market sentiment', source: 'Bloomberg', sentiment: 0.9, category: 'crypto' },
  { id: 'n3', timestamp: 0, headline: 'SEC launches probe into DeFi protocols', source: 'WSJ', sentiment: -0.6, category: 'regulation' },
  { id: 'n4', timestamp: 0, headline: 'Ethereum network upgrade reduces gas fees by 40%', source: 'CoinDesk', sentiment: 0.75, category: 'crypto' },
  { id: 'n5', timestamp: 0, headline: 'Global recession fears mount as PMI data disappoints', source: 'FT', sentiment: -0.7, category: 'macro' },
  { id: 'n6', timestamp: 0, headline: 'Institutional adoption of crypto reaches all-time high', source: 'Bloomberg', sentiment: 0.85, category: 'crypto' },
  { id: 'n7', timestamp: 0, headline: 'Stablecoin depegging event triggers market panic', source: 'Reuters', sentiment: -0.9, category: 'crypto' },
  { id: 'n8', timestamp: 0, headline: 'Central bank digital currency pilots show promising results', source: 'FT', sentiment: 0.4, category: 'macro' },
];

export class NewsIngestor extends EventEmitter {
  private running = false;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private itemsProcessed = 0;
  private mockIndex = 0;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 3000) {
    super();
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info('[NewsIngestor] Started — polling mock news feed');
    this.intervalHandle = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    logger.info('[NewsIngestor] Stopped');
  }

  /** Inject a news item externally (for testing). Only works when running. */
  injectNews(item: NewsItem): void {
    if (!this.running) return;
    this.processItem(item);
  }

  getStats(): { itemsProcessed: number } {
    return { itemsProcessed: this.itemsProcessed };
  }

  private poll(): void {
    const template = MOCK_NEWS[this.mockIndex % MOCK_NEWS.length];
    const item: NewsItem = { ...template, timestamp: Date.now(), id: `${template.id}_${this.itemsProcessed}` };
    this.mockIndex++;
    this.processItem(item);
  }

  private processItem(item: NewsItem): void {
    this.itemsProcessed++;
    logger.debug(`[NewsIngestor] News[${item.id}] sentiment=${item.sentiment.toFixed(2)} "${item.headline.slice(0, 50)}..."`);
    this.emit('news', item);
  }
}
