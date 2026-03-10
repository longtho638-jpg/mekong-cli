import { StrategyLoader } from '../../src/core/StrategyLoader';
import { QLearningStrategy } from '../../src/ml/tabular-q-learning-rl-trading-strategy';
import { GruPredictionStrategy } from '../../src/ml/gru-prediction-strategy';
import * as tf from '@tensorflow/tfjs';

// Force CPU backend
tf.setBackend('cpu');

describe('StrategyLoader ML Integration', () => {
  beforeAll(() => {
    StrategyLoader.registerMLStrategies();
  });

  afterEach(() => {
    tf.disposeVariables();
  });

  it('should include QLearning in strategy names', () => {
    const names = StrategyLoader.getNames();
    expect(names).toContain('QLearning');
  });

  it('should include GruPrediction in strategy names', () => {
    const names = StrategyLoader.getNames();
    expect(names).toContain('GruPrediction');
  });

  it('should load QLearning strategy via factory', () => {
    const strategy = StrategyLoader.load('QLearning');
    expect(strategy).toBeInstanceOf(QLearningStrategy);
    expect(strategy.name).toBe('Q-Learning RL Strategy');
  });

  it('should load GruPrediction strategy with built model', () => {
    const strategy = StrategyLoader.load('GruPrediction');
    expect(strategy).toBeInstanceOf(GruPredictionStrategy);
    expect(strategy.name).toBe('GRU Price Prediction Strategy');
  });

  it('should still load traditional strategies', () => {
    const rsi = StrategyLoader.load('RsiSma');
    expect(rsi.name).toBeDefined();
  });

  it('registerFactory should override previous factory', () => {
    const custom = new QLearningStrategy({ learningRate: 0.99 });
    StrategyLoader.registerFactory('QLearning', () => custom);

    const loaded = StrategyLoader.load('QLearning');
    expect(loaded).toBe(custom);

    // Re-register default
    StrategyLoader.registerMLStrategies();
  });

  it('loadAll should include ML strategies', () => {
    const all = StrategyLoader.loadAll();
    const names = all.map(s => s.name);
    expect(names).toContain('QLearning');
    expect(names).toContain('GruPrediction');
    expect(all.length).toBeGreaterThanOrEqual(10); // 8 traditional + 2 ML
  });
});
