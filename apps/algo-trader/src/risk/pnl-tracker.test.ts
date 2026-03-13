/**
 * PnL Tracker Unit Tests
 *
 * Tests for PnL tracking: trade recording, rolling windows, strategy breakdown.
 */

import { PnLTracker, type TradeRecord, type Position } from './pnl-tracker';
import { RiskEventEmitter } from '../core/risk-events';

describe('PnLTracker', () => {
  let tracker: PnLTracker;
  let eventEmitter: RiskEventEmitter;

  beforeEach(() => {
    tracker = new PnLTracker();
    eventEmitter = RiskEventEmitter.getInstance();
    eventEmitter.reset();
  });

  afterEach(() => {
    tracker.reset();
  });

  describe('recordTrade', () => {
    it('should record a BUY trade and create position', () => {
      const trade: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      tracker.recordTrade(trade);

      const positions = tracker.getPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].tokenId).toBe('token-123');
      expect(positions[0].shares).toBe(100);
      expect(positions[0].avgPrice).toBe(0.60);
    });

    it('should average into existing position on second BUY', () => {
      const trade1: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      const trade2: TradeRecord = {
        tradeId: 'trade-2',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'BUY',
        price: 0.80,
        size: 100,
        timestamp: Date.now() + 1000,
      };

      tracker.recordTrade(trade1);
      tracker.recordTrade(trade2);

      const positions = tracker.getPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].shares).toBe(200);
      expect(positions[0].avgPrice).toBe(0.70); // (0.60 * 100 + 0.80 * 100) / 200
    });

    it('should record realized PnL on SELL', () => {
      const buyTrade: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      const sellTrade: TradeRecord = {
        tradeId: 'trade-2',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'SELL',
        price: 0.80,
        size: 100,
        timestamp: Date.now() + 1000,
      };

      tracker.recordTrade(buyTrade);
      tracker.recordTrade(sellTrade);

      const positions = tracker.getPositions();
      expect(positions.length).toBe(0); // Position closed

      const trades = tracker.getTrades();
      const sell = trades.find(t => t.tradeId === 'trade-2');
      expect(sell?.realizedPnl).toBeCloseTo(20, 5); // (0.80 - 0.60) * 100
    });

    it('should partially close position on partial SELL', () => {
      const buyTrade: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      const sellTrade: TradeRecord = {
        tradeId: 'trade-2',
        strategy: 'ListingArb',
        tokenId: 'token-123',
        side: 'YES',
        action: 'SELL',
        price: 0.80,
        size: 50,
        timestamp: Date.now() + 1000,
      };

      tracker.recordTrade(buyTrade);
      tracker.recordTrade(sellTrade);

      const positions = tracker.getPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].shares).toBe(50);
      expect(positions[0].realizedPnl).toBeCloseTo(10, 5); // (0.80 - 0.60) * 50
    });
  });

  describe('getTotalPnL', () => {
    it('should return total PnL across all strategies', () => {
      const trade1: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      const trade2: TradeRecord = {
        tradeId: 'trade-2',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'SELL',
        price: 0.80,
        size: 100,
        timestamp: Date.now() + 1000,
      };

      tracker.recordTrade(trade1);
      tracker.recordTrade(trade2);

      const totalPnl = tracker.getTotalPnL();
      expect(totalPnl).toBeCloseTo(20, 5);
    });
  });

  describe('getDailyPnL', () => {
    it('should return PnL for last 24 hours only', () => {
      const now = Date.now();
      const dayAgo = now - 25 * 60 * 60 * 1000; // 25 hours ago

      const oldTrade: TradeRecord = {
        tradeId: 'trade-old',
        strategy: 'ListingArb',
        tokenId: 'token-old',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: dayAgo,
        realizedPnl: -50,
      };

      const newTrade: TradeRecord = {
        tradeId: 'trade-new',
        strategy: 'ListingArb',
        tokenId: 'token-new',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: now,
        realizedPnl: 30,
      };

      tracker.recordTrade(oldTrade);
      tracker.recordTrade(newTrade);

      const dailyPnl = tracker.getDailyPnL();
      expect(dailyPnl).toBe(30); // Only new trade
    });
  });

  describe('getStrategyPnL', () => {
    it('should return PnL for specific strategy', () => {
      const trade1: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      const trade2: TradeRecord = {
        tradeId: 'trade-2',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'SELL',
        price: 0.80,
        size: 100,
        timestamp: Date.now() + 1000,
      };

      tracker.recordTrade(trade1);
      tracker.recordTrade(trade2);

      const pnl = tracker.getStrategyPnL('ListingArb');
      expect(pnl).toBeDefined();
      expect(pnl?.strategy).toBe('ListingArb');
      expect(pnl?.realizedPnl).toBeCloseTo(20, 5);
    });

    it('should return undefined for unknown strategy', () => {
      const pnl = tracker.getStrategyPnL('UnknownStrategy');
      expect(pnl).toBeUndefined();
    });
  });

  describe('getAllStrategyPnL', () => {
    it('should return PnL for all initialized strategies', () => {
      const pnls = tracker.getAllStrategyPnL();
      expect(pnls.length).toBe(3);
      expect(pnls.map(s => s.strategy)).toEqual(
        expect.arrayContaining(['ListingArb', 'CrossPlatformArb', 'MarketMaker']),
      );
    });
  });

  describe('getRollingPnL', () => {
    it('should return rolling window PnL', () => {
      const now = Date.now();

      // Trade 1 hour ago
      const trade1h: TradeRecord = {
        tradeId: 'trade-1h',
        strategy: 'ListingArb',
        tokenId: 'token-1h',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: now - 30 * 60 * 1000, // 30 min ago
        realizedPnl: 10,
      };

      // Trade 2 hours ago
      const trade2h: TradeRecord = {
        tradeId: 'trade-2h',
        strategy: 'ListingArb',
        tokenId: 'token-2h',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
        realizedPnl: -5,
      };

      tracker.recordTrade(trade1h);
      tracker.recordTrade(trade2h);

      const rolling = tracker.getRollingPnL();
      expect(rolling.pnl1h).toBe(10); // Only trade1h
      expect(rolling.pnl24h).toBe(5); // Both trades
      expect(rolling.pnl7d).toBe(5); // Both trades
    });
  });

  describe('updatePrices', () => {
    it('should update unrealized PnL when price changes', () => {
      const trade: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      tracker.recordTrade(trade);
      tracker.updatePrices('token-1', 0.80);

      const positions = tracker.getPositions();
      expect(positions[0].currentPrice).toBe(0.80);
      expect(positions[0].unrealizedPnl).toBeCloseTo(20, 5); // (0.80 - 0.60) * 100
    });
  });

  describe('event emission', () => {
    it('should emit pnl:alert event on trade record', async () => {
      const events: any[] = [];
      eventEmitter.on('pnl:alert', (event) => events.push(event));

      const trade: TradeRecord = {
        tradeId: 'trade-1',
        strategy: 'ListingArb',
        tokenId: 'token-1',
        side: 'YES',
        action: 'BUY',
        price: 0.60,
        size: 100,
        timestamp: Date.now(),
      };

      tracker.recordTrade(trade);

      // Wait for async event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('pnl:alert');
    });
  });
});
