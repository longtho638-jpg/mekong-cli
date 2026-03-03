/**
 * Arbitrage Risk Manager Tests
 */

import { ArbitrageRiskManager, ArbRiskConfig } from './arbitrage-risk-manager';

describe('ArbitrageRiskManager', () => {
  const defaultConfig: ArbRiskConfig = {
    maxPositionSizeUsd: 100,
    maxDailyLossUsd: 500,
    maxTradesPerDay: 50,
    minBalanceUsd: 10,
  };

  let riskManager: ArbitrageRiskManager;

  beforeEach(() => {
    riskManager = new ArbitrageRiskManager(defaultConfig);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const status = riskManager.getStatus();
      expect(status.dailyPnlUsd).toBe(0);
      expect(status.tradeCount).toBe(0);
      expect(status.isCircuitBroken).toBe(false);
    });
  });

  describe('preCheck', () => {
    it('should allow trade when all checks pass', () => {
      const result = riskManager.preCheck(
        50, // positionSizeUsd
        1000, // buyExchangeBalance
        10, // sellExchangeBalance
        0.5 // sellAmount
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject when position size exceeds max', () => {
      const result = riskManager.preCheck(
        150, // exceeds maxPositionSizeUsd (100)
        1000,
        10,
        0.5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds max');
    });

    it('should reject when buy exchange balance below min', () => {
      const result = riskManager.preCheck(
        50,
        5, // below minBalanceUsd (10)
        10,
        0.5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('below min');
    });

    it('should reject when sell exchange balance insufficient', () => {
      const result = riskManager.preCheck(
        50,
        1000,
        0.3, // less than sellAmount (0.5)
        0.5
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('< required');
    });

    it('should reject when trade count reaches daily limit', () => {
      // Manually set trade count to max
      for (let i = 0; i < 50; i++) {
        riskManager.recordTrade(10);
      }

      const result = riskManager.preCheck(50, 1000, 10, 0.5);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('reaches daily limit');
    });

    it('should reject when circuit breaker is tripped', () => {
      // Trip circuit breaker by exceeding daily loss
      riskManager.recordTrade(-600); // exceeds maxDailyLossUsd (500)

      const result = riskManager.preCheck(50, 1000, 10, 0.5);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily loss');
    });
  });

  describe('recordTrade', () => {
    it('should update daily P&L and trade count', () => {
      riskManager.recordTrade(25);

      expect(riskManager.getDailyPnl()).toBe(25);
      expect(riskManager.getTradeCount()).toBe(1);

      riskManager.recordTrade(-10);

      expect(riskManager.getDailyPnl()).toBe(15);
      expect(riskManager.getTradeCount()).toBe(2);
    });

    it('should trip circuit breaker when daily loss exceeded', () => {
      riskManager.recordTrade(-400);
      expect(riskManager.isCircuitBroken).toBe(false);

      riskManager.recordTrade(-150); // Total: -550, exceeds -500

      expect(riskManager.isCircuitBroken).toBe(true);
      const status = riskManager.getStatus();
      expect(status.reason).toContain('Daily loss');
    });

    it('should not trip circuit breaker if within limits', () => {
      riskManager.recordTrade(-200);
      riskManager.recordTrade(-200); // Total: -400, still within -500

      expect(riskManager.isCircuitBroken).toBe(false);
    });
  });

  describe('resetDaily', () => {
    it('should reset all counters', () => {
      // Set up some state
      riskManager.recordTrade(50);
      riskManager.recordTrade(-100);
      riskManager.recordTrade(-500); // Trip circuit breaker

      expect(riskManager.isCircuitBroken).toBe(true);
      expect(riskManager.getTradeCount()).toBe(3);

      // Reset
      riskManager.resetDaily();

      const status = riskManager.getStatus();
      expect(status.dailyPnlUsd).toBe(0);
      expect(status.tradeCount).toBe(0);
      expect(status.isCircuitBroken).toBe(false);
      expect(status.reason).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      riskManager.recordTrade(100);
      riskManager.recordTrade(-50);

      const status = riskManager.getStatus();

      expect(status).toEqual({
        dailyPnlUsd: 50,
        tradeCount: 2,
        isCircuitBroken: false,
        reason: undefined,
      });
    });
  });

  describe('getDailyPnl', () => {
    it('should return current daily P&L', () => {
      expect(riskManager.getDailyPnl()).toBe(0);

      riskManager.recordTrade(75);
      expect(riskManager.getDailyPnl()).toBe(75);

      riskManager.recordTrade(-25);
      expect(riskManager.getDailyPnl()).toBe(50);
    });
  });

  describe('getTradeCount', () => {
    it('should return number of trades today', () => {
      expect(riskManager.getTradeCount()).toBe(0);

      riskManager.recordTrade(10);
      expect(riskManager.getTradeCount()).toBe(1);

      riskManager.recordTrade(20);
      expect(riskManager.getTradeCount()).toBe(2);
    });
  });
});
