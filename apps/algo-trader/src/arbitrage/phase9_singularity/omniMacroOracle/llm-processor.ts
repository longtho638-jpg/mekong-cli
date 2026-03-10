/**
 * LlmProcessor — processes news headlines via mock LLM (llama.cpp / transformers.js).
 * Extracts sentiment, named entities, and event probabilities per headline.
 * In production: replace with real llama.cpp bindings or ONNX runtime.
 */

import { EventEmitter } from 'events';
import type { NewsHeadline } from './news-ingestor';

export interface LlmProcessorConfig {
  enabled: boolean;
  modelName: string;
  /** Max concurrent inference requests. */
  concurrency: number;
  /** Simulated inference latency in ms. */
  inferenceLatencyMs: number;
}

export interface SentimentResult {
  label: 'bullish' | 'bearish' | 'neutral';
  score: number; // 0..1
}

export interface ProcessedHeadline {
  original: NewsHeadline;
  sentiment: SentimentResult;
  entities: string[];
  eventProbabilities: Record<string, number>;
  processedAt: number;
}

const DEFAULT_CONFIG: LlmProcessorConfig = {
  enabled: false,
  modelName: 'llama3-8b-instruct',
  concurrency: 4,
  inferenceLatencyMs: 0,
};

/** Keyword-based mock sentiment — deterministic for testing. */
function mockSentiment(headline: string): SentimentResult {
  const lower = headline.toLowerCase();
  const bullishKw = ['rally', 'surge', 'approved', 'beats', 'record', 'breaks', 'cools', 'ease', 'rebounds'];
  const bearishKw = ['fear', 'recession', 'cut', 'weakens', 'alert', 'trending'];

  let score = 0;
  for (const kw of bullishKw) if (lower.includes(kw)) score++;
  for (const kw of bearishKw) if (lower.includes(kw)) score--;

  if (score > 0) return { label: 'bullish', score: Math.min(0.5 + score * 0.1, 1.0) };
  if (score < 0) return { label: 'bearish', score: Math.min(0.5 + Math.abs(score) * 0.1, 1.0) };
  return { label: 'neutral', score: 0.5 };
}

/** Extract capitalised words as mock entities. */
function mockEntities(headline: string): string[] {
  return headline.match(/\b[A-Z][A-Z0-9]+\b/g) ?? [];
}

/** Produce mock event-probability map from sentiment. */
function mockEventProbs(sentiment: SentimentResult): Record<string, number> {
  const base = sentiment.label === 'bullish' ? sentiment.score : 1 - sentiment.score;
  return {
    priceUp: parseFloat(base.toFixed(3)),
    priceDown: parseFloat((1 - base).toFixed(3)),
    highVolatility: parseFloat((Math.random() * 0.4 + 0.3).toFixed(3)),
  };
}

export class LlmProcessor extends EventEmitter {
  private readonly cfg: LlmProcessorConfig;
  private activeJobs = 0;

  constructor(config: Partial<LlmProcessorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a batch of headlines. Respects concurrency limit.
   * Returns only successfully processed items.
   */
  async processHeadlines(headlines: NewsHeadline[]): Promise<ProcessedHeadline[]> {
    const results: ProcessedHeadline[] = [];

    for (const chunk of this.chunks(headlines, this.cfg.concurrency)) {
      const processed = await Promise.all(chunk.map((h) => this.inferOne(h)));
      results.push(...processed);
    }

    this.emit('batch:complete', { count: results.length });
    return results;
  }

  getModel(): string {
    return this.cfg.modelName;
  }

  getConfig(): LlmProcessorConfig {
    return { ...this.cfg };
  }

  isEnabled(): boolean {
    return this.cfg.enabled;
  }

  private async inferOne(headline: NewsHeadline): Promise<ProcessedHeadline> {
    this.activeJobs++;
    this.emit('inference:start', { id: headline.id });

    if (this.cfg.inferenceLatencyMs > 0) {
      await delay(this.cfg.inferenceLatencyMs);
    }

    const sentiment = mockSentiment(headline.headline);
    const entities = mockEntities(headline.headline);
    const eventProbabilities = mockEventProbs(sentiment);

    const result: ProcessedHeadline = {
      original: headline,
      sentiment,
      entities,
      eventProbabilities,
      processedAt: Date.now(),
    };

    this.activeJobs--;
    this.emit('inference:done', { id: headline.id, sentiment: sentiment.label });
    return result;
  }

  getActiveJobs(): number {
    return this.activeJobs;
  }

  private *chunks<T>(arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) {
      yield arr.slice(i, i + size);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
