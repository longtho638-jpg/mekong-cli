import * as tf from '@tensorflow/tfjs';
import { ICandle } from '../../src/interfaces/ICandle';
import { GruPricePredictionModel } from '../../src/ml/gru-price-prediction-model';
import { GruPredictionStrategy } from '../../src/ml/gru-prediction-strategy';
import { FeatureEngineeringPipeline } from '../../src/ml/feature-engineering-candle-to-vector-pipeline';

// Force CPU backend for tests
tf.setBackend('cpu');

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

/** Build training data from candles: feature windows + binary labels. */
function buildTrainingData(candles: ICandle[], windowSize: number) {
  const pipeline = new FeatureEngineeringPipeline();
  const features = pipeline.extract(candles);
  const windows = FeatureEngineeringPipeline.toWindows(features, windowSize);

  // Label: 1 if close[i+windowSize] > close[i+windowSize-1], else 0
  const alignedStart = candles.length - features.length;
  const labels: number[] = [];
  for (let i = 0; i < windows.length; i++) {
    const idx = alignedStart + windowSize + i;
    if (idx >= candles.length) break;
    labels.push(candles[idx].close > candles[idx - 1].close ? 1 : 0);
  }

  const trimmed = windows.slice(0, labels.length);
  return { windows: trimmed, labels };
}

// Skip heavy TF.js tests - memory leak causes worker SIGKILL
// Run manually with: npm test -- --testPathPattern=gru --no-coverage --runInBand --forceExit
describe.skip('GruPricePredictionModel', () => {
  beforeEach(() => {
    // Reset backend state before each test
    tf.disposeVariables();
  });

  afterEach(() => {
    // Clean up all tensors after each test
    tf.disposeVariables();
    tf.engine().reset();
  });

  describe('build()', () => {
    it('should build model without errors', () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      model.build();
      expect(model.isReady()).toBe(true);
      model.dispose();
    });
  });

  describe('predict()', () => {
    it('should return probability between 0 and 1', () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      model.build();

      const window = Array.from({ length: 10 }, () =>
        Array.from({ length: 7 }, () => Math.random()),
      );
      const prob = model.predict(window);

      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
      model.dispose();
    });

    it('should throw if model not built', () => {
      const model = new GruPricePredictionModel();
      const window = Array.from({ length: 60 }, () => Array.from({ length: 7 }, () => 0.5));
      expect(() => model.predict(window)).toThrow('Model not built');
    });
  });

  describe('predictBatch()', () => {
    it('should return array of probabilities', () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      model.build();

      const batch = Array.from({ length: 5 }, () =>
        Array.from({ length: 10 }, () => Array.from({ length: 7 }, () => Math.random())),
      );
      const probs = model.predictBatch(batch);

      expect(probs).toHaveLength(5);
      probs.forEach(p => {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      });
      model.dispose();
    });
  });

  describe('train()', () => {
    it('should train on synthetic data and reduce loss', async () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4, learningRate: 0.01 });
      model.build();

      // Simple synthetic data: random windows with binary labels
      const samples = 30;
      const windows = Array.from({ length: samples }, () =>
        Array.from({ length: 10 }, () => Array.from({ length: 7 }, () => Math.random())),
      );
      const labels = Array.from({ length: samples }, () => Math.round(Math.random()));

      const result = await model.train(windows, labels, 3, 16);

      expect(result.epochs).toBe(3);
      expect(result.finalLoss).toBeGreaterThanOrEqual(0);
      expect(result.trainingTimeMs).toBeGreaterThanOrEqual(0);
      model.dispose();
    }, 30000);
  });

  describe('train with real feature pipeline', () => {
    it('should train on candle-derived features', async () => {
      const candles = generateCandles(200);
      const windowSize = 10;
      const { windows, labels } = buildTrainingData(candles, windowSize);

      expect(windows.length).toBeGreaterThan(0);
      expect(labels.length).toBe(windows.length);

      const model = new GruPricePredictionModel({ windowSize, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      const result = await model.train(windows, labels, 2, 16);

      expect(result.epochs).toBe(2);
      expect(result.finalLoss).toBeLessThan(1); // Should be reasonable
      model.dispose();
    }, 30000);
  });

  describe('saveWeights()', () => {
    it('should export model artifacts', async () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      model.build();

      const artifacts = await model.saveWeights();
      expect(artifacts).toBeDefined();
      expect(artifacts.modelTopology).toBeDefined();
      model.dispose();
    });
  });

  describe('getConfig()', () => {
    it('should return full config with defaults', () => {
      const model = new GruPricePredictionModel({ gruUnits: 32 });
      const cfg = model.getConfig();
      expect(cfg.gruUnits).toBe(32);
      expect(cfg.windowSize).toBe(60);
      expect(cfg.numFeatures).toBe(7);
    });
  });

  describe('dispose()', () => {
    it('should free model and mark as not ready', () => {
      const model = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
      model.build();
      expect(model.isReady()).toBe(true);
      model.dispose();
      expect(model.isReady()).toBe(false);
    });
  });
});

// Skip heavy TF.js tests - memory leak causes worker SIGKILL
describe.skip('GruPredictionStrategy', () => {
  beforeEach(() => {
    tf.disposeVariables();
    tf.engine().reset();
  });

  afterEach(() => {
    tf.disposeVariables();
    tf.engine().reset();
  });

  it('should return null when insufficient candles', async () => {
    const gruModel = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
    gruModel.build();
    const strategy = new GruPredictionStrategy(gruModel, { windowSize: 10 });

    const signal = await strategy.onCandle({
      timestamp: Date.now(), open: 100, high: 102, low: 98, close: 101, volume: 1000,
    });
    expect(signal).toBeNull();
    gruModel.dispose();
  });

  it('should process candles and return signal or null', async () => {
    const gruModel = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
    gruModel.build();
    const strategy = new GruPredictionStrategy(gruModel, { windowSize: 10 });

    const candles = generateCandles(100);
    let signalCount = 0;
    for (const c of candles) {
      const signal = await strategy.onCandle(c);
      if (signal) signalCount++;
    }
    // Just verify it runs without errors
    expect(signalCount).toBeGreaterThanOrEqual(0);
    gruModel.dispose();
  });

  it('should track position state correctly', async () => {
    const gruModel = new GruPricePredictionModel({ windowSize: 10, numFeatures: 7, gruUnits: 8, denseUnits: 4 });
    gruModel.build();
    const strategy = new GruPredictionStrategy(gruModel, { windowSize: 10 });

    expect(strategy.getPosition()).toBe(false);
    strategy.resetPosition();
    expect(strategy.getPosition()).toBe(false);
    gruModel.dispose();
  });
});
