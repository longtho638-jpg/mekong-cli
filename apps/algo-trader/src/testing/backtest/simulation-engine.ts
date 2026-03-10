/**
 * Simulation Engine for Historical Backtesting
 * Replays market data tick-by-tick, applying slippage, fees, and latency
 */

import { MarketDataEvent } from './data-loader';
import { StateManager } from './state-manager';
import { MetricsCollector } from './metrics-collector';
import { StrategyInstance } from './strategy-loader';
import { FeeConfig } from './backtest-config-types';

export interface SimulationConfig {
  latencyMs: number;
  batchSize: number;
  deterministicSeed?: number;
  fees?: Record<string, FeeConfig>;
}

export class SimulationEngine {
  private config: SimulationConfig;
  private stateManager: StateManager;
  private metricsCollector: MetricsCollector;
  private seed: number;

  constructor(
    config: SimulationConfig,
    stateManager: StateManager,
    metricsCollector: MetricsCollector,
  ) {
    this.config = config;
    this.stateManager = stateManager;
    this.metricsCollector = metricsCollector;
    this.seed = config.deterministicSeed ?? 12345;
  }

  async runSimulation(
    events: MarketDataEvent[],
    strategies: StrategyInstance[],
  ): Promise<void> {
    const batchSize = this.config.batchSize;
    const currentPrices = new Map<string, number>();

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await this.processBatch(batch, strategies, currentPrices);
    }
  }

  private async processBatch(
    batch: MarketDataEvent[],
    strategies: StrategyInstance[],
    currentPrices: Map<string, number>,
  ): Promise<void> {
    for (const event of batch) {
      currentPrices.set(event.source, event.price);

      // Apply simulated latency offset (deterministic, not real sleep)
      const effectiveTimestamp = event.timestamp + this.simulateLatency();

      // Feed to each enabled strategy
      for (const instance of strategies) {
        const candle = {
          timestamp: effectiveTimestamp,
          open: event.price,
          high: event.price * 1.001,
          low: event.price * 0.999,
          close: event.price,
          volume: event.volume ?? 1,
        };

        try {
          const signal = await instance.strategy.onCandle(candle);
          if (signal && signal.type !== 'NONE') {
            const side = signal.type === 'BUY' ? 'buy' : 'sell';
            const volume = event.volume ?? 0.1;
            const slippagePrice = this.applySlippage(event.price, volume, side);
            const fees = this.applyFees(slippagePrice * volume, event.source, 'taker');

            const order = this.stateManager.openOrder({
              asset: event.source,
              side,
              price: slippagePrice,
              quantity: volume,
              exchange: event.source,
              timestamp: effectiveTimestamp,
            });

            const trade = this.stateManager.executeFill(order, slippagePrice, fees);
            if (trade.profit !== 0 || side === 'sell') {
              this.metricsCollector.recordTrade(trade);
            }
          }
        } catch {
          // Strategy errors are non-fatal in backtest
        }
      }

      this.stateManager.recordEquityPoint(effectiveTimestamp, currentPrices);
      const ep = this.stateManager.getEquityCurve();
      if (ep.length > 0) {
        this.metricsCollector.recordEquityPoint(ep[ep.length - 1]);
      }
    }
  }

  applySlippage(price: number, volume: number, side: 'buy' | 'sell'): number {
    // Market impact: larger volume = more slippage
    const impactBps = Math.min(volume * 0.5, 10); // max 10 bps
    const slippage = price * (impactBps / 10000);
    return side === 'buy' ? price + slippage : price - slippage;
  }

  applyFees(amount: number, exchange: string, side: 'maker' | 'taker'): number {
    const feeConfig = this.config.fees?.[exchange] ?? this.config.fees?.['default'];
    if (!feeConfig) return amount * 0.001;
    const rate = side === 'taker'
      ? (feeConfig.taker ?? feeConfig.fee ?? 0.001)
      : (feeConfig.maker ?? feeConfig.fee ?? 0.001);
    return amount * rate;
  }

  simulateLatency(): number {
    // Deterministic jitter: LCG-based pseudo-random
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    const rand = (this.seed >>> 0) / 0xffffffff;
    return Math.floor(rand * this.config.latencyMs);
  }
}
