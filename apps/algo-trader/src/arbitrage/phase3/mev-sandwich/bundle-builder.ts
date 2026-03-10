/**
 * BundleBuilder — constructs Flashbots (Ethereum) and Jito (Solana) bundles
 * from detected sandwich opportunities. All bundles are simulated — no real signing.
 */

import { logger } from '../../../utils/logger';
import type { SandwichOpportunity } from './sandwich-detector';

export interface Bundle {
  chain: 'ethereum' | 'solana';
  transactions: Array<{ to: string; data: string; value: number; gasLimit: number }>;
  nonce: number;
  maxFeePerGas?: number;
  revertProtection: boolean;
}

const ETH_SWAP_SELECTOR = '0x7ff36ab5'; // swapExactETHForTokens
const SOL_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'; // Jupiter aggregator

export class BundleBuilder {
  private nonceCounter = 0;

  /**
   * Build an Ethereum Flashbots bundle (frontrun + victim + backrun).
   */
  buildEthBundle(opp: SandwichOpportunity): Bundle {
    this.nonceCounter++;
    const bundle: Bundle = {
      chain: 'ethereum',
      nonce: this.nonceCounter,
      maxFeePerGas: opp.victimTx.gasPrice * 1.1, // outbid victim slightly
      revertProtection: true,
      transactions: [
        // 1. Frontrun — buy before victim
        {
          to: opp.victimTx.to,
          data: ETH_SWAP_SELECTOR + this.encodeSwapParams(opp.frontrunTrade.asset, opp.frontrunTrade.amount),
          value: opp.frontrunTrade.amount,
          gasLimit: 200_000,
        },
        // 2. Victim tx (pass-through reference)
        {
          to: opp.victimTx.to,
          data: opp.victimTx.data,
          value: opp.victimTx.value,
          gasLimit: 250_000,
        },
        // 3. Backrun — sell after victim's price impact
        {
          to: opp.victimTx.to,
          data: ETH_SWAP_SELECTOR + this.encodeSwapParams(opp.backrunTrade.asset, opp.backrunTrade.amount),
          value: 0,
          gasLimit: 200_000,
        },
      ],
    };

    logger.debug(`[BundleBuilder] ETH bundle nonce=${bundle.nonce} txs=${bundle.transactions.length}`);
    return bundle;
  }

  /**
   * Build a Solana Jito bundle (frontrun + victim + backrun).
   */
  buildSolBundle(opp: SandwichOpportunity): Bundle {
    this.nonceCounter++;
    const bundle: Bundle = {
      chain: 'solana',
      nonce: this.nonceCounter,
      revertProtection: true, // Jito bundles are atomic
      transactions: [
        // 1. Frontrun
        {
          to: SOL_PROGRAM_ID,
          data: this.encodeSolSwap(opp.frontrunTrade.asset, opp.frontrunTrade.amount, 'buy'),
          value: opp.frontrunTrade.amount,
          gasLimit: 400_000, // compute units
        },
        // 2. Victim tx reference
        {
          to: opp.victimTx.to,
          data: opp.victimTx.data,
          value: opp.victimTx.value,
          gasLimit: 400_000,
        },
        // 3. Backrun
        {
          to: SOL_PROGRAM_ID,
          data: this.encodeSolSwap(opp.backrunTrade.asset, opp.backrunTrade.amount, 'sell'),
          value: 0,
          gasLimit: 400_000,
        },
      ],
    };

    logger.debug(`[BundleBuilder] SOL bundle nonce=${bundle.nonce} txs=${bundle.transactions.length}`);
    return bundle;
  }

  private encodeSwapParams(asset: string, amount: number): string {
    // Simulated ABI encoding — not real calldata
    return Buffer.from(`${asset}:${amount.toFixed(6)}`).toString('hex');
  }

  private encodeSolSwap(asset: string, amount: number, side: 'buy' | 'sell'): string {
    return Buffer.from(`sol:${side}:${asset}:${amount.toFixed(6)}`).toString('hex');
  }
}
