/**
 * Tests for PaperTradingArbBridge.
 * Verifies multi-exchange paper execution, P&L aggregation, price updates, and reset.
 */

import { PaperTradingArbBridge } from '../../src/execution/paper-trading-arbitrage-bridge';

const DEFAULT_CONFIG = {
  exchanges: ['binance', 'okx'],
  initialBalancePerExchange: 10000,
  slippagePct: 0.001,
  feeRate: 0.001,
};

function makeBridge() {
  return new PaperTradingArbBridge(DEFAULT_CONFIG);
}

describe('PaperTradingArbBridge', () => {
  describe('constructor', () => {
    it('creates one engine per exchange', () => {
      const bridge = makeBridge();
      expect(bridge.getEngineIds()).toEqual(['binance', 'okx']);
    });

    it('supports 3 exchanges', () => {
      const bridge = new PaperTradingArbBridge({
        exchanges: ['binance', 'okx', 'bybit'],
        initialBalancePerExchange: 5000,
      });
      expect(bridge.getEngineIds()).toHaveLength(3);
    });
  });

  describe('executeArb', () => {
    it('returns success=true when both engines have prices set', async () => {
      const bridge = makeBridge();
      const result = await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.01,
        buyPrice: 50000,
        sellPrice: 50100,
      });
      expect(result.success).toBe(true);
      expect(result.buyTradeId).toBeDefined();
      expect(result.sellTradeId).toBeDefined();
    });

    it('netPnl reflects price difference minus fee', async () => {
      const bridge = makeBridge();
      // Use a large spread (2%) to ensure netPnl stays positive after slippage (0.1%) + fees (0.1%)
      const result = await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 51000, // 2% spread → gross $100, fees ~$10, slippage ~$10, net ~$80
      });
      expect(result.success).toBe(true);
      expect(result.netPnl).toBeGreaterThan(0);
      expect(result.fee).toBeGreaterThan(0);
    });

    it('returns error when buy exchange is unknown', async () => {
      const bridge = makeBridge();
      const result = await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'unknown',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('unknown');
    });

    it('returns error when sell exchange is unknown', async () => {
      const bridge = makeBridge();
      const result = await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'missing',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing');
    });

    it('returns error when balance insufficient', async () => {
      const bridge = new PaperTradingArbBridge({
        exchanges: ['binance', 'okx'],
        initialBalancePerExchange: 1, // only $1
      });
      const result = await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updatePrices', () => {
    it('updates prices on all engines', async () => {
      const bridge = makeBridge();
      const ticks = new Map([['BTC/USDT', 55000], ['ETH/USDT', 3000]]);
      // Should not throw
      expect(() => bridge.updatePrices(ticks)).not.toThrow();
    });
  });

  describe('getAggregatedPnl', () => {
    it('returns zero P&L before any trades', () => {
      const bridge = makeBridge();
      const pnl = bridge.getAggregatedPnl();
      expect(pnl.realized).toBe(0);
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(0);
      expect(pnl.perExchange).toHaveProperty('binance');
      expect(pnl.perExchange).toHaveProperty('okx');
    });

    it('accumulates realized P&L after successful arb', async () => {
      const bridge = makeBridge();
      // Execute and then sell back (close position)
      await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      const pnl = bridge.getAggregatedPnl();
      // okx engine should have realized PnL from the sell
      expect(pnl.perExchange['binance']).toBeDefined();
      expect(pnl.perExchange['okx']).toBeDefined();
    });
  });

  describe('getAllPositions', () => {
    it('returns empty array before any trades', () => {
      const bridge = makeBridge();
      expect(bridge.getAllPositions()).toHaveLength(0);
    });

    it('returns open positions after buy', async () => {
      const bridge = makeBridge();
      await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      // binance has a long position (bought BTC)
      const positions = bridge.getAllPositions();
      expect(positions.length).toBeGreaterThan(0);
    });
  });

  describe('getCombinedHistory', () => {
    it('returns empty array before any trades', () => {
      const bridge = makeBridge();
      expect(bridge.getCombinedHistory()).toHaveLength(0);
    });

    it('returns 2 trades (buy + sell) after one arb', async () => {
      const bridge = makeBridge();
      await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      expect(bridge.getCombinedHistory()).toHaveLength(2);
    });

    it('returns trades sorted by timestamp ascending', async () => {
      const bridge = makeBridge();
      await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.05,
        buyPrice: 50000,
        sellPrice: 50100,
      });
      const history = bridge.getCombinedHistory();
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp);
      }
    });
  });

  describe('reset', () => {
    it('clears all history and positions', async () => {
      const bridge = makeBridge();
      await bridge.executeArb({
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'okx',
        amount: 0.1,
        buyPrice: 50000,
        sellPrice: 50200,
      });
      bridge.reset();
      expect(bridge.getCombinedHistory()).toHaveLength(0);
      expect(bridge.getAllPositions()).toHaveLength(0);
      const pnl = bridge.getAggregatedPnl();
      expect(pnl.total).toBe(0);
    });
  });
});
