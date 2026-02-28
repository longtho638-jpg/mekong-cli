/**
 * Base Strategy — Abstract strategy class with candle buffering.
 * All trading strategies inherit this for shared history management.
 */

import { IStrategy, ISignal } from '../interfaces/strategy-types';
import { ICandle } from '../interfaces/candle-types';

export abstract class BaseStrategy implements IStrategy {
  abstract name: string;
  protected candles: ICandle[] = [];
  protected maxHistoryBuffer: number = 200;

  /** Initialize with historical data */
  async init(history: ICandle[]): Promise<void> {
    this.candles = [...history];
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles = this.candles.slice(-this.maxHistoryBuffer);
    }
  }

  /** Buffer new candle, trim to max */
  protected bufferCandle(candle: ICandle): void {
    this.candles.push(candle);
    if (this.candles.length > this.maxHistoryBuffer) {
      this.candles.shift();
    }
  }

  /** Extract closing prices from buffered candles */
  protected getCloses(): number[] {
    return this.candles.map(c => c.close);
  }

  /** Process new candle — implemented by subclasses */
  abstract onCandle(candle: ICandle): Promise<ISignal | null>;
}
