/**
 * Smart Order Router — finds profitable multi-hop routes across CEX, DEX, and bridges.
 * Supports optional flash loan amplification for capital-efficient arbitrage.
 *
 * No ethers.js / web3.js — pure TypeScript algorithm layer.
 */

import { EventEmitter } from 'events';
import { LicenseService, LicenseTier } from '../../../lib/raas-gate';
import { logger } from '../../../utils/logger';
import { DexRegistry } from './dex-node';
import { FlashLoanProvider } from './flash-loan-provider';

export interface RouteStep {
  type: 'cex_trade' | 'dex_swap' | 'bridge' | 'flash_loan_borrow' | 'flash_loan_repay';
  venue: string;
  chain?: string;
  inputAsset: string;
  outputAsset: string;
  inputAmount: number;
  outputAmount: number;
  feeUsd: number;
}

export interface RoutePath {
  steps: RouteStep[];
  totalProfitUsd: number;
  totalFeesUsd: number;
  totalGasUsd: number;
  netProfitUsd: number;
  totalLatencyMs: number;
  requiresFlashLoan: boolean;
  flashLoanAmount?: number;
}

export interface RouterConfig {
  minNetProfitUsd?: number;   // default 10
  maxHops?: number;           // default 5
  maxBridgeTimeMs?: number;   // default 30000
  enableFlashLoans?: boolean; // default true
}

const DEFAULT_CONFIG: Required<RouterConfig> = {
  minNetProfitUsd: 10,
  maxHops: 5,
  maxBridgeTimeMs: 30000,
  enableFlashLoans: true,
};

/**
 * SmartOrderRouter scans CEX prices and DEX nodes to identify profitable arbitrage paths.
 *
 * Route discovery strategy:
 *   1. CEX-only: buy on cheapest CEX, sell on most expensive
 *   2. CEX→DEX: buy on CEX, route through DEX for better exit
 *   3. Flash loan: amplify CEX-only spread using borrowed capital (PRO gate)
 *
 * Events:
 *   'route:found'   — emitted for each profitable route discovered
 *   'route:best'    — emitted when best route is selected
 */
export class SmartOrderRouter extends EventEmitter {
  private config: Required<RouterConfig>;

  constructor(
    private dexRegistry: DexRegistry,
    private flashLoanProvider: FlashLoanProvider,
    config: RouterConfig = {}
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Find all profitable routes for a given start asset and capital amount.
   * CEX prices map: symbol -> { bid, ask }
   */
  findRoutes(
    startAsset: string,
    amount: number,
    cexPrices: Map<string, { bid: number; ask: number }>
  ): RoutePath[] {
    const routes: RoutePath[] = [];

    // 1. CEX-only routes
    routes.push(...this._findCexRoutes(startAsset, amount, cexPrices));

    // 2. CEX→DEX routes
    routes.push(...this._findCexDexRoutes(startAsset, amount, cexPrices));

    // 3. Flash loan routes (PRO gate)
    if (this.config.enableFlashLoans) {
      routes.push(...this._findFlashLoanRoutes(startAsset, amount, cexPrices));
    }

    // Filter by min profit and max hops
    const filtered = routes.filter(
      r => r.netProfitUsd >= this.config.minNetProfitUsd &&
           r.steps.length <= this.config.maxHops
    );

    filtered.forEach(r => this.emit('route:found', r));
    return filtered;
  }

  /**
   * Returns the single most profitable route, or null if none passes filters.
   */
  findBestRoute(
    startAsset: string,
    amount: number,
    cexPrices: Map<string, { bid: number; ask: number }>
  ): RoutePath | null {
    const routes = this.findRoutes(startAsset, amount, cexPrices);
    if (routes.length === 0) return null;

    const best = routes.reduce((a, b) => a.netProfitUsd >= b.netProfitUsd ? a : b);
    this.emit('route:best', best);
    logger.info(`[Router] Best route: hops=${best.steps.length} netProfit=$${best.netProfitUsd.toFixed(2)} flashLoan=${best.requiresFlashLoan}`);
    return best;
  }

  /**
   * Simulate execution of a route — validates expected profit holds under mock slippage.
   */
  async simulateRoute(route: RoutePath): Promise<{ success: boolean; actualProfit: number }> {
    // Apply 0.1% slippage to each non-fee-paying step
    const slippageFactor = Math.pow(0.999, route.steps.filter(s => s.type !== 'flash_loan_borrow').length);
    const actualProfit = route.netProfitUsd * slippageFactor;
    const success = actualProfit > 0;

    logger.info(`[Router] Simulate: netProfit=${route.netProfitUsd.toFixed(2)} actualProfit=${actualProfit.toFixed(2)} success=${success}`);
    return { success, actualProfit };
  }

  // ─── Private route builders ────────────────────────────────────────────────

  private _findCexRoutes(
    asset: string,
    amount: number,
    cexPrices: Map<string, { bid: number; ask: number }>
  ): RoutePath[] {
    const routes: RoutePath[] = [];
    const entries = Array.from(cexPrices.entries());

    for (let i = 0; i < entries.length; i++) {
      for (let j = 0; j < entries.length; j++) {
        if (i === j) continue;
        const [buyVenue, buyPrices] = entries[i];
        const [sellVenue, sellPrices] = entries[j];

        // Buy at ask on buyVenue, sell at bid on sellVenue
        const spread = sellPrices.bid - buyPrices.ask;
        if (spread <= 0) continue;

        const tradeFeeUsd = amount * 0.001 * 2; // 0.1% each side
        const grossProfit = (spread / buyPrices.ask) * amount;
        const netProfitUsd = grossProfit - tradeFeeUsd;

        if (netProfitUsd <= 0) continue;

        const steps: RouteStep[] = [
          {
            type: 'cex_trade',
            venue: buyVenue,
            inputAsset: 'USD',
            outputAsset: asset,
            inputAmount: amount,
            outputAmount: amount / buyPrices.ask,
            feeUsd: tradeFeeUsd / 2,
          },
          {
            type: 'cex_trade',
            venue: sellVenue,
            inputAsset: asset,
            outputAsset: 'USD',
            inputAmount: amount / buyPrices.ask,
            outputAmount: amount + grossProfit,
            feeUsd: tradeFeeUsd / 2,
          },
        ];

        routes.push({
          steps,
          totalProfitUsd: grossProfit,
          totalFeesUsd: tradeFeeUsd,
          totalGasUsd: 0,
          netProfitUsd,
          totalLatencyMs: 200,
          requiresFlashLoan: false,
        });
      }
    }

    return routes;
  }

  private _findCexDexRoutes(
    asset: string,
    amount: number,
    cexPrices: Map<string, { bid: number; ask: number }>
  ): RoutePath[] {
    const routes: RoutePath[] = [];
    const dexNodes = this.dexRegistry.getAllNodes().filter(n => n.symbol.includes(asset));

    for (const [buyVenue, buyPrices] of cexPrices.entries()) {
      for (const dexNode of dexNodes) {
        // Model: buy on CEX, swap on DEX for better effective price
        const dexEffectiveRate = 1 / (buyPrices.ask * (1 + dexNode.feePct));
        const cexEffectiveRate = 1 / buyPrices.ask;

        if (dexEffectiveRate <= cexEffectiveRate) continue;
        if (dexNode.liquidity < amount) continue;

        const tradeFeeUsd = amount * 0.001;       // CEX buy fee
        const dexFeeUsd = amount * dexNode.feePct;
        const gasUsd = dexNode.gasEstimateUsd;
        const grossProfit = amount * (dexEffectiveRate - cexEffectiveRate);
        const netProfitUsd = grossProfit - tradeFeeUsd - dexFeeUsd - gasUsd;

        if (netProfitUsd <= 0) continue;

        const steps: RouteStep[] = [
          {
            type: 'cex_trade',
            venue: buyVenue,
            chain: dexNode.chain,
            inputAsset: 'USD',
            outputAsset: asset,
            inputAmount: amount,
            outputAmount: amount / buyPrices.ask,
            feeUsd: tradeFeeUsd,
          },
          {
            type: 'dex_swap',
            venue: dexNode.id,
            chain: dexNode.chain,
            inputAsset: asset,
            outputAsset: 'USD',
            inputAmount: amount / buyPrices.ask,
            outputAmount: amount + grossProfit,
            feeUsd: dexFeeUsd,
          },
        ];

        routes.push({
          steps,
          totalProfitUsd: grossProfit,
          totalFeesUsd: tradeFeeUsd + dexFeeUsd,
          totalGasUsd: gasUsd,
          netProfitUsd,
          totalLatencyMs: 500,
          requiresFlashLoan: false,
        });
      }
    }

    return routes;
  }

  private _findFlashLoanRoutes(
    asset: string,
    amount: number,
    cexPrices: Map<string, { bid: number; ask: number }>
  ): RoutePath[] {
    // PRO license required for flash loan execution
    if (!LicenseService.getInstance().hasTier(LicenseTier.PRO)) {
      logger.warn('[Router] Flash loan routes require PRO license — skipped');
      return [];
    }

    const routes: RoutePath[] = [];
    // Amplify capital: borrow 10x
    const borrowAmount = amount * 10;
    const quote = this.flashLoanProvider.getBestQuote('ethereum', asset, borrowAmount);
    if (!quote) return [];

    const cexRoutes = this._findCexRoutes(asset, borrowAmount, cexPrices);

    for (const baseRoute of cexRoutes) {
      const loanFeeUsd = quote.feePct * borrowAmount + quote.gasEstimateUsd;
      const netProfitUsd = baseRoute.netProfitUsd - loanFeeUsd;
      if (netProfitUsd <= 0) continue;

      const flashBorrowStep: RouteStep = {
        type: 'flash_loan_borrow',
        venue: quote.provider,
        chain: quote.chain,
        inputAsset: 'USD',
        outputAsset: asset,
        inputAmount: 0,
        outputAmount: borrowAmount,
        feeUsd: 0,
      };

      const flashRepayStep: RouteStep = {
        type: 'flash_loan_repay',
        venue: quote.provider,
        chain: quote.chain,
        inputAsset: asset,
        outputAsset: 'USD',
        inputAmount: borrowAmount,
        outputAmount: 0,
        feeUsd: loanFeeUsd,
      };

      routes.push({
        steps: [flashBorrowStep, ...baseRoute.steps, flashRepayStep],
        totalProfitUsd: baseRoute.totalProfitUsd,
        totalFeesUsd: baseRoute.totalFeesUsd + loanFeeUsd,
        totalGasUsd: baseRoute.totalGasUsd + quote.gasEstimateUsd,
        netProfitUsd,
        totalLatencyMs: baseRoute.totalLatencyMs + 100,
        requiresFlashLoan: true,
        flashLoanAmount: borrowAmount,
      });
    }

    return routes;
  }
}
