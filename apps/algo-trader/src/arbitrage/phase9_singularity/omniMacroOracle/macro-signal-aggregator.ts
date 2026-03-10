/**
 * MacroSignalAggregator — combines LLM sentiment outputs, on-chain data
 * (whale movements, exchange flows) and economic indicators into a unified
 * macro state vector. In production: connect to Glassnode / Dune / FRED APIs.
 */

import { EventEmitter } from 'events';
import type { ProcessedHeadline } from './llm-processor';

export interface OnChainData {
  whaleTransferUsd: number;   // Net whale USD moved in last window
  exchangeNetFlow: number;    // BTC net inflow to exchanges (positive = sell pressure)
  activeAddresses: number;
  nvtRatio: number;           // Network Value to Transactions
}

export interface EconomicIndicator {
  dxyIndex: number;           // US Dollar Index
  vixLevel: number;           // Volatility index
  tenYrYield: number;         // 10-year treasury yield %
  cpiYoy: number;             // CPI year-over-year %
}

export interface MacroState {
  timestamp: number;
  sentimentScore: number;     // Aggregated: -1 (bearish) to +1 (bullish)
  onChainScore: number;       // -1 to +1
  macroScore: number;         // -1 to +1 from economic indicators
  compositeScore: number;     // Weighted composite of all three
  regime: 'risk-on' | 'risk-off' | 'neutral';
  confidence: number;         // 0..1
}

export interface MacroSignalAggregatorConfig {
  enabled: boolean;
  /** Weights must sum to 1. */
  weights: { sentiment: number; onChain: number; macro: number };
  regimeThreshold: number; // |compositeScore| above this → risk-on/off
}

const DEFAULT_CONFIG: MacroSignalAggregatorConfig = {
  enabled: false,
  weights: { sentiment: 0.4, onChain: 0.35, macro: 0.25 },
  regimeThreshold: 0.3,
};

/** Mock on-chain data generator. */
function mockOnChain(): OnChainData {
  return {
    whaleTransferUsd: (Math.random() - 0.5) * 1e9,
    exchangeNetFlow: (Math.random() - 0.5) * 5000,
    activeAddresses: 800_000 + Math.random() * 200_000,
    nvtRatio: 50 + Math.random() * 100,
  };
}

/** Mock economic indicators. */
function mockEconomicIndicators(): EconomicIndicator {
  return {
    dxyIndex: 100 + (Math.random() - 0.5) * 10,
    vixLevel: 15 + Math.random() * 20,
    tenYrYield: 4.0 + (Math.random() - 0.5) * 1,
    cpiYoy: 2.0 + (Math.random() - 0.5) * 1,
  };
}

function scoreOnChain(data: OnChainData): number {
  // Negative exchange net flow = accumulation = bullish
  const flowSignal = -Math.sign(data.exchangeNetFlow) * 0.5;
  const whaleSignal = Math.sign(data.whaleTransferUsd) * 0.3;
  const nvtSignal = data.nvtRatio < 80 ? 0.2 : -0.2;
  return Math.max(-1, Math.min(1, flowSignal + whaleSignal + nvtSignal));
}

function scoreMacro(eco: EconomicIndicator): number {
  // High VIX = bearish, high DXY = bearish for crypto, low CPI = bullish
  const vixSignal = eco.vixLevel > 25 ? -0.4 : 0.2;
  const dxySignal = eco.dxyIndex > 103 ? -0.3 : 0.1;
  const cpiSignal = eco.cpiYoy < 2.5 ? 0.3 : -0.2;
  return Math.max(-1, Math.min(1, vixSignal + dxySignal + cpiSignal));
}

export class MacroSignalAggregator extends EventEmitter {
  private readonly cfg: MacroSignalAggregatorConfig;
  private lastState: MacroState | null = null;

  constructor(config: Partial<MacroSignalAggregatorConfig> = {}) {
    super();
    this.cfg = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_CONFIG.weights, ...(config.weights ?? {}) },
    };
  }

  /**
   * Aggregate processed headlines with fresh on-chain + economic data.
   * Accepts optional overrides for on-chain and economic data (for testing).
   */
  aggregate(
    headlines: ProcessedHeadline[],
    onChain?: OnChainData,
    economic?: EconomicIndicator,
  ): MacroState {
    const sentimentScore = this.aggregateSentiment(headlines);
    const onChainData = onChain ?? mockOnChain();
    const ecoData = economic ?? mockEconomicIndicators();

    const onChainScore = scoreOnChain(onChainData);
    const macroScore = scoreMacro(ecoData);

    const w = this.cfg.weights;
    const compositeScore =
      w.sentiment * sentimentScore +
      w.onChain * onChainScore +
      w.macro * macroScore;

    const regime: MacroState['regime'] =
      compositeScore > this.cfg.regimeThreshold
        ? 'risk-on'
        : compositeScore < -this.cfg.regimeThreshold
        ? 'risk-off'
        : 'neutral';

    const confidence = Math.min(1, Math.abs(compositeScore) / 0.7 + 0.3);

    const state: MacroState = {
      timestamp: Date.now(),
      sentimentScore: parseFloat(sentimentScore.toFixed(4)),
      onChainScore: parseFloat(onChainScore.toFixed(4)),
      macroScore: parseFloat(macroScore.toFixed(4)),
      compositeScore: parseFloat(compositeScore.toFixed(4)),
      regime,
      confidence: parseFloat(confidence.toFixed(4)),
    };

    this.lastState = state;
    this.emit('state:updated', state);
    return state;
  }

  getState(): MacroState | null {
    return this.lastState;
  }

  private aggregateSentiment(headlines: ProcessedHeadline[]): number {
    if (headlines.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const h of headlines) {
      const raw = h.sentiment.label === 'bullish'
        ? h.sentiment.score
        : h.sentiment.label === 'bearish'
        ? -h.sentiment.score
        : 0;

      const weight = h.original.relevanceScore;
      weightedSum += raw * weight;
      totalWeight += weight;
    }

    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  }
}
