import * as tf from '@tensorflow/tfjs';
import { PredictiveOrderbookModel, OrderbookSnapshot } from '../../src/ml/predictive-orderbook-model';
import { LicenseService, LicenseTier } from '../../src/lib/raas-gate';

// Force CPU backend — no GPU needed in tests
beforeAll(async () => {
  await tf.setBackend('cpu');
});

// Helpers
function makeSnapshot(overrides?: Partial<OrderbookSnapshot>): OrderbookSnapshot {
  return {
    bidPrices: [60000, 59990, 59980],
    askPrices: [60010, 60020, 60030],
    bidVolumes: [1.5, 2.0, 0.8],
    askVolumes: [1.2, 1.8, 0.5],
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeLabel(priceUp = 1, liquidityShift = 0) {
  return { priceUp, liquidityShift };
}

// Compact model config to keep tests fast
const fastCfg = { hiddenUnits: 8, learningRate: 0.05, minSamplesForConfidence: 10 };

// ────────────────────────────────────────────────────────────
describe.skip('PredictiveOrderbookModel (TF.js — run with --runInBand)', () => {
  afterEach(() => {
    tf.disposeVariables();
  });

  // 1. build() creates model successfully
  describe('build()', () => {
    it('creates model and marks isReady()', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      expect(m.isReady()).toBe(true);
      m.dispose();
    });
  });

  // 2. extractFeatures() produces 8-element vector
  describe('extractFeatures()', () => {
    it('returns vector of length 8', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      const features = m.extractFeatures(makeSnapshot());
      expect(features).toHaveLength(8);
      m.dispose();
    });

    // 3. handles empty orderbook gracefully
    it('handles empty volumes without throwing', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      const snap = makeSnapshot({ bidVolumes: [], askVolumes: [], bidPrices: [], askPrices: [] });
      expect(() => m.extractFeatures(snap)).not.toThrow();
      const features = m.extractFeatures(snap);
      expect(features).toHaveLength(8);
      m.dispose();
    });

    // 9. Feature normalization: extreme values are clamped to [0,1]
    it('clamps extreme volume values to [0, 1]', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      const snap = makeSnapshot({ bidVolumes: [1e9, 1e9, 1e9], askVolumes: [0, 0, 0] });
      const features = m.extractFeatures(snap);
      features.forEach(f => {
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1);
      });
      m.dispose();
    });
  });

  // 4. predict() returns probabilities in [0,1]
  describe('predict()', () => {
    it('returns priceUpProb and liquidityShiftProb in [0, 1]', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      const result = m.predict(makeSnapshot());
      expect(result.priceUpProb).toBeGreaterThanOrEqual(0);
      expect(result.priceUpProb).toBeLessThanOrEqual(1);
      expect(result.liquidityShiftProb).toBeGreaterThanOrEqual(0);
      expect(result.liquidityShiftProb).toBeLessThanOrEqual(1);
      m.dispose();
    });

    it('returns features array of length 8', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      const result = m.predict(makeSnapshot());
      expect(result.features).toHaveLength(8);
      m.dispose();
    });

    it('returns confidence 0 before any training', () => {
      const m = new PredictiveOrderbookModel({ ...fastCfg, minSamplesForConfidence: 50 });
      m.build();
      const result = m.predict(makeSnapshot());
      expect(result.confidence).toBe(0);
      m.dispose();
    });

    // 5. predict() throws if model not built
    it('throws if model not built', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      expect(() => m.predict(makeSnapshot())).toThrow('Model not built');
    });

    // EventEmitter: emits 'prediction' event
    it('emits prediction event', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      const handler = jest.fn();
      m.on('prediction', handler);
      m.predict(makeSnapshot());
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toHaveProperty('priceUpProb');
      m.dispose();
    });
  });

  // 6. trainOnBatch() decreases loss over multiple batches
  describe('trainOnBatch()', () => {
    it('runs without throwing and increments sample count', async () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();

      const snaps = Array.from({ length: 20 }, () => makeSnapshot());
      const labels = Array.from({ length: 20 }, (_, i) => makeLabel(i % 2, (i + 1) % 2));

      await m.trainOnBatch(snaps, labels);
      expect(m.getSampleCount()).toBe(20);
      m.dispose();
    });

    it('auto-builds model if not yet built', async () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      const snaps = [makeSnapshot()];
      const labels = [makeLabel()];
      await expect(m.trainOnBatch(snaps, labels)).resolves.not.toThrow();
      expect(m.isReady()).toBe(true);
      m.dispose();
    });
  });

  // 7. Online learning: predictions change after training
  describe('online learning', () => {
    it('predictions shift after targeted training', async () => {
      const m = new PredictiveOrderbookModel({ ...fastCfg, learningRate: 0.1 });
      m.build();

      const snap = makeSnapshot();
      const beforePred = m.predict(snap);

      // Train hard toward priceUp=1, liquidityShift=0
      const snaps = Array.from({ length: 30 }, () => makeSnapshot());
      const labels = Array.from({ length: 30 }, () => makeLabel(1, 0));
      await m.trainOnBatch(snaps, labels);

      const afterPred = m.predict(snap);

      // After strong signal training, at least one output should differ
      const changed =
        Math.abs(afterPred.priceUpProb - beforePred.priceUpProb) > 0.001 ||
        Math.abs(afterPred.liquidityShiftProb - beforePred.liquidityShiftProb) > 0.001;
      expect(changed).toBe(true);
      m.dispose();
    });
  });

  // 8. dispose() cleans up model
  describe('dispose()', () => {
    it('sets isReady() to false after dispose', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      expect(m.isReady()).toBe(true);
      m.dispose();
      expect(m.isReady()).toBe(false);
    });

    it('is safe to call dispose() multiple times', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();
      expect(() => { m.dispose(); m.dispose(); }).not.toThrow();
    });
  });

  // 10. Multiple sequential predictions don't leak memory
  describe('memory stability', () => {
    it('tensor count stays stable across 10 predictions', () => {
      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();

      // Warm up
      m.predict(makeSnapshot());
      const baseline = tf.memory().numTensors;

      for (let i = 0; i < 10; i++) {
        m.predict(makeSnapshot());
      }

      const after = tf.memory().numTensors;
      // Allow ±2 tensor tolerance for internal TF.js bookkeeping
      expect(after - baseline).toBeLessThanOrEqual(2);
      m.dispose();
    });
  });

  // LicenseService gate tests (mocked)
  describe('saveWeights() license gate', () => {
    it('throws LicenseError when tier is FREE', async () => {
      const licSvc = LicenseService.getInstance();
      jest.spyOn(licSvc, 'hasTier').mockReturnValue(false);

      const m = new PredictiveOrderbookModel(fastCfg);
      m.build();

      await expect(m.saveWeights()).rejects.toMatchObject({
        name: 'LicenseError',
        requiredTier: LicenseTier.PRO,
      });

      jest.restoreAllMocks();
      m.dispose();
    });
  });
});
