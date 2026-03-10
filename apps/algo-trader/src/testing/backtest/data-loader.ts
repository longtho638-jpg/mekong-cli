/**
 * Data Loader for Historical Backtesting
 * Loads market data from CSV files or generates synthetic fallback data
 */

import * as fs from 'fs';
import * as path from 'path';
import { BacktestConfig } from './backtest-config-types';

export interface MarketDataEvent {
  timestamp: number;
  source: string;
  type: 'trade' | 'orderbook' | 'swap' | 'oracle' | 'sentiment';
  price: number;
  volume?: number;
  metadata?: Record<string, unknown>;
}

export class DataLoader {
  private config: BacktestConfig;

  constructor(config: BacktestConfig) {
    this.config = config;
  }

  async loadData(): Promise<MarketDataEvent[]> {
    const start = new Date(this.config.dateRange.start);
    const end = new Date(this.config.dateRange.end);
    return this.loadDateRange(start, end);
  }

  async loadDateRange(start: Date, end: Date): Promise<MarketDataEvent[]> {
    const events: MarketDataEvent[] = [];

    for (const [source, filePath] of Object.entries(this.config.dataPaths)) {
      const loaded = this.loadFromCsv(filePath, source);
      events.push(...loaded);
    }

    // Fallback to synthetic data if no files loaded
    if (events.length === 0) {
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const synthetic = this.generateSyntheticData(Math.max(days, 1), 288);
      // Shift synthetic timestamps to match requested date range
      const offset = start.getTime() - synthetic[0].timestamp;
      synthetic.forEach(e => { e.timestamp += offset; });
      events.push(...synthetic);
    }

    // Filter by date range and sort
    return events
      .filter(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private loadFromCsv(filePath: string, source: string): MarketDataEvent[] {
    const events: MarketDataEvent[] = [];
    const resolved = path.resolve(filePath);

    if (!fs.existsSync(resolved)) {
      return events;
    }

    try {
      const content = fs.readFileSync(resolved, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      // Skip header row
      const dataLines = lines[0].toLowerCase().includes('timestamp') ? lines.slice(1) : lines;

      for (const line of dataLines) {
        const parts = line.split(',');
        if (parts.length < 3) continue;
        const timestamp = parseInt(parts[0], 10);
        const price = parseFloat(parts[1]);
        const volume = parts[2] ? parseFloat(parts[2]) : undefined;
        if (isNaN(timestamp) || isNaN(price)) continue;

        events.push({
          timestamp,
          source,
          type: 'trade',
          price,
          volume,
        });
      }
    } catch {
      // File unreadable - return empty, caller will use synthetic
    }

    return events;
  }

  generateSyntheticData(days: number, ticksPerDay: number): MarketDataEvent[] {
    const events: MarketDataEvent[] = [];
    const sources = ['binance', 'bybit', 'ethereum'];
    const msPerTick = Math.floor((24 * 60 * 60 * 1000) / ticksPerDay);
    const startTs = Date.now() - days * 24 * 60 * 60 * 1000;

    // Seeded simple LCG for determinism
    let seed = 42;
    const rand = (): number => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    const totalTicks = days * ticksPerDay;
    let price = 50000; // Starting BTC price

    for (let i = 0; i < totalTicks; i++) {
      const timestamp = startTs + i * msPerTick;
      // Random walk
      const change = (rand() - 0.5) * 0.002 * price;
      price = Math.max(100, price + change);
      const source = sources[i % sources.length];
      const volume = 0.1 + rand() * 5;

      events.push({
        timestamp,
        source,
        type: 'trade',
        price: parseFloat(price.toFixed(2)),
        volume: parseFloat(volume.toFixed(4)),
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
}
