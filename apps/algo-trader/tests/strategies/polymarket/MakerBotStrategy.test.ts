/**
 * Maker Bot Strategy Tests
 */

import { MakerBotStrategy } from '../../../src/strategies/polymarket/MakerBotStrategy';
import { IMarketTick, PolymarketSignalType } from '../../../src/interfaces/IPolymarket';

describe('MakerBotStrategy', () => {
  let strategy: MakerBotStrategy;

  beforeEach(() => {
    strategy = new MakerBotStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.spreadBps).toBe(200);
      expect(config.orderSize).toBe(50);
      expect(config.maxInventory).toBe(200);
      expect(config.skewFactor).toBe(0.5);
      expect(config.staleThresholdMs).toBe(5000);
      expect(config.minConfidence).toBe(0.3);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        spreadBps: 300,
        orderSize: 100,
        maxInventory: 500,
      });

      const config = strategy.getConfig();
      expect(config.spreadBps).toBe(300);
      expect(config.orderSize).toBe(100);
      expect(config.maxInventory).toBe(500);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.spreadBps).toBeDefined();
      expect(schema.orderSize).toBeDefined();
      expect(schema.maxInventory).toBeDefined();
      expect(schema.skewFactor).toBeDefined();
      expect(schema.staleThresholdMs).toBeDefined();
      expect(schema.minConfidence).toBeDefined();
    });
  });

  describe('fair value calculation', () => {
    const createTick = (tokenId: string, yesBid: number, yesAsk: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid,
      yesAsk,
      yesPrice: (yesBid + yesAsk) / 2,
      noPrice: 1 - (yesBid + yesAsk) / 2,
      spread: yesAsk - yesBid,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should calculate fair value as mid price', async () => {
      const tick = createTick('token-1', 0.48, 0.52);

      // Store tick in strategy
      (strategy as any).marketTicks.set('token-1', tick);

      const fairValue = await strategy.calculateFairValue('token-1');

      expect(fairValue).toBe(0.50);
    });
  });

  describe('inventory skew', () => {
    it('should calculate skew correctly', async () => {
      await strategy.init([], { maxInventory: 200, skewFactor: 0.5 });

      // Positive inventory (long YES) → negative skew (lower quotes)
      const skew = (strategy as any).calculateSkew(100);
      expect(skew).toBe(0.25); // (100/200) * 0.5

      // Negative inventory (short YES) → positive skew (raise quotes)
      const skewNegative = (strategy as any).calculateSkew(-100);
      expect(skewNegative).toBe(-0.25);
    });
  });

  describe('quote generation', () => {
    const createTick = (tokenId: string, yesBid: number, yesAsk: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid,
      yesAsk,
      yesPrice: (yesBid + yesAsk) / 2,
      noPrice: 1 - (yesBid + yesAsk) / 2,
      spread: yesAsk - yesBid,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should generate bid and ask quotes', () => {
      const tick = createTick('token-1', 0.48, 0.52);

      const quotes = strategy.generateQuotes(tick);

      // Should have at least 2 signals (bid + ask)
      expect(quotes.length).toBeGreaterThanOrEqual(2);
    });

    it('should include CANCEL signals when replacing quotes', () => {
      const tick = createTick('token-1', 0.48, 0.52);

      // First call - initial quotes
      strategy.generateQuotes(tick);

      // Second call with different price - should include cancels
      const tick2 = createTick('token-1', 0.46, 0.50);
      const quotes = strategy.generateQuotes(tick2);

      const cancelSignals = quotes.filter(q => q.type === PolymarketSignalType.CANCEL);
      expect(cancelSignals.length).toBeGreaterThan(0);
    });

    it('should respect spread configuration', () => {
      const tick = createTick('token-1', 0.49, 0.51);
      const midPrice = 0.50;

      const quotes = strategy.generateQuotes(tick);

      // Check that bid < mid < ask
      const buySignals = quotes.filter(q => q.action === 'BUY');
      const sellSignals = quotes.filter(q => q.action === 'SELL');

      if (buySignals.length > 0 && sellSignals.length > 0) {
        expect(buySignals[0].price).toBeLessThan(midPrice);
        expect(sellSignals[0].price).toBeGreaterThan(midPrice);
      }
    });
  });

  describe('inventory management', () => {
    it('should update inventory on BUY', () => {
      strategy.updateInventory('token-1', 'BUY', 50);

      const state = (strategy as any).state.get('token-1');
      expect(state.inventory).toBe(50);
    });

    it('should update inventory on SELL', () => {
      strategy.updateInventory('token-1', 'SELL', 30);

      const state = (strategy as any).state.get('token-1');
      expect(state.inventory).toBe(-30);
    });

    it('should track inventory per token', () => {
      strategy.updateInventory('token-1', 'BUY', 50);
      strategy.updateInventory('token-2', 'SELL', 30);

      const state1 = (strategy as any).state.get('token-1');
      const state2 = (strategy as any).state.get('token-2');

      expect(state1.inventory).toBe(50);
      expect(state2.inventory).toBe(-30);
    });
  });

  describe('processTick', () => {
    const createTick = (tokenId: string, yesBid: number, yesAsk: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid,
      yesAsk,
      yesPrice: (yesBid + yesAsk) / 2,
      noPrice: 1 - (yesBid + yesAsk) / 2,
      spread: yesAsk - yesBid,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should process tick and return quotes', () => {
      const tick = createTick('token-1', 0.48, 0.52);

      const quotes = strategy.processTick(tick);

      expect(Array.isArray(quotes)).toBe(true);
      expect(quotes.length).toBeGreaterThanOrEqual(2);
    });
  });
});
