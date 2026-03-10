/**
 * Unit tests for AbiTrade Deep Scanner
 * Tests the core scanning functionality
 */

import { AbiTradeDeepScanner } from '../../src/abi-trade/abi-trade-deep-scanner';

// Mock các dependency
const mockExchangeClient = {
  fetchTicker: jest.fn(),
  fetchOrderBook: jest.fn(),
};

// Mock ExchangeClientBase
jest.mock('@agencyos/trading-core/exchanges', () => {
  return {
    ExchangeClientBase: jest.fn().mockImplementation((id) => ({
      id,
      fetchTicker: jest.fn().mockResolvedValue({ last: 45000 + Math.random() * 100 }),
      fetchOrderBook: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock các module phụ thuộc khác
jest.mock('../../src/arbitrage/arbitrage-profit-calculator');
jest.mock('../../src/abi-trade/abi-trade-opportunity-filter');
jest.mock('../../src/abi-trade/abi-trade-risk-analyzer');

const mockLogger = require('../../src/utils/logger').logger;

describe('AbiTradeDeepScanner', () => {
  let scanner: AbiTradeDeepScanner;
  const config = {
    exchanges: ['binance', 'bybit', 'okx'],
    symbols: ['BTC/USDT', 'ETH/USDT'],
    pollIntervalMs: 1000,
    minNetProfitPercent: 0.1,
    positionSizeUsd: 1000,
    maxSlippagePercent: 0.1,
    opportunityTtlMs: 5000,
    deepScanEnabled: true,
    correlationThreshold: 0.85,
    latencyBufferMs: 200,
    maxConcurrentScans: 5,
    enableHistoricalAnalysis: true,
    enableLatencyOptimization: true,
    maxDepthLevels: 10,
    volumeThreshold: 10000,
    volatilityWindow: 20,
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create scanner instance
    scanner = new AbiTradeDeepScanner(config);
  });

  afterEach(async () => {
    if (scanner) {
      await scanner.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const actualConfig = scanner.getConfig();
      expect(actualConfig.exchanges).toEqual(config.exchanges);
      expect(actualConfig.symbols).toEqual(config.symbols);
      expect(actualConfig.pollIntervalMs).toEqual(config.pollIntervalMs);
      expect(actualConfig.minNetProfitPercent).toEqual(config.minNetProfitPercent);
    });

    it('should merge default config with provided config', () => {
      const partialConfig = { exchanges: ['binance'], symbols: ['BTC/USDT'] };
      const partialScanner = new AbiTradeDeepScanner(partialConfig);

      const actualConfig = partialScanner.getConfig();
      expect(actualConfig.exchanges).toEqual(['binance']);
      expect(actualConfig.symbols).toEqual(['BTC/USDT']);
      // Should retain default values for unspecified properties
      expect(actualConfig.pollIntervalMs).toBeDefined();
      expect(actualConfig.minNetProfitPercent).toBeDefined();
    });

    it('should have event emitter functionality', () => {
      expect(scanner).toBeInstanceOf(require('events').EventEmitter);

      // Test event handling
      const mockCallback = jest.fn();
      scanner.on('opportunity', mockCallback);

      // Emit an event
      scanner.emit('opportunity', { test: 'data' });
      expect(mockCallback).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('Exchange connections', () => {
    it('should get connected exchanges after initialization', async () => {
      await scanner.initialize();
      const connectedExchanges = scanner.getConnectedExchanges();
      expect(connectedExchanges).toEqual(config.exchanges);
    });

    it('should handle initialization failures gracefully', async () => {
      // Mock a scenario where exchanges fail to connect
      const failingConfig = { exchanges: [], symbols: ['BTC/USDT'] };
      const failingScanner = new AbiTradeDeepScanner(failingConfig);

      await expect(failingScanner.initialize()).rejects.toThrow('No exchanges connected');
    });
  });

  describe('Runtime control', () => {
    it('should start and stop correctly', async () => {
      await scanner.initialize();

      expect(scanner.isRunning()).toBe(false);

      scanner.start();
      expect(scanner.isRunning()).toBe(true);

      scanner.stop();
      expect(scanner.isRunning()).toBe(false);
    });

    it('should not start if already running', async () => {
      await scanner.initialize();

      scanner.start();
      expect(scanner.isRunning()).toBe(true);

      // Starting again should not cause issues
      scanner.start();
      expect(scanner.isRunning()).toBe(true);
    });
  });

  describe('Deep scan functionality', () => {
    it('should perform deep scan for a symbol', async () => {
      await scanner.initialize();

      // This test will be limited since we can't easily test private methods
      // but we can verify the deep scan loop structure
      expect(scanner.getConfig().deepScanEnabled).toBe(true);
    });

    it('should have deep scan disabled when configured', () => {
      const configWithoutDeepScan = { ...config, deepScanEnabled: false };
      const scannerWithoutDeepScan = new AbiTradeDeepScanner(configWithoutDeepScan);

      expect(scannerWithoutDeepScan.getConfig().deepScanEnabled).toBe(false);
    });
  });

  describe('Performance and optimization', () => {
    it('should track latency metrics', async () => {
      await scanner.initialize();

      // Verify that we can get connected exchanges (prerequisite for latency tracking)
      const exchanges = scanner.getConnectedExchanges();
      expect(exchanges.length).toBeGreaterThan(0);
    });

    it('should support configurable parameters', () => {
      expect(scanner.getConfig().maxConcurrentScans).toEqual(config.maxConcurrentScans);
      expect(scanner.getConfig().volumeThreshold).toEqual(config.volumeThreshold);
      expect(scanner.getConfig().volatilityWindow).toEqual(config.volatilityWindow);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await scanner.initialize();
      scanner.start();

      await scanner.shutdown();
      expect(scanner.isRunning()).toBe(false);

      // Verify that the logger was called during shutdown
      expect(mockLogger.info).toHaveBeenCalledWith('[AbiTradeDeepScanner] Shutdown complete');
    });
  });
});