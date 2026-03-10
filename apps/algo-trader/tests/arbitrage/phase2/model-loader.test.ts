/**
 * Tests: ModelLoader (ONNX model loader with heuristic fallback)
 */

import { ModelLoader, ModelInput } from '../../../src/arbitrage/phase2/adversarial-mm/model-loader';

describe('ModelLoader', () => {
  let loader: ModelLoader;

  beforeEach(() => {
    loader = new ModelLoader({ modelPath: './nonexistent-model.onnx', warmupOnLoad: false });
  });

  afterEach(async () => {
    await loader.dispose();
  });

  // 1. Initializes without error
  test('initializes without error', () => {
    expect(loader).toBeInstanceOf(ModelLoader);
    expect(loader.isLoaded()).toBe(false);
  });

  // 2. load() returns false and emits fallback when model file missing
  test('load returns false when model file does not exist', async () => {
    const fallbackHandler = jest.fn();
    loader.on('fallback', fallbackHandler);

    const result = await loader.load();
    expect(result).toBe(false);
    expect(loader.isLoaded()).toBe(false);
    expect(fallbackHandler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'model_not_found' })
    );
  });

  // 3. predict() uses heuristic fallback when model not loaded
  test('predict uses heuristic fallback when model not loaded', async () => {
    const input: ModelInput = {
      cancelRatio: 0.9,
      refillCount: 4,
      bidAskRatio: 5,
      volumeImbalance: 0.8,
      priceLevel: 50000,
      timeDeltaMs: 500,
    };

    const prediction = await loader.predict(input);
    expect(prediction.spoofProbability).toBeGreaterThan(0.5);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  // 4. heuristic: low cancel ratio → low spoof probability
  test('heuristic predicts low spoof for clean orderbook', async () => {
    const input: ModelInput = {
      cancelRatio: 0.1,
      refillCount: 0,
      bidAskRatio: 1.0,
      volumeImbalance: 0.05,
      priceLevel: 50000,
      timeDeltaMs: 1000,
    };

    const prediction = await loader.predict(input);
    expect(prediction.spoofProbability).toBeLessThan(0.3);
    expect(prediction.icebergProbability).toBeLessThan(0.1);
  });

  // 5. heuristic: high cancel ratio → high spoof probability
  test('heuristic predicts high spoof for manipulated orderbook', async () => {
    const input: ModelInput = {
      cancelRatio: 0.95,
      refillCount: 5,
      bidAskRatio: 4.0,
      volumeImbalance: 0.9,
      priceLevel: 50000,
      timeDeltaMs: 100,
    };

    const prediction = await loader.predict(input);
    expect(prediction.spoofProbability).toBeGreaterThan(0.7);
    expect(prediction.icebergProbability).toBeGreaterThan(0.3);
    expect(prediction.layeringProbability).toBeGreaterThan(0.5);
  });

  // 6. heuristic: iceberg detection based on refill count
  test('heuristic detects iceberg based on refill count', async () => {
    const input: ModelInput = {
      cancelRatio: 0.1,
      refillCount: 6,
      bidAskRatio: 1.0,
      volumeImbalance: 0.1,
      priceLevel: 50000,
      timeDeltaMs: 500,
    };

    const prediction = await loader.predict(input);
    expect(prediction.icebergProbability).toBeGreaterThan(0.5);
  });

  // 7. dispose clears state
  test('dispose resets loaded state', async () => {
    await loader.dispose();
    expect(loader.isLoaded()).toBe(false);
  });

  // 8. multiple dispose calls are safe
  test('multiple dispose calls do not throw', async () => {
    await loader.dispose();
    await expect(loader.dispose()).resolves.toBeUndefined();
  });

  // 9. prediction values are clamped 0-1
  test('prediction probabilities are clamped between 0 and 1', async () => {
    const input: ModelInput = {
      cancelRatio: 1.5, // over 1 — should be clamped
      refillCount: 100,
      bidAskRatio: 50,
      volumeImbalance: 2,
      priceLevel: 50000,
      timeDeltaMs: 10,
    };

    const prediction = await loader.predict(input);
    expect(prediction.spoofProbability).toBeLessThanOrEqual(1);
    expect(prediction.icebergProbability).toBeLessThanOrEqual(1);
    expect(prediction.layeringProbability).toBeLessThanOrEqual(1);
  });
});
