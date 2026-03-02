import { ICandle } from '../../src/interfaces/ICandle';
import {
  FeatureEngineeringPipeline,
  FeatureVector,
} from '../../src/ml/feature-engineering-candle-to-vector-pipeline';

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

describe('FeatureEngineeringPipeline', () => {
  const pipeline = new FeatureEngineeringPipeline();

  describe('extract()', () => {
    it('should extract 7 features from candle array', () => {
      const candles = generateCandles(200);
      const features = pipeline.extract(candles);

      expect(features.length).toBeGreaterThan(0);

      const fv = features[0];
      expect(fv).toHaveProperty('rsiNorm');
      expect(fv).toHaveProperty('macdHistNorm');
      expect(fv).toHaveProperty('bbWidth');
      expect(fv).toHaveProperty('bbPercentB');
      expect(fv).toHaveProperty('atrNorm');
      expect(fv).toHaveProperty('volumeRatio');
      expect(fv).toHaveProperty('hlRange');
    });

    it('should return empty array for insufficient data', () => {
      const candles = generateCandles(10);
      const features = pipeline.extract(candles);
      expect(features).toHaveLength(0);
    });

    it('should normalize all features to expected ranges', () => {
      const candles = generateCandles(200);
      const features = pipeline.extract(candles);

      for (const fv of features) {
        expect(fv.rsiNorm).toBeGreaterThanOrEqual(0);
        expect(fv.rsiNorm).toBeLessThanOrEqual(1);

        expect(fv.macdHistNorm).toBeGreaterThanOrEqual(-1);
        expect(fv.macdHistNorm).toBeLessThanOrEqual(1);

        expect(fv.bbWidth).toBeGreaterThanOrEqual(0);

        expect(fv.bbPercentB).toBeGreaterThanOrEqual(0);
        expect(fv.bbPercentB).toBeLessThanOrEqual(1);

        expect(fv.atrNorm).toBeGreaterThanOrEqual(0);

        expect(fv.volumeRatio).toBeGreaterThanOrEqual(0);
        expect(fv.volumeRatio).toBeLessThanOrEqual(3);

        expect(fv.hlRange).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('extractLast()', () => {
    it('should return null for insufficient data', () => {
      const candles = generateCandles(5);
      expect(pipeline.extractLast(candles)).toBeNull();
    });

    it('should return single FeatureVector for sufficient data', () => {
      const candles = generateCandles(200);
      const fv = pipeline.extractLast(candles);
      expect(fv).not.toBeNull();
      expect(typeof fv!.rsiNorm).toBe('number');
    });
  });

  describe('toArray()', () => {
    it('should convert to flat array of 7 numbers', () => {
      const fv: FeatureVector = {
        rsiNorm: 0.5,
        macdHistNorm: 0.1,
        bbWidth: 0.05,
        bbPercentB: 0.6,
        atrNorm: 0.02,
        volumeRatio: 1.2,
        hlRange: 0.03,
      };
      const arr = FeatureEngineeringPipeline.toArray(fv);
      expect(arr).toHaveLength(7);
      expect(arr).toEqual([0.5, 0.1, 0.05, 0.6, 0.02, 1.2, 0.03]);
    });
  });

  describe('toWindows()', () => {
    it('should create sliding windows of correct shape', () => {
      const candles = generateCandles(200);
      const features = pipeline.extract(candles);
      const windowSize = 10;
      const windows = FeatureEngineeringPipeline.toWindows(features, windowSize);

      expect(windows.length).toBe(features.length - windowSize + 1);
      expect(windows[0]).toHaveLength(windowSize);
      expect(windows[0][0]).toHaveLength(7);
    });

    it('should return empty array when features fewer than windowSize', () => {
      const candles = generateCandles(200);
      const features = pipeline.extract(candles);
      const windows = FeatureEngineeringPipeline.toWindows(features, features.length + 1);
      expect(windows).toHaveLength(0);
    });

    it('should return empty array for windowSize <= 0', () => {
      const features = pipeline.extract(generateCandles(200));
      expect(FeatureEngineeringPipeline.toWindows(features, 0)).toHaveLength(0);
    });
  });
});
