/**
 * Signal Generator — Multi-indicator consensus engine.
 * Aggregates signals from multiple strategies with configurable weights.
 * BUY/SELL only fires when consensus threshold is met.
 */

import { SignalType, ISignal } from '../interfaces/strategy-types';

export interface WeightedSignal {
  strategyName: string;
  signal: ISignal | null;
  weight: number;
}

export interface ConsensusSignal {
  type: SignalType;
  confidence: number;
  price: number;
  timestamp: number;
  votes: { strategy: string; vote: SignalType; weight: number }[];
  metadata: { totalWeight: number; buyWeight: number; sellWeight: number };
}

export interface SignalGeneratorConfig {
  consensusThreshold: number;
  minVotes: number;
}

const DEFAULT_CONFIG: SignalGeneratorConfig = {
  consensusThreshold: 0.6,
  minVotes: 2,
};

export class SignalGenerator {
  private config: SignalGeneratorConfig;

  constructor(config?: Partial<SignalGeneratorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Aggregate weighted signals into consensus decision */
  aggregate(signals: WeightedSignal[]): ConsensusSignal | null {
    const votes: ConsensusSignal['votes'] = [];
    let buyWeight = 0, sellWeight = 0, totalWeight = 0;
    let latestPrice = 0, latestTimestamp = 0;

    for (const ws of signals) {
      const vote = ws.signal?.type ?? SignalType.NONE;
      totalWeight += ws.weight;

      if (vote === SignalType.BUY) buyWeight += ws.weight;
      else if (vote === SignalType.SELL) sellWeight += ws.weight;

      if (vote !== SignalType.NONE) {
        votes.push({ strategy: ws.strategyName, vote, weight: ws.weight });
      }
      if (ws.signal) {
        latestPrice = ws.signal.price;
        latestTimestamp = ws.signal.timestamp;
      }
    }

    if (totalWeight === 0 || votes.length < this.config.minVotes) return null;

    const buyFraction = buyWeight / totalWeight;
    const sellFraction = sellWeight / totalWeight;
    const meta = { totalWeight, buyWeight, sellWeight };

    if (buyFraction >= this.config.consensusThreshold) {
      return { type: SignalType.BUY, confidence: buyFraction, price: latestPrice, timestamp: latestTimestamp, votes, metadata: meta };
    }
    if (sellFraction >= this.config.consensusThreshold) {
      return { type: SignalType.SELL, confidence: sellFraction, price: latestPrice, timestamp: latestTimestamp, votes, metadata: meta };
    }
    return null;
  }
}
