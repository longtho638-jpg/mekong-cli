/**
 * ImpactAnalyzer — measures market impact of shadow-layering activity.
 * Compares pre/post trade flow and orderbook state to quantify spoofing effect.
 * SIMULATION ONLY.
 */

import { logger } from '../../../utils/logger';
import type { Trade, OrderbookSnapshot } from './exchange-simulator';

export interface ImpactReport {
  priceMovementPct: number;       // % price move from pre to post snapshot
  liquidationsTriggered: number;  // simulated stop-loss orders triggered
  botReactions: number;           // estimated algorithmic reactions (volume spikes)
  volumeIncrease: number;         // additional trade volume attributable to layering
  timestamp: number;
}

const STOP_LOSS_BAND_PCT = 0.5;  // orders within 0.5% of price movement = liquidated
const BOT_REACTION_RATIO = 0.3;  // 30% of volume increase assumed algo-driven

export class ImpactAnalyzer {
  private reports: ImpactReport[] = [];

  /**
   * Analyze the impact of a layering episode by comparing pre/post state.
   */
  analyze(
    preTrades: Trade[],
    postTrades: Trade[],
    preSnapshot: OrderbookSnapshot,
    postSnapshot: OrderbookSnapshot,
  ): ImpactReport {
    const priceMovementPct = preSnapshot.midPrice > 0
      ? ((postSnapshot.midPrice - preSnapshot.midPrice) / preSnapshot.midPrice) * 100
      : 0;

    const preVolume = preTrades.reduce((sum, t) => sum + t.size * t.price, 0);
    const postVolume = postTrades.reduce((sum, t) => sum + t.size * t.price, 0);
    const volumeIncrease = Math.max(0, postVolume - preVolume);

    // Estimate liquidations: count resting orders near the moved price range
    const priceMovedAbs = Math.abs(postSnapshot.midPrice - preSnapshot.midPrice);
    const stopBand = preSnapshot.midPrice * (STOP_LOSS_BAND_PCT / 100);
    const liquidationsTriggered = this.estimateLiquidations(
      priceMovementPct,
      priceMovedAbs,
      stopBand,
      preSnapshot,
    );

    const botReactions = Math.round(volumeIncrease * BOT_REACTION_RATIO / 1000);

    const report: ImpactReport = {
      priceMovementPct,
      liquidationsTriggered,
      botReactions,
      volumeIncrease,
      timestamp: Date.now(),
    };

    this.reports.push(report);

    logger.info(
      `[ImpactAnalyzer] Report: priceMovement=${priceMovementPct.toFixed(4)}% ` +
      `liquidations=${liquidationsTriggered} botReactions=${botReactions} ` +
      `volumeIncrease=${volumeIncrease.toFixed(2)}`,
    );

    return report;
  }

  getReports(): ImpactReport[] {
    return [...this.reports];
  }

  reset(): void {
    this.reports.length = 0;
  }

  private estimateLiquidations(
    priceMovementPct: number,
    priceMovedAbs: number,
    stopBand: number,
    preSnapshot: OrderbookSnapshot,
  ): number {
    if (priceMovedAbs < stopBand) return 0;

    // Count book levels within the price-moved range (proxy for stop-loss density)
    const relevantBook = priceMovementPct > 0 ? preSnapshot.asks : preSnapshot.bids;
    const threshold = priceMovedAbs;
    let count = 0;
    for (const level of relevantBook) {
      const dist = Math.abs(level.price - preSnapshot.midPrice);
      if (dist <= threshold) count++;
    }
    return count;
  }
}
