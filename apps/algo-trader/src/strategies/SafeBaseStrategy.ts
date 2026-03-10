/**
 * BaseStrategy Safety Layer — Error boundaries and signal validation.
 *
 * Enhancements:
 * - Error boundary around onCandle
 * - Signal validation (null checks, type checks)
 * - Max signal frequency limiter
 * - Trade audit logging
 */

import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';

export interface SignalValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface SignalFrequencyTracker {
  lastSignalAt?: number;
  signalsInWindow: number[];
}

export abstract class SafeBaseStrategy implements IStrategy {
  abstract name: string;
  protected candles: ICandle[] = [];
  protected maxHistoryBuffer: number = 200;
  protected config: Record<string, unknown> = {};

  // Safety features
  private signalTracker: SignalFrequencyTracker = { signalsInWindow: [] };
  private maxSignalsPerWindow: number = 1;
  private signalWindowMs: number = 60000; // 1 minute default
  private errorCount: number = 0;
  private maxErrorsBeforeHalt: number = 5;

  async init(history: ICandle[], config?: Record<string, unknown>): Promise<void> {
    this.candles = [...history];
    this.config = config ?? {};
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles = this.candles.slice(-this.maxHistoryBuffer);
    }
    this.signalTracker = { signalsInWindow: [] };
    this.errorCount = 0;
    await this.onSafeStart();
  }

  async updateConfig(config: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Record<string, unknown> {
    return this.config;
  }

  getConfigSchema(): Record<string, unknown> {
    return {};
  }

  protected bufferCandle(candle: ICandle): void {
    this.candles.push(candle);
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles.shift();
    }
  }

  protected getCloses(): number[] {
    return this.candles.map(c => c.close);
  }

  /**
   * Safe wrapper around onCandle with error boundary
   */
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    try {
      this.bufferCandle(candle);

      // Check error count
      if (this.errorCount >= this.maxErrorsBeforeHalt) {
        logger.error(`[SafeBaseStrategy] ${this.name}: Halting due to ${this.errorCount} errors`);
        return null;
      }

      // Call subclass implementation
      const signal = await this.onSafeCandle(candle);

      // Validate signal
      if (signal) {
        const validation = this.validateSignal(signal);
        if (!validation.isValid) {
          logger.warn(`[SafeBaseStrategy] ${this.name}: Invalid signal - ${validation.reason}`);
          this.errorCount++;
          return null;
        }

        // Check frequency limit
        if (!this.isSignalAllowed(candle.timestamp)) {
          logger.debug(`[SafeBaseStrategy] ${this.name}: Signal blocked (frequency limit)`);
          return null;
        }

        // Track signal
        this.trackSignal(candle.timestamp);
        this.errorCount = 0; // Reset on success
      }

      return signal;
    } catch (error) {
      this.errorCount++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[SafeBaseStrategy] ${this.name}: Error in onCandle - ${errorMsg}`);
      return null; // Graceful degradation
    }
  }

  /**
   * Subclass should override this instead of onCandle
   */
  abstract onSafeCandle(candle: ICandle): Promise<ISignal | null>;

  /**
   * Validate signal structure and values
   */
  protected validateSignal(signal: ISignal): SignalValidationResult {
    if (!signal) {
      return { isValid: false, reason: 'Signal is null' };
    }

    if (!signal.type || !['BUY', 'SELL', 'NONE', 'buy', 'sell', 'hold'].includes(String(signal.type))) {
      return { isValid: false, reason: `Invalid signal type: ${signal.type}` };
    }

    // Price must be positive number
    if (typeof signal.price !== 'number' || signal.price <= 0) {
      return { isValid: false, reason: 'Price must be a positive number' };
    }

    // Timestamp must be positive number
    if (typeof signal.timestamp !== 'number' || signal.timestamp <= 0) {
      return { isValid: false, reason: 'Timestamp must be a positive number' };
    }

    return { isValid: true };
  }

  /**
   * Check if signal frequency is within limits
   */
  protected isSignalAllowed(timestamp: number): boolean {
    const windowStart = timestamp - this.signalWindowMs;
    const recentSignals = this.signalTracker.signalsInWindow.filter(t => t > windowStart);

    if (recentSignals.length >= this.maxSignalsPerWindow) {
      return false;
    }

    return true;
  }

  /**
   * Track signal for frequency limiting
   */
  protected trackSignal(timestamp: number): void {
    this.signalTracker.signalsInWindow.push(timestamp);
    // Keep only last 100 signals for memory efficiency
    if (this.signalTracker.signalsInWindow.length > 100) {
      this.signalTracker.signalsInWindow = this.signalTracker.signalsInWindow.slice(-100);
    }
  }

  /**
   * Configure signal frequency limits
   */
  protected setSignalFrequencyLimit(maxSignals: number, windowMs: number): void {
    this.maxSignalsPerWindow = maxSignals;
    this.signalWindowMs = windowMs;
  }

  /**
   * Get current error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Reset error count (call after successful recovery)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Get signal frequency stats
   */
  getSignalStats(windowMs: number): { count: number; lastSignalAt?: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    const recentSignals = this.signalTracker.signalsInWindow.filter(t => t > windowStart);
    return {
      count: recentSignals.length,
      lastSignalAt: this.signalTracker.signalsInWindow[this.signalTracker.signalsInWindow.length - 1],
    };
  }

  async onStart(): Promise<void> {
    await this.onSafeStart();
  }

  /**
   * Safe version of onStart - override this instead
   */
  async onSafeStart(): Promise<void> {
    // Default no-op, subclasses can override
  }

  async onTick(tick: { price: number; timestamp: number }): Promise<ISignal | null> {
    return null;
  }

  async onSignal(signal: ISignal): Promise<ISignal | null> {
    return signal;
  }

  async onFinish(): Promise<void> {
    await this.onSafeFinish();
  }

  /**
   * Safe version of onFinish - override this instead
   */
  async onSafeFinish(): Promise<void> {
    // Default no-op, subclasses can override
  }
}

/**
 * Factory function to wrap existing strategies with safety layer
 */
export function withSafety<T extends IStrategy>(strategy: T): T & SafeBaseStrategy {
  const safeStrategy = strategy as T & SafeBaseStrategy;

  // Wrap onCandle with error boundary
  const originalOnCandle = strategy.onCandle.bind(strategy);
  safeStrategy.onCandle = async (candle: ICandle) => {
    try {
      return await originalOnCandle(candle);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[withSafety] ${strategy.name}: Error - ${errorMsg}`);
      return null;
    }
  };

  return safeStrategy;
}
