/**
 * Circuit Breakers Tests — Comprehensive test coverage for risk guards.
 */

import {
  MaxDrawdownCircuitBreaker,
  ConsecutiveLossLimiter,
  DailyLossCircuitBreaker,
  VolatilityPositionSizer,
  KillSwitch,
  CircuitBreakerManager,
} from './circuit-breakers';

describe('MaxDrawdownCircuitBreaker', () => {
  it('should not trip when drawdown is below threshold', () => {
    const breaker = new MaxDrawdownCircuitBreaker(20);
    const state = breaker.check(15);
    expect(state.isTripped).toBe(false);
  });

  it('should trip when drawdown equals threshold', () => {
    const breaker = new MaxDrawdownCircuitBreaker(20);
    const state = breaker.check(20);
    expect(state.isTripped).toBe(true);
    expect(state.reason).toContain('20%');
  });

  it('should trip when drawdown exceeds threshold', () => {
    const breaker = new MaxDrawdownCircuitBreaker(20);
    const state = breaker.check(25);
    expect(state.isTripped).toBe(true);
    expect(state.reason).toContain('25.00%');
  });

  it('should reset after being tripped', () => {
    const breaker = new MaxDrawdownCircuitBreaker(20);
    breaker.check(25);
    breaker.reset();
    expect(breaker.getState().isTripped).toBe(false);
  });

  it('should capture trippedAt timestamp', () => {
    const breaker = new MaxDrawdownCircuitBreaker(20);
    const before = Date.now();
    breaker.check(25);
    const after = Date.now();
    const state = breaker.getState();
    expect(state.trippedAt).toBeGreaterThanOrEqual(before);
    expect(state.trippedAt).toBeLessThanOrEqual(after);
  });
});

describe('ConsecutiveLossLimiter', () => {
  it('should not trip with winning trades', () => {
    const limiter = new ConsecutiveLossLimiter(5);
    for (let i = 0; i < 10; i++) {
      limiter.recordTrade(100);
    }
    expect(limiter.getState().isTripped).toBe(false);
  });

  it('should not trip with fewer losses than limit', () => {
    const limiter = new ConsecutiveLossLimiter(5);
    for (let i = 0; i < 4; i++) {
      limiter.recordTrade(-50);
    }
    expect(limiter.getState().isTripped).toBe(false);
  });

  it('should trip on exact limit of consecutive losses', () => {
    const limiter = new ConsecutiveLossLimiter(5);
    for (let i = 0; i < 5; i++) {
      limiter.recordTrade(-50);
    }
    expect(limiter.getState().isTripped).toBe(true);
    expect(limiter.getState().reason).toContain('5 consecutive losses');
  });

  it('should reset loss count after a win', () => {
    const limiter = new ConsecutiveLossLimiter(5);
    for (let i = 0; i < 4; i++) {
      limiter.recordTrade(-50);
    }
    limiter.recordTrade(100); // Win resets counter
    for (let i = 0; i < 4; i++) {
      limiter.recordTrade(-50);
    }
    expect(limiter.getState().isTripped).toBe(false);
  });

  it('should reset manually', () => {
    const limiter = new ConsecutiveLossLimiter(5);
    for (let i = 0; i < 5; i++) {
      limiter.recordTrade(-50);
    }
    limiter.reset();
    expect(limiter.getState().isTripped).toBe(false);
  });
});

describe('DailyLossCircuitBreaker', () => {
  it('should not trip when daily loss is below limit', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    const state = breaker.checkDailyLoss(-300);
    expect(state.isTripped).toBe(false);
  });

  it('should trip when daily loss equals limit', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    const state = breaker.checkDailyLoss(-500);
    expect(state.isTripped).toBe(true);
    expect(state.reason).toContain('$500');
  });

  it('should trip when daily loss exceeds limit', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    const state = breaker.checkDailyLoss(-700);
    expect(state.isTripped).toBe(true);
  });

  it('should track daily loss correctly', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    breaker.checkDailyLoss(-200);
    const tracker = breaker.getTracker();
    expect(tracker.totalLoss).toBe(200);
  });

  it('should reset manually', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    breaker.checkDailyLoss(-600);
    breaker.reset();
    expect(breaker.getState().isTripped).toBe(false);
  });

  it('should have resetAt set to next midnight when tripped', () => {
    const breaker = new DailyLossCircuitBreaker(500);
    breaker.checkDailyLoss(-600);
    const state = breaker.getState();
    expect(state.resetAt).toBeDefined();
    if (state.resetAt) {
      const nextMidnight = new Date(state.resetAt);
      expect(nextMidnight.getHours()).toBe(0);
      expect(nextMidnight.getMinutes()).toBe(0);
    }
  });
});

describe('VolatilityPositionSizer', () => {
  it('should return normal risk when ATR ratio is low', () => {
    const sizer = new VolatilityPositionSizer(2, 3);
    const risk = sizer.calculateRiskPercent(1, 1); // ATR ratio = 1
    expect(risk).toBe(2);
  });

  it('should reduce risk by 50% when ATR ratio >= 2', () => {
    const sizer = new VolatilityPositionSizer(2, 3);
    const risk = sizer.calculateRiskPercent(2, 1); // ATR ratio = 2
    expect(risk).toBe(1); // 50% of 2
  });

  it('should reduce risk by 75% when ATR ratio >= threshold', () => {
    const sizer = new VolatilityPositionSizer(2, 3);
    const risk = sizer.calculateRiskPercent(3, 1); // ATR ratio = 3 (threshold)
    expect(risk).toBe(0.5); // 25% of 2
  });

  it('should calculate position size with volatility adjustment', () => {
    const sizer = new VolatilityPositionSizer(2, 3);
    const balance = 10000;
    const price = 100;
    const size = sizer.calculatePositionSize(balance, price, 1, 1);
    expect(size).toBe(2); // 2% of $10000 / $100 = 2 shares
  });

  it('should reduce position size when volatility is high', () => {
    const sizer = new VolatilityPositionSizer(2, 3);
    const balance = 10000;
    const price = 100;
    const normalSize = sizer.calculatePositionSize(balance, price, 1, 1);
    const highVolSize = sizer.calculatePositionSize(balance, price, 3, 1);
    expect(highVolSize).toBeLessThan(normalSize);
  });
});

describe('KillSwitch', () => {
  it('should not be active by default', () => {
    const killSwitch = new KillSwitch();
    expect(killSwitch.isActive()).toBe(false);
  });

  it('should activate with default reason', () => {
    const killSwitch = new KillSwitch();
    killSwitch.activate();
    expect(killSwitch.isActive()).toBe(true);
    expect(killSwitch.getReason()).toBe('Manual kill switch activated');
  });

  it('should activate with custom reason', () => {
    const killSwitch = new KillSwitch();
    killSwitch.activate('Emergency: exchange API down');
    expect(killSwitch.isActive()).toBe(true);
    expect(killSwitch.getReason()).toBe('Emergency: exchange API down');
  });

  it('should reset after activation', () => {
    const killSwitch = new KillSwitch();
    killSwitch.activate();
    killSwitch.reset();
    expect(killSwitch.isActive()).toBe(false);
    expect(killSwitch.getReason()).toBeUndefined();
  });
});

describe('CircuitBreakerManager', () => {
  it('should not trip when all breakers are clear', () => {
    const manager = new CircuitBreakerManager();
    const shouldHalt = manager.checkAll(10); // 10% drawdown
    expect(shouldHalt).toBe(false);
  });

  it('should trip when max drawdown is exceeded', () => {
    const manager = new CircuitBreakerManager({ maxDrawdownPercent: 20 });
    const shouldHalt = manager.checkAll(25); // 25% drawdown
    expect(shouldHalt).toBe(true);
  });

  it('should trip on consecutive losses', () => {
    const manager = new CircuitBreakerManager({ maxConsecutiveLosses: 5 });
    for (let i = 0; i < 4; i++) {
      manager.checkAll(10, -50); // 4 losses
    }
    expect(manager.checkAll(10, -50)).toBe(true); // 5th loss
  });

  it('should trip on daily loss limit', () => {
    const manager = new CircuitBreakerManager({ dailyLossLimitUsd: 500 });
    const shouldHalt = manager.checkAll(10, undefined, -600);
    expect(shouldHalt).toBe(true);
  });

  it('should return status of all breakers', () => {
    const manager = new CircuitBreakerManager();
    const status = manager.getStatus();
    expect(status).toHaveProperty('maxDrawdown');
    expect(status).toHaveProperty('consecutiveLoss');
    expect(status).toHaveProperty('dailyLoss');
    expect(status).toHaveProperty('killSwitch');
    expect(status.anyTripped).toBe(false);
  });

  it('should reset all breakers', () => {
    const manager = new CircuitBreakerManager({ maxDrawdownPercent: 20 });
    manager.checkAll(25); // Trip max drawdown
    manager.resetAll();
    expect(manager.getStatus().anyTripped).toBe(false);
  });

  it('should activate kill switch via emergencyStop', () => {
    const manager = new CircuitBreakerManager();
    manager.emergencyStop('Test emergency');
    expect(manager.getStatus().killSwitch.isTripped).toBe(true);
    expect(manager.getStatus().anyTripped).toBe(true);
  });

  it('should respect kill switch priority', () => {
    const manager = new CircuitBreakerManager();
    manager.emergencyStop('Test');
    const shouldHalt = manager.checkAll(0); // No drawdown
    expect(shouldHalt).toBe(true); // Kill switch still halts
  });

  it('should get volatility-adjusted risk percent', () => {
    const manager = new CircuitBreakerManager({ normalRiskPercent: 2 });
    const normalRisk = manager.getRiskPercent(1, 1);
    const highRisk = manager.getRiskPercent(3, 1);
    expect(highRisk).toBeLessThan(normalRisk);
  });

  it('should calculate volatility-adjusted position size', () => {
    const manager = new CircuitBreakerManager();
    const normalSize = manager.getPositionSize(10000, 100, 1, 1);
    const highVolSize = manager.getPositionSize(10000, 100, 3, 1);
    expect(highVolSize).toBeLessThan(normalSize);
  });
});
