import { describe, test, expect, beforeEach } from '@jest/globals';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should halt after max consecutive losses', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 3 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(true);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(false);
    expect(cb.getState().isHalted).toBe(true);
  });

  test('should reset consecutive losses on win', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 3 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    cb.recordTrade(200);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(true);
  });

  test('should resume after cooldown', () => {
    const cb = new CircuitBreaker({ maxLossesInRow: 2, cooldownMs: 60000 });
    cb.recordTrade(-100);
    cb.recordTrade(-100);
    expect(cb.canTrade()).toBe(false);
    jest.advanceTimersByTime(60000);
    expect(cb.canTrade()).toBe(true);
  });

  test('should halt on max error count', () => {
    const cb = new CircuitBreaker();
    for (let i = 0; i < 5; i++) cb.recordError('error');
    expect(cb.canTrade()).toBe(false);
  });

  test('should track win rate', () => {
    const cb = new CircuitBreaker();
    const state = cb.getState();
    expect(state.totalTrades).toBe(0);
    expect(state.consecutiveLosses).toBe(0);
  });
});
