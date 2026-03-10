/**
 * SandwichDetector — identifies sandwich attack opportunities from pending txs.
 * Parses tx.data for swap signatures, estimates price impact, computes
 * frontrun/backrun profit after gas costs.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { PendingTransaction } from './mempool-monitor';

export interface SandwichOpportunity {
  victimTx: PendingTransaction;
  frontrunTrade: { asset: string; amount: number; price: number };
  backrunTrade: { asset: string; amount: number; price: number };
  estimatedProfitUsd: number;
  gasEstimateUsd: number;
  netProfitUsd: number;
  confidence: number;
}

interface SandwichDetectorConfig {
  minProfitUsd: number;
  maxGasUsd: number;
}

// Common ERC-20/Uniswap swap function selectors
const SWAP_SELECTORS = new Set([
  '0x38ed1739', // swapExactTokensForTokens
  '0x7ff36ab5', // swapExactETHForTokens
  '0x18cbafe5', // swapExactTokensForETH
  '0xfb3bdb41', // swapETHForExactTokens
  '0x5c11d795', // swapExactTokensForTokensSupportingFeeOnTransferTokens
]);

const ETH_PRICE_USD = 3000; // simulated price for profit calc
const SOL_PRICE_USD = 150;

export class SandwichDetector extends EventEmitter {
  private config: Required<SandwichDetectorConfig>;

  constructor(config: SandwichDetectorConfig) {
    super();
    this.config = {
      minProfitUsd: config.minProfitUsd,
      maxGasUsd: config.maxGasUsd,
    };
  }

  /**
   * Analyze a pending transaction against current orderbook data.
   * Returns a SandwichOpportunity if profitable, null otherwise.
   */
  analyze(
    tx: PendingTransaction,
    orderbookData: Map<string, { bid: number; ask: number }>,
  ): SandwichOpportunity | null {
    if (!this.isSwapTransaction(tx)) return null;

    const asset = this.inferAsset(tx);
    const book = orderbookData.get(asset);
    if (!book) return null;

    const priceUsd = tx.chain === 'ethereum' ? ETH_PRICE_USD : SOL_PRICE_USD;
    const txValueUsd = tx.value * priceUsd;

    // Estimate victim's slippage impact: ~1% of tx value
    const slippageImpact = txValueUsd * 0.01;
    const frontrunAmount = slippageImpact * 10; // buy before victim

    // Frontrun: buy at ask, backrun: sell at ask + impact
    const frontrunPrice = book.ask;
    const backrunPrice = book.ask + slippageImpact / frontrunAmount;

    const grossProfit = (backrunPrice - frontrunPrice) * frontrunAmount;
    const gasEstimateUsd = tx.gasPrice * 200000 * (priceUsd / 1e9); // 200k gas units
    const netProfitUsd = grossProfit - gasEstimateUsd;

    if (netProfitUsd < this.config.minProfitUsd) return null;
    if (gasEstimateUsd > this.config.maxGasUsd) return null;

    const confidence = Math.min(0.95, netProfitUsd / (netProfitUsd + gasEstimateUsd));

    const opportunity: SandwichOpportunity = {
      victimTx: tx,
      frontrunTrade: { asset, amount: frontrunAmount, price: frontrunPrice },
      backrunTrade: { asset, amount: frontrunAmount, price: backrunPrice },
      estimatedProfitUsd: grossProfit,
      gasEstimateUsd,
      netProfitUsd,
      confidence,
    };

    logger.debug(`[SandwichDetector] Opportunity: net=$${netProfitUsd.toFixed(2)} conf=${confidence.toFixed(2)}`);
    this.emit('opportunity', opportunity);
    return opportunity;
  }

  private isSwapTransaction(tx: PendingTransaction): boolean {
    if (tx.chain === 'solana') {
      // Solana: simplified — large value txs treated as swaps
      return tx.value > 0.1 && tx.data.length > 0;
    }
    // Ethereum: check 4-byte function selector
    const selector = tx.data.slice(0, 10);
    return SWAP_SELECTORS.has(selector);
  }

  private inferAsset(tx: PendingTransaction): string {
    // Simplified: derive asset name from tx.to address last 4 chars
    return `TOKEN_${tx.to.slice(-4).toUpperCase()}`;
  }
}
