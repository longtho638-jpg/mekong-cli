import { RiskManager } from '../../src/core/RiskManager';

describe('Enhanced RiskManager', () => {
  describe('calculateDynamicPositionSize', () => {
    it('should calculate position size with volatility adjustment', () => {
      const baseBalance = 10000;
      const baseRiskPercent = 2;
      const currentPrice = 50000;
      const atr = 1000; // ATR value

      const positionSize = RiskManager.calculateDynamicPositionSize(
        baseBalance,
        baseRiskPercent,
        currentPrice,
        atr
      );

      // Should return a valid position size
      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThan(RiskManager.calculatePositionSize(baseBalance, baseRiskPercent, currentPrice));
    });

    it('should return smaller position size with higher volatility', () => {
      const baseBalance = 10000;
      const baseRiskPercent = 2;
      const currentPrice = 50000;
      const lowVolAtr = 500;
      const highVolAtr = 2000;

      const lowVolPositionSize = RiskManager.calculateDynamicPositionSize(
        baseBalance,
        baseRiskPercent,
        currentPrice,
        lowVolAtr
      );

      const highVolPositionSize = RiskManager.calculateDynamicPositionSize(
        baseBalance,
        baseRiskPercent,
        currentPrice,
        highVolAtr
      );

      // Higher volatility should result in smaller position size
      expect(highVolPositionSize).toBeLessThan(lowVolPositionSize);
    });
  });

  describe('calculateAtrStopLoss', () => {
    it('should calculate correct ATR stop-loss for long position', () => {
      const entryPrice = 50000;
      const atr = 1000;
      const atrMultiplier = 2;

      const stopLoss = RiskManager.calculateAtrStopLoss(
        entryPrice,
        atr,
        atrMultiplier,
        'buy'
      );

      const expectedStopLoss = entryPrice - (atr * atrMultiplier);
      expect(stopLoss).toBe(expectedStopLoss);
    });

    it('should calculate correct ATR stop-loss for short position', () => {
      const entryPrice = 50000;
      const atr = 1000;
      const atrMultiplier = 2;

      const stopLoss = RiskManager.calculateAtrStopLoss(
        entryPrice,
        atr,
        atrMultiplier,
        'sell'
      );

      const expectedStopLoss = entryPrice + (atr * atrMultiplier);
      expect(stopLoss).toBe(expectedStopLoss);
    });
  });

  describe('checkDrawdownLimit', () => {
    it('should correctly identify when drawdown limit is exceeded', () => {
      const currentBalance = 9000; // 10% drawdown from peak of 10000
      const peakBalance = 10000;
      const config = {
        maxDrawdownPercent: 5, // 5% max drawdown allowed
        recoveryPercentage: 0.8,
        resetAfterRecovery: false
      };

      const result = RiskManager.checkDrawdownLimit(
        currentBalance,
        peakBalance,
        config
      );

      expect(result.exceeded).toBe(true);
      expect(result.drawdownPercent).toBe(10);
    });

    it('should correctly identify when drawdown limit is not exceeded', () => {
      const currentBalance = 9600; // 4% drawdown from peak of 10000
      const peakBalance = 10000;
      const config = {
        maxDrawdownPercent: 5, // 5% max drawdown allowed
        recoveryPercentage: 0.8,
        resetAfterRecovery: false
      };

      const result = RiskManager.checkDrawdownLimit(
        currentBalance,
        peakBalance,
        config
      );

      expect(result.exceeded).toBe(false);
      expect(result.drawdownPercent).toBeCloseTo(4, 10);
    });
  });

  describe('calculateRiskAdjustedMetrics', () => {
    it('should calculate Sharpe, Sortino, and Calmar ratios', () => {
      const portfolioReturn = 0.15; // 15% return
      const portfolioRisk = 0.10; // 10% risk
      const riskFreeRate = 0.02; // 2% risk-free rate
      const maxDrawdown = 0.08; // 8% max drawdown

      const metrics = RiskManager.calculateRiskAdjustedMetrics(
        portfolioReturn,
        portfolioRisk,
        riskFreeRate,
        maxDrawdown
      );

      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.sortinoRatio).toBeDefined();
      expect(metrics.calmarRatio).toBeDefined();
    });
  });

  describe('calculateDynamicRiskParams', () => {
    it('should return adjusted risk parameters based on volatility', () => {
      const volatilityPercent = 6; // High volatility
      const trendStrength = 0.6;
      const marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet' = 'volatile';

      const params = RiskManager.calculateDynamicRiskParams(
        volatilityPercent,
        trendStrength,
        marketRegime
      );

      expect(params.positionSizeMultiplier).toBeLessThan(1.1); // Should be reduced in volatile markets
      expect(params.stopLossMultiplier).toBeGreaterThan(1); // Should be wider stops in volatile markets
      expect(params.leverageAdjustment).toBeLessThan(1); // Should reduce leverage in volatile markets
    });

    it('should return conservative parameters in high volatility conditions', () => {
      const volatilityPercent = 10; // Very high volatility
      const trendStrength = 0.5;
      const marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet' = 'volatile';

      const params = RiskManager.calculateDynamicRiskParams(
        volatilityPercent,
        trendStrength,
        marketRegime
      );

      expect(params.positionSizeMultiplier).toBeLessThan(0.9); // Significantly reduced position size
      expect(params.leverageAdjustment).toBeLessThan(0.8); // Significantly reduced leverage
    });
  });
});