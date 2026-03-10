/**
 * Tests for RiskManager — position sizing, stop-loss, take-profit, trailing stop,
 * daily loss limits, ATR-based stops, and drawdown control.
 */

import { RiskManager, StopLossTakeProfitConfig, TrailingStopConfig, DrawdownControlConfig } from '../../src/core/RiskManager';

describe('RiskManager', () => {
  describe('calculatePositionSize', () => {
    it('calculates correct position size for valid inputs', () => {
      const size = RiskManager.calculatePositionSize(10000, 2, 100); // 2% of $10000 at $100
      expect(size).toBe(2); // $200 / $100 = 2 units
    });

    it('returns zero for zero balance', () => {
      const size = RiskManager.calculatePositionSize(0, 2, 100);
      expect(size).toBe(0);
    });

    it('throws for negative risk percentage', () => {
      expect(() => RiskManager.calculatePositionSize(10000, -1, 100)).toThrow('Risk percentage must be between 0 and 100');
    });

    it('throws for risk > 100%', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 101, 100)).toThrow('Risk percentage must be between 0 and 100');
    });

    it('throws for zero price', () => {
      expect(() => RiskManager.calculatePositionSize(10000, 2, 0)).toThrow('Current price must be greater than 0');
    });

    it('throws for negative balance', () => {
      expect(() => RiskManager.calculatePositionSize(-100, 2, 100)).toThrow('Balance cannot be negative');
    });

    it('handles very small risk percentage', () => {
      const size = RiskManager.calculatePositionSize(10000, 0.1, 100);
      expect(size).toBeCloseTo(0.1); // $10 / $100 = 0.1
    });

    it('handles 100% risk', () => {
      const size = RiskManager.calculatePositionSize(10000, 100, 100);
      expect(size).toBe(100); // $10000 / $100 = 100
    });
  });

  describe('checkStopLossTakeProfit', () => {
    describe('long positions (side = buy)', () => {
      it('SL hit when price drops below stop', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(95, 100, 'buy', config);
        expect(result.stopLossHit).toBe(true);
        expect(result.takeProfitHit).toBe(false);
        expect(result.stopLossPrice).toBeCloseTo(95);
        expect(result.takeProfitPrice).toBeCloseTo(110);
      });

      it('TP hit when price rises above target', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(110.01, 100, 'buy', config);
        expect(result.stopLossHit).toBe(false);
        expect(result.takeProfitHit).toBe(true);
      });

      it('both hit when price equals exactly SL', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(95, 100, 'buy', config);
        expect(result.stopLossHit).toBe(true);
      });

      it('neither hit when price in middle', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(102, 100, 'buy', config);
        expect(result.stopLossHit).toBe(false);
        expect(result.takeProfitHit).toBe(false);
      });
    });

    describe('short positions (side = sell)', () => {
      it('SL hit when price rises above stop', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(105, 100, 'sell', config);
        expect(result.stopLossHit).toBe(true);
        expect(result.takeProfitHit).toBe(false);
        expect(result.stopLossPrice).toBe(105); // 100 * (1 + 5/100)
        expect(result.takeProfitPrice).toBe(90); // 100 * (1 - 10/100)
      });

      it('TP hit when price drops below target', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 5, takeProfitPercent: 10 };
        const result = RiskManager.checkStopLossTakeProfit(90, 100, 'sell', config);
        expect(result.stopLossHit).toBe(false);
        expect(result.takeProfitHit).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('zero SL/TP config means no stop', () => {
        const config: StopLossTakeProfitConfig = { stopLossPercent: 0, takeProfitPercent: 0 };
        const result = RiskManager.checkStopLossTakeProfit(50, 100, 'buy', config);
        expect(result.stopLossHit).toBe(false);
        expect(result.takeProfitHit).toBe(false);
      });

      it('undefined SL/TP treated as zero', () => {
        const config: StopLossTakeProfitConfig = {};
        const result = RiskManager.checkStopLossTakeProfit(50, 100, 'buy', config);
        expect(result.stopLossHit).toBe(false);
        expect(result.takeProfitHit).toBe(false);
      });
    });
  });

  describe('isDailyLossLimitHit', () => {
    it('returns false when limit not configured', () => {
      expect(RiskManager.isDailyLossLimitHit(-500, undefined)).toBe(false);
      expect(RiskManager.isDailyLossLimitHit(-500)).toBe(false);
    });

    it('returns false when loss < limit', () => {
      expect(RiskManager.isDailyLossLimitHit(-200, 500)).toBe(false);
      expect(RiskManager.isDailyLossLimitHit(0, 500)).toBe(false);
      expect(RiskManager.isDailyLossLimitHit(100, 500)).toBe(false);
    });

    it('returns true when loss >= limit', () => {
      expect(RiskManager.isDailyLossLimitHit(-500, 500)).toBe(true);
      expect(RiskManager.isDailyLossLimitHit(-1000, 500)).toBe(true);
    });

    it('returns false for positive/zero limit', () => {
      expect(RiskManager.isDailyLossLimitHit(-100, 0)).toBe(false);
      expect(RiskManager.isDailyLossLimitHit(-100, -500)).toBe(false);
    });
  });

  describe('initTrailingStop', () => {
    it('initializes with default offset (2%)', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config);
      expect(state.highestPrice).toBe(100);
      expect(state.stopPrice).toBe(98); // 100 * (1 - 0.02)
      expect(state.isPositiveActive).toBe(false);
      expect(state.entryPrice).toBe(100);
    });

    it('uses custom positive offset', () => {
      const config: TrailingStopConfig = { trailingStop: true, trailingStopPositive: 0.03 };
      const state = RiskManager.initTrailingStop(100, config);
      expect(state.stopPrice).toBe(97); // 100 * (1 - 0.03)
    });
  });

  describe('updateTrailingStop', () => {
    it('does not trail when disabled', () => {
      const config: TrailingStopConfig = { trailingStop: false };
      const state = RiskManager.initTrailingStop(100, { trailingStop: true });
      const result = RiskManager.updateTrailingStop(110, state, config);
      expect(result.stopHit).toBe(false);
      expect(result.state.stopPrice).toBe(98); // unchanged
      expect(result.state.highestPrice).toBe(100); // not updated
    });

    it('stop hit when price <= stopPrice', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config);
      const result = RiskManager.updateTrailingStop(97, state, config);
      expect(result.stopHit).toBe(true);
    });

    it('updates highestPrice when price increases', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      const state = RiskManager.initTrailingStop(100, config);
      const result = RiskManager.updateTrailingStop(110, state, config);
      expect(result.stopHit).toBe(false);
      expect(result.state.highestPrice).toBe(110);
      expect(result.state.stopPrice).toBeGreaterThan(98); // trails up
    });

    it('activates positive trailing stop when threshold reached', () => {
      const config: TrailingStopConfig = {
        trailingStop: true,
        trailingStopPositive: 0.02,
        trailingStopPositiveOffset: 0.05,
      };
      const state = RiskManager.initTrailingStop(100, config);
      // Price needs to go up 5% to activate positive trailing
      const result = RiskManager.updateTrailingStop(105, state, config);
      expect(result.state.isPositiveActive).toBe(true);
    });

    it('trailing stop only moves up, never down', () => {
      const config: TrailingStopConfig = { trailingStop: true };
      let state = RiskManager.initTrailingStop(100, config);
      state = RiskManager.updateTrailingStop(110, state, config).state;
      const stopAfterUp = state.stopPrice;
      // Price drops, but stop should not move down
      const result = RiskManager.updateTrailingStop(105, state, config);
      expect(result.state.stopPrice).toBeGreaterThanOrEqual(stopAfterUp);
    });
  });

  describe('calculateDynamicPositionSize', () => {
    it('returns base size when volatility is low', () => {
      const size = RiskManager.calculateDynamicPositionSize(10000, 2, 100, 1, {
        minVolatility: 2, // ATR% < 2% = low vol
      });
      expect(size).toBeCloseTo(2, 1); // Same as base
    });

    it('reduces size when volatility is high', () => {
      const baseSize = RiskManager.calculatePositionSize(10000, 2, 100);
      const size = RiskManager.calculateDynamicPositionSize(10000, 2, 100, 10, {
        minVolatility: 1.5,
        maxVolatility: 8,
        atrMultiplier: 1,
      });
      expect(size).toBeLessThan(baseSize);
    });

    it('handles zero ATR', () => {
      const size = RiskManager.calculateDynamicPositionSize(10000, 2, 100, 0);
      expect(size).toBeCloseTo(2, 1); // No adjustment
    });
  });

  describe('calculateAtrStopLoss', () => {
    it('calculates SL below entry for long positions', () => {
      const sl = RiskManager.calculateAtrStopLoss(100, 2, 2, 'buy');
      expect(sl).toBe(96); // 100 - (2 * 2)
    });

    it('calculates SL above entry for short positions', () => {
      const sl = RiskManager.calculateAtrStopLoss(100, 2, 2, 'sell');
      expect(sl).toBe(104); // 100 + (2 * 2)
    });

    it('uses default multiplier of 2', () => {
      const sl = RiskManager.calculateAtrStopLoss(100, 2, undefined, 'buy');
      expect(sl).toBe(96);
    });
  });

  describe('checkDrawdownLimit', () => {
    it('returns exceeded when drawdown >= max', () => {
      const config: DrawdownControlConfig = {
        maxDrawdownPercent: 10,
        recoveryPercentage: 50,
        resetAfterRecovery: true,
      };
      const result = RiskManager.checkDrawdownLimit(9000, 10000, config);
      expect(result.exceeded).toBe(true);
      expect(result.drawdownPercent).toBe(10);
    });

    it('returns not exceeded when drawdown < max', () => {
      const config: DrawdownControlConfig = {
        maxDrawdownPercent: 10,
        recoveryPercentage: 50,
        resetAfterRecovery: true,
      };
      const result = RiskManager.checkDrawdownLimit(9500, 10000, config);
      expect(result.exceeded).toBe(false);
      expect(result.drawdownPercent).toBe(5);
    });

    it('throws for zero peak balance', () => {
      const config: DrawdownControlConfig = {
        maxDrawdownPercent: 10,
        recoveryPercentage: 50,
        resetAfterRecovery: true,
      };
      expect(() => RiskManager.checkDrawdownLimit(9000, 0, config)).toThrow('Peak balance must be greater than 0');
    });

    it('calculates correct drawdown percentage', () => {
      const config: DrawdownControlConfig = {
        maxDrawdownPercent: 20,
        recoveryPercentage: 50,
        resetAfterRecovery: true,
      };
      const result = RiskManager.checkDrawdownLimit(8000, 10000, config);
      expect(result.drawdownPercent).toBe(20);
    });
  });

  describe('calculateRiskAdjustedMetrics', () => {
    it('calculates Sharpe ratio correctly', () => {
      const metrics = RiskManager.calculateRiskAdjustedMetrics(0.15, 0.1, 0.03, 0.05);
      expect(metrics.sharpeRatio).toBeCloseTo(1.2, 1); // (0.15 - 0.03) / 0.1
    });

    it('returns zero Sharpe for zero risk', () => {
      const metrics = RiskManager.calculateRiskAdjustedMetrics(0.15, 0, 0.03, 0.05);
      expect(metrics.sharpeRatio).toBe(0);
    });

    it('calculates Calmar ratio correctly', () => {
      const metrics = RiskManager.calculateRiskAdjustedMetrics(0.15, 0.1, 0.03, -0.1);
      expect(metrics.calmarRatio).toBeCloseTo(1.5, 1); // 0.15 / 0.1
    });

    it('returns zero Calmar for zero drawdown', () => {
      const metrics = RiskManager.calculateRiskAdjustedMetrics(0.15, 0.1, 0.03, 0);
      expect(metrics.calmarRatio).toBe(0);
    });
  });

  describe('calculateDynamicRiskParams', () => {
    it('reduces risk in high volatility', () => {
      const params = RiskManager.calculateDynamicRiskParams(6); // > 5 = high vol
      expect(params.positionSizeMultiplier).toBeLessThan(1);
      expect(params.leverageAdjustment).toBeLessThan(1);
    });

    it('increases risk slightly in low volatility', () => {
      const params = RiskManager.calculateDynamicRiskParams(1); // < 2 = low vol
      expect(params.positionSizeMultiplier).toBeGreaterThan(1);
      expect(params.leverageAdjustment).toBeGreaterThan(1);
    });

    it('increases risk in trending regime', () => {
      const params = RiskManager.calculateDynamicRiskParams(3, 0.5, 'trending');
      expect(params.positionSizeMultiplier).toBeGreaterThan(1);
    });

    it('reduces risk in volatile regime', () => {
      const params = RiskManager.calculateDynamicRiskParams(3, 0.5, 'volatile');
      expect(params.positionSizeMultiplier).toBeLessThan(1);
      expect(params.leverageAdjustment).toBeLessThan(1);
    });

    it('reduces risk in mean-reverting regime', () => {
      const params = RiskManager.calculateDynamicRiskParams(3, 0.5, 'mean-reverting');
      expect(params.positionSizeMultiplier).toBeLessThan(1);
    });

    it('adjusts based on trend strength', () => {
      const strongTrend = RiskManager.calculateDynamicRiskParams(3, 0.8); // strong trend
      const weakTrend = RiskManager.calculateDynamicRiskParams(3, 0.2); // weak trend
      expect(strongTrend.positionSizeMultiplier).toBeGreaterThan(weakTrend.positionSizeMultiplier);
    });
  });
});
