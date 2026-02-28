/**
 * Signal Generator — Multi-indicator consensus engine.
 * Aggregates signals from multiple strategies with configurable weights.
 * BUY/SELL only when consensus threshold met.
 */

import { ISignal, SignalType } from '../interfaces/IStrategy';

export interface WeightedSignal {
  strategyName: string;
  signal: ISignal | null;
  weight: number;
}

export interface ConsensusSignal {
  type: SignalType;
  confidence: number; // 0-1: how strong the consensus is
  price: number;
  timestamp: number;
  votes: { strategy: string; vote: SignalType; weight: number }[];
  metadata: { totalWeight: number; buyWeight: number; sellWeight: number };
}

export interface SignalGeneratorConfig {
  consensusThreshold: number; // Min weighted fraction to trigger (default: 0.6 = 60%)
  minVotes: number;           // Min number of strategies that must vote (default: 2)
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

  /**
   * Aggregate weighted signals into a consensus decision.
   * @param signals Array of weighted strategy signals
   * @returns ConsensusSignal if threshold met, null otherwise
   */
  aggregate(signals: WeightedSignal[]): ConsensusSignal | null {
    const votes: ConsensusSignal['votes'] = [];
    let buyWeight = 0;
    let sellWeight = 0;
    let totalWeight = 0;
    let latestPrice = 0;
    let latestTimestamp = 0;

    for (const ws of signals) {
      const vote = ws.signal?.type ?? SignalType.NONE;
      totalWeight += ws.weight;

      if (vote === SignalType.BUY) {
        buyWeight += ws.weight;
      } else if (vote === SignalType.SELL) {
        sellWeight += ws.weight;
      }

      if (vote !== SignalType.NONE) {
        votes.push({ strategy: ws.strategyName, vote, weight: ws.weight });
      }

      if (ws.signal) {
        latestPrice = ws.signal.price;
        latestTimestamp = ws.signal.timestamp;
      }
    }

    if (totalWeight === 0 || votes.length < this.config.minVotes) {
      return null;
    }

    const buyFraction = buyWeight / totalWeight;
    const sellFraction = sellWeight / totalWeight;

    // Check consensus threshold
    if (buyFraction >= this.config.consensusThreshold) {
      return {
        type: SignalType.BUY,
        confidence: buyFraction,
        price: latestPrice,
        timestamp: latestTimestamp,
        votes,
        metadata: { totalWeight, buyWeight, sellWeight },
      };
    }

    if (sellFraction >= this.config.consensusThreshold) {
      return {
        type: SignalType.SELL,
        confidence: sellFraction,
        price: latestPrice,
        timestamp: latestTimestamp,
        votes,
        metadata: { totalWeight, buyWeight, sellWeight },
      };
    }

    return null; // No consensus reached
  }
}
