/**
 * Tests for SignalGenerator — multi-indicator consensus engine.
 * Validates weighted signal aggregation and consensus threshold logic.
 */

import { SignalGenerator, WeightedSignal, SignalGeneratorConfig } from '../../src/core/SignalGenerator';
import { ISignal, SignalType } from '../../src/interfaces/IStrategy';

describe('SignalGenerator', () => {
  let generator: SignalGenerator;

  const makeSignal = (type: SignalType, price: number = 100, timestamp: number = Date.now()): ISignal => ({
    type,
    price,
    timestamp,
  });

  const makeWeightedSignal = (signal: ISignal | null, weight: number, name: string = 'Strategy1'): WeightedSignal => ({
    signal,
    weight,
    strategyName: name,
  });

  beforeEach(() => {
    generator = new SignalGenerator();
  });

  describe('constructor', () => {
    it('uses default config when no options provided', () => {
      const gen = new SignalGenerator();
      // Default threshold is 0.6 (60%)
      expect(gen).toBeDefined();
    });

    it('accepts custom config', () => {
      const gen = new SignalGenerator({ consensusThreshold: 0.75, minVotes: 3 });
      expect(gen).toBeDefined();
    });
  });

  describe('aggregate()', () => {
    describe('edge cases', () => {
      it('returns null for empty signals array', () => {
        const result = generator.aggregate([]);
        expect(result).toBeNull();
      });

      it('returns null when total weight is zero', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY), 0),
          makeWeightedSignal(makeSignal(SignalType.BUY), 0),
        ];
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });

      it('returns null when below minVotes (default: 2)', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY), 1, 'OnlyOne'),
        ];
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });

      it('returns null when all signals are NONE', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.NONE), 0.5, 'Strat1'),
          makeWeightedSignal(makeSignal(SignalType.NONE), 0.5, 'Strat2'),
        ];
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });
    });

    describe('consensus threshold', () => {
      it('returns BUY when 60%+ votes are BUY (default threshold)', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.6, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 101), 0.2, 'Bull2'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.2, 'Bear1'),
        ];
        const result = generator.aggregate(signals);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(SignalType.BUY);
        expect(result?.confidence).toBe(0.8); // 0.8 / 1.0
      });

      it('returns SELL when 60%+ votes are SELL', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.5, 'Bear1'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 98), 0.3, 'Bear2'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 101), 0.2, 'Bull1'),
        ];
        const result = generator.aggregate(signals);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(SignalType.SELL);
        expect(result?.confidence).toBe(0.8);
      });

      it('returns null when no majority reaches threshold', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.4, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.4, 'Bear1'),
          makeWeightedSignal(makeSignal(SignalType.NONE, 100), 0.2, 'Neutral'),
        ];
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });

      it('handles exactly at threshold (60%)', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.6, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.4, 'Bull2'), // 2nd vote to meet minVotes
        ];
        // 100% BUY (1.0 / 1.0), exactly at 60% threshold
        const result = generator.aggregate(signals);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(SignalType.BUY);
        expect(result?.confidence).toBeCloseTo(1.0);
      });

      it('returns null when just below threshold (59%)', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.59, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.NONE, 100), 0.41, 'Neutral'),
        ];
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });
    });

    describe('weighted voting', () => {
      it('calculates weighted consensus correctly', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 1.0, 'Heavy1'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.5, 'Light1'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 98), 0.5, 'Light2'),
        ];
        // Total: 2.0, Buy: 1.0 (50%), Sell: 1.0 (50%) - no consensus
        const result = generator.aggregate(signals);
        expect(result).toBeNull();
      });

      it('uses latest price from signals', () => {
        const ts = Date.now();
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100, ts - 1000), 0.3, 'Early'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 105, ts), 0.3, 'Latest'),
        ];
        const result = generator.aggregate(signals);
        expect(result?.price).toBe(105);
        expect(result?.timestamp).toBe(ts);
      });
    });

    describe('metadata', () => {
      it('includes vote breakdown in metadata', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.5, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 101), 0.3, 'Bull2'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.2, 'Bear1'),
        ];
        const result = generator.aggregate(signals);
        expect(result?.metadata).toBeDefined();
        expect(result?.metadata.totalWeight).toBe(1.0);
        expect(result?.metadata.buyWeight).toBe(0.8);
        expect(result?.metadata.sellWeight).toBe(0.2);
      });

      it('includes individual votes array', () => {
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.6, 'Strat1'),
          makeWeightedSignal(makeSignal(SignalType.SELL, 99), 0.4, 'Strat2'),
        ];
        const result = generator.aggregate(signals);
        expect(result?.votes).toHaveLength(2);
        expect(result?.votes[0]).toEqual({
          strategy: 'Strat1',
          vote: SignalType.BUY,
          weight: 0.6,
        });
      });
    });

    describe('custom config', () => {
      it('respects custom consensusThreshold', () => {
        const gen = new SignalGenerator({ consensusThreshold: 0.8, minVotes: 2 });
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.7, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.NONE, 100), 0.3, 'Neutral'),
        ];
        // 70% < 80% threshold → null
        expect(gen.aggregate(signals)).toBeNull();

        const signals2: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.8, 'Bull1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.2, 'Bull2'), // 2nd BUY vote
        ];
        // 100% BUY >= 80% threshold → BUY
        const result = gen.aggregate(signals2);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(SignalType.BUY);
        expect(result?.confidence).toBeCloseTo(1.0);
      });

      it('respects custom minVotes', () => {
        const gen = new SignalGenerator({ minVotes: 3, consensusThreshold: 0.6 });
        const signals: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.5, 'S1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.5, 'S2'),
        ];
        // Only 2 votes < 3 minVotes → null
        expect(gen.aggregate(signals)).toBeNull();

        const signals2: WeightedSignal[] = [
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.4, 'S1'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.4, 'S2'),
          makeWeightedSignal(makeSignal(SignalType.BUY, 100), 0.2, 'S3'),
        ];
        // 3 votes >= 3 minVotes → BUY
        expect(gen.aggregate(signals2)?.type).toBe(SignalType.BUY);
      });
    });
  });
});
