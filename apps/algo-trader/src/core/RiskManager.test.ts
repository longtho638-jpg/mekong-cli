import { RiskManager, TrailingStopConfig, KellyConfig, PositionReturn } from './RiskManager';

describe('RiskManager', () => {
  describe('calculatePositionSize', () => {
    it('should calculate correct position size', () => {
      const size = RiskManager.calculatePositionSize(10000, 1, 100);
      expect(size).toBeCloseTo(1, 5); // 1% of 10000 = 100, 100/100 = 1
    });

    it('should throw if riskPercentage is 0', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 0, 100)).toThrow();
    });

    it('should throw if riskPercentage > 100', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 101, 100)).toThrow();
    });

    it('should throw if currentPrice is 0', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 1, 0)).toThrow('greater than 0');
    });

    it('should throw if currentPrice is negative', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 1, -1)).toThrow('greater than 0');
    });

    it('should throw if balance is negative', () => {
      expect(() => RiskManager.calculatePositionSize(-10000, 1, 100)).toThrow('Balance cannot be negative');
    });
  });

  describe('calculateKelly', () => {
    it('should calculate correct Kelly for favorable bet', () => {
      // 55% win rate, 1:1 odds (b=1)
      // f* = (1*0.55 - 0.45) / 1 = 0.10 = 10%
      const result = RiskManager.calculateKelly(0.55, 1);
      expect(result.fullKelly).toBeCloseTo(10, 1);
    });

    it('should return 0 for unfavorable bet (negative edge)', () => {
      // 40% win rate, 1:1 odds → negative Kelly
      const result = RiskManager.calculateKelly(0.4, 1);
      expect(result.fullKelly).toBe(0); // Clamped to 0
    });

    it('should apply Kelly fraction correctly', () => {
      const config: KellyConfig = { fraction: 0.5 }; // Half Kelly
      const result = RiskManager.calculateKelly(0.6, 1, config);
      // Full Kelly = 20%, half Kelly = 10%
      expect(result.adjustedKelly).toBeCloseTo(10, 1);
    });

    it('should apply max position limit', () => {
      const config: KellyConfig = { maxPercent: 5 }; // Cap at 5%
      const result = RiskManager.calculateKelly(0.7, 1, config);
      // Full Kelly = 40%, but capped at 5%
      expect(result.adjustedKelly).toBeLessThanOrEqual(5);
    });

    it('should throw if edge is negative', () => {
      expect(() => RiskManager.calculateKelly(-0.1, 1)).toThrow();
    });

    it('should throw if edge > 1', () => {
      expect(() => RiskManager.calculateKelly(1.5, 1)).toThrow();
    });

    it('should throw if odds <= 0', () => {
      expect(() => RiskManager.calculateKelly(0.5, 0)).toThrow();
      expect(() => RiskManager.calculateKelly(0.5, -1)).toThrow();
    });

    it('should handle Polymarket binary odds correctly', () => {
      // Binary market: buy at $0.60, payout $1.00 if win
      // Odds = (1.00 - 0.60) / 0.60 = 0.67 (67% return)
      // If edge = 0.65 (65% win probability)
      // f* = (0.67 * 0.65 - 0.35) / 0.67 = 0.125 = 12.5%
      const odds = (1 - 0.6) / 0.6;
      const result = RiskManager.calculateKelly(0.65, odds);
      expect(result.fullKelly).toBeGreaterThan(0);
    });
  });

  describe('calculateKellyPositionSize', () => {
    it('should calculate USD position size from Kelly', () => {
      const bankroll = 10000;
      const size = RiskManager.calculateKellyPositionSize(0.55, 1, bankroll);
      // Full Kelly = 10%, quarter Kelly = 2.5% = $250
      expect(size).toBeCloseTo(250, 0);
    });
  });

  describe('checkPositionLimit', () => {
    it('should return true for valid position', () => {
      expect(RiskManager.checkPositionLimit(100, 1000, 25)).toBe(true);
    });

    it('should return false for oversized position', () => {
      expect(RiskManager.checkPositionLimit(300, 1000, 25)).toBe(false);
    });

    it('should return false for negative position', () => {
      expect(RiskManager.checkPositionLimit(-100, 1000, 25)).toBe(false);
    });

    it('should use default 25% if not specified', () => {
      expect(RiskManager.checkPositionLimit(200, 1000)).toBe(true);
      expect(RiskManager.checkPositionLimit(300, 1000)).toBe(false);
    });
  });

  describe('checkDailyLoss', () => {
    it('should return false when loss is within limit', () => {
      expect(RiskManager.checkDailyLoss(-200, 500)).toBe(false);
    });

    it('should return true when loss exceeds limit', () => {
      expect(RiskManager.checkDailyLoss(-600, 500)).toBe(true);
    });

    it('should return false when profitable', () => {
      expect(RiskManager.checkDailyLoss(100, 500)).toBe(false);
    });

    it('should return false when limit is 0 or negative', () => {
      expect(RiskManager.checkDailyLoss(-100, 0)).toBe(false);
      expect(RiskManager.checkDailyLoss(-100, -100)).toBe(false);
    });
  });

  describe('calculateCorrelation', () => {
    it('should return empty matrix for no positions', () => {
      const result = RiskManager.calculateCorrelation([]);
      expect(result.symbols).toEqual([]);
      expect(result.matrix).toEqual([]);
    });

    it('should return identity matrix for single position', () => {
      const positions: PositionReturn[] = [
        { symbol: 'BTC', returns: [0.01, 0.02, -0.01, 0.03] }
      ];
      const result = RiskManager.calculateCorrelation(positions);
      expect(result.symbols).toEqual(['BTC']);
      expect(result.matrix).toEqual([[1]]);
    });

    it('should return identity matrix for insufficient data', () => {
      const positions: PositionReturn[] = [
        { symbol: 'BTC', returns: [0.01] },
        { symbol: 'ETH', returns: [0.02] }
      ];
      const result = RiskManager.calculateCorrelation(positions);
      expect(result.matrix.length).toBe(2);
      expect(result.matrix[0][0]).toBe(1);
      expect(result.matrix[1][1]).toBe(1);
    });

    it('should calculate perfect positive correlation', () => {
      const positions: PositionReturn[] = [
        { symbol: 'A', returns: [1, 2, 3, 4, 5] },
        { symbol: 'B', returns: [1, 2, 3, 4, 5] }
      ];
      const result = RiskManager.calculateCorrelation(positions);
      expect(result.matrix[0][1]).toBeCloseTo(1, 5);
      expect(result.matrix[1][0]).toBeCloseTo(1, 5);
    });

    it('should calculate perfect negative correlation', () => {
      const positions: PositionReturn[] = [
        { symbol: 'A', returns: [1, 2, 3, 4, 5] },
        { symbol: 'B', returns: [-1, -2, -3, -4, -5] }
      ];
      const result = RiskManager.calculateCorrelation(positions);
      expect(result.matrix[0][1]).toBeCloseTo(-1, 5);
    });

    it('should calculate zero correlation', () => {
      const positions: PositionReturn[] = [
        { symbol: 'A', returns: [1, -1, 1, -1, 1] },
        { symbol: 'B', returns: [0, 0, 0, 0, 0] }
      ];
      const result = RiskManager.calculateCorrelation(positions);
      expect(Math.abs(result.matrix[0][1])).toBeLessThan(0.01);
    });
  });

  describe('correlationBetween', () => {
    it('should calculate correlation between two series', () => {
      const r1 = [0.01, 0.02, 0.015, 0.025, 0.018];
      const r2 = [0.008, 0.022, 0.012, 0.028, 0.02];
      const corr = RiskManager.correlationBetween(r1, r2);
      expect(corr).toBeGreaterThan(0.9); // Highly correlated
    });

    it('should return 0 for insufficient data', () => {
      expect(RiskManager.correlationBetween([1], [2])).toBe(0);
      expect(RiskManager.correlationBetween([], [])).toBe(0);
    });
  });

  describe('getInventorySkew', () => {
    it('should return 0 for zero inventory', () => {
      expect(RiskManager.getInventorySkew(0, 100)).toBeCloseTo(0, 5);
    });

    it('should return negative skew for long inventory', () => {
      // Long 50 units, max 100 → 50% inventory → -0.5% skew
      const skew = RiskManager.getInventorySkew(50, 100, 1);
      expect(skew).toBeCloseTo(-0.005, 5);
    });

    it('should return positive skew for short inventory', () => {
      // Short 50 units, max 100 → -50% inventory → +0.5% skew
      const skew = RiskManager.getInventorySkew(-50, 100, 1);
      expect(skew).toBeCloseTo(0.005, 5);
    });

    it('should cap at max inventory', () => {
      const skew1 = RiskManager.getInventorySkew(100, 100, 1);
      const skew2 = RiskManager.getInventorySkew(200, 100, 1);
      // Both should be at max skew (-1%)
      expect(skew1).toBeCloseTo(-0.01, 5);
      expect(skew2).toBeCloseTo(-0.01, 5);
    });

    it('should return 0 for invalid maxInventory', () => {
      expect(RiskManager.getInventorySkew(50, 0)).toBe(0);
      expect(RiskManager.getInventorySkew(50, -100)).toBe(0);
    });
  });

  describe('getSkewedPrices', () => {
    it('should return symmetric prices for zero inventory', () => {
      const result = RiskManager.getSkewedPrices(100, 0, 100, 0.02);
      expect(result.bid).toBeCloseTo(99, 2); // 100 * (1 - 0.01)
      expect(result.ask).toBeCloseTo(101, 2); // 100 * (1 + 0.01)
      expect(result.skew).toBeCloseTo(0, 5);
    });

    it('should lower prices for long inventory', () => {
      const result = RiskManager.getSkewedPrices(100, 50, 100, 0.02, 1);
      expect(result.skew).toBeLessThan(0);
      expect(result.bid).toBeLessThan(99);
      expect(result.ask).toBeLessThan(101);
    });

    it('should raise prices for short inventory', () => {
      const result = RiskManager.getSkewedPrices(100, -50, 100, 0.02, 1);
      expect(result.skew).toBeGreaterThan(0);
      expect(result.bid).toBeGreaterThan(99);
      expect(result.ask).toBeGreaterThan(101);
    });
  });

  describe('initTrailingStop', () => {
    it('should initialize stop 2% below entry by default', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config, 0.02);
      expect(state.highestPrice).toBe(100);
      expect(state.stopPrice).toBeCloseTo(98, 5);
      expect(state.isPositiveActive).toBe(false);
    });

    it('should use trailingStopPositive as initial fraction', () => {
      const config: TrailingStopConfig = { trailingStop: true, trailingStopPositive: 0.01 };
      const state = RiskManager.initTrailingStop(100, config);
      expect(state.stopPrice).toBeCloseTo(99, 5);
    });
  });

  describe('updateTrailingStop', () => {
    it('should not trigger stop if price above stop', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config, 0.02);
      const { stopHit } = RiskManager.updateTrailingStop(105, state, config, 0.02);
      expect(stopHit).toBe(false);
    });

    it('should trigger stop if price falls below stop', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config, 0.02);
      const { stopHit } = RiskManager.updateTrailingStop(97, state, config, 0.02);
      expect(stopHit).toBe(true);
    });

    it('should trail stop up as price rises', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      let state = RiskManager.initTrailingStop(100, config, 0.02);

      // Price rises to 110
      const result = RiskManager.updateTrailingStop(110, state, config, 0.02);
      state = result.state;
      expect(result.stopHit).toBe(false);
      expect(state.highestPrice).toBe(110);
      expect(state.stopPrice).toBeCloseTo(107.8, 1); // 110 * 0.98

      // Now price drops to 108 — above stop, not triggered
      const result2 = RiskManager.updateTrailingStop(108, state, config, 0.02);
      expect(result2.stopHit).toBe(false);

      // Price drops to 107 — below stop of 107.8, triggered
      const result3 = RiskManager.updateTrailingStop(107, state, config, 0.02);
      expect(result3.stopHit).toBe(true);
    });

    it('should not update trailing stop when trailingStop is false', () => {
      const config: TrailingStopConfig = { trailingStop: false };
      const state = RiskManager.initTrailingStop(100, config, 0.02);
      const { stopHit } = RiskManager.updateTrailingStop(50, state, config, 0.02);
      expect(stopHit).toBe(false);
    });

    it('should activate trailingStopPositive when price crosses offset threshold', () => {
      const config: TrailingStopConfig = {
        trailingStop: true,
        trailingStopPositive: 0.01,   // tighter 1% trail once active
        trailingStopPositiveOffset: 0.03 // activate after +3% gain
      };
      let state = RiskManager.initTrailingStop(100, config, 0.02);

      // Price rises 4% — crosses the +3% offset → activates positive trailing
      const result = RiskManager.updateTrailingStop(104, state, config, 0.02);
      state = result.state;
      expect(result.stopHit).toBe(false);
      expect(state.isPositiveActive).toBe(true);
      // Stop should now be at 104 * (1 - 0.01) = 102.96
      expect(state.stopPrice).toBeCloseTo(102.96, 1);
    });
  });
});
