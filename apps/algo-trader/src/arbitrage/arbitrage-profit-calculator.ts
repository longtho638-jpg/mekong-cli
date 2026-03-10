/**
 * Arbitrage Profit Calculator — Fee-aware profit math
 */

import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';

interface PriceData {
  exchange: string;
  price: number;
  makerFee: number;
  takerFee: number;
}

export interface OpportunityCalculation {
  spreadPercent: number;
  netProfitPercent: number;
  estimatedProfitUsd: number;
}

export class ArbitrageProfitCalculator {
  private positionSizeUsd: number;
  private slippagePercent: number;

  constructor(positionSizeUsd: number = 1000, slippagePercent: number = 0.1) {
    this.positionSizeUsd = positionSizeUsd;
    this.slippagePercent = slippagePercent;
  }

  /**
   * Calculate arbitrage opportunity between two exchanges
   */
  calculate(
    buyData: PriceData,
    sellData: PriceData,
    symbol: string
  ): IArbitrageOpportunity | null {
    const { buyPrice, sellPrice } = this.normalizePrices(buyData, sellData);
    
    // Raw spread
    const spreadPercent = ((sellPrice - buyPrice) / buyPrice) * 100;

    // Total fees (taker on both sides)
    const totalFeesPercent = buyData.takerFee + sellData.takerFee;

    // Net profit after fees and slippage
    const netProfitPercent = spreadPercent - totalFeesPercent - (this.slippagePercent * 2);

    if (netProfitPercent <= 0) {
      return null; // Not profitable
    }

    const estimatedProfitUsd = (this.positionSizeUsd * netProfitPercent) / 100;
    const now = Date.now();

    return {
      id: `arb-${now}-${buyData.exchange}-${sellData.exchange}`,
      symbol,
      buyExchange: buyData.exchange,
      sellExchange: sellData.exchange,
      buyPrice,
      sellPrice,
      spreadPercent,
      netProfitPercent,
      estimatedProfitUsd,
      buyFee: buyData.takerFee,
      sellFee: sellData.takerFee,
      slippageEstimate: this.slippagePercent,
      timestamp: now,
      expiresAt: now + 5000, // 5s TTL
    };
  }

  /**
   * Find all profitable opportunities from a list of exchange prices
   */
  findOpportunities(
    prices: PriceData[],
    symbol: string,
    minNetProfitPercent: number = 0.5
  ): IArbitrageOpportunity[] {
    const opportunities: IArbitrageOpportunity[] = [];

    // Compare all pairs
    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue;

        const opp = this.calculate(prices[i], prices[j], symbol);
        if (opp && opp.netProfitPercent >= minNetProfitPercent) {
          opportunities.push(opp);
        }
      }
    }

    // Return best opportunity per symbol
    return opportunities
      .sort((a, b) => b.netProfitPercent - a.netProfitPercent)
      .slice(0, 1);
  }

  /**
   * Normalize prices — ensure buyPrice < sellPrice for correct calculation
   */
  private normalizePrices(
    buyData: PriceData,
    sellData: PriceData
  ): { buyPrice: number; sellPrice: number } {
    // If buy price is higher, swap (we want to buy low, sell high)
    if (buyData.price > sellData.price) {
      return { buyPrice: sellData.price, sellPrice: buyData.price };
    }
    return { buyPrice: buyData.price, sellPrice: sellData.price };
  }
}
