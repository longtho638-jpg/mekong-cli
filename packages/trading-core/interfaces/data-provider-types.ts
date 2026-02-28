/**
 * Data provider interface — candle feed abstraction.
 * Implement for live WebSocket, REST polling, or mock/backtest data.
 */

import { ICandle } from './candle-types';

export interface IDataProvider {
  init(): Promise<void>;
  subscribe(callback: (candle: ICandle) => void): void;
  getHistory(limit: number): Promise<ICandle[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
