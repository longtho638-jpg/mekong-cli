/**
 * Tests for StrategyPerformanceTracker
 */

import { StrategyPerformanceTracker } from '../../src/core/strategy-performance-tracker';

describe('StrategyPerformanceTracker', () => {
  let tracker: StrategyPerformanceTracker;

  beforeEach(() => {
    tracker = StrategyPerformanceTracker.getInstance();
    tracker.reset();
  });

  describe('recordTrade', () => {
    it('should record a new trade with OPEN status', async () => {
      const trade = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.45,
        fees: 0.5,
      });

      expect(trade.id).toMatch(/trd_\d+_[a-z0-9]+/);
      expect(trade.status).toBe('OPEN');
      expect(trade.entryPrice).toBe(0.45);
    });
  });

  describe('closeTrade', () => {
    it('should close a trade and calculate P&L', async () => {
      const trade = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.45,
        fees: 0.5,
      });

      const closedTrade = await tracker.closeTrade(trade.id, 0.55, 0.5);

      expect(closedTrade).not.toBeNull();
      expect(closedTrade!.status).toBe('CLOSED');
      expect(closedTrade!.exitPrice).toBe(0.55);
      // P&L = (0.55 - 0.45) * 100 - 0.5 - 0.5 = 10 - 1 = 9
      expect(closedTrade!.pnl).toBeCloseTo(9, 1);
    });

    it('should return null for non-existent trade', async () => {
      const result = await tracker.closeTrade('nonexistent', 0.50);
      expect(result).toBeNull();
    });
  });

  describe('getStrategyStats', () => {
    it('should return default stats for unknown strategy', () => {
      const stats = tracker.getStrategyStats('unknown');
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toBe(0);
    });

    it('should calculate win rate and profit factor', async () => {
      // Record and close 3 trades: 2 wins, 1 loss
      const trade1 = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.40,
        fees: 0.5,
      });
      await tracker.closeTrade(trade1.id, 0.50, 0.5);

      const trade2 = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.40,
        fees: 0.5,
      });
      await tracker.closeTrade(trade2.id, 0.30, 0.5);

      const trade3 = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.40,
        fees: 0.5,
      });
      await tracker.closeTrade(trade3.id, 0.55, 0.5);

      const stats = tracker.getStrategyStats('strat_001');

      expect(stats.totalTrades).toBe(3);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('getTrades', () => {
    it('should filter by strategy', async () => {
      await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.45,
        fees: 0.5,
      });

      await tracker.recordTrade({
        strategyId: 'strat_002',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'SELL',
        size: 50,
        entryPrice: 0.60,
        fees: 0.25,
      });

      const strat1Trades = tracker.getTrades('strat_001');
      expect(strat1Trades.length).toBe(1);
      expect(strat1Trades[0].strategyId).toBe('strat_001');
    });

    it('should filter by status', async () => {
      const trade1 = await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 100,
        entryPrice: 0.45,
        fees: 0.5,
      });

      await tracker.recordTrade({
        strategyId: 'strat_001',
        tenantId: 'tenant_001',
        timestamp: Date.now(),
        market: 'POLY-USDC',
        side: 'BUY',
        size: 50,
        entryPrice: 0.30,
        fees: 0.25,
      });

      await tracker.closeTrade(trade1.id, 0.55, 0.5);

      const openTrades = tracker.getTrades('strat_001', 'OPEN');
      const closedTrades = tracker.getTrades('strat_001', 'CLOSED');

      expect(openTrades.length).toBe(1);
      expect(closedTrades.length).toBe(1);
    });
  });
});
