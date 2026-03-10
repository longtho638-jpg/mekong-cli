/**
 * SentinelExecutor — SIMULATION ONLY.
 * Evaluates macro drift signals and generates mock trade orders.
 * No real orders are placed. Tracks simulated PnL for backtesting.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { MacroDriftSignal } from './signal-fusion-engine';

export interface SimulatedTrade {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  size: number;   // USD notional
  price: number;  // mock spot price
  timestamp: number;
  signal: MacroDriftSignal;
}

// Mock spot prices for simulation
const MOCK_PRICES: Record<string, number> = {
  BTC: 87_400,
  ETH: 3_820,
  SOL: 178,
};

const TRADE_SIZE_USD = 1_000; // fixed notional per signal

export class SentinelExecutor extends EventEmitter {
  private tradeCount = 0;
  private simulatedPnl = 0;
  private openPositions = new Map<string, SimulatedTrade>();

  evaluateAndExecute(signal: MacroDriftSignal, threshold: number): SimulatedTrade | null {
    if (signal.strength < threshold || signal.direction === 'neutral') {
      return null;
    }

    // Choose asset based on highest expected return (simple: rotate through list)
    const assets = ['BTC', 'ETH', 'SOL'];
    const asset = assets[this.tradeCount % assets.length];
    const side: SimulatedTrade['side'] = signal.direction === 'bullish' ? 'buy' : 'sell';

    // Close any open position for this asset and realise mock PnL
    const existing = this.openPositions.get(asset);
    if (existing) {
      const entryPrice = existing.price;
      const exitPrice = MOCK_PRICES[asset] * (1 + (Math.random() - 0.48) * 0.02);
      const pnl = existing.side === 'buy'
        ? (exitPrice - entryPrice) / entryPrice * TRADE_SIZE_USD
        : (entryPrice - exitPrice) / entryPrice * TRADE_SIZE_USD;
      this.simulatedPnl += pnl;
      logger.debug(`[SentinelExecutor] Closed ${asset} PnL=${pnl.toFixed(2)} totalPnL=${this.simulatedPnl.toFixed(2)}`);
      this.openPositions.delete(asset);
    }

    const trade: SimulatedTrade = {
      id: `sim_${Date.now()}_${asset}`,
      asset,
      side,
      size: TRADE_SIZE_USD,
      price: MOCK_PRICES[asset] * (1 + (Math.random() - 0.5) * 0.001),
      timestamp: Date.now(),
      signal,
    };

    this.tradeCount++;
    this.openPositions.set(asset, trade);
    logger.info(`[SentinelExecutor] SIM TRADE ${side.toUpperCase()} ${asset} @${trade.price.toFixed(2)} strength=${signal.strength.toFixed(3)}`);
    this.emit('trade', trade);
    return trade;
  }

  getStats(): { trades: number; simulatedPnl: number } {
    return { trades: this.tradeCount, simulatedPnl: this.simulatedPnl };
  }
}
