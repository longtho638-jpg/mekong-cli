/**
 * Tests for AbiTrade Deep Scanner
 * Validates the functionality of the AbiTrade deep scan implementation
 */

import { AbiTradeDeepScanner } from '../../src/abi-trade/abi-trade-deep-scanner';
import { AbiTradeOpportunityFilter } from '../../src/abi-trade/abi-trade-opportunity-filter';
import { AbiTradeRiskAnalyzer } from '../../src/abi-trade/abi-trade-risk-analyzer';
import { IArbitrageOpportunity } from '../../src/interfaces/IArbitrageOpportunity';

describe('AbiTradeDeepScanner', () => {
  let scanner: AbiTradeDeepScanner;

  beforeEach(() => {
    const config = {
      exchanges: ['binance', 'bybit'],
      symbols: ['BTC/USDT', 'ETH/USDT'],
      pollIntervalMs: 1000,
      minNetProfitPercent: 0.5,
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

    scanner = new AbiTradeDeepScanner(config);
  });

  afterEach(async () => {
    if (scanner.isRunning()) {
      scanner.stop();
    }
    await scanner.shutdown();
  });

  it('should initialize with correct configuration', () => {
    const config = scanner.getConfig();
    expect(config.exchanges).toContain('binance');
    expect(config.symbols).toContain('BTC/USDT');
    expect(config.deepScanEnabled).toBe(true);
    expect(config.correlationThreshold).toBe(0.85);
  });

  it('should handle scan loop without errors', async () => {
    // Mock the exchange clients to prevent actual API calls
    (scanner as any).exchangeClients = new Map();

    // Mock exchange client
    const mockExchangeClient = {
      fetchTicker: jest.fn().mockResolvedValue({ last: 45000 }),
      fetchOHLCV: jest.fn().mockResolvedValue([]),
      fetchOrderBook: jest.fn().mockResolvedValue({ bids: [], asks: [] }),
      fetchTrades: jest.fn().mockResolvedValue([])
    };

    (scanner as any).exchangeClients.set('binance', mockExchangeClient);
    (scanner as any).exchangeClients.set('bybit', mockExchangeClient);

    // Test basic scan
    await expect((scanner as any).scanLoop()).resolves.not.toThrow();
  });

  it('should calculate confidence score', () => {
    const opportunities: IArbitrageOpportunity[] = [{
      id: 'test-1',
      symbol: 'BTC/USDT',
      buyExchange: 'binance',
      sellExchange: 'bybit',
      buyPrice: 45000,
      sellPrice: 45100,
      spreadPercent: 0.22,
      netProfitPercent: 0.15,
      estimatedProfitUsd: 1.50,
      buyFee: 0.001,
      sellFee: 0.001,
      slippageEstimate: 0.001,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5000,
    }];

    const correlations = [];
    const riskFactors = [];

    const score = (scanner as any).calculateConfidenceScore(opportunities, correlations, riskFactors);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should aggregate results correctly', () => {
    const mockResults = [{
      opportunities: [{ id: 'opp1' }],
      correlations: [{ symbol: 'BTC/USDT', exchanges: ['binance', 'bybit'], correlationCoefficient: 0.9, priceDelta: 0.1, volumeDelta: 1000, timestamp: Date.now() }],
      latencyMetrics: [],
      riskFactors: [],
      scanDurationMs: 100,
      confidenceScore: 85
    }, {
      opportunities: [{ id: 'opp2' }],
      correlations: [{ symbol: 'ETH/USDT', exchanges: ['binance', 'bybit'], correlationCoefficient: 0.8, priceDelta: 0.2, volumeDelta: 2000, timestamp: Date.now() }],
      latencyMetrics: [],
      riskFactors: [],
      scanDurationMs: 120,
      confidenceScore: 75
    }];

    const aggregated = (scanner as any).aggregateResults(mockResults);
    expect(aggregated.totalOpportunities).toBe(2);
    expect(aggregated.avgConfidence).toBeCloseTo(80, 0); // (85+75)/2
  });
});

describe('AbiTradeOpportunityFilter', () => {
  let filter: AbiTradeOpportunityFilter;

  beforeEach(() => {
    filter = new AbiTradeOpportunityFilter();
  });

  it('should filter opportunities based on profit threshold', () => {
    const opportunities: IArbitrageOpportunity[] = [
      {
        id: 'opp1',
        symbol: 'BTC/USDT',
        buyExchange: 'binance',
        sellExchange: 'bybit',
        buyPrice: 45000,
        sellPrice: 45100,
        spreadPercent: 0.22,
        netProfitPercent: 0.6, // Above threshold
        estimatedProfitUsd: 6.00,
        buyFee: 0.001,
        sellFee: 0.001,
        slippageEstimate: 0.001,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5000,
      },
      {
        id: 'opp2',
        symbol: 'ETH/USDT',
        buyExchange: 'binance',
        sellExchange: 'bybit',
        buyPrice: 3000,
        sellPrice: 3005,
        spreadPercent: 0.17,
        netProfitPercent: 0.1, // Below threshold
        estimatedProfitUsd: 1.00,
        buyFee: 0.001,
        sellFee: 0.001,
        slippageEstimate: 0.001,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5000,
      }
    ];

    const context = {
      correlations: [],
      latencyMetrics: [],
      riskFactors: [],
      volumeThreshold: 10000
    };

    const filtered = filter.filterOpportunities(opportunities, context);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('opp1');
  });

  it('should calculate priority score', () => {
    const opportunity: IArbitrageOpportunity = {
      id: 'test-opp',
      symbol: 'BTC/USDT',
      buyExchange: 'binance',
      sellExchange: 'bybit',
      buyPrice: 45000,
      sellPrice: 45100,
      spreadPercent: 0.22,
      netProfitPercent: 0.6,
      estimatedProfitUsd: 6.00,
      buyFee: 0.001,
      sellFee: 0.001,
      slippageEstimate: 0.001,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5000,
    };

    const context = {
      correlations: [],
      latencyMetrics: [],
      riskFactors: [],
      volumeThreshold: 10000
    };

    const score = filter.calculatePriorityScore(opportunity, context);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('AbiTradeRiskAnalyzer', () => {
  let analyzer: AbiTradeRiskAnalyzer;

  beforeEach(() => {
    analyzer = new AbiTradeRiskAnalyzer();
  });

  it('should create with default configuration', () => {
    const config = (analyzer as any).config;
    expect(config.volatilityThreshold).toBe(0.02);
    expect(config.liquidityThreshold).toBe(100000);
    expect(config.maxPositionSize).toBe(5000);
  });

  it('should analyze risk factors', () => {
    const mockPriceData = [
      {
        exchange: 'binance',
        ticker: { last: 45000, quoteVolume: 1000000 },
        orderBook: {
          bids: [[44999, 1], [44998, 2]],
          asks: [[45001, 1], [45002, 2]]
        },
        latency: 100,
        prices: [45000, 45010, 44990, 45005, 45015] // Historical prices for volatility calc
      },
      {
        exchange: 'bybit',
        ticker: { last: 45005, quoteVolume: 800000 },
        orderBook: {
          bids: [[45004, 1], [45003, 2]],
          asks: [[45006, 1], [45007, 2]]
        },
        latency: 150,
        prices: [45005, 45015, 44995, 45010, 45020] // Historical prices for volatility calc
      }
    ];

    const riskFactors = analyzer.analyzeRiskFactors('BTC/USDT', mockPriceData);

    // Should have risk factors for volatility, liquidity, volume, latency, and correlation
    expect(Array.isArray(riskFactors)).toBe(true);
    expect(riskFactors.length).toBeGreaterThan(0);
  });

  it('should determine severity from value correctly', () => {
    // Access the private method through type assertion to test it
    const getSeverityFromValue = (analyzer as any).getSeverityFromValue;

    // Value less than threshold should be low
    expect(getSeverityFromValue(0.005, 0.02)).toBe('low');

    // Value at threshold should be high (0.5x threshold = low, <= threshold = medium, <= 2x threshold = high, > 2x = critical)
    // Actually, threshold * 0.5 = 0.01, so values <= 0.01 are low, values <= 0.02 are medium
    expect(getSeverityFromValue(0.02, 0.02)).toBe('medium'); // At threshold becomes medium

    // Value slightly above threshold should be high (<= 2x threshold = high)
    expect(getSeverityFromValue(0.03, 0.02)).toBe('high'); // 1.5x threshold = high

    // Value well above threshold should be critical
    expect(getSeverityFromValue(0.05, 0.02)).toBe('critical'); // More than 2x threshold = critical
  });

  it('should convert severity to numeric score', () => {
    const severityToScore = (analyzer as any).severityToScore;

    expect(severityToScore('low')).toBe(20);
    expect(severityToScore('medium')).toBe(40);
    expect(severityToScore('high')).toBe(70);
    expect(severityToScore('critical')).toBe(95);
  });

  it('should calculate returns from prices', () => {
    const calculateReturns = (analyzer as any).calculateReturns;
    const prices = [100, 105, 103, 107]; // 4 prices = 3 returns

    const returns = calculateReturns(prices);
    expect(returns.length).toBe(3);

    // First return: (105-100)/100 = 0.05
    expect(returns[0]).toBeCloseTo(0.05, 4);

    // Second return: (103-105)/105 ≈ -0.0190
    expect(returns[1]).toBeCloseTo(-0.0190, 4);

    // Third return: (107-103)/103 ≈ 0.0388
    expect(returns[2]).toBeCloseTo(0.0388, 4);
  });
});