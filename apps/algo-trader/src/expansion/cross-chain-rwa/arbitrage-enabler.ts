/**
 * Detects cross-chain arbitrage paths and enables them when profitable.
 */

import { EventEmitter } from 'events';
import type { ArbPath, RwaPrice } from '../expansion-config-types';

export interface ArbitrageEnablerConfig {
  minProfitBps: number;
}

export class ArbitrageEnabler extends EventEmitter {
  private readonly config: ArbitrageEnablerConfig;
  private readonly activePaths: ArbPath[] = [];

  constructor(config: ArbitrageEnablerConfig) {
    super();
    this.config = config;
  }

  /**
   * Given prices from two chains for the same asset, compute arb opportunity.
   * Simulates a 0.1% bridge fee on each leg.
   */
  evaluate(
    asset: string,
    fromChain: string,
    fromPrice: number,
    toChain: string,
    toPrice: number,
  ): ArbPath | null {
    const bridgeFeeBps = 10; // 0.1% per leg
    const grossProfitBps = Math.round(((toPrice - fromPrice) / fromPrice) * 10_000);
    const netProfitBps = grossProfitBps - bridgeFeeBps * 2;

    if (netProfitBps < this.config.minProfitBps) return null;

    const path: ArbPath = { fromChain, toChain, asset, profitBps: netProfitBps };
    this.activePaths.push(path);
    this.emit('path-found', path);
    return path;
  }

  /**
   * Scans all price combinations across chains for arb paths.
   */
  scanPaths(
    prices: RwaPrice[],
    connectedChains: string[],
  ): ArbPath[] {
    this.activePaths.length = 0;
    const byAsset = new Map<string, RwaPrice[]>();

    for (const p of prices) {
      const list = byAsset.get(p.asset) ?? [];
      list.push(p);
      byAsset.set(p.asset, list);
    }

    const found: ArbPath[] = [];
    for (const [asset, assetPrices] of byAsset) {
      for (let i = 0; i < assetPrices.length; i++) {
        for (let j = i + 1; j < assetPrices.length; j++) {
          const a = assetPrices[i];
          const b = assetPrices[j];
          if (!connectedChains.includes(a.asset) && !connectedChains.includes(b.asset)) {
            const path = this.evaluate(asset, 'chainA', a.price, 'chainB', b.price);
            if (path) found.push(path);
          }
        }
      }
    }

    return found;
  }

  getActivePaths(): ArbPath[] {
    return [...this.activePaths];
  }
}
