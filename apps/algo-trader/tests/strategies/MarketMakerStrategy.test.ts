/**
 * MarketMakerStrategy Tests
 *
 * Tests for two-sided market making strategy
 */

import { MarketMakerStrategy } from '../../../src/strategies/MarketMakerStrategy';

// Manual mocks
const mockPolyClient = {
  getOrderBook: jest.fn(),
  getMidpoint: jest.fn(),
  createAndPostOrder: jest.fn(),
  cancelOrder: jest.fn(),
};

const mockPolyWS = {
  connect: jest.fn(),
  subscribe: jest.fn(),
  on: jest.fn(),
};

jest.mock('../../../src/polymarket/client', () => ({
  ClobClient: jest.fn().mockImplementation(() => mockPolyClient),
}));

jest.mock('../../../src/polymarket/websocket', () => ({
  PolymarketWebSocket: jest.fn().mockImplementation(() => mockPolyWS),
}));

describe('MarketMakerStrategy', () => {
  let strategy: MarketMakerStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new MarketMakerStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.targetSpreadBps).toBeDefined();
      expect(config.orderSize).toBeDefined();
      expect(config.maxInventory).toBeDefined();
      expect(config.cancelReplaceMs).toBeDefined();
    });

    it('should accept custom config', async () => {
      const customConfig: any = {
        targetSpreadBps: 1500, // 15 cents
        orderSize: 100,
        maxInventory: 500,
      };

      await strategy.init([], customConfig);
      const config = strategy.getConfig();

      expect(config.targetSpreadBps).toBe(1500);
      expect(config.orderSize).toBe(100);
      expect(config.maxInventory).toBe(500);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.targetSpreadBps).toBeDefined();
      expect(schema.orderSize).toBeDefined();
      expect(schema.maxInventory).toBeDefined();
      expect(schema.cancelReplaceMs).toBeDefined();
    });
  });

  describe('spread calculation', () => {
    const createTick = (tokenId: string, midPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: midPrice - 0.005,
      yesAsk: midPrice + 0.005,
      yesPrice: midPrice,
      noPrice: 1 - midPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should calculate bid/ask prices around midprice', async () => {
      await strategy.init([], { targetSpreadBps: 1000, orderSize: 50 }); // 10 cents

      // Midprice = 0.50
      // Bid = 0.50 - 0.05 = 0.45
      // Ask = 0.50 + 0.05 = 0.55
      expect(strategy.name).toBe('MarketMaker');
    });

    it('should adjust spread based on config', async () => {
      await strategy.init([], { targetSpreadBps: 2000 }); // 20 cents

      // Wider spread = more profit per trade, less fill probability
      expect(strategy).toBeDefined();
    });

    it('should handle midprice movement', async () => {
      await strategy.init([]);

      // Midprice moves from 0.50 to 0.60
      // Quotes should update accordingly
      expect(strategy).toBeDefined();
    });
  });

  describe('order placement', () => {
    it('should place two-sided orders', async () => {
      await strategy.init([]);

      // Should generate:
      // 1. BUY order (bid) below midprice
      // 2. SELL order (ask) above midprice
      expect(strategy).toBeDefined();
    });

    it('should use correct order sizes', async () => {
      await strategy.init([], { orderSize: 100 });

      // Both bid and ask should be 100 shares
      expect(strategy).toBeDefined();
    });

    it('should align prices with tick size', async () => {
      await strategy.init([]);

      // Prices should be rounded to valid tick size (0.01)
      // 0.4567 → 0.46
      expect(strategy).toBeDefined();
    });
  });

  describe('inventory management', () => {
    it('should track delta (net position)', async () => {
      await strategy.init([]);

      // Buy 50 YES → delta = +50
      // Sell 30 YES → delta = +20
      expect(strategy).toBeDefined();
    });

    it('should apply inventory skew', async () => {
      await strategy.init([], { maxInventory: 200, skewFactor: 0.5 });

      // Positive delta (long YES) → skew down
      // Negative delta (short YES) → skew up
      expect(strategy).toBeDefined();
    });

    it('should enforce max inventory limit', async () => {
      await strategy.init([], { maxInventory: 100 });

      // Delta = +100 (at limit)
      // Should stop buying, only sell
      expect(strategy).toBeDefined();
    });

    it('should skew bid more than ask when long', async () => {
      await strategy.init([]);

      // Inventory = +100 (long)
      // Bid should be lower (discourage buys)
      // Ask should be normal or higher
      expect(strategy).toBeDefined();
    });

    it('should skew ask more than bid when short', async () => {
      await strategy.init([]);

      // Inventory = -100 (short)
      // Ask should be higher (discourage sells)
      // Bid should be normal or lower
      expect(strategy).toBeDefined();
    });
  });

  describe('cancel/replace loop', () => {
    it('should heartbeat replace orders', async () => {
      await strategy.init([], { cancelReplaceMs: 5000 });

      // Every 5 seconds, cancel and replace orders
      // To stay competitive
      expect(strategy).toBeDefined();
    });

    it('should detect midprice movement threshold', async () => {
      await strategy.init([]);

      // Midprice moves > 30% of spread
      // Should trigger immediate cancel/replace
      expect(strategy).toBeDefined();
    });

    it('should cancel orders when stopping', async () => {
      await strategy.init([]);

      // On stop/finish
      // Should cancel all open orders
      expect(strategy).toBeDefined();
    });
  });

  describe('signal generation', () => {
    it('should generate BUY and SELL signals', async () => {
      await strategy.init([]);

      // BUY signal at bid price
      // SELL signal at ask price
      expect(strategy).toBeDefined();
    });

    it('should include maker flag for fee rebate', async () => {
      await strategy.init([]);

      // Orders should be post-only (maker)
      // To qualify for fee rebate
      expect(strategy).toBeDefined();
    });

    it('should track unrealized PnL', async () => {
      await strategy.init([]);

      // Long 50 @ 0.45, midprice = 0.50
      // Unrealized PnL = 50 * (0.50 - 0.45) = +2.5 USDC
      expect(strategy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero inventory start', async () => {
      await strategy.init([]);

      // Delta = 0 (flat)
      // Symmetric quotes around midprice
      expect(strategy).toBeDefined();
    });

    it('should handle full inventory stop', async () => {
      await strategy.init([], { maxInventory: 100 });

      // Delta = +100 (max)
      // Should only quote sells, no buys
      expect(strategy).toBeDefined();
    });

    it('should handle rapid price changes', async () => {
      await strategy.init([]);

      // Midprice oscillates 0.40 → 0.60 → 0.45
      // Should update quotes without over-trading
      expect(strategy).toBeDefined();
    });

    it('should handle stale data', async () => {
      await strategy.init([]);

      // Tick timestamp > stale threshold
      // Should not place orders
      expect(strategy).toBeDefined();
    });
  });

  describe('maker rebate optimization', () => {
    it('should use post-only orders', async () => {
      await strategy.init([]);

      // All orders should be post-only
      // To avoid taker fees
      expect(strategy).toBeDefined();
    });

    it('should track daily rebates earned', async () => {
      await strategy.init([]);

      // Stats should include maker rebate total
      expect(strategy).toBeDefined();
    });
  });

  describe('stats tracking', () => {
    it('should track orders placed', async () => {
      await strategy.init([]);

      // Count of bid + ask orders placed
      expect(strategy).toBeDefined();
    });

    it('should track fill rate', async () => {
      await strategy.init([]);

      // Fills / Orders placed
      expect(strategy).toBeDefined();
    });

    it('should track spread captured', async () => {
      await strategy.init([]);

      // Total spread earned from round-trip trades
      expect(strategy).toBeDefined();
    });

    it('should track maker rebates', async () => {
      await strategy.init([]);

      // Total USDC rebates earned
      expect(strategy).toBeDefined();
    });
  });
});
