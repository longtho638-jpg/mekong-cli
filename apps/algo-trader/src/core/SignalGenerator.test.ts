/**
 * Tests for SignalGenerator — Multi-indicator consensus engine
 */

import { SignalGenerator, WeightedSignal, SignalGeneratorConfig } from './SignalGenerator';
import { ISignal, SignalType } from '../interfaces/IStrategy';

describe('SignalGenerator', () => {
  let generator: SignalGenerator;

  const createSignal = (type: SignalType, price: number = 100, timestamp: number = Date.now()): ISignal => ({
    type,
    price,
    timestamp,
    metadata: {},
  });

  const createWeightedSignal = (strategyName: string, signal: ISignal | null, weight: number): WeightedSignal => ({
    strategyName,
    signal,
    weight,
  });

  beforeEach(() => {
    generator = new SignalGenerator();
  });

  describe('constructor', () => {
    it('should use default config when no options provided', () => {
      const gen = new SignalGenerator();
      // Default config is used internally
      expect(gen).toBeDefined();
    });

    it('should accept custom config options', () => {
      const customConfig: Partial<SignalGeneratorConfig> = {
        consensusThreshold: 0.8,
        minVotes: 3,
      };
      const gen = new SignalGenerator(customConfig);
      expect(gen).toBeDefined();
    });
  });

  describe('aggregate', () => {
    it('should return null when total weight is 0', () => {
      const signals: WeightedSignal[] = [];
      const result = generator.aggregate(signals);
      expect(result).toBeNull();
    });

    it('should return null when fewer than minVotes strategies vote', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 1.0),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull();
    });

    it('should return BUY signal when buy fraction meets threshold', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.6),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.4),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.BUY);
      expect(result?.confidence).toBe(1); // 100% buy
    });

    it('should return SELL signal when sell fraction meets threshold', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.SELL, 100), 0.7),
        createWeightedSignal('Strategy2', createSignal(SignalType.SELL, 100), 0.3),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.SELL);
      expect(result?.confidence).toBe(1); // 100% sell
    });

    it('should return null when no consensus reached', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.5),
        createWeightedSignal('Strategy2', createSignal(SignalType.SELL, 100), 0.5),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull(); // 50/50 split, no threshold met
    });

    it('should handle NONE signals correctly', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.NONE, 100), 0.5),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.5),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull(); // Only 1 vote for BUY
    });

    it('should handle null signals as NONE', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', null, 0.5),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.5),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull(); // Only 1 vote for BUY
    });

    it('should calculate confidence correctly', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.5 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.3),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.2),
        createWeightedSignal('Strategy3', createSignal(SignalType.SELL, 100), 0.5),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.SELL);
      expect(result?.confidence).toBe(0.5); // 0.5 / 1.0
    });

    it('should include vote details in result', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('RSI', createSignal(SignalType.BUY, 100), 0.4),
        createWeightedSignal('MACD', createSignal(SignalType.BUY, 100), 0.6),
      ];
      const result = gen.aggregate(signals);
      expect(result?.votes).toHaveLength(2);
      expect(result?.votes[0]).toEqual({
        strategy: 'RSI',
        vote: SignalType.BUY,
        weight: 0.4,
      });
    });

    it('should use latest price and timestamp from signals', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const timestamp = Date.now();
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 99, timestamp - 1000), 0.5),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100, timestamp), 0.5),
      ];
      const result = gen.aggregate(signals);
      expect(result?.price).toBe(100);
      expect(result?.timestamp).toBe(timestamp);
    });

    it('should handle exact threshold boundary', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.6),
        createWeightedSignal('Strategy2', createSignal(SignalType.NONE, 100), 0.4),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.BUY);
      expect(result?.confidence).toBe(1); // 0.6 / 0.6 = 100% of voting weight
    });

    it('should fail when below threshold by small margin', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.59),
        createWeightedSignal('Strategy2', createSignal(SignalType.SELL, 100), 0.41),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull(); // 59% < 60% threshold
    });
  });

  describe('edge cases', () => {
    it('should handle very small weights', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.001),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.002),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.BUY);
    });

    it('should handle large weights', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 1000),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 2000),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.BUY);
    });

    it('should handle mixed voting and non-voting signals', () => {
      const gen = new SignalGenerator({ minVotes: 1, consensusThreshold: 0.5 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.NONE, 100), 0.3),
        createWeightedSignal('Strategy2', createSignal(SignalType.BUY, 100), 0.5),
        createWeightedSignal('Strategy3', null, 0.2),
      ];
      const result = gen.aggregate(signals);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(SignalType.BUY);
      expect(result?.confidence).toBe(1); // 0.5 / 0.5 = 100% of actual votes
    });

    it('should populate metadata correctly', () => {
      const gen = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.6 });
      const signals: WeightedSignal[] = [
        createWeightedSignal('Strategy1', createSignal(SignalType.BUY, 100), 0.4),
        createWeightedSignal('Strategy2', createSignal(SignalType.SELL, 100), 0.3),
        createWeightedSignal('Strategy3', createSignal(SignalType.NONE, 100), 0.3),
      ];
      const result = gen.aggregate(signals);
      expect(result).toBeNull(); // No threshold met
      // But if threshold was lower:
      const gen2 = new SignalGenerator({ minVotes: 2, consensusThreshold: 0.35 });
      const result2 = gen2.aggregate(signals);
      expect(result2?.metadata).toEqual({
        totalWeight: 1.0,
        buyWeight: 0.4,
        sellWeight: 0.3,
      });
    });
  });
});
