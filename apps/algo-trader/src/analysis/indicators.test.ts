import { Indicators } from './indicators';

describe('Indicators', () => {
  describe('zScore', () => {
    it('should calculate correct z-score', () => {
      const value = 110;
      const mean = 100;
      const stdDev = 5;
      expect(Indicators.zScore(value, mean, stdDev)).toBe(2);
    });

    it('should return 0 if stdDev is 0', () => {
      expect(Indicators.zScore(110, 100, 0)).toBe(0);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate correct standard deviation', () => {
      const values = [10, 12, 23, 23, 16, 23, 21, 16];
      // Sum = 144, n = 8, Mean = 18
      // Sum of squares: 64 + 36 + 25 + 25 + 4 + 25 + 9 + 4 = 192
      // Population Variance = 192 / 8 = 24
      // StdDev = sqrt(24) ≈ 4.898979...
      expect(Indicators.standardDeviation(values)).toBeCloseTo(4.89898, 5);
    });

    it('should return 0 for empty array', () => {
      expect(Indicators.standardDeviation([])).toBe(0);
    });
  });

  describe('correlation', () => {
    it('should calculate correct correlation for identical arrays', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];
      expect(Indicators.correlation(x, y)).toBe(1);
    });

    it('should calculate correct correlation for inverse arrays', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 4, 3, 2, 1];
      expect(Indicators.correlation(x, y)).toBe(-1);
    });

    it('should return 0 if arrays have different lengths', () => {
      expect(Indicators.correlation([1, 2], [1, 2, 3])).toBe(0);
    });

    it('should return 0 for zero variance arrays', () => {
      expect(Indicators.correlation([1, 1, 1], [1, 2, 3])).toBe(0);
    });
  });
});
