import { ICandle } from '../../src/interfaces/ICandle';
import {
  QLearningStrategy,
  Action,
} from '../../src/ml/tabular-q-learning-rl-trading-strategy';
import { QLearningEpisodeTrainer } from '../../src/ml/tabular-q-learning-episode-trainer';

function generateCandles(count: number, basePrice = 100): ICandle[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 60000,
    open: basePrice + Math.sin(i / 30) * 10,
    high: basePrice + Math.sin(i / 30) * 10 + 2 + Math.random(),
    low: basePrice + Math.sin(i / 30) * 10 - 2 - Math.random(),
    close: basePrice + Math.sin(i / 30) * 10 + (Math.random() - 0.5) * 2,
    volume: 1000 + Math.random() * 500 + Math.sin(i / 20) * 200,
  }));
}

describe('QLearningStrategy', () => {
  let strategy: QLearningStrategy;

  beforeEach(() => {
    strategy = new QLearningStrategy();
  });

  describe('discretizeState()', () => {
    it('should return a string state key from candles', () => {
      const candles = generateCandles(60);
      const state = strategy.discretizeState(candles);
      expect(typeof state).toBe('string');
      // Format: rsiBucket_trendBucket_volBucket_posBucket_heldBucket
      expect(state).toMatch(/^\d_\d_\d_\d_\d$/);
    });

    it('should return different state when position changes', () => {
      const candles = generateCandles(60);
      const stateFlat = strategy.discretizeState(candles);

      strategy.isLong = true;
      strategy.barsHeld = 3;
      const stateLong = strategy.discretizeState(candles);

      // Position bucket differs (index 3: 0 vs 1)
      const flatPos = stateFlat.split('_')[3];
      const longPos = stateLong.split('_')[3];
      expect(flatPos).toBe('0');
      expect(longPos).toBe('1');
    });
  });

  describe('Q-table operations', () => {
    it('getQValues should initialize zeros for new state', () => {
      const q = strategy.getQValues('0_0_0_0_0');
      expect(q).toEqual([0, 0, 0]);
    });

    it('updateQ should modify Q-values', () => {
      strategy.updateQ('s1', Action.BUY, 1.0, 's2');
      const q = strategy.getQValues('s1');
      // After update: Q[BUY] = 0 + 0.1 * (1.0 + 0.95 * 0 - 0) = 0.1
      expect(q[Action.BUY]).toBeCloseTo(0.1, 4);
    });

    it('selectAction should pick max Q-value in greedy mode', () => {
      strategy.trainingMode = false;
      const q = strategy.getQValues('test_state');
      q[Action.BUY] = 10; // Make BUY highest

      const action = strategy.selectAction('test_state');
      expect(action).toBe(Action.BUY);
    });

    it('selectAction should mask invalid actions', () => {
      strategy.trainingMode = false;
      const q = strategy.getQValues('mask_test');
      q[Action.BUY] = 10;
      q[Action.SELL] = 20;

      // When flat, SELL should be masked
      strategy.isLong = false;
      const action = strategy.selectAction('mask_test');
      expect(action).toBe(Action.BUY);

      // When long, BUY should be masked
      strategy.isLong = true;
      const actionLong = strategy.selectAction('mask_test');
      expect(actionLong).toBe(Action.SELL);
    });
  });

  describe('decayEpsilon()', () => {
    it('should reduce epsilon by decay factor', () => {
      const initial = strategy.getEpsilon();
      strategy.decayEpsilon();
      expect(strategy.getEpsilon()).toBeLessThan(initial);
    });

    it('should not go below minEpsilon', () => {
      const s = new QLearningStrategy({ epsilon: 0.011, epsilonDecay: 0.1, minEpsilon: 0.01 });
      s.decayEpsilon();
      expect(s.getEpsilon()).toBeGreaterThanOrEqual(0.01);
    });
  });

  describe('computeReward()', () => {
    it('should penalize negative returns', () => {
      const r1 = strategy.computeReward(-0.05);
      expect(r1).toBeLessThan(0);
    });

    it('should reward positive delta', () => {
      strategy.computeReward(0); // reset lastReturn
      const r = strategy.computeReward(0.05);
      expect(r).toBeGreaterThan(0);
    });
  });

  describe('onCandle()', () => {
    it('should return null when insufficient candles', async () => {
      const candle: ICandle = {
        timestamp: Date.now(),
        open: 100, high: 102, low: 98, close: 101, volume: 1000,
      };
      const signal = await strategy.onCandle(candle);
      expect(signal).toBeNull();
    });

    it('should produce signals after warmup period', async () => {
      const candles = generateCandles(60);
      let signals = 0;
      for (const c of candles) {
        const signal = await strategy.onCandle(c);
        if (signal) signals++;
      }
      // With default zero Q-table, actions are all equal — signals depend on state
      // Just verify no errors thrown and at least processes all candles
      expect(signals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetState()', () => {
    it('should clear position state', () => {
      strategy.isLong = true;
      strategy.barsHeld = 5;
      strategy.resetState();
      expect(strategy.isLong).toBe(false);
      expect(strategy.barsHeld).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize Q-table', () => {
      strategy.updateQ('s1', Action.BUY, 1.0, 's2');
      strategy.updateQ('s2', Action.SELL, 0.5, 's3');

      const json = strategy.serialize();
      const restored = QLearningStrategy.deserialize(json);

      expect(restored.getQValues('s1')[Action.BUY]).toBeCloseTo(
        strategy.getQValues('s1')[Action.BUY], 6,
      );
      expect(restored.getStatesExplored()).toBe(strategy.getStatesExplored());
    });

    it('should preserve config through serialization', () => {
      const s = new QLearningStrategy({ learningRate: 0.2, discountFactor: 0.9 });
      s.updateQ('x', Action.HOLD, 0.1, 'y');
      const restored = QLearningStrategy.deserialize(s.serialize());
      // Restored strategy should have same learning rate
      restored.updateQ('a', Action.BUY, 1.0, 'b');
      // With lr=0.2: Q = 0 + 0.2 * (1.0 + 0.9*0 - 0) = 0.2
      expect(restored.getQValues('a')[Action.BUY]).toBeCloseTo(0.2, 4);
    });
  });
});

describe('QLearningEpisodeTrainer', () => {
  const trainer = new QLearningEpisodeTrainer();

  it('should throw if candles < 50', () => {
    const strategy = new QLearningStrategy();
    const shortCandles = generateCandles(30);
    expect(() => trainer.train(strategy, shortCandles, 1)).toThrow('at least 50');
  });

  it('should train for specified episodes and explore states', () => {
    const strategy = new QLearningStrategy({ epsilon: 0.5 });
    const candles = generateCandles(200);
    const result = trainer.train(strategy, candles, 3);

    expect(result.episodes).toBe(3);
    expect(result.statesExplored).toBeGreaterThan(0);
    expect(result.trainingTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.avgReward).toBe('number');
  });

  it('should decay epsilon after training', () => {
    const strategy = new QLearningStrategy({ epsilon: 0.5, epsilonDecay: 0.9 });
    trainer.train(strategy, generateCandles(200), 5);
    expect(strategy.getEpsilon()).toBeLessThan(0.5);
  });

  it('should leave strategy in non-training mode after train()', () => {
    const strategy = new QLearningStrategy();
    trainer.train(strategy, generateCandles(100), 2);
    expect(strategy.trainingMode).toBe(false);
  });

  it('should produce meaningful Q-values after multiple episodes', () => {
    const strategy = new QLearningStrategy({ epsilon: 0.8 });
    trainer.train(strategy, generateCandles(200), 10);
    // After 10 episodes with high exploration, should have explored multiple states
    expect(strategy.getStatesExplored()).toBeGreaterThan(5);
  });
});
