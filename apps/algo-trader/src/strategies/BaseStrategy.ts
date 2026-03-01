import { IStrategy, ISignal } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';

export abstract class BaseStrategy implements IStrategy {
  abstract name: string;
  protected candles: ICandle[] = [];
  protected maxHistoryBuffer: number = 200; // Default buffer size

  protected config: Record<string, unknown> = {};

  /**
   * Initialize the strategy with historical data and optional initial config.
   * @param history Array of historical candles
   * @param config Optional initial configuration (dynamic JSON)
   */
  async init(history: ICandle[], config?: Record<string, unknown>): Promise<void> {
    this.candles = [...history];
    this.config = config ?? {};
    // Trim history to max buffer if it exceeds
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles = this.candles.slice(-this.maxHistoryBuffer);
    }
  }

  /**
   * Update configuration at runtime without restart.
   */
  async updateConfig(config: Record<string, unknown>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration.
   */
  getConfig(): Record<string, unknown> {
    return this.config;
  }

  /**
   * Strategy configuration schema (JSON Schema compatible).
   * Subclasses should override this to provide validation and UI hints.
   */
  getConfigSchema(): Record<string, unknown> {
    return {};
  }

  /**
   * Buffer the new candle and ensure we don't exceed the memory limit
   * @param candle The new candle
   */
  protected bufferCandle(candle: ICandle): void {
    this.candles.push(candle);
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles.shift();
    }
  }

  /**
   * Extract closing prices from the current buffered candles
   * @returns Array of closing prices
   */
  protected getCloses(): number[] {
    return this.candles.map(c => c.close);
  }

  /**
   * Process a new candle. Must be implemented by subclasses.
   * Usually begins with `this.bufferCandle(candle);`
   * @param candle The new candle
   */
  abstract onCandle(candle: ICandle): Promise<ISignal | null>;

  /**
   * Lifecycle method: called when the strategy is starting.
   */
  async onStart(): Promise<void> {}

  /**
   * Granular tick update (optional).
   */
  async onTick(tick: { price: number; timestamp: number }): Promise<ISignal | null> {
    return null;
  }

  /**
   * Called when a strategy produces a signal (pre-execution check/enrichment).
   */
  async onSignal(signal: ISignal): Promise<ISignal | null> {
    return signal;
  }

  /**
   * Lifecycle method: called when the strategy is finishing/stopping.
   */
  async onFinish(): Promise<void> {}
}
