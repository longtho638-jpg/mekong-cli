/**
 * AbiTrade Risk Analyzer — Comprehensive risk assessment for arbitrage opportunities
 * Evaluates multiple risk factors to ensure safe and profitable trading
 */

import type { RiskFactor as RiskFactorType } from '../types/trading.types';
import { RiskFactor } from './abi-trade-types';

export interface RiskConfig {
  volatilityThreshold: number;
  liquidityThreshold: number;
  volumeThreshold: number;
  maxPositionSize: number;
  volatilityWindow: number;
  correlationRiskThreshold: number;
  latencyRiskThreshold: number;
}

export interface ExchangeRiskProfile {
  exchangeId: string;
  volatilityScore: number;
  liquidityScore: number;
  volumeScore: number;
  latencyScore: number;
  overallRiskScore: number;
}

interface ExchangePriceData {
  exchange: string;
  prices: number[];
  orderBook?: {
    bids: [number, number][];
    asks: [number, number][];
  };
  ticker: {
    quoteVolume?: number;
    baseVolume?: number;
    volume?: number;
    last: number;
  };
  latency?: number;
}

export class AbiTradeRiskAnalyzer {
  private config: RiskConfig;

  constructor(config?: Partial<RiskConfig>) {
    this.config = this.mergeDefaultConfig(config);
  }

  private mergeDefaultConfig(config?: Partial<RiskConfig>): RiskConfig {
    const defaults: RiskConfig = {
      volatilityThreshold: 0.02,
      liquidityThreshold: 100000,
      volumeThreshold: 10000,
      maxPositionSize: 5000,
      volatilityWindow: 20,
      correlationRiskThreshold: 0.9,
      latencyRiskThreshold: 1000,
    };

    return { ...defaults, ...config };
  }

  analyzeRiskFactors(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    riskFactors.push(...this.analyzeVolatilityRisk(symbol, priceData));
    riskFactors.push(...this.analyzeLiquidityRisk(symbol, priceData));
    riskFactors.push(...this.analyzeVolumeRisk(symbol, priceData));
    riskFactors.push(...this.analyzeLatencyRisk(symbol, priceData));
    riskFactors.push(...this.analyzeCorrelationRisk(symbol, priceData));

    return riskFactors;
  }

  private analyzeVolatilityRisk(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    for (const data of priceData) {
      const exchange = data.exchange;
      const prices = data.prices || [];

      if (prices.length >= this.config.volatilityWindow) {
        const returns = this.calculateReturns(prices.slice(-this.config.volatilityWindow));
        const volatility = this.calculateStdDev(returns);

        const severity = this.getSeverityFromValue(volatility, this.config.volatilityThreshold);

        riskFactors.push({
          type: 'volatility',
          severity,
          value: volatility,
          threshold: this.config.volatilityThreshold,
          description: `${exchange} volatility for ${symbol}: ${volatility.toFixed(4)}, threshold: ${this.config.volatilityThreshold}`
        });
      }
    }

    return riskFactors;
  }

  private analyzeLiquidityRisk(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    for (const data of priceData) {
      const exchange = data.exchange;
      const orderBook = data.orderBook;

      if (orderBook && orderBook.bids && orderBook.asks) {
        const bidVolume = orderBook.bids.slice(0, 5).reduce((sum, [price, amount]) => sum + (price * amount), 0);
        const askVolume = orderBook.asks.slice(0, 5).reduce((sum, [price, amount]) => sum + (price * amount), 0);
        const availableLiquidity = Math.min(bidVolume, askVolume);

        const severity = availableLiquidity < this.config.liquidityThreshold ? 'high' : 'low';

        riskFactors.push({
          type: 'liquidity',
          severity,
          value: availableLiquidity,
          threshold: this.config.liquidityThreshold,
          description: `${exchange} liquidity for ${symbol}: $${availableLiquidity.toFixed(2)}, threshold: $${this.config.liquidityThreshold}`
        });
      }
    }

    return riskFactors;
  }

  private analyzeVolumeRisk(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    for (const data of priceData) {
      const exchange = data.exchange;
      const ticker = data.ticker;

      const volume = ticker.quoteVolume || ticker.baseVolume || ticker.volume || 0;

      const severity = volume < this.config.volumeThreshold ? 'high' : 'low';

      riskFactors.push({
        type: 'volume',
        severity,
        value: volume,
        threshold: this.config.volumeThreshold,
        description: `${exchange} volume for ${symbol}: $${volume.toFixed(2)}, threshold: $${this.config.volumeThreshold}`
      });
    }

    return riskFactors;
  }

  private analyzeLatencyRisk(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    for (const data of priceData) {
      const exchange = data.exchange;
      const latency = data.latency || 0;

      const severity = latency > this.config.latencyRiskThreshold ? 'high' : 'low';

      riskFactors.push({
        type: 'latency',
        severity,
        value: latency,
        threshold: this.config.latencyRiskThreshold,
        description: `${exchange} latency for ${symbol}: ${latency}ms, threshold: ${this.config.latencyRiskThreshold}ms`
      });
    }

    return riskFactors;
  }

  private analyzeCorrelationRisk(symbol: string, priceData: ExchangePriceData[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    const exchangePrices: { [exchange: string]: number } = {};
    for (const data of priceData) {
      exchangePrices[data.exchange] = data.ticker.last;
    }

    const exchanges = Object.keys(exchangePrices);

    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const ex1 = exchanges[i];
        const ex2 = exchanges[j];
        const price1 = exchangePrices[ex1];
        const price2 = exchangePrices[ex2];

        const priceDiffPercent = Math.abs((price1 - price2) / ((price1 + price2) / 2)) * 100;

        const severity = priceDiffPercent < 0.1 ? 'high' : 'low';

        riskFactors.push({
          type: 'correlation',
          severity,
          value: priceDiffPercent,
          threshold: 0.1,
          description: `Correlation risk between ${ex1} and ${ex2} for ${symbol}: ${priceDiffPercent.toFixed(3)}% price difference`
        });
      }
    }

    return riskFactors;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const returnVal = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(returnVal);
    }

    return returns;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(variance);
  }

  private getSeverityFromValue(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value <= threshold * 0.5) {
      return 'low';
    } else if (value <= threshold) {
      return 'medium';
    } else if (value <= threshold * 2) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  getExchangeRiskProfile(exchangeId: string, riskFactors: RiskFactor[]): ExchangeRiskProfile {
    const exchangeFactors = riskFactors.filter(factor => factor.description.includes(exchangeId));

    let volatilityScore = 0;
    let liquidityScore = 0;
    let volumeScore = 0;
    let latencyScore = 0;

    let factorCount = 0;

    for (const factor of exchangeFactors) {
      factorCount++;
      switch (factor.type) {
        case 'volatility':
          volatilityScore = this.severityToScore(factor.severity);
          break;
        case 'liquidity':
          liquidityScore = this.severityToScore(factor.severity);
          break;
        case 'volume':
          volumeScore = this.severityToScore(factor.severity);
          break;
        case 'latency':
          latencyScore = this.severityToScore(factor.severity);
          break;
      }
    }

    const avgRiskScore = factorCount > 0
      ? (volatilityScore + liquidityScore + volumeScore + latencyScore) / factorCount
      : 0;

    return {
      exchangeId,
      volatilityScore,
      liquidityScore,
      volumeScore,
      latencyScore,
      overallRiskScore: avgRiskScore
    };
  }

  private severityToScore(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (severity) {
      case 'low': return 20;
      case 'medium': return 40;
      case 'high': return 70;
      case 'critical': return 95;
    }
  }

  getRiskSummary(riskFactors: RiskFactor[]): { [exchangeId: string]: ExchangeRiskProfile } {
    const exchangeIds = [...new Set(riskFactors.map(f =>
      f.description.split(' ')[0]
    ))];

    const summary: { [exchangeId: string]: ExchangeRiskProfile } = {};

    for (const exchangeId of exchangeIds) {
      summary[exchangeId] = this.getExchangeRiskProfile(exchangeId, riskFactors);
    }

    return summary;
  }

  isPositionSafe(positionSize: number, riskFactors: RiskFactor[]): boolean {
    if (positionSize > this.config.maxPositionSize) {
      return false;
    }

    const criticalRisks = riskFactors.filter(factor => factor.severity === 'critical');
    return criticalRisks.length === 0;
  }
}
