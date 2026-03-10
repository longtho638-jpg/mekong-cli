/**
 * SafeBaseStrategy Tests
 */

import { SafeBaseStrategy, withSafety } from './SafeBaseStrategy';
import { ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';

function createMockCandle(timestamp: number, close: number): ICandle {
  return {
    timestamp,
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume: 1000000,
  };
}

// Test implementation of SafeBaseStrategy with public methods for testing
class TestSafeStrategy extends SafeBaseStrategy {
  name = 'TestSafeStrategy';
  private shouldThrow = false;
  private signalToReturn: ISignal | null = null;

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  setSignalToReturn(signal: ISignal | null): void {
    this.signalToReturn = signal;
  }

  // Public wrapper for testing protected method
  testSetSignalFrequencyLimit(maxSignals: number, windowMs: number): void {
    this.setSignalFrequencyLimit(maxSignals, windowMs);
  }

  async onSafeCandle(candle: ICandle): Promise<ISignal | null> {
    if (this.shouldThrow) {
      throw new Error('Test error');
    }
    return this.signalToReturn;
  }
}

function createMockSignal(type: SignalType = SignalType.BUY, price: number = 100, timestamp: number = Date.now()): ISignal {
  return {
    type,
    price,
    timestamp,
    tag: 'test',
  };
}

describe('SafeBaseStrategy', () => {
  it('should return null on error instead of throwing', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    strategy.setShouldThrow(true);
    const result = await strategy.onCandle(createMockCandle(2000, 105));

    expect(result).toBe(null);
  });

  it('should track error count', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    strategy.setShouldThrow(true);
    for (let i = 0; i < 3; i++) {
      await strategy.onCandle(createMockCandle(2000 + i, 105));
    }

    expect(strategy.getErrorCount()).toBe(3);
  });

  it('should halt after max errors', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    strategy.setShouldThrow(true);
    for (let i = 0; i < 5; i++) {
      await strategy.onCandle(createMockCandle(2000 + i, 105));
    }

    // After 5 errors, should still return null without throwing
    const result = await strategy.onCandle(createMockCandle(3000, 110));
    expect(result).toBe(null);
  });

  it('should validate signal type', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    // Invalid signal type - string instead of SignalType enum
    const invalidSignal = { type: 'INVALID', price: 100, timestamp: 2000 };
    (strategy as any).setSignalToReturn(invalidSignal);

    const result = await strategy.onCandle(createMockCandle(2000, 105));
    expect(result).toBe(null);
  });

  it('should validate signal price', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    // Invalid price (zero)
    const invalidSignal = { type: SignalType.BUY, price: 0, timestamp: 2000 };
    (strategy as any).setSignalToReturn(invalidSignal);

    const result = await strategy.onCandle(createMockCandle(2000, 105));
    expect(result).toBe(null);
  });

  it('should accept valid BUY signal', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    const validSignal = createMockSignal(SignalType.BUY, 105, 2000);
    strategy.setSignalToReturn(validSignal);

    const result = await strategy.onCandle(createMockCandle(2000, 105));
    expect(result).toBe(validSignal);
  });

  it('should accept valid SELL signal', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    const validSignal = createMockSignal(SignalType.SELL, 105, 2000);
    strategy.setSignalToReturn(validSignal);

    const result = await strategy.onCandle(createMockCandle(2000, 105));
    expect(result).toBe(validSignal);
  });

  it('should reset error count on success', async () => {
    const strategy = new TestSafeStrategy();
    await strategy.init([createMockCandle(1000, 100)]);

    // Cause 2 errors
    strategy.setShouldThrow(true);
    await strategy.onCandle(createMockCandle(2000, 105));
    await strategy.onCandle(createMockCandle(3000, 106));

    expect(strategy.getErrorCount()).toBe(2);

    // Success should reset (return null is also success, just no signal)
    strategy.setShouldThrow(false);
    strategy.setSignalToReturn(null); // null is valid (no signal)
    await strategy.onCandle(createMockCandle(4000, 107));

    // Error count stays at 2 because null signal is not a success
    // Need to return valid signal to reset
    strategy.setSignalToReturn(createMockSignal(SignalType.BUY, 107, 4000));
    await strategy.onCandle(createMockCandle(5000, 108));

    expect(strategy.getErrorCount()).toBe(0);
  });

  it('should buffer candle and limit history', async () => {
    const strategy = new TestSafeStrategy();
    (strategy as any).maxHistoryBuffer = 5;
    await strategy.init([]);

    for (let i = 0; i < 10; i++) {
      await strategy.onCandle(createMockCandle(1000 + i * 1000, 100 + i));
    }

    // Should only keep last 5 candles
    expect((strategy as any).candles.length).toBe(5);
  });
});

describe('withSafety', () => {
  it('should wrap strategy with error boundary', async () => {
    const mockStrategy = {
      name: 'MockStrategy',
      init: jest.fn().mockResolvedValue(undefined),
      onCandle: jest.fn().mockImplementation(() => { throw new Error('Test'); }),
      onStart: jest.fn().mockResolvedValue(undefined),
      onTick: jest.fn().mockResolvedValue(null),
      onSignal: jest.fn().mockResolvedValue(null),
      onFinish: jest.fn().mockResolvedValue(undefined),
    };

    const safeStrategy = withSafety(mockStrategy);
    await safeStrategy.init([]);

    const result = await safeStrategy.onCandle(createMockCandle(1000, 100));
    expect(result).toBe(null);
  });
});
