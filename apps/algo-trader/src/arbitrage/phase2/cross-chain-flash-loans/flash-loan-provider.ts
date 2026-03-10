/**
 * Flash Loan Provider — abstraction over on-chain flash loan sources.
 * Supports Aave v3 (Ethereum), Port Finance (Solana), and others.
 * Execution is simulated (no ethers.js / web3.js) — pure algorithm layer.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface FlashLoanQuote {
  provider: string;      // "aave_v3", "port_finance", "dydx"
  chain: string;
  asset: string;
  maxAmount: number;     // USD
  feePct: number;        // e.g. 0.0009 = 0.09% (Aave v3)
  gasEstimateUsd: number;
}

export interface FlashLoanExecution {
  quoteId: string;
  borrowAmount: number;
  repayAmount: number;   // borrowAmount * (1 + feePct) + gasEstimateUsd
  profitUsd: number;     // expectedProfit - fees
  success: boolean;
  txHash?: string;
}

interface ProviderAsset {
  asset: string;
  maxAmount: number;
  feePct: number;
}

/**
 * FlashLoanProvider manages available flash loan sources and simulates execution.
 *
 * Events:
 *   'quote:selected' — emitted when a best quote is chosen
 *   'execution:simulated' — emitted after simulate completes
 */
export class FlashLoanProvider extends EventEmitter {
  // chain:provider -> list of asset quotes
  private providers: Map<string, FlashLoanQuote[]> = new Map();

  /**
   * Register available flash loan sources for a chain/provider combo.
   */
  registerProvider(
    chain: string,
    provider: string,
    assets: ProviderAsset[],
    gasEstimateUsd = 5
  ): void {
    const key = `${chain}::${provider}`;
    const quotes: FlashLoanQuote[] = assets.map(a => ({
      provider,
      chain,
      asset: a.asset,
      maxAmount: a.maxAmount,
      feePct: a.feePct,
      gasEstimateUsd,
    }));
    this.providers.set(key, quotes);
    logger.info(`[FlashLoan] Registered provider ${provider} on ${chain} with ${assets.length} assets`);
  }

  /**
   * Get the best (lowest effective cost) quote for a given chain + asset + amount.
   * Returns null if no provider can cover the amount.
   */
  getBestQuote(chain: string, asset: string, amount: number): FlashLoanQuote | null {
    const candidates: FlashLoanQuote[] = [];

    for (const quotes of this.providers.values()) {
      for (const q of quotes) {
        if (q.chain === chain && q.asset === asset && q.maxAmount >= amount) {
          candidates.push(q);
        }
      }
    }

    if (candidates.length === 0) return null;

    // Best = lowest total cost (feePct * amount + gas)
    const best = candidates.reduce((a, b) => {
      const costA = a.feePct * amount + a.gasEstimateUsd;
      const costB = b.feePct * amount + b.gasEstimateUsd;
      return costA <= costB ? a : b;
    });

    this.emit('quote:selected', { quote: best, amount });
    return best;
  }

  /**
   * Simulate flash loan execution — pure math, no on-chain calls.
   * Returns profit after fees, or marks failure if profit is insufficient.
   */
  async simulateExecution(
    quote: FlashLoanQuote,
    amount: number,
    expectedProfit: number
  ): Promise<FlashLoanExecution> {
    const loanFeeUsd = quote.feePct * amount;
    const totalCost = loanFeeUsd + quote.gasEstimateUsd;
    const profitUsd = expectedProfit - totalCost;
    const repayAmount = amount + loanFeeUsd;
    const success = profitUsd > 0;

    const result: FlashLoanExecution = {
      quoteId: `${quote.provider}::${quote.chain}::${quote.asset}::${Date.now()}`,
      borrowAmount: amount,
      repayAmount,
      profitUsd,
      success,
      txHash: success ? `0xsim_${Date.now().toString(16)}` : undefined,
    };

    this.emit('execution:simulated', result);
    logger.info(
      `[FlashLoan] Simulated: provider=${quote.provider} amount=${amount} profit=${profitUsd.toFixed(2)} success=${success}`
    );

    return result;
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  clear(): void {
    this.providers.clear();
  }
}
