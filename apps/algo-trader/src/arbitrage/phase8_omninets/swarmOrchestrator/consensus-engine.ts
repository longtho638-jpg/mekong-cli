/**
 * Consensus Engine — lightweight BFT majority vote for critical decisions.
 * Collects agent signals, applies weighted majority, emits consensus result.
 * Threshold configurable (default 0.67 = 2/3 supermajority).
 */

import { EventEmitter } from 'events';
import type { AgentState } from './agent-node';

export type ConsensusSignal = 'buy' | 'sell' | 'hold' | 'no-consensus';

export interface ConsensusResult {
  signal: ConsensusSignal;
  confidence: number;
  participantCount: number;
  buyWeight: number;
  sellWeight: number;
  holdWeight: number;
  decidedAt: number;
}

export interface ConsensusEngineConfig {
  /** Fraction of total weight required to reach consensus. */
  threshold: number;
  /** Ignore agents with confidence below this value. */
  minConfidence: number;
}

const DEFAULT_CONFIG: ConsensusEngineConfig = {
  threshold: 0.67,
  minConfidence: 0.1,
};

export class ConsensusEngine extends EventEmitter {
  private readonly cfg: ConsensusEngineConfig;
  private roundCount = 0;

  constructor(config: Partial<ConsensusEngineConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compute weighted majority vote from a set of agent states.
   * Weight per agent = agent.confidence (confidence-weighted BFT).
   */
  decide(states: AgentState[]): ConsensusResult {
    this.roundCount++;

    const eligible = states.filter(
      (s) => s.confidence >= this.cfg.minConfidence,
    );

    if (eligible.length === 0) {
      return this.noConsensus(0, states.length);
    }

    let buyWeight = 0;
    let sellWeight = 0;
    let holdWeight = 0;
    let totalWeight = 0;

    for (const s of eligible) {
      totalWeight += s.confidence;
      if (s.signal === 'buy') buyWeight += s.confidence;
      else if (s.signal === 'sell') sellWeight += s.confidence;
      else holdWeight += s.confidence;
    }

    const buyFrac = totalWeight > 0 ? buyWeight / totalWeight : 0;
    const sellFrac = totalWeight > 0 ? sellWeight / totalWeight : 0;
    const holdFrac = totalWeight > 0 ? holdWeight / totalWeight : 0;

    let signal: ConsensusSignal = 'no-consensus';
    let confidence = 0;

    if (buyFrac >= this.cfg.threshold) {
      signal = 'buy';
      confidence = buyFrac;
    } else if (sellFrac >= this.cfg.threshold) {
      signal = 'sell';
      confidence = sellFrac;
    } else if (holdFrac >= this.cfg.threshold) {
      signal = 'hold';
      confidence = holdFrac;
    }

    const result: ConsensusResult = {
      signal,
      confidence,
      participantCount: eligible.length,
      buyWeight,
      sellWeight,
      holdWeight,
      decidedAt: Date.now(),
    };

    this.emit('consensus:decided', result);
    return result;
  }

  getRoundCount(): number {
    return this.roundCount;
  }

  private noConsensus(confidence: number, participantCount: number): ConsensusResult {
    return {
      signal: 'no-consensus',
      confidence,
      participantCount,
      buyWeight: 0,
      sellWeight: 0,
      holdWeight: 0,
      decidedAt: Date.now(),
    };
  }
}
