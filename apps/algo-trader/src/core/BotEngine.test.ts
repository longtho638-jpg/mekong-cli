import { BotEngine, BotConfig } from './BotEngine';
import { IStrategy, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { IExchange, IBalance } from '../interfaces/IExchange';
import { ICandle } from '../interfaces/ICandle';
import { OrderManager } from './OrderManager';

const makeCandle = (close = 100): ICandle => ({
  timestamp: Date.now(), open: close, high: close + 1, low: close - 1, close, volume: 1000,
});

const makeBalance = (free: number): Record<string, IBalance> => ({
  USDT: { currency: 'USDT', free, used: 0, total: free },
  BTC: { currency: 'BTC', free: 1, used: 0, total: 1 },
});

const makeExchange = (balanceFree = 10000): jest.Mocked<IExchange> => ({
  name: 'mock',
  connect: jest.fn().mockResolvedValue(undefined),
  fetchTicker: jest.fn().mockResolvedValue(100),
  createMarketOrder: jest.fn().mockResolvedValue({ id: '1', symbol: 'BTC/USDT', side: 'buy', amount: 0.01, price: 100, status: 'closed', timestamp: Date.now() }),
  fetchBalance: jest.fn().mockResolvedValue(makeBalance(balanceFree)),
  fetchOrderBook: jest.fn().mockResolvedValue({ symbol: 'BTC/USDT', bids: [], asks: [], timestamp: Date.now() }),
});

const makeDataProvider = (): jest.Mocked<IDataProvider> => ({
  init: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn(),
  getHistory: jest.fn().mockResolvedValue([]),
});

const makeStrategy = (signalType?: SignalType | null): jest.Mocked<IStrategy> => ({
  name: 'MockStrategy',
  onCandle: jest.fn().mockResolvedValue(
    signalType ? { type: signalType, price: 100, timestamp: Date.now(), metadata: {} } : null
  ),
  init: jest.fn().mockResolvedValue(undefined),
});

const makeConfig = (overrides: Partial<BotConfig> = {}): BotConfig => ({
  tenantId: 'test',
  symbol: 'BTC/USDT',
  riskPercentage: 1,
  pollInterval: 1000,
  ...overrides,
});

describe('BotEngine', () => {
  describe('start / stop', () => {
    it('should connect, init, subscribe, and start', async () => {
      const exchange = makeExchange();
      const dataProvider = makeDataProvider();
      const strategy = makeStrategy();
      const bot = new BotEngine(strategy, dataProvider, exchange, makeConfig());

      await bot.start();

      expect(exchange.connect).toHaveBeenCalledTimes(1);
      expect(dataProvider.init).toHaveBeenCalledTimes(1);
      expect(dataProvider.subscribe).toHaveBeenCalledTimes(1);
      expect(dataProvider.start).toHaveBeenCalledTimes(1);
    });

    it('should stop gracefully', async () => {
      const exchange = makeExchange();
      const dataProvider = makeDataProvider();
      const bot = new BotEngine(makeStrategy(), dataProvider, exchange, makeConfig());

      await bot.start();
      await bot.stop();

      expect(dataProvider.stop).toHaveBeenCalledTimes(1);
    });

    it('should stop gracefully even if dataProvider.stop throws', async () => {
      const exchange = makeExchange();
      const dataProvider = makeDataProvider();
      dataProvider.stop.mockRejectedValue(new Error('stop error'));
      const bot = new BotEngine(makeStrategy(), dataProvider, exchange, makeConfig());

      await bot.start();
      await expect(bot.stop()).resolves.not.toThrow();
    });
  });

  describe('drawdown protection', () => {
    it('should seed peakBalance on start when maxDrawdownPercent is set', async () => {
      const exchange = makeExchange(10000);
      const dataProvider = makeDataProvider();
      const bot = new BotEngine(makeStrategy(), dataProvider, exchange, makeConfig({ maxDrawdownPercent: 10 }));

      await bot.start();

      // fetchBalance should be called during start to syncPositionState and seed peakBalance
      expect(exchange.fetchBalance).toHaveBeenCalledTimes(2);
    });

    it('should NOT stop if drawdown is below threshold', async () => {
      const exchange = makeExchange(9500); // 5% below 10000 but threshold is 10%
      const dataProvider = makeDataProvider();
      const strategy = makeStrategy(SignalType.BUY);
      const bot = new BotEngine(strategy, dataProvider, exchange, makeConfig({ maxDrawdownPercent: 10 }));

      exchange.fetchBalance
        .mockResolvedValueOnce(makeBalance(10000)) // syncPositionState
        .mockResolvedValueOnce(makeBalance(10000)) // start seed
        .mockResolvedValueOnce(makeBalance(9500))  // drawdown check: 5% < 10%
        .mockResolvedValueOnce(makeBalance(9500)); // executeTrade balance check

      await bot.start();

      // Simulate candle arriving
      const onCandle = (dataProvider.subscribe as jest.Mock).mock.calls[0][0];

      await onCandle(makeCandle());

      // Bot should still be running (not stopped)
      expect(dataProvider.stop).not.toHaveBeenCalled();
    });

    it('should stop bot if drawdown exceeds threshold', async () => {
      const exchange = makeExchange(10000);
      const dataProvider = makeDataProvider();
      const strategy = makeStrategy(SignalType.BUY);
      const bot = new BotEngine(strategy, dataProvider, exchange, makeConfig({ maxDrawdownPercent: 10 }));

      // Seed peak at 10000 on start, then current drops to 8000 (20% drawdown)
      exchange.fetchBalance
        .mockResolvedValueOnce(makeBalance(10000)) // syncPositionState
        .mockResolvedValueOnce(makeBalance(10000)) // start seed
        .mockResolvedValueOnce(makeBalance(8000));  // drawdown check: 20% > 10%

      await bot.start();

      const onCandle = (dataProvider.subscribe as jest.Mock).mock.calls[0][0];
      await onCandle(makeCandle());
      // Allow async onCandle (via SignalMesh) to complete
      await new Promise(r => setTimeout(r, 50));

      expect(dataProvider.stop).toHaveBeenCalledTimes(1);
    });

    it('should update peakBalance when balance rises above previous peak', async () => {
      const exchange = makeExchange(10000);
      const dataProvider = makeDataProvider();
      const strategy = makeStrategy(null);
      strategy.onCandle.mockResolvedValue(null);

      const bot = new BotEngine(strategy, dataProvider, exchange, makeConfig({ maxDrawdownPercent: 10 }));

      // First start seeds 10000
      exchange.fetchBalance
        .mockResolvedValueOnce(makeBalance(10000)) // syncPositionState
        .mockResolvedValueOnce(makeBalance(10000)) // start seed
        .mockResolvedValueOnce(makeBalance(12000)) // 1st candle: balance rose, update peak
        .mockResolvedValueOnce(makeBalance(11000)); // 2nd candle: 8.3% drawdown from 12000 — within 10%

      await bot.start();
      const onCandle = (dataProvider.subscribe as jest.Mock).mock.calls[0][0];
      await onCandle(makeCandle());
      await onCandle(makeCandle());

      // Neither candle should have stopped the bot
      expect(dataProvider.stop).not.toHaveBeenCalled();
    });

    it('should NOT check drawdown if maxDrawdownPercent is not set', async () => {
      const exchange = makeExchange(1); // Very low balance
      const dataProvider = makeDataProvider();
      const strategy = makeStrategy(null);
      strategy.onCandle.mockResolvedValue(null);

      const bot = new BotEngine(strategy, dataProvider, exchange, makeConfig()); // no maxDrawdownPercent

      await bot.start();
      const onCandle = (dataProvider.subscribe as jest.Mock).mock.calls[0][0];
      await onCandle(makeCandle());

      // fetchBalance called only once (during syncPositionState)
      // Key: NOT called during start seeding or checkDrawdown
      const callsAfterConnect = exchange.fetchBalance.mock.calls.length;
      expect(callsAfterConnect).toBe(1); // 1 balance fetch during syncPositionState, no drawdown check
    });
  });
});
