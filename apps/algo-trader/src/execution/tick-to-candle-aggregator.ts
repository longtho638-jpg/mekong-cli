/**
 * Tick-to-Candle Aggregator — Converts real-time WebSocket price ticks
 * into OHLCV candles at configurable time intervals.
 * Each symbol gets its own candle builder.
 */

import { EventEmitter } from 'events';
import { ICandle } from '../interfaces/ICandle';
import { PriceTick } from './websocket-multi-exchange-price-feed-manager';

interface CandleBuilder {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;
  tickCount: number;
}

export class TickToCandleAggregator extends EventEmitter {
  private builders = new Map<string, CandleBuilder>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 60_000) {
    super();
    this.intervalMs = intervalMs;
  }

  /** Feed a price tick into the aggregator */
  addTick(tick: PriceTick): void {
    const key = `${tick.exchange}:${tick.symbol}`;
    const midPrice = (tick.bid + tick.ask) / 2;
    const existing = this.builders.get(key);

    if (!existing) {
      this.builders.set(key, {
        symbol: tick.symbol,
        open: midPrice,
        high: midPrice,
        low: midPrice,
        close: midPrice,
        volume: 0,
        openTime: tick.timestamp,
        tickCount: 1,
      });
      return;
    }

    existing.high = Math.max(existing.high, midPrice);
    existing.low = Math.min(existing.low, midPrice);
    existing.close = midPrice;
    existing.tickCount++;
  }

  /** Start periodic candle emission */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.intervalMs);
    this.timer.unref();
  }

  /** Stop periodic emission */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Flush all builders → emit candles → reset */
  flush(): void {
    const now = Date.now();
    for (const [key, builder] of this.builders) {
      if (builder.tickCount === 0) continue;

      const candle: ICandle = {
        timestamp: now,
        open: builder.open,
        high: builder.high,
        low: builder.low,
        close: builder.close,
        volume: builder.volume,
        metadata: { symbol: builder.symbol, tickCount: builder.tickCount },
      };

      this.emit('candle', candle, key);

      // Reset builder for next interval
      builder.open = builder.close;
      builder.high = builder.close;
      builder.low = builder.close;
      builder.volume = 0;
      builder.openTime = now;
      builder.tickCount = 0;
    }
  }

  /** Get current partial candle for a key */
  getPartial(key: string): CandleBuilder | undefined {
    return this.builders.get(key);
  }

  /** Number of active symbol channels */
  get size(): number {
    return this.builders.size;
  }
}
