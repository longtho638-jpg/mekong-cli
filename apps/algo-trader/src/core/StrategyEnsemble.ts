/**
 * Strategy Ensemble — runs multiple strategies on same candle feed,
 * aggregates via SignalGenerator consensus voting.
 * Implements IStrategy interface so it can be used as a drop-in replacement.
 */

import { IStrategy, ISignal } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { SignalGenerator, SignalGeneratorConfig, WeightedSignal } from './SignalGenerator';
import { logger } from '../utils/logger';

export interface EnsembleMember {
  strategy: IStrategy;
  weight: number; // Relative weight in consensus voting
}

export class StrategyEnsemble implements IStrategy {
  name: string;
  private members: EnsembleMember[];
  private signalGenerator: SignalGenerator;

  constructor(members: EnsembleMember[], config?: Partial<SignalGeneratorConfig>) {
    this.members = members;
    this.signalGenerator = new SignalGenerator(config);
    this.name = `Ensemble(${members.map(m => m.strategy.name).join('+')})`;
  }

  async init(history: ICandle[]): Promise<void> {
    // Initialize all member strategies with same history
    await Promise.all(this.members.map(m => m.strategy.init(history)));
    logger.info(`[Ensemble] Initialized ${this.members.length} strategies`);
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    // Collect signals from all member strategies
    const weightedSignals: WeightedSignal[] = await Promise.all(
      this.members.map(async (member) => {
        const signal = await member.strategy.onCandle(candle);
        return {
          strategyName: member.strategy.name,
          signal,
          weight: member.weight,
        };
      })
    );

    // Aggregate via consensus
    const consensus = this.signalGenerator.aggregate(weightedSignals);

    if (consensus) {
      const votesSummary = consensus.votes.map(v => `${v.strategy}=${v.vote}`).join(', ');
      logger.info(`[Ensemble] Consensus: ${consensus.type} (confidence: ${(consensus.confidence * 100).toFixed(1)}%) [${votesSummary}]`);

      return {
        type: consensus.type,
        price: consensus.price,
        timestamp: consensus.timestamp,
        tag: 'ensemble',
        metadata: {
          confidence: consensus.confidence,
          votes: consensus.votes.length,
          totalStrategies: this.members.length,
        },
      };
    }

    return null;
  }
}
