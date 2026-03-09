/**
 * Yield Optimizer — barrel exports and main loop.
 * Module 3 of Phase 8 OmniNet Genesis.
 *
 * Main loop: poll AMMs → calculate IL → optimize hedge → rebalance → detect arb.
 * All disabled by default; dry-run mode active.
 */

import { EventEmitter } from 'events';
import { AmmMonitor } from './amm-monitor';
import { ImpermanentLossCalculator } from './impermanent-loss-calculator';
import { HedgeOptimizer } from './hedge-optimizer';
import { AllocationExecutor } from './allocation-executor';
import { ArbitrageDetector } from './arbitrage-detector';
import type { CexQuote } from './arbitrage-detector';
import type { HedgeInstrument } from './hedge-optimizer';

export { AmmMonitor } from './amm-monitor';
export type { PoolState, AmmMonitorConfig } from './amm-monitor';

export { ImpermanentLossCalculator } from './impermanent-loss-calculator';
export type { ILResult, V3TickParams } from './impermanent-loss-calculator';

export { HedgeOptimizer } from './hedge-optimizer';
export type { HedgeInstrument, HedgeOptimizationResult, HedgeOptimizerConfig } from './hedge-optimizer';

export { AllocationExecutor } from './allocation-executor';
export type { RebalanceAction, AllocationState, AllocationExecutorConfig } from './allocation-executor';

export { ArbitrageDetector } from './arbitrage-detector';
export type { CexQuote, ArbOpportunityDetected, ArbitrageDetectorConfig } from './arbitrage-detector';

export interface YieldOptimizerConfig {
  enabled: boolean;
  ammPools: string[];
  hedgeInstruments: string[];
  rebalanceIntervalSec: number;
  minArbitrageProfitUsd: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: YieldOptimizerConfig = {
  enabled: false,
  ammPools: ['uniswap_v3_eth_usdc', 'curve_tricrypto', 'balancer_bb_a_usd'],
  hedgeInstruments: ['eth_perp_binance', 'btc_option_deribit'],
  rebalanceIntervalSec: 60,
  minArbitrageProfitUsd: 20,
  dryRun: true,
};

/** Mock CEX quote generator for dry-run testing. */
function mockCexQuote(symbol: string, basePrice: number): CexQuote {
  const spread = basePrice * 0.001;
  return {
    symbol,
    bid: basePrice - spread / 2,
    ask: basePrice + spread / 2,
    exchange: 'binance',
    timestamp: Date.now(),
  };
}

const MOCK_INSTRUMENTS: HedgeInstrument[] = [
  { id: 'eth_perp_binance', type: 'perp', costPerUnit: 0.0003, deltaPerUnit: 0.9 },
  { id: 'btc_option_deribit', type: 'option', costPerUnit: 0.005, deltaPerUnit: 0.5 },
];

export class YieldOptimizer extends EventEmitter {
  private readonly cfg: YieldOptimizerConfig;
  readonly monitor: AmmMonitor;
  readonly ilCalc: ImpermanentLossCalculator;
  readonly hedger: HedgeOptimizer;
  readonly executor: AllocationExecutor;
  readonly detector: ArbitrageDetector;
  private rebalanceTimer: ReturnType<typeof setInterval> | null = null;
  /** Track entry prices per pool for IL calculation. */
  private entryPrices = new Map<string, number>();

  constructor(config: Partial<YieldOptimizerConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };

    this.monitor = new AmmMonitor({ poolIds: this.cfg.ammPools, dryRun: this.cfg.dryRun });
    this.ilCalc = new ImpermanentLossCalculator();
    this.hedger = new HedgeOptimizer({ dryRun: this.cfg.dryRun });
    this.executor = new AllocationExecutor({ dryRun: this.cfg.dryRun });
    this.detector = new ArbitrageDetector({ minProfitUsd: this.cfg.minArbitrageProfitUsd });

    // Capture entry prices on first poll
    this.monitor.on('pool:updated', (state) => {
      if (!this.entryPrices.has(state.poolId)) {
        this.entryPrices.set(state.poolId, state.price);
      }
    });

    this.detector.on('opportunity:detected', (opp) => this.emit('arb:opportunity', opp));
  }

  async start(): Promise<void> {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }

    this.monitor.start();

    const intervalMs = this.cfg.rebalanceIntervalSec * 1000;
    this.rebalanceTimer = setInterval(() => this.runCycle(), intervalMs);
    this.emit('started', { pools: this.cfg.ammPools });
  }

  stop(): void {
    this.monitor.stop();
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
      this.rebalanceTimer = null;
    }
    this.emit('stopped');
  }

  /** Run one update cycle: IL calc → hedge optimize → rebalance → arb scan. */
  runCycle(): void {
    const pools = this.monitor.getAllStates();
    const instrument = MOCK_INSTRUMENTS[0];

    for (const pool of pools) {
      const entryPrice = this.entryPrices.get(pool.poolId) ?? pool.price;
      const liquidityUsd = pool.liquidity * 0.01; // manage 1% of pool

      // IL calc
      const il = this.ilCalc.calculateV2(entryPrice, pool.price, liquidityUsd);
      this.emit('il:calculated', { poolId: pool.poolId, il });

      // Hedge optimization
      const hedgeResult = this.hedger.optimize(entryPrice, pool.price, liquidityUsd, instrument);
      this.emit('hedge:optimized', { poolId: pool.poolId, hedgeResult });

      // Rebalance if net benefit positive
      if (hedgeResult.netBenefitUsd > 0) {
        const actions = this.executor.rebalance(
          pool.poolId,
          liquidityUsd,
          hedgeResult.optimalRatio,
          instrument.id,
        );
        this.emit('rebalance:executed', { poolId: pool.poolId, actions });
      }

      // Arb detection
      const cex = mockCexQuote(pool.token0, pool.price * (1 + (Math.random() - 0.5) * 0.005));
      this.detector.detect(pool, cex);
    }
  }
}
