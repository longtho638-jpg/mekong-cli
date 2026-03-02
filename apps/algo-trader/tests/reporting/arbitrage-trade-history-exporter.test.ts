/**
 * Tests for exportArbHistory — CSV and JSON export, filtering, empty input.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exportArbHistory } from '../../src/reporting/arbitrage-trade-history-exporter';
import { PaperTrade } from '../../src/core/paper-trading-engine';

function makeTrade(overrides: Partial<PaperTrade> = {}): PaperTrade {
  return {
    id: '1',
    pair: 'BTC/USDT',
    side: 'buy',
    amount: 0.1,
    price: 50000,
    fee: 5,
    timestamp: Date.now(),
    ...overrides,
  };
}

function tmpPath(name: string): string {
  return path.join(os.tmpdir(), `arb-export-test-${Date.now()}-${name}`);
}

describe('exportArbHistory', () => {
  describe('JSON export', () => {
    it('writes a valid JSON array', async () => {
      const trades = [makeTrade({ id: '1' }), makeTrade({ id: '2', side: 'sell' })];
      const outPath = tmpPath('trades');
      const result = await exportArbHistory(trades, { format: 'json', outputPath: outPath });

      expect(result.count).toBe(2);
      expect(result.path).toBe(`${outPath}.json`);
      const content = JSON.parse(fs.readFileSync(result.path, 'utf8'));
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2);
      expect(content[0].id).toBe('1');
    });

    it('appends .json extension if missing', async () => {
      const outPath = tmpPath('no-ext');
      const result = await exportArbHistory([makeTrade()], { format: 'json', outputPath: outPath });
      expect(result.path.endsWith('.json')).toBe(true);
    });

    it('does not re-append extension when already present', async () => {
      const outPath = tmpPath('with-ext') + '.json';
      const result = await exportArbHistory([makeTrade()], { format: 'json', outputPath: outPath });
      expect(result.path).toBe(outPath);
      expect(result.path.endsWith('.json.json')).toBe(false);
    });

    it('exports empty array for empty input', async () => {
      const outPath = tmpPath('empty');
      const result = await exportArbHistory([], { format: 'json', outputPath: outPath });
      expect(result.count).toBe(0);
      const content = JSON.parse(fs.readFileSync(result.path, 'utf8'));
      expect(content).toHaveLength(0);
    });
  });

  describe('CSV export', () => {
    it('writes header row + data rows', async () => {
      const trades = [makeTrade({ id: '42', pair: 'ETH/USDT', side: 'sell', amount: 1, price: 3000, fee: 3 })];
      const outPath = tmpPath('csv-trades');
      const result = await exportArbHistory(trades, { format: 'csv', outputPath: outPath });

      expect(result.count).toBe(1);
      expect(result.path.endsWith('.csv')).toBe(true);

      const lines = fs.readFileSync(result.path, 'utf8').split('\n');
      expect(lines[0]).toBe('id,timestamp,pair,side,amount,price,fee');
      expect(lines[1]).toContain('42');
      expect(lines[1]).toContain('ETH/USDT');
      expect(lines[1]).toContain('sell');
    });

    it('writes only header for empty input', async () => {
      const outPath = tmpPath('csv-empty');
      const result = await exportArbHistory([], { format: 'csv', outputPath: outPath });
      expect(result.count).toBe(0);
      const lines = fs.readFileSync(result.path, 'utf8').split('\n');
      expect(lines[0]).toBe('id,timestamp,pair,side,amount,price,fee');
      expect(lines).toHaveLength(1);
    });

    it('appends .csv extension if missing', async () => {
      const outPath = tmpPath('no-csv-ext');
      const result = await exportArbHistory([makeTrade()], { format: 'csv', outputPath: outPath });
      expect(result.path.endsWith('.csv')).toBe(true);
    });
  });

  describe('filtering', () => {
    it('filters by symbol', async () => {
      const trades = [
        makeTrade({ id: '1', pair: 'BTC/USDT' }),
        makeTrade({ id: '2', pair: 'ETH/USDT' }),
        makeTrade({ id: '3', pair: 'BTC/USDT' }),
      ];
      const outPath = tmpPath('filter-symbol');
      const result = await exportArbHistory(trades, {
        format: 'json',
        outputPath: outPath,
        filterSymbol: 'BTC/USDT',
      });
      expect(result.count).toBe(2);
      const content = JSON.parse(fs.readFileSync(result.path, 'utf8'));
      expect(content.every((t: PaperTrade) => t.pair === 'BTC/USDT')).toBe(true);
    });

    it('filters by startDate', async () => {
      const now = Date.now();
      const trades = [
        makeTrade({ id: '1', timestamp: now - 10000 }),
        makeTrade({ id: '2', timestamp: now - 5000 }),
        makeTrade({ id: '3', timestamp: now }),
      ];
      const outPath = tmpPath('filter-start');
      const result = await exportArbHistory(trades, {
        format: 'json',
        outputPath: outPath,
        startDate: now - 6000,
      });
      expect(result.count).toBe(2);
    });

    it('filters by endDate', async () => {
      const now = Date.now();
      const trades = [
        makeTrade({ id: '1', timestamp: now - 10000 }),
        makeTrade({ id: '2', timestamp: now }),
      ];
      const outPath = tmpPath('filter-end');
      const result = await exportArbHistory(trades, {
        format: 'json',
        outputPath: outPath,
        endDate: now - 5000,
      });
      expect(result.count).toBe(1);
    });

    it('returns 0 when no trades match filter', async () => {
      const trades = [makeTrade({ pair: 'BTC/USDT' })];
      const outPath = tmpPath('filter-no-match');
      const result = await exportArbHistory(trades, {
        format: 'json',
        outputPath: outPath,
        filterSymbol: 'SOL/USDT',
      });
      expect(result.count).toBe(0);
    });
  });
});
