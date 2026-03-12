/**
 * Tests for TradeHistoryExporter
 */

import { TradeHistoryExporter, ExportedTrade } from '../../src/core/trade-history-exporter';
import { TradeRecord } from '../../src/core/strategy-performance-tracker';

describe('TradeHistoryExporter', () => {
  let exporter: TradeHistoryExporter;
  let sampleTrades: TradeRecord[];

  beforeEach(() => {
    exporter = new TradeHistoryExporter();

    const now = Date.now();
    sampleTrades = [
      {
        id: 'trd_001',
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: now - 86400000,
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.45,
        exitPrice: 0.55,
        pnl: 9,
        fees: 1,
        status: 'CLOSED',
      },
      {
        id: 'trd_002',
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: now,
        market: 'KALXI-USD',
        side: 'SELL',
        size: 50,
        entryPrice: 0.60,
        fees: 0.5,
        status: 'OPEN',
      },
    ];
  });

  describe('export to CSV', () => {
    it('should export trades to CSV format', () => {
      const csv = exporter.export(sampleTrades, { format: 'csv' });

      const lines = csv.split('\n');
      expect(lines[0]).toContain('timestamp,strategyId,market,side,size');
      expect(lines.length).toBe(3); // Header + 2 trades
    });

    it('should include all required columns', () => {
      const csv = exporter.export(sampleTrades, { format: 'csv' });
      const headers = csv.split('\n')[0].split(',');

      expect(headers).toContain('timestamp');
      expect(headers).toContain('entryPrice');
      expect(headers).toContain('pnl');
      expect(headers).toContain('fees');
    });
  });

  describe('export to JSON', () => {
    it('should export trades to JSON format', () => {
      const json = exporter.export(sampleTrades, { format: 'json' });
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].strategyId).toBe('strat_001');
    });
  });

  describe('filtering', () => {
    it('should filter by strategy ID', () => {
      const csv = exporter.export(sampleTrades, {
        format: 'csv',
        strategyId: 'strat_001',
      });

      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // All trades belong to strat_001
    });

    it('should filter by date range', () => {
      const now = Date.now();
      const startDate = new Date(now - 50000); // After first trade
      const endDate = new Date(now + 50000); // After all trades

      const csv = exporter.export(sampleTrades, {
        format: 'csv',
        startDate,
        endDate,
      });

      const lines = csv.split('\n');
      expect(lines.length).toBe(2); // Only second trade
    });

    it('should filter closed trades only', () => {
      const json = exporter.export(sampleTrades, {
        format: 'json',
        includeClosedOnly: true,
      });

      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(1);
      expect(parsed[0].status).toBe('CLOSED');
    });
  });

  describe('generateSummary', () => {
    it('should generate correct summary statistics', () => {
      const summary = exporter.generateSummary(sampleTrades);

      expect(summary.totalTrades).toBe(2);
      expect(summary.closedTrades).toBe(1);
      expect(summary.openTrades).toBe(1);
      expect(summary.totalPnl).toBe(9);
      expect(summary.totalFees).toBe(1.5);
    });

    it('should calculate win rate correctly', () => {
      const trades: TradeRecord[] = [
        {
          id: 'trd_1',
          strategyId: 'strat_001',
          tenantId: 'tenant_001',
          timestamp: Date.now(),
          market: 'TEST',
          side: 'BUY',
          size: 100,
          entryPrice: 0.5,
          exitPrice: 0.6,
          pnl: 10,
          fees: 0.5,
          status: 'CLOSED',
        },
        {
          id: 'trd_2',
          strategyId: 'strat_001',
          tenantId: 'tenant_001',
          timestamp: Date.now(),
          market: 'TEST',
          side: 'BUY',
          size: 100,
          entryPrice: 0.5,
          exitPrice: 0.4,
          pnl: -10,
          fees: 0.5,
          status: 'CLOSED',
        },
        {
          id: 'trd_3',
          strategyId: 'strat_001',
          tenantId: 'tenant_001',
          timestamp: Date.now(),
          market: 'TEST',
          side: 'BUY',
          size: 100,
          entryPrice: 0.5,
          exitPrice: 0.7,
          pnl: 20,
          fees: 0.5,
          status: 'CLOSED',
        },
      ];

      const summary = exporter.generateSummary(trades);
      expect(summary.wins).toBe(2);
      expect(summary.losses).toBe(1);
      expect(summary.winRate).toBeCloseTo(66.67, 1);
    });

    it('should find largest win and loss', () => {
      const summary = exporter.generateSummary(sampleTrades);
      expect(summary.largestWin).toBe(9);
    });
  });

  describe('formatTrades', () => {
    it('should format trades with ISO timestamps', () => {
      const json = exporter.export(sampleTrades, { format: 'json' });
      const parsed: ExportedTrade[] = JSON.parse(json);

      expect(parsed[0].timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('should include holding period for closed trades', () => {
      const json = exporter.export(sampleTrades, { format: 'json' });
      const parsed: ExportedTrade[] = JSON.parse(json);

      const closedTrade = parsed.find(t => t.status === 'CLOSED');
      expect(closedTrade?.holdingPeriod).toBeDefined();
    });
  });
});
