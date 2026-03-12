/**
 * Whale Tracking Strategy Tests
 */

import { WhaleTrackingStrategy, WhaleData, WhaleTrade } from '../../../src/strategies/polymarket/WhaleTrackingStrategy';
import { IMarketTick } from '../../../src/interfaces/IPolymarket';

describe('WhaleTrackingStrategy', () => {
  let strategy: WhaleTrackingStrategy;

  beforeEach(() => {
    strategy = new WhaleTrackingStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minWinRate).toBe(0.55);
      expect(config.maxPositionSize).toBe(25);
      expect(config.copyDelayMs).toBe(5000);
      expect(config.minTrades).toBe(10);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        minWinRate: 0.60,
        maxPositionSize: 50,
        copyDelayMs: 10000,
        minTrades: 20,
      });

      const config = strategy.getConfig();
      expect(config.minWinRate).toBe(0.60);
      expect(config.maxPositionSize).toBe(50);
      expect(config.copyDelayMs).toBe(10000);
      expect(config.minTrades).toBe(20);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minWinRate).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.copyDelayMs).toBeDefined();
      expect(schema.minTrades).toBeDefined();
    });
  });

  describe('whale management', () => {
    it('should register whale wallet', () => {
      const whale: WhaleData = {
        address: '0x1234567890abcdef',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
        specialty: 'politics',
      };

      strategy.registerWhale(whale);

      expect((strategy as any).whales.get('0x1234567890abcdef')).toEqual(whale);
    });

    it('should remove whale wallet', () => {
      const whale: WhaleData = {
        address: '0xabcdef',
        winRate: 0.60,
        totalTrades: 30,
        totalPnL: 5000,
      };

      strategy.registerWhale(whale);
      strategy.removeWhale('0xabcdef');

      expect((strategy as any).whales.get('0xabcdef')).toBeUndefined();
    });
  });

  describe('whale trade processing', () => {
    const createWhaleTrade = (whaleAddress: string, tokenId: string, side: 'YES' | 'NO'): WhaleTrade => ({
      whaleAddress,
      tokenId,
      marketId: 'market-1',
      side,
      action: 'BUY',
      size: 100,
      price: 0.50,
      timestamp: Date.now(),
    });

    it('should ignore trade from unregistered whale', () => {
      const trade = createWhaleTrade('unknown-whale', 'token-1', 'YES');

      strategy.processWhaleTrade(trade);

      const pendingTrade = (strategy as any).pendingTrades.get('token-1');
      expect(pendingTrade).toBeUndefined();
    });

    it('should ignore trade from whale with insufficient trades', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.65,
        totalTrades: 5, // Below minTrades (10)
        totalPnL: 1000,
      };

      strategy.registerWhale(whale);

      const trade = createWhaleTrade('0xwhale', 'token-1', 'YES');
      strategy.processWhaleTrade(trade);

      const pendingTrade = (strategy as any).pendingTrades.get('token-1');
      expect(pendingTrade).toBeUndefined();
    });

    it('should ignore trade from whale with low win rate', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.45, // Below minWinRate (0.55)
        totalTrades: 50,
        totalPnL: -1000,
      };

      strategy.registerWhale(whale);

      const trade = createWhaleTrade('0xwhale', 'token-1', 'YES');
      strategy.processWhaleTrade(trade);

      const pendingTrade = (strategy as any).pendingTrades.get('token-1');
      expect(pendingTrade).toBeUndefined();
    });

    it('should schedule qualified whale trade for copying', () => {
      const whale: WhaleData = {
        address: '0xqualified',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
      };

      strategy.registerWhale(whale);

      const trade = createWhaleTrade('0xqualified', 'token-1', 'YES');
      strategy.processWhaleTrade(trade);

      const pendingTrade = (strategy as any).pendingTrades.get('token-1');
      expect(pendingTrade).toBeDefined();
      expect(pendingTrade.whaleAddress).toBe('0xqualified');
    });
  });

  describe('fair value calculation', () => {
    it('should return whale win rate for YES trades', async () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        action: 'BUY',
        size: 100,
        price: 0.50,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const fairValue = await strategy.calculateFairValue('token-1');

      expect(fairValue).toBe(0.65);
    });

    it('should return 1 - win rate for NO trades', async () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'NO',
        action: 'BUY',
        size: 100,
        price: 0.40,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const fairValue = await strategy.calculateFairValue('token-1');

      expect(fairValue).toBe(0.35); // 1 - 0.65
    });

    it('should return null for unknown token', async () => {
      const fairValue = await strategy.calculateFairValue('unknown-token');

      expect(fairValue).toBeNull();
    });
  });

  describe('signal generation', () => {
    const createTick = (tokenId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should return null when no pending trade', () => {
      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.generateSignal(tick);

      expect(signal).toBeNull();
    });

    it('should generate BUY_YES signal for whale YES trade', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        action: 'BUY',
        size: 100,
        price: 0.50,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.generateSignal(tick);

      expect(signal).toBeTruthy();
      expect(signal?.side).toBe('YES');
      expect(signal?.action).toBe('BUY');
      expect(signal?.confidence).toBe(0.65);
    });

    it('should generate BUY_NO signal for whale NO trade', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.60,
        totalTrades: 40,
        totalPnL: 8000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'NO',
        action: 'BUY',
        size: 80,
        price: 0.40,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const tick = createTick('token-1', 0.45, 0.55);
      const signal = strategy.generateSignal(tick);

      expect(signal).toBeTruthy();
      expect(signal?.side).toBe('NO');
      expect(signal?.action).toBe('BUY');
    });

    it('should scale position size by confidence', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.80, // High confidence
        totalTrades: 100,
        totalPnL: 50000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        action: 'BUY',
        size: 100,
        price: 0.50,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.generateSignal(tick);

      // Size = maxPositionSize * confidence = 25 * 0.80 = 20
      expect(signal?.size).toBe(20);
    });

    it('should include whale metadata in signal', () => {
      const whale: WhaleData = {
        address: '0x1234567890abcdef',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
        specialty: 'crypto',
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0x1234567890abcdef',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        action: 'BUY',
        size: 100,
        price: 0.50,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.generateSignal(tick);

      expect(signal?.metadata).toBeDefined();
      expect(signal?.metadata?.whaleAddress).toBe('0x1234567890abcdef');
      expect(signal?.metadata?.whaleWinRate).toBe(0.65);
      expect(signal?.metadata?.whaleTrades).toBe(50);
    });
  });

  describe('processTick', () => {
    const createTick = (tokenId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should process tick and potentially return signal', () => {
      const whale: WhaleData = {
        address: '0xwhale',
        winRate: 0.65,
        totalTrades: 50,
        totalPnL: 10000,
      };

      strategy.registerWhale(whale);

      const trade: WhaleTrade = {
        whaleAddress: '0xwhale',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        action: 'BUY',
        size: 100,
        price: 0.50,
        timestamp: Date.now(),
      };

      strategy.processWhaleTrade(trade);

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.processTick(tick);

      expect(signal).toBeTruthy();
    });
  });
});
