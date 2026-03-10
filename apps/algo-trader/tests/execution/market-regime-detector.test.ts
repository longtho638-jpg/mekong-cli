/**
 * Tests for MarketRegimeDetector — verifies regime classification,
 * confidence scoring, arb param suggestions, and event emission.
 */

import { MarketRegimeDetector } from '../../src/execution/market-regime-detector';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate steadily ascending prices with small noise. */
function ascendingPrices(count: number, start = 100, stepSize = 1): number[] {
  return Array.from({ length: count }, (_, i) => start + i * stepSize);
}

/** Generate steadily descending prices. */
function descendingPrices(count: number, start = 200, stepSize = 1): number[] {
  return Array.from({ length: count }, (_, i) => start - i * stepSize);
}

/** Generate oscillating prices (ranging market). */
function oscillatingPrices(count: number, center = 100, amplitude = 2): number[] {
  return Array.from({ length: count }, (_, i) =>
    center + amplitude * Math.sin((i * Math.PI) / 4)
  );
}

/** Feed all prices into detector. */
function feedPrices(detector: MarketRegimeDetector, prices: number[]): void {
  for (const p of prices) detector.addPrice(p);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MarketRegimeDetector', () => {
  describe('regime detection', () => {
    it('detects trending_up from steadily ascending prices', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.5 });
      feedPrices(detector, ascendingPrices(40, 100, 2));
      expect(detector.getRegime()).toBe('trending_up');
    });

    it('detects trending_down from steadily descending prices', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.5 });
      feedPrices(detector, descendingPrices(40, 200, 2));
      expect(detector.getRegime()).toBe('trending_down');
    });

    it('detects ranging from oscillating prices', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.6 });
      feedPrices(detector, oscillatingPrices(50, 100, 1));
      expect(detector.getRegime()).toBe('ranging');
    });

    it('detects volatile when swings greatly exceed baseline', () => {
      // Seed baseline with small oscillations first, then inject large swings
      const detector = new MarketRegimeDetector({
        windowSize: 20,
        volatilityMultiplier: 1.5,
        minSamples: 5,
      });
      // Baseline: small oscillations to establish low longTermVolatility
      feedPrices(detector, oscillatingPrices(60, 100, 0.2));
      // Now inject huge swings — must override window and spike vol
      const bigSwings = [100, 130, 80, 140, 70, 150, 60];
      feedPrices(detector, bigSwings);
      expect(detector.getRegime()).toBe('volatile');
    });
  });

  describe('confidence', () => {
    it('returns 0 confidence when fewer than minSamples prices fed', () => {
      const detector = new MarketRegimeDetector({ minSamples: 10 });
      feedPrices(detector, ascendingPrices(4));
      // confidence stays at initial 0 — _recompute bails early
      expect(detector.getConfidence()).toBe(0);
    });

    it('confidence increases toward 1 as more data is added', () => {
      const detector = new MarketRegimeDetector({ windowSize: 50, trendStrengthThreshold: 0.5 });
      feedPrices(detector, ascendingPrices(10, 100, 2));
      const earlyConfidence = detector.getConfidence();
      feedPrices(detector, ascendingPrices(40, 120, 2));
      const laterConfidence = detector.getConfidence();
      expect(laterConfidence).toBeGreaterThan(earlyConfidence);
    });

    it('confidence is between 0 and 1 inclusive', () => {
      const detector = new MarketRegimeDetector();
      feedPrices(detector, ascendingPrices(60, 100, 3));
      const c = detector.getConfidence();
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    });
  });

  describe('getStats()', () => {
    it('returns correct regime and sampleCount', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20 });
      feedPrices(detector, ascendingPrices(25, 100, 1));
      const stats = detector.getStats();
      expect(stats.regime).toBe(detector.getRegime());
      expect(stats.sampleCount).toBeLessThanOrEqual(20);
      expect(stats.sampleCount).toBeGreaterThan(0);
    });

    it('returns positive slope for ascending prices', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20 });
      feedPrices(detector, ascendingPrices(25, 100, 1));
      const { slope } = detector.getStats();
      expect(slope).toBeGreaterThan(0);
    });

    it('returns negative slope for descending prices', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20 });
      feedPrices(detector, descendingPrices(25, 200, 1));
      const { slope } = detector.getStats();
      expect(slope).toBeLessThan(0);
    });

    it('returns directionalStrength between 0 and 1', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20 });
      feedPrices(detector, ascendingPrices(25));
      const { directionalStrength } = detector.getStats();
      expect(directionalStrength).toBeGreaterThanOrEqual(0);
      expect(directionalStrength).toBeLessThanOrEqual(1);
    });
  });

  describe('suggestArbParams()', () => {
    it('suggests tighter spreads and normal size for ranging regime', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.6 });
      feedPrices(detector, oscillatingPrices(50, 100, 1));
      expect(detector.getRegime()).toBe('ranging');
      const params = detector.suggestArbParams();
      expect(params.minSpreadMultiplier).toBeLessThan(1);
      expect(params.positionSizeMultiplier).toBe(1.0);
      expect(params.reason).toContain('ranging');
    });

    it('suggests wider spreads and smaller size for trending_up', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.5 });
      feedPrices(detector, ascendingPrices(40, 100, 2));
      expect(detector.getRegime()).toBe('trending_up');
      const params = detector.suggestArbParams();
      expect(params.minSpreadMultiplier).toBeGreaterThan(1);
      expect(params.positionSizeMultiplier).toBeLessThan(1);
    });

    it('suggests wider spreads and smaller size for trending_down', () => {
      const detector = new MarketRegimeDetector({ windowSize: 30, trendStrengthThreshold: 0.5 });
      feedPrices(detector, descendingPrices(40, 200, 2));
      expect(detector.getRegime()).toBe('trending_down');
      const params = detector.suggestArbParams();
      expect(params.minSpreadMultiplier).toBeGreaterThan(1);
      expect(params.positionSizeMultiplier).toBeLessThan(1);
    });

    it('suggests longest cooldown and smallest size for volatile regime', () => {
      const detector = new MarketRegimeDetector({
        windowSize: 20,
        volatilityMultiplier: 1.5,
        minSamples: 5,
      });
      feedPrices(detector, oscillatingPrices(60, 100, 0.2));
      feedPrices(detector, [100, 130, 80, 140, 70, 150, 60]);
      expect(detector.getRegime()).toBe('volatile');
      const params = detector.suggestArbParams();
      expect(params.cooldownMultiplier).toBeGreaterThanOrEqual(2);
      expect(params.positionSizeMultiplier).toBeLessThanOrEqual(0.5);
    });

    it('returns a reason string for every regime', () => {
      const detector = new MarketRegimeDetector();
      const params = detector.suggestArbParams();
      expect(typeof params.reason).toBe('string');
      expect(params.reason.length).toBeGreaterThan(0);
    });
  });

  describe('regime:change event', () => {
    it('emits regime:change when regime transitions', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20, trendStrengthThreshold: 0.5, minSamples: 5 });
      const changes: { previous: string; current: string }[] = [];
      detector.on('regime:change', (e) => changes.push(e));

      // Ranging first
      feedPrices(detector, oscillatingPrices(25, 100, 0.5));
      // Then trending up
      feedPrices(detector, ascendingPrices(25, 110, 3));

      expect(changes.length).toBeGreaterThan(0);
      const lastChange = changes[changes.length - 1];
      expect(lastChange.current).toBe('trending_up');
    });

    it('does not emit excessive regime:change events for stable regime', () => {
      const detector = new MarketRegimeDetector({ windowSize: 20, trendStrengthThreshold: 0.5 });
      let changeCount = 0;
      detector.on('regime:change', () => changeCount++);

      // Consistently ascending — should stay trending_up after first detection
      feedPrices(detector, ascendingPrices(60, 100, 2));

      // At most 2 events (initial ranging → trending_up, possibly one more)
      expect(changeCount).toBeLessThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    it('handles insufficient data gracefully — no crash, returns default regime', () => {
      const detector = new MarketRegimeDetector({ minSamples: 10 });
      detector.addPrice(100);
      detector.addPrice(101);
      expect(() => detector.getRegime()).not.toThrow();
      expect(detector.getRegime()).toBe('ranging');
    });

    it('addPrice updates internal state each call', () => {
      const detector = new MarketRegimeDetector({ windowSize: 10, minSamples: 5 });
      for (let i = 0; i < 10; i++) {
        detector.addPrice(100 + i * 5);
        const stats = detector.getStats();
        expect(stats.sampleCount).toBe(i + 1);
      }
    });
  });
});
