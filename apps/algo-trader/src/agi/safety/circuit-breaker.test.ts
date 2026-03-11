import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    jest.useFakeTimers();
    circuitBreaker = new CircuitBreaker({
      maxFailures: 3,
      timeoutMs: 60000,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(circuitBreaker).toBeDefined();
    });
  });

  describe('recordFailure()', () => {
    it('should increment failure count', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const state = circuitBreaker.getState();
      expect(state.failures).toBe(2);
    });

    it('should open circuit after threshold', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.isCircuitOpen()).toBe(true);
    });

    it('should reset failure count on success', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess();

      const state = circuitBreaker.getState();
      expect(state.failures).toBe(0);
    });
  });

  describe('recordSuccess()', () => {
    it('should reset failures and close circuit', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.isCircuitOpen()).toBe(true);

      circuitBreaker.recordSuccess();

      expect(circuitBreaker.isCircuitOpen()).toBe(false);
      const state = circuitBreaker.getState();
      expect(state.failures).toBe(0);
    });
  });

  describe('isCircuitOpen()', () => {
    it('should return false initially', () => {
      expect(circuitBreaker.isCircuitOpen()).toBe(false);
    });

    it('should return true after threshold failures', () => {
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
      expect(circuitBreaker.isCircuitOpen()).toBe(true);
    });

    it('should return false after reset timeout', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.isCircuitOpen()).toBe(true);

      jest.advanceTimersByTime(61000);

      expect(circuitBreaker.isCircuitOpen()).toBe(false);
    });
  });

  describe('canProceed()', () => {
    it('should return true when circuit closed', () => {
      expect(circuitBreaker.canProceed()).toBe(true);
    });

    it('should return false when circuit open', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      expect(circuitBreaker.canProceed()).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset all state', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      circuitBreaker.reset();

      const state = circuitBreaker.getState();
      expect(state.failures).toBe(0);
      expect(state.isOpen).toBe(false);
    });
  });

  describe('maxFailures threshold', () => {
    it('should respect custom maxFailures', () => {
      const customBreaker = new CircuitBreaker({
        maxFailures: 5,
        timeoutMs: 60000,
      });

      for (let i = 0; i < 4; i++) {
        customBreaker.recordFailure();
      }
      expect(customBreaker.isCircuitOpen()).toBe(false);

      customBreaker.recordFailure();
      expect(customBreaker.isCircuitOpen()).toBe(true);
    });
  });

  describe('timeout', () => {
    it('should respect custom timeout', () => {
      const customBreaker = new CircuitBreaker({
        maxFailures: 3,
        timeoutMs: 30000,
      });

      customBreaker.recordFailure();
      customBreaker.recordFailure();
      customBreaker.recordFailure();

      expect(customBreaker.isCircuitOpen()).toBe(true);

      jest.advanceTimersByTime(29000);
      expect(customBreaker.isCircuitOpen()).toBe(true);

      jest.advanceTimersByTime(2000);
      expect(customBreaker.isCircuitOpen()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid failures', () => {
      for (let i = 0; i < 10; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.isCircuitOpen()).toBe(true);
    });

    it('should handle alternating success/failure', () => {
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          circuitBreaker.recordSuccess();
        } else {
          circuitBreaker.recordFailure();
        }
      }

      expect(circuitBreaker.isCircuitOpen()).toBe(false);
    });
  });
});
