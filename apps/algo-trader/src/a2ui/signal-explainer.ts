/**
 * A2UI Signal Explainer — Explainable AI rationale for trading signals.
 * Maps indicator values → human-readable reasoning + confidence scoring.
 */

import {
  AgentEventType,
  SignalRationaleEvent,
  ConfidenceUpdateEvent,
  ThoughtSummaryEvent,
} from './types';
import { AgentEventBus } from './agent-event-bus';

export interface ConfidenceFactor {
  name: string;
  score: number; // 0-1
  weight: number; // 0-1
}

export class SignalExplainer {
  private eventBus: AgentEventBus;

  constructor(eventBus: AgentEventBus) {
    this.eventBus = eventBus;
  }

  /** Explain a trading signal with indicator values */
  explainSignal(
    strategy: string,
    signal: 'BUY' | 'SELL' | 'NONE',
    indicators: Record<string, number>
  ): string {
    const parts: string[] = [];

    if (indicators.rsi !== undefined) {
      if (indicators.rsi < 30) parts.push(`RSI=${indicators.rsi.toFixed(1)} (oversold)`);
      else if (indicators.rsi > 70) parts.push(`RSI=${indicators.rsi.toFixed(1)} (overbought)`);
      else parts.push(`RSI=${indicators.rsi.toFixed(1)} (neutral)`);
    }

    if (indicators.smaShort !== undefined && indicators.smaLong !== undefined) {
      const cross = indicators.smaShort > indicators.smaLong ? 'bullish' : 'bearish';
      parts.push(`SMA ${cross} cross (${indicators.smaShort.toFixed(0)}/${indicators.smaLong.toFixed(0)})`);
    }

    if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
      const dir = indicators.macd > indicators.macdSignal ? 'above' : 'below';
      parts.push(`MACD ${dir} signal`);
    }

    if (indicators.bbUpper !== undefined && indicators.bbLower !== undefined && indicators.price !== undefined) {
      if (indicators.price > indicators.bbUpper) parts.push('Price above upper Bollinger');
      else if (indicators.price < indicators.bbLower) parts.push('Price below lower Bollinger');
    }

    if (indicators.hurst !== undefined) {
      const regime = indicators.hurst > 0.55 ? 'trending' : indicators.hurst < 0.45 ? 'mean-reverting' : 'random';
      parts.push(`Hurst=${indicators.hurst.toFixed(2)} (${regime})`);
    }

    const reasoning = parts.length > 0
      ? `${signal}: ${parts.join(' + ')}`
      : `${signal}: No significant indicators`;

    const event: SignalRationaleEvent = {
      type: AgentEventType.SIGNAL_RATIONALE,
      tenantId: 'default',
      timestamp: Date.now(),
      strategy,
      indicators,
      reasoning,
      signal,
    };
    this.eventBus.emit(event);

    return reasoning;
  }

  /** Calculate and emit composite confidence score */
  updateConfidence(factors: ConfidenceFactor[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const factor of factors) {
      const clampedScore = Math.max(0, Math.min(1, factor.score));
      const clampedWeight = Math.max(0, Math.min(1, factor.weight));
      weightedSum += clampedScore * clampedWeight;
      totalWeight += clampedWeight;
    }

    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const event: ConfidenceUpdateEvent = {
      type: AgentEventType.CONFIDENCE_UPDATE,
      tenantId: 'default',
      timestamp: Date.now(),
      overall,
      factors: factors.map(f => ({
        name: f.name,
        score: Math.max(0, Math.min(1, f.score)),
        weight: Math.max(0, Math.min(1, f.weight)),
      })),
    };
    this.eventBus.emit(event);

    return overall;
  }

  /** Emit a thought summary (AGI regime detection steps, etc.) */
  emitThoughtSummary(steps: string[], conclusion: string, regime?: string): void {
    const event: ThoughtSummaryEvent = {
      type: AgentEventType.THOUGHT_SUMMARY,
      tenantId: 'default',
      timestamp: Date.now(),
      steps,
      conclusion,
      regime,
    };
    this.eventBus.emit(event);
  }
}
