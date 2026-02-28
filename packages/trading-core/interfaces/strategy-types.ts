/**
 * Strategy interface and signal types for trading systems.
 * Any strategy (momentum, arbitrage, ML) implements IStrategy.
 */

import { ICandle } from './candle-types';

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  NONE = 'NONE'
}

export interface ISignal {
  type: SignalType;
  price: number;
  timestamp: number;
  tag?: string;
  metadata?: Record<string, unknown>;
}

export interface IStrategy {
  name: string;
  /** Process new candle, return signal if generated */
  onCandle(candle: ICandle): Promise<ISignal | null>;
  /** Initialize with historical data */
  init(history: ICandle[]): Promise<void>;
}
