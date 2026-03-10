/**
 * AbiTrade Deep Scanner — Advanced arbitrage opportunity detection
 */

import { EventEmitter } from 'events';
import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';
import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';
import { ArbitrageProfitCalculator } from '../arbitrage/arbitrage-profit-calculator';
import { logger } from '../utils/logger';
import { AbiTradeOpportunityFilter } from './abi-trade-opportunity-filter';
import { AbiTradeRiskAnalyzer } from './abi-trade-risk-analyzer';

import {
  AbiTradeScanConfig,
  DeepScanResult,
  MarketCorrelation,
  LatencyMetrics,
  RiskFactor,
} from './abi-trade-types';

interface PriceDataItem {
  exchange: string;
  ticker: unknown;
  orderBook: unknown | null;
  trades: unknown | null;
  makerFee: number;
  takerFee: number;
}

interface DeepScanAggregate {
  totalOpportunities: number;
  avgConfidence: number;
  highestConfidence: number;
  avgCorrelation: number;
  riskSummary: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  timestamp: number;
}

interface PriceHistory {
  exchange: string;
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class AbiTradeDeepScanner extends EventEmitter {
  private config: AbiTradeScanConfig;
  private calculator: ArbitrageProfitCalculator;
  private filter: AbiTradeOpportunityFilter;
  private riskAnalyzer: AbiTradeRiskAnalyzer;
  private exchangeClients: Map<string, ExchangeClientBase> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;
  private deepScanInterval: NodeJS.Timeout | null = null;
  private running = false;
  private historicalData: Map<string, PriceHistory[]> = new Map();
  private latencyHistory: Map<string, number[]> = new Map();

  constructor(config?: Partial<AbiTradeScanConfig>) {
    super();
    this.config = this.mergeDefaultConfig(config);
    this.calculator = new ArbitrageProfitCalculator(
      this.config.positionSizeUsd,
      this.config.maxSlippagePercent
    );
    this.filter = new AbiTradeOpportunityFilter();
    this.riskAnalyzer = new AbiTradeRiskAnalyzer(this.config);
  }

  private mergeDefaultConfig(config?: Partial<AbiTradeScanConfig>): AbiTradeScanConfig {
    const defaults: AbiTradeScanConfig = {
      exchanges: ['binance', 'bybit', 'okx'],
      symbols: ['BTC/USDT', 'ETH/USDT'],
      pollIntervalMs: 10000,
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

    return { ...defaults, ...config };
  }

  async initialize(): Promise<void> {
    logger.info(`[AbiTradeDeepScanner] Initializing with ${this.config.exchanges.length} exchanges`);

    for (const exchangeId of this.config.exchanges) {
      try {
        const client = new ExchangeClientBase(exchangeId);
        await (client as any).initialize?.();
        this.exchangeClients.set(exchangeId, client);
        logger.debug(`[AbiTradeDeepScanner] Connected to ${exchangeId}`);
      } catch (error) {
        logger.error(`[AbiTradeDeepScanner] Failed to connect to ${exchangeId}: ${error}`);
      }
    }

    if (this.exchangeClients.size === 0) {
      throw new Error('No exchanges connected');
    }

    await this.initializeHistoricalData();
  }

  private async initializeHistoricalData(): Promise<void> {
    if (!this.config.enableHistoricalAnalysis) return;

    logger.info('[AbiTradeDeepScanner] Initializing historical data...');

    for (const symbol of this.config.symbols) {
      const symbolHistory: PriceHistory[] = [];

      for (const [exchangeId, client] of this.exchangeClients.entries()) {
        try {
          const ticker = await client.fetchTicker(symbol);
          symbolHistory.push({
            exchange: exchangeId,
            symbol,
            timestamp: Date.now(),
            open: this.getTickerNumber(ticker, 'open'),
            high: this.getTickerNumber(ticker, 'high'),
            low: this.getTickerNumber(ticker, 'low'),
            close: this.getTickerNumber(ticker, 'close'),
            volume: this.getTickerNumber(ticker, 'quoteVolume'),
          });
        } catch (error) {
          logger.warn(`[AbiTradeDeepScanner] Could not fetch data for ${exchangeId} ${symbol}: ${error}`);
        }
      }

      this.historicalData.set(`${symbol}_${Array.from(this.exchangeClients.keys()).join('_')}`, symbolHistory);
    }
  }

  private getTickerNumber(ticker: unknown, prop: string): number {
    if (typeof ticker === 'object' && ticker !== null && prop in ticker) {
      const val = (ticker as Record<string, unknown>)[prop];
      return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val) : 0;
    }
    return typeof ticker === 'number' ? ticker : 0;
  }

  start(): void {
    if (this.running) {
      logger.warn('[AbiTradeDeepScanner] Already running');
      return;
    }

    this.running = true;
    logger.info(`[AbiTradeDeepScanner] Starting scan loop (interval: ${this.config.pollIntervalMs}ms)`);

    this.scanLoop();
    if (this.config.deepScanEnabled) {
      this.deepScanLoop();
    }

    this.scanInterval = setInterval(() => this.scanLoop(), this.config.pollIntervalMs);

    if (this.config.deepScanEnabled) {
      this.deepScanInterval = setInterval(
        () => this.deepScanLoop(),
        this.config.pollIntervalMs * 10
      );
    }
  }

  stop(): void {
    this.running = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.deepScanInterval) {
      clearInterval(this.deepScanInterval);
      this.deepScanInterval = null;
    }
    logger.info('[AbiTradeDeepScanner] Stopped');
  }

  async shutdown(): Promise<void> {
    this.stop();
    for (const client of this.exchangeClients.values()) {
      await (client as any).close?.();
    }
    this.exchangeClients.clear();
    logger.info('[AbiTradeDeepScanner] Shutdown complete');
  }

  private async scanLoop(): Promise<void> {
    if (!this.running) return;

    try {
      const startTime = Date.now();
      for (const symbol of this.config.symbols) {
        await this.scanSymbol(symbol);
      }
      logger.debug(`[AbiTradeDeepScanner] Regular scan completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error(`[AbiTradeDeepScanner] Regular scan error: ${error}`);
    }
  }

  private async deepScanLoop(): Promise<void> {
    if (!this.running || !this.config.deepScanEnabled) return;

    try {
      const startTime = Date.now();
      logger.info('[AbiTradeDeepScanner] Starting deep scan...');

      const results: DeepScanResult[] = [];
      for (const symbol of this.config.symbols) {
        const result = await this.performDeepScan(symbol);
        results.push(result);
        this.emit('deepScanResult', result);
      }

      logger.info(`[AbiTradeDeepScanner] Deep scan completed in ${Date.now() - startTime}ms`);

      const aggregateResult = this.aggregateResults(results);
      this.emit('deepScanAggregate', aggregateResult);

    } catch (error) {
      logger.error(`[AbiTradeDeepScanner] Deep scan error: ${error}`);
    }
  }

  private async performDeepScan(symbol: string): Promise<DeepScanResult> {
    const clients = Array.from(this.exchangeClients.entries());

    const pricePromises = clients.map(async ([exchangeId, client]) => {
      try {
        const ticker = await client.fetchTicker(symbol);
        return {
          exchange: exchangeId,
          ticker,
          orderBook: null,
          trades: null,
          makerFee: 0.001,
          takerFee: 0.001,
        };
      } catch (error) {
        logger.debug(`[AbiTradeDeepScanner] ${exchangeId} ${symbol} fetch failed: ${error}`);
        return null;
      }
    });

    const results = await Promise.allSettled(pricePromises);
    const priceData: PriceDataItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        priceData.push(result.value);
      }
    }

    if (priceData.length < 2) {
      return {
        opportunities: [],
        correlations: [],
        latencyMetrics: [],
        riskFactors: [],
        scanDurationMs: 0,
        confidenceScore: 0
      };
    }

    const correlations = this.calculateCorrelations(symbol, priceData);
    const riskFactors = this.riskAnalyzer.analyzeRiskFactors(symbol, priceData as any);
    const latencyMetrics = this.getLatencyMetrics(symbol);

    const basicPrices = priceData.map(pd => ({
      exchange: pd.exchange,
      price: this.getTickerNumber(pd.ticker, 'last'),
      makerFee: pd.makerFee,
      takerFee: pd.takerFee,
    }));

    const opportunities = this.calculator.findOpportunities(
      basicPrices,
      symbol,
      this.config.minNetProfitPercent
    );

    const filteredOpportunities = this.filter.filterOpportunities(opportunities, {
      correlations,
      latencyMetrics,
      riskFactors,
      volumeThreshold: this.config.volumeThreshold,
    });

    return {
      opportunities: filteredOpportunities,
      correlations,
      latencyMetrics,
      riskFactors,
      scanDurationMs: Date.now(),
      confidenceScore: this.calculateConfidenceScore(filteredOpportunities, correlations, riskFactors),
    };
  }

  private calculateCorrelations(symbol: string, priceData: PriceDataItem[]): MarketCorrelation[] {
    if (priceData.length < 2) return [];

    const correlations: MarketCorrelation[] = [];

    for (let i = 0; i < priceData.length; i++) {
      for (let j = i + 1; j < priceData.length; j++) {
        const first = priceData[i];
        const second = priceData[j];

        const firstLast = this.getTickerNumber(first.ticker, 'last');
        const secondLast = this.getTickerNumber(second.ticker, 'last');

        const priceDelta = Math.abs(firstLast - secondLast);
        const avgPrice = (firstLast + secondLast) / 2;
        const normalizedDelta = avgPrice > 0 ? (priceDelta / avgPrice) * 100 : 0;

        const correlationCoeff = 1 - Math.min(normalizedDelta / 5, 1);

        correlations.push({
          symbol,
          exchanges: [first.exchange, second.exchange],
          correlationCoefficient: correlationCoeff,
          priceDelta: normalizedDelta,
          volumeDelta: Math.abs(
            this.getTickerNumber(first.ticker, 'quoteVolume') -
            this.getTickerNumber(second.ticker, 'quoteVolume')
          ),
          timestamp: Date.now(),
        });
      }
    }

    return correlations;
  }

  private getLatencyMetrics(symbol: string): LatencyMetrics[] {
    const metrics: LatencyMetrics[] = [];

    for (const [exchangeId] of this.exchangeClients.entries()) {
      const key = `${exchangeId}_${symbol}`;
      const history = this.latencyHistory.get(key) || [];

      if (history.length > 0) {
        const avgLatency = history.reduce((sum, val) => sum + val, 0) / history.length;
        metrics.push({
          exchange: exchangeId,
          symbol,
          avgLatency,
          minLatency: Math.min(...history),
          maxLatency: Math.max(...history),
          timestamp: Date.now(),
        });
      }
    }

    return metrics;
  }

  private calculateConfidenceScore(
    opportunities: IArbitrageOpportunity[],
    correlations: MarketCorrelation[],
    riskFactors: RiskFactor[]
  ): number {
    let score = 50;
    score += opportunities.length * 10;

    const avgCorrelation = correlations.length > 0
      ? correlations.reduce((sum, c) => sum + c.correlationCoefficient, 0) / correlations.length
      : 0;
    score += avgCorrelation * 30;

    const highRiskCount = riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    score -= highRiskCount * 15;

    return Math.max(0, Math.min(100, score));
  }

  private aggregateResults(results: DeepScanResult[]): DeepScanAggregate {
    const allOpportunities = results.flatMap(r => r.opportunities);
    const allCorrelations = results.flatMap(r => r.correlations);
    const allRiskFactors = results.flatMap(r => r.riskFactors);
    const avgConfidence = results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length;

    return {
      totalOpportunities: allOpportunities.length,
      avgConfidence,
      highestConfidence: Math.max(...results.map(r => r.confidenceScore)),
      avgCorrelation: allCorrelations.length > 0
        ? allCorrelations.reduce((sum, c) => sum + c.correlationCoefficient, 0) / allCorrelations.length
        : 0,
      riskSummary: {
        low: allRiskFactors.filter(r => r.severity === 'low').length,
        medium: allRiskFactors.filter(r => r.severity === 'medium').length,
        high: allRiskFactors.filter(r => r.severity === 'high').length,
        critical: allRiskFactors.filter(r => r.severity === 'critical').length,
      },
      timestamp: Date.now(),
    };
  }

  private async scanSymbol(symbol: string): Promise<void> {
    const clients = Array.from(this.exchangeClients.entries());

    const pricePromises = clients.map(async ([exchangeId, client]) => {
      try {
        const price = await client.fetchTicker(symbol);
        const numericPrice = this.getTickerNumber(price, 'last');
        const fees = await this.getExchangeFees(client, exchangeId, symbol);
        return {
          exchange: exchangeId,
          price: numericPrice,
          makerFee: fees.maker,
          takerFee: fees.taker,
        };
      } catch (error) {
        logger.debug(`[AbiTradeDeepScanner] ${exchangeId} ${symbol} fetch failed: ${error}`);
        return null;
      }
    });

    const results = await Promise.allSettled(pricePromises);
    const prices: { exchange: string; price: number; makerFee: number; takerFee: number }[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        prices.push(result.value);
      }
    }

    if (prices.length < 2) return;

    const opportunities = this.calculator.findOpportunities(
      prices,
      symbol,
      this.config.minNetProfitPercent
    );

    for (const opp of opportunities) {
      logger.info(
        `[AbiTradeDeepScanner] Opportunity: ${opp.symbol} | Buy ${opp.buyExchange} @ ${opp.buyPrice} | Sell ${opp.sellExchange} @ ${opp.sellPrice} | Net: ${opp.netProfitPercent.toFixed(2)}% ($${opp.estimatedProfitUsd.toFixed(2)})`
      );
      this.emit('opportunity', opp);
    }
  }

  private async getExchangeFees(
    client: ExchangeClientBase,
    _exchangeId: string,
    symbol: string
  ): Promise<{ maker: number; taker: number }> {
    try {
      if (typeof (client as any).fetchTradingFee === 'function') {
        const fee = await (client as any).fetchTradingFee(symbol);
        return { maker: fee.maker, taker: fee.taker };
      }

      const exchange = (client as any).exchange;
      if (exchange && exchange.fees) {
        return {
          maker: exchange.fees.trading.maker,
          taker: exchange.fees.trading.taker,
        };
      }

      return { maker: 0.001, taker: 0.001 };
    } catch {
      return { maker: 0.001, taker: 0.001 };
    }
  }

  getConnectedExchanges(): string[] {
    return Array.from(this.exchangeClients.keys());
  }

  isRunning(): boolean {
    return this.running;
  }

  getConfig(): AbiTradeScanConfig {
    return { ...this.config };
  }
}
