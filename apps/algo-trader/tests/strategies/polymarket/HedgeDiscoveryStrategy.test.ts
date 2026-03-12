/**
 * Hedge Discovery Strategy Tests
 */

import { HedgeDiscoveryStrategy, RelatedMarkets } from '../../../src/strategies/polymarket/HedgeDiscoveryStrategy';
import { IMarketTick } from '../../../src/interfaces/IPolymarket';

describe('HedgeDiscoveryStrategy', () => {
  let strategy: HedgeDiscoveryStrategy;

  beforeEach(() => {
    strategy = new HedgeDiscoveryStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minEdgeThreshold).toBe(0.03);
      expect(config.maxPositionSize).toBe(40);
      expect(config.correlationThreshold).toBe(0.8);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        minEdgeThreshold: 0.05,
        maxPositionSize: 100,
        correlationThreshold: 0.9,
      });

      const config = strategy.getConfig();
      expect(config.minEdgeThreshold).toBe(0.05);
      expect(config.maxPositionSize).toBe(100);
      expect(config.correlationThreshold).toBe(0.9);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minEdgeThreshold).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.correlationThreshold).toBeDefined();
    });
  });

  describe('pair registration', () => {
    it('should register related markets pair', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'yes-token', marketId: 'market-1', question: 'Will X happen?' },
        marketB: { tokenId: 'no-token', marketId: 'market-1', question: 'Will X not happen?' },
        relationship: 'COMPLEMENT',
      };

      strategy.registerPair('pair-1', pair);

      expect((strategy as any).relatedPairs.get('pair-1')).toEqual(pair);
    });
  });

  describe('price updates', () => {
    it('should update price for token', () => {
      strategy.updatePrice('token-1', 0.60);

      expect((strategy as any).lastPrices.get('token-1')).toBe(0.60);
    });
  });

  describe('fair value calculation', () => {
    it('should calculate fair value as 1 - price for complement', async () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'yes-token', marketId: 'market-1', question: 'Will X happen?' },
        marketB: { tokenId: 'no-token', marketId: 'market-1', question: 'Will X not happen?' },
        relationship: 'COMPLEMENT',
      };

      strategy.registerPair('pair-1', pair);
      strategy.updatePrice('no-token', 0.40);

      const fairValue = await strategy.calculateFairValue('yes-token');

      expect(fairValue).toBe(0.60); // 1 - 0.40
    });

    it('should return null when pair not found', async () => {
      const fairValue = await strategy.calculateFairValue('unknown-token');

      expect(fairValue).toBeNull();
    });

    it('should return null when related price not available', async () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'yes-token', marketId: 'market-1', question: 'Will X happen?' },
        marketB: { tokenId: 'no-token', marketId: 'market-1', question: 'Will X not happen?' },
        relationship: 'COMPLEMENT',
      };

      strategy.registerPair('pair-1', pair);
      // Don't update price for no-token

      const fairValue = await strategy.calculateFairValue('yes-token');

      expect(fairValue).toBeNull();
    });
  });

  describe('arbitrage detection', () => {
    it('should detect arbitrage when sum < 1', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const result = strategy.checkPair(pair, 0.45, 0.45);

      expect(result.hasOpportunity).toBe(true);
      expect(result.edge).toBeCloseTo(0.10, 2);
      expect(result.signals).toContain('BUY_A');
      expect(result.signals).toContain('BUY_B');
    });

    it('should detect arbitrage when sum > 1', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const result = strategy.checkPair(pair, 0.60, 0.60);

      expect(result.hasOpportunity).toBe(true);
      expect(result.edge).toBeCloseTo(0.20, 2);
      expect(result.signals).toContain('SELL_A');
      expect(result.signals).toContain('SELL_B');
    });

    it('should not detect arbitrage when edge below threshold', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const result = strategy.checkPair(pair, 0.49, 0.49);

      expect(result.hasOpportunity).toBe(false);
    });
  });

  describe('signal generation', () => {
    const createTick = (tokenId: string, marketId: string, yesPrice: number): IMarketTick => ({
      tokenId,
      marketId,
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice: 1 - yesPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should generate BUY signals for undervalued pair', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const tickA = createTick('a', 'm1', 0.45);
      const tickB = createTick('b', 'm1', 0.45);

      const signals = strategy.generateSignals(tickA, tickB, pair);

      expect(signals.length).toBe(2);
      expect(signals[0].action).toBe('BUY');
      expect(signals[1].action).toBe('BUY');
    });

    it('should include metadata in signals', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const tickA = createTick('a', 'm1', 0.40);
      const tickB = createTick('b', 'm1', 0.40);

      const signals = strategy.generateSignals(tickA, tickB, pair);

      expect(signals[0].metadata).toBeDefined();
      expect(signals[0].metadata?.pair).toBe('COMPLEMENT');
      expect(signals[0].metadata?.edge).toBeDefined();
    });

    it('should return empty array when no opportunity', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const tickA = createTick('a', 'm1', 0.50);
      const tickB = createTick('b', 'm1', 0.50);

      const signals = strategy.generateSignals(tickA, tickB, pair);

      expect(signals.length).toBe(0);
    });
  });

  describe('processPair', () => {
    const createTick = (tokenId: string, marketId: string, yesPrice: number): IMarketTick => ({
      tokenId,
      marketId,
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice: 1 - yesPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should process pair and generate signals', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const tickA = createTick('a', 'm1', 0.45);
      const tickB = createTick('b', 'm1', 0.45);

      const signals = strategy.processPair(tickA, tickB, pair);

      expect(signals.length).toBe(2);
    });

    it('should update internal prices', () => {
      const pair: RelatedMarkets = {
        marketA: { tokenId: 'a', marketId: 'm1', question: 'A' },
        marketB: { tokenId: 'b', marketId: 'm1', question: 'not A' },
        relationship: 'COMPLEMENT',
      };

      const tickA = createTick('a', 'm1', 0.45);
      const tickB = createTick('b', 'm1', 0.45);

      strategy.processPair(tickA, tickB, pair);

      expect((strategy as any).lastPrices.get('a')).toBe(0.45);
      expect((strategy as any).lastPrices.get('b')).toBe(0.45);
    });
  });
});
