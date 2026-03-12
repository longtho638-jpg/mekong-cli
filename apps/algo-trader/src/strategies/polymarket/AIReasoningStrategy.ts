/**
 * AI Reasoning Strategy
 *
 * Uses LLM ensemble (Claude, Ollama) to estimate event probabilities.
 * Sends market question + context to LLM, gets probability estimate.
 *
 * Signal Logic:
 * - Extract market question and context
 * - Send to LLM ensemble for probability estimation
 * - Aggregate predictions (weighted average)
 * - Compare to market price
 * - If LLM probability > market + edge: Buy YES
 * - If LLM probability < market - edge: Buy NO
 *
 * Works best for: Politics, Current Events, Crypto predictions
 */

import { BasePolymarketStrategy } from './BasePolymarketStrategy';
import { ICandle } from '../../../interfaces/ICandle';
import { ISignal } from '../../../interfaces/ISignal';
import { IPolymarketSignal, PolymarketSignalType, IMarketTick } from '../../../interfaces/IPolymarket';

export interface AIReasoningConfig {
  minEdgeThreshold: number;    // Minimum edge (default 0.08 = 8%)
  maxPositionSize: number;     // Max shares (default 30)
  provider: 'claude' | 'ollama' | 'ensemble';
  confidenceThreshold: number; // Min confidence to trade (default 0.6)
  contextWindow: number;       // Max context tokens (default 4000)
}

export interface LLMResponse {
  provider: string;
  probability: number;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

export class AIReasoningStrategy extends BasePolymarketStrategy {
  name = 'AI Reasoning';

  protected config: Required<AIReasoningConfig> = {
    minEdgeThreshold: 0.08,
    maxPositionSize: 30,
    provider: 'ensemble',
    confidenceThreshold: 0.6,
    contextWindow: 4000,
  };

  private llmResponses = new Map<string, LLMResponse[]>(); // tokenId -> responses

  async init(candles: ICandle[], config?: Record<string, unknown>): Promise<void> {
    await super.init(candles, config);
    if (config) {
      this.config = { ...this.config, ...(config as unknown as AIReasoningConfig) };
    }
  }

  getConfigSchema(): Record<string, unknown> {
    return {
      minEdgeThreshold: { type: 'number', default: 0.08, min: 0.02, max: 0.2 },
      maxPositionSize: { type: 'number', default: 30, min: 10, max: 100 },
      provider: { type: 'string', enum: ['claude', 'ollama', 'ensemble'] },
      confidenceThreshold: { type: 'number', default: 0.6, min: 0.3, max: 0.9 },
      contextWindow: { type: 'number', default: 4000, min: 1000, max: 32000 },
    };
  }

  /**
   * Calculate fair value from LLM ensemble
   */
  async calculateFairValue(tokenId: string): Promise<number | null> {
    const responses = this.llmResponses.get(tokenId);
    if (!responses || responses.length === 0) return null;

    // Weighted average by confidence
    let totalWeight = 0;
    let weightedSum = 0;

    for (const resp of responses) {
      const weight = resp.confidence;
      weightedSum += resp.probability * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0.5;
    return weightedSum / totalWeight;
  }

  /**
   * Add LLM response (called externally from LLM service)
   */
  addLLMResponse(tokenId: string, response: LLMResponse): void {
    const responses = this.llmResponses.get(tokenId) || [];
    responses.push(response);

    // Keep only last N responses
    if (responses.length > 5) {
      responses.shift();
    }

    this.llmResponses.set(tokenId, responses);
  }

  /**
   * Clear cached responses
   */
  clearResponses(tokenId: string): void {
    this.llmResponses.delete(tokenId);
  }

  /**
   * Generate trading signal from LLM predictions
   */
  async generateSignal(tokenId: string, marketId: string, tick: IMarketTick): Promise<IPolymarketSignal | null> {
    const responses = this.llmResponses.get(tokenId);
    if (!responses || responses.length === 0) return null;

    // Check minimum confidence
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    if (avgConfidence < this.config.confidenceThreshold) return null;

    const fairValue = await this.calculateFairValue(tokenId);
    if (fairValue === null) return null;

    const marketPrice = tick.yesPrice;
    const edge = fairValue - marketPrice;

    if (Math.abs(edge) < this.config.minEdgeThreshold) return null;

    const reasoning = responses.map(r => r.reasoning).join('; ');

    if (edge > 0) {
      return {
        type: PolymarketSignalType.BUY_YES,
        tokenId,
        marketId,
        side: 'YES',
        action: 'BUY',
        price: marketPrice,
        size: this.config.maxPositionSize,
        timestamp: Date.now(),
        expectedValue: edge * this.config.maxPositionSize,
        confidence: avgConfidence,
        catalyst: `AI ensemble: fair=${fairValue.toFixed(2)} vs market=${marketPrice}`,
        metadata: {
          fairValue,
          marketPrice,
          edge,
          llmCount: responses.length,
          reasoning: reasoning.substring(0, 200),
        },
      };
    } else {
      return {
        type: PolymarketSignalType.BUY_NO,
        tokenId,
        marketId,
        side: 'NO',
        action: 'BUY',
        price: tick.noPrice,
        size: this.config.maxPositionSize,
        timestamp: Date.now(),
        expectedValue: Math.abs(edge) * this.config.maxPositionSize,
        confidence: avgConfidence,
        catalyst: `AI ensemble: fair=${fairValue.toFixed(2)} vs market=${marketPrice}`,
        metadata: {
          fairValue,
          marketPrice,
          edge: Math.abs(edge),
          llmCount: responses.length,
          reasoning: reasoning.substring(0, 200),
        },
      };
    }
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    return null;
  }

  processTick(tick: IMarketTick): IPolymarketSignal | null {
    this.onMarketTick(tick);
    return this.generateSignal(tick.tokenId, tick.marketId, tick);
  }
}
