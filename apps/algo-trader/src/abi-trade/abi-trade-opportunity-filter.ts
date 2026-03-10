/**
 * AbiTrade Opportunity Filter — Advanced filtering for arbitrage opportunities
 * Applies multiple filters and scoring mechanisms to prioritize the best opportunities
 */

import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';
import { MarketCorrelation, LatencyMetrics, RiskFactor } from './abi-trade-types';

export interface FilterCriteria {
  minProfitPercent?: number;
  maxLatencyDiff?: number;
  correlationThreshold?: number;
  excludeHighRisk?: boolean;
  volumeThreshold?: number;
  minConfidence?: number;
  maxAgeMs?: number;
}

export interface FilteringContext {
  correlations: MarketCorrelation[];
  latencyMetrics: LatencyMetrics[];
  riskFactors: RiskFactor[];
  volumeThreshold: number;
}

export class AbiTradeOpportunityFilter {
  private defaultCriteria: FilterCriteria = {
    minProfitPercent: 0.5,
    maxLatencyDiff: 500,
    correlationThreshold: 0.7,
    excludeHighRisk: true,
    volumeThreshold: 10000,
    minConfidence: 60,
    maxAgeMs: 5000,
  };

  /**
   * Filter opportunities based on multiple criteria
   */
  filterOpportunities(
    opportunities: IArbitrageOpportunity[],
    context: FilteringContext,
    criteria?: FilterCriteria
  ): IArbitrageOpportunity[] {
    const config = { ...this.defaultCriteria, ...criteria };

    return opportunities.filter(opp => {
      return (
        this.checkProfitThreshold(opp, config.minProfitPercent!) &&
        this.checkAge(opp, config.maxAgeMs!) &&
        this.checkRiskFactors(opp, context.riskFactors, config.excludeHighRisk!) &&
        this.checkCorrelation(opp, context.correlations, config.correlationThreshold!) &&
        this.checkLatency(opp, context.latencyMetrics, config.maxLatencyDiff!) &&
        this.checkVolumeThreshold(opp, context.volumeThreshold)
      );
    }).sort((a, b) => this.calculatePriorityScore(b, context) - this.calculatePriorityScore(a, context)); // Sort by priority
  }

  /**
   * Check if opportunity meets profit threshold
   */
  private checkProfitThreshold(opp: IArbitrageOpportunity, threshold: number): boolean {
    return opp.netProfitPercent >= threshold;
  }

  /**
   * Check if opportunity is not too old
   */
  private checkAge(opp: IArbitrageOpportunity, maxAgeMs: number): boolean {
    return Date.now() - opp.timestamp <= maxAgeMs;
  }

  /**
   * Check risk factors and exclude if too high risk
   */
  private checkRiskFactors(
    opp: IArbitrageOpportunity,
    riskFactors: RiskFactor[],
    excludeHighRisk: boolean
  ): boolean {
    if (!excludeHighRisk) {
      return true;
    }

    // Check if the opportunity involves exchanges with critical risk factors
    for (const risk of riskFactors) {
      if (risk.severity === 'critical') {
        if (opp.buyExchange.includes(risk.description) || opp.sellExchange.includes(risk.description)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check correlation between exchanges for this opportunity
   */
  private checkCorrelation(
    opp: IArbitrageOpportunity,
    correlations: MarketCorrelation[],
    threshold: number
  ): boolean {
    const relevantCorrelation = correlations.find(cor =>
      cor.exchanges.includes(opp.buyExchange) && cor.exchanges.includes(opp.sellExchange) && cor.symbol === opp.symbol
    );

    return relevantCorrelation ? relevantCorrelation.correlationCoefficient >= threshold : true;
  }

  /**
   * Check latency differences between exchanges
   */
  private checkLatency(
    opp: IArbitrageOpportunity,
    latencyMetrics: LatencyMetrics[],
    maxLatencyDiff: number
  ): boolean {
    const buyLatency = latencyMetrics.find(m => m.exchange === opp.buyExchange)?.avgLatency || 0;
    const sellLatency = latencyMetrics.find(m => m.exchange === opp.sellExchange)?.avgLatency || 0;
    const latencyDiff = Math.abs(buyLatency - sellLatency);

    return latencyDiff <= maxLatencyDiff;
  }

  /**
   * Check volume threshold for the symbol
   */
  private checkVolumeThreshold(opp: IArbitrageOpportunity, volumeThreshold: number): boolean {
    // Since volume data might not be directly available in the opportunity,
    // we return true as this should be checked elsewhere with more complete data
    return true;
  }

  /**
   * Calculate priority score for an opportunity based on multiple factors
   */
  calculatePriorityScore(opp: IArbitrageOpportunity, context: FilteringContext): number {
    let score = 0;

    // Base score on profit percentage (highest weight)
    score += opp.netProfitPercent * 10;

    // Bonus for higher estimated profit
    score += opp.estimatedProfitUsd / 10;

    // Adjust for spread percentage
    score += (opp.spreadPercent || 0) * 5;

    // Adjust for correlation (higher correlation = lower opportunity, but safer)
    const correlation = context.correlations.find(cor =>
      cor.exchanges.includes(opp.buyExchange) && cor.exchanges.includes(opp.sellExchange) && cor.symbol === opp.symbol
    );
    if (correlation) {
      // Lower score if correlation is too high (indicating less opportunity)
      score *= (1 - Math.min(correlation.correlationCoefficient * 0.2, 0.5));
    }

    // Penalty for high-risk exchanges
    const highRiskFactors = context.riskFactors.filter(risk =>
      risk.severity === 'high' && (opp.buyExchange.includes(risk.description) || opp.sellExchange.includes(risk.description))
    );
    score -= highRiskFactors.length * 10;

    // Bonus for stable exchanges (not in risk factors)
    const riskyExchanges = new Set(context.riskFactors.map(r => r.description));
    if (!riskyExchanges.has(opp.buyExchange) && !riskyExchanges.has(opp.sellExchange)) {
      score += 5;
    }

    // Adjust based on latency
    const buyLatency = context.latencyMetrics.find(m => m.exchange === opp.buyExchange)?.avgLatency || 0;
    const sellLatency = context.latencyMetrics.find(m => m.exchange === opp.sellExchange)?.avgLatency || 0;
    const avgLatency = (buyLatency + sellLatency) / 2;

    // Higher penalty for high latency (arbitrage needs speed)
    score -= Math.min(avgLatency / 10, 15);

    // Final score should not exceed 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Apply dynamic filtering based on market conditions
   */
  applyDynamicFilters(
    opportunities: IArbitrageOpportunity[],
    context: FilteringContext,
    marketVolatility: number
  ): IArbitrageOpportunity[] {
    // Adjust criteria based on market volatility
    const volatilityAdjustment = Math.min(marketVolatility * 10, 2); // Cap adjustment at 2%

    const adjustedCriteria: FilterCriteria = {
      ...this.defaultCriteria,
      minProfitPercent: (this.defaultCriteria.minProfitPercent || 0) + volatilityAdjustment,
    };

    return this.filterOpportunities(opportunities, context, adjustedCriteria);
  }

  /**
   * Get filtered opportunities with enhanced confidence scores
   */
  getFilteredWithConfidence(
    opportunities: IArbitrageOpportunity[],
    context: FilteringContext
  ): Array<IArbitrageOpportunity & { confidence: number }> {
    return this.filterOpportunities(opportunities, context)
      .map(opp => ({
        ...opp,
        confidence: this.calculateConfidenceScore(opp, context)
      }));
  }

  /**
   * Calculate confidence score for an opportunity
   */
  private calculateConfidenceScore(opp: IArbitrageOpportunity, context: FilteringContext): number {
    let score = 50; // Base score

    // Increase for higher profits
    score += Math.min(opp.netProfitPercent * 5, 20);

    // Increase for higher estimated profit
    score += Math.min(opp.estimatedProfitUsd / 100, 10);

    // Check correlation - too high correlation might indicate less opportunity
    const correlation = context.correlations.find(cor =>
      cor.exchanges.includes(opp.buyExchange) && cor.exchanges.includes(opp.sellExchange) && cor.symbol === opp.symbol
    );
    if (correlation) {
      // Ideal correlation is around 0.5-0.7 (some divergence but market is coherent)
      const idealCorrelationLow = 0.3;
      const idealCorrelationHigh = 0.7;
      if (correlation.correlationCoefficient >= idealCorrelationLow && correlation.correlationCoefficient <= idealCorrelationHigh) {
        score += 10;
      } else {
        score -= Math.abs(correlation.correlationCoefficient - 0.5) * 20;
      }
    }

    // Decrease for high risk
    const riskFactorsForOpp = context.riskFactors.filter(risk =>
      opp.buyExchange.includes(risk.description) || opp.sellExchange.includes(risk.description)
    );
    for (const risk of riskFactorsForOpp) {
      switch (risk.severity) {
        case 'low': score -= 2; break;
        case 'medium': score -= 5; break;
        case 'high': score -= 10; break;
        case 'critical': score -= 20; break;
      }
    }

    // Adjust for latency
    const buyLatency = context.latencyMetrics.find(m => m.exchange === opp.buyExchange)?.avgLatency || 0;
    const sellLatency = context.latencyMetrics.find(m => m.exchange === opp.sellExchange)?.avgLatency || 0;
    const avgLatency = (buyLatency + sellLatency) / 2;

    // Reduce confidence for high latency (arbitrage needs speed)
    score -= Math.min(avgLatency / 20, 15);

    // Clamp between 0-100
    return Math.max(0, Math.min(100, score));
  }
}