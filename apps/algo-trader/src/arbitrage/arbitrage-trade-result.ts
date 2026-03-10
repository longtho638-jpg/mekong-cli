/**
 * Arbitrage Trade Result Type
 *
 * Defines the structure for tracking arbitrage execution outcomes,
 * including atomic buy+sell pair tracking and profit calculation.
 */

import { IOrder } from '../interfaces/IExchange';
import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';

export type ArbTradeStatus = 'success' | 'partial_fill' | 'failed' | 'dry_run' | 'rejected';

export interface ArbitrageTradeResult {
  opportunity: IArbitrageOpportunity;
  status: ArbTradeStatus;
  buyOrder: IOrder | null;
  sellOrder: IOrder | null;
  actualBuyPrice: number;
  actualSellPrice: number;
  actualProfitUsd: number;
  actualProfitPercent: number;
  executionTimeMs: number;
  error?: string;
  timestamp: number;
}

/**
 * Calculate actual profit from executed orders
 * Handles partial fills by using actual filled amounts
 */
export function calculateActualProfit(
  buyOrder: IOrder | null,
  sellOrder: IOrder | null
): { profitUsd: number; profitPercent: number } {
  if (!buyOrder || !sellOrder) {
    return { profitUsd: 0, profitPercent: 0 };
  }

  const cost = buyOrder.amount * buyOrder.price;
  const revenue = sellOrder.amount * sellOrder.price;
  const profitUsd = revenue - cost;
  const profitPercent = cost > 0 ? (profitUsd / cost) * 100 : 0;

  return { profitUsd, profitPercent };
}

/**
 * Create a rejected trade result
 */
export function createRejectedResult(
  opportunity: IArbitrageOpportunity,
  error: string,
  executionTimeMs: number
): ArbitrageTradeResult {
  return {
    opportunity,
    status: 'rejected',
    buyOrder: null,
    sellOrder: null,
    actualBuyPrice: 0,
    actualSellPrice: 0,
    actualProfitUsd: 0,
    actualProfitPercent: 0,
    executionTimeMs,
    error,
    timestamp: Date.now(),
  };
}

/**
 * Create a dry-run trade result (simulated execution)
 */
export function createDryRunResult(
  opportunity: IArbitrageOpportunity,
  executionTimeMs: number
): ArbitrageTradeResult {
  return {
    opportunity,
    status: 'dry_run',
    buyOrder: null,
    sellOrder: null,
    actualBuyPrice: opportunity.buyPrice,
    actualSellPrice: opportunity.sellPrice,
    actualProfitUsd: opportunity.estimatedProfitUsd,
    actualProfitPercent: opportunity.netProfitPercent,
    executionTimeMs,
    timestamp: Date.now(),
  };
}
