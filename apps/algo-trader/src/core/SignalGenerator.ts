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
    let noneWeight = 0;  // Track NONE weight for minVotes calculation
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
      } else {
        // NONE or null - still counts as a "voting strategy" for minVotes
        noneWeight += ws.weight;
      }

      if (vote !== SignalType.NONE) {
        votes.push({ strategy: ws.strategyName, vote, weight: ws.weight });
      }

      if (ws.signal) {
        latestPrice = ws.signal.price;
        latestTimestamp = ws.signal.timestamp;
      }
    }

    // minVotes counts participating strategies (including NONE), not just actual BUY/SELL votes
    // This ensures we have enough strategies active, regardless of whether they vote to abstain
    const participatingStrategies = signals.length;
    if (totalWeight === 0 || participatingStrategies < this.config.minVotes) {
      return null;
    }

    // Threshold check: use totalWeight (including NONE) to require broad consensus
    const buyFractionOfTotal = buyWeight / totalWeight;
    const sellFractionOfTotal = sellWeight / totalWeight;

    // Confidence calculation: use votingWeight (excluding NONE) to show strength among voters
    const votingWeight = buyWeight + sellWeight;
    const buyConfidence = votingWeight > 0 ? buyWeight / votingWeight : 0;
    const sellConfidence = votingWeight > 0 ? sellWeight / votingWeight : 0;

    // Check consensus threshold using total weight fraction
    const buyMeetsThreshold = buyFractionOfTotal >= this.config.consensusThreshold;
    const sellMeetsThreshold = sellFractionOfTotal >= this.config.consensusThreshold;

    if (buyMeetsThreshold && sellMeetsThreshold) {
      // Both meet threshold - pick the one with higher raw weight
      // If equal, prefer SELL (conservative approach - don't buy on uncertainty)
      if (buyWeight > sellWeight) {
        return {
          type: SignalType.BUY,
          confidence: buyConfidence,
          price: latestPrice,
          timestamp: latestTimestamp,
          votes,
          metadata: { totalWeight, buyWeight, sellWeight },
        };
      } else {
        // sellWeight >= buyWeight: SELL wins ties (conservative)
        return {
          type: SignalType.SELL,
          confidence: sellConfidence,
          price: latestPrice,
          timestamp: latestTimestamp,
          votes,
          metadata: { totalWeight, buyWeight, sellWeight },
        };
      }
    }

    if (buyMeetsThreshold) {
      return {
        type: SignalType.BUY,
        confidence: buyConfidence,
        price: latestPrice,
        timestamp: latestTimestamp,
        votes,
        metadata: { totalWeight, buyWeight, sellWeight },
      };
    }

    if (sellMeetsThreshold) {
      return {
        type: SignalType.SELL,
        confidence: sellConfidence,
        price: latestPrice,
        timestamp: latestTimestamp,
        votes,
        metadata: { totalWeight, buyWeight, sellWeight },
      };
    }

    return null; // No consensus reached
  }
}
