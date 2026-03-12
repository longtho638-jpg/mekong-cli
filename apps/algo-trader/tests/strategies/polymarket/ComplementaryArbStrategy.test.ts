/**
 * Complementary Arbitrage Strategy Tests
 */

import { ComplementaryArbStrategy } from '../../../src/strategies/polymarket/ComplementaryArbStrategy';
import { IMarketTick } from '../../../src/interfaces/IPolymarket';

describe('ComplementaryArbStrategy', () => {
  let strategy: ComplementaryArbStrategy;

  beforeEach(() => {
    strategy = new ComplementaryArbStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minEdgeThreshold).toBe(0.02);
      expect(config.maxPositionSize).toBe(100);
      expect(config.feeRateBps).toBe(2500);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        minEdgeThreshold: 0.03,
        maxPositionSize: 50,
      });

      const config = strategy.getConfig();
      expect(config.minEdgeThreshold).toBe(0.03);
      expect(config.maxPositionSize).toBe(50);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minEdgeThreshold).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.feeRateBps).toBeDefined();
    });
  });

  describe('arbitrage detection', () => {
    const createTick = (tokenId: string, marketId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId,
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should detect arbitrage when YES + NO < 1.00', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.45, 0.50);
      const noTick = createTick('no-token', 'market-1', 0.45, 0.50);

      // Sum = 0.95, edge = 0.05
      const result = strategy.checkArbitrage(yesTick, noTick);

      expect(result.hasArb).toBe(true);
      expect(result.side).toBe('BUY_BOTH');
      expect(result.edge).toBeCloseTo(0.05, 2);
    });

    it('should not detect arbitrage when edge below threshold', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.49, 0.49);
      const noTick = createTick('no-token', 'market-1', 0.49, 0.49);

      // Sum = 0.98, edge = 0.02 (at threshold)
      const result = strategy.checkArbitrage(yesTick, noTick);

      expect(result.hasArb).toBe(false);
    });

    it('should calculate profit per share correctly', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.40, 0.55);
      const noTick = createTick('no-token', 'market-1', 0.40, 0.55);

      // Sum = 0.95, edge = 0.05
      const result = strategy.checkArbitrage(yesTick, noTick);

      expect(result.hasArb).toBe(true);
      expect(result.profitPerShare).toBeGreaterThan(0);
    });
  });

  describe('signal generation', () => {
    const createTick = (tokenId: string, marketId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId,
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should generate BUY_YES and BUY_NO signals for arbitrage opportunity', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.45, 0.50);
      const noTick = createTick('no-token', 'market-1', 0.45, 0.50);

      const signals = strategy.generateSignals(yesTick, noTick);

      expect(signals.length).toBe(2);
      expect(signals[0].side).toBe('YES');
      expect(signals[0].action).toBe('BUY');
      expect(signals[1].side).toBe('NO');
      expect(signals[1].action).toBe('BUY');
    });

    it('should include metadata in signals', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.40, 0.55);
      const noTick = createTick('no-token', 'market-1', 0.40, 0.55);

      const signals = strategy.generateSignals(yesTick, noTick);

      expect(signals[0].metadata).toBeDefined();
      expect(signals[0].metadata?.edge).toBeDefined();
      expect(signals[0].metadata?.profitPerShare).toBeDefined();
    });

    it('should return empty array when no arbitrage', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.50, 0.50);
      const noTick = createTick('no-token', 'market-1', 0.50, 0.50);

      const signals = strategy.generateSignals(yesTick, noTick);

      expect(signals.length).toBe(0);
    });
  });

  describe('processTicks', () => {
    const createTick = (tokenId: string, marketId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId,
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should process ticks and generate signals', () => {
      const yesTick = createTick('yes-token', 'market-1', 0.45, 0.50);
      const noTick = createTick('no-token', 'market-1', 0.45, 0.50);

      const signals = strategy.processTicks(yesTick, noTick);

      expect(signals.length).toBe(2);
    });
  });
});
