/**
 * AssetUniverseManager — coordinates liquidity scanning, volatility filtering,
 * backtesting, and risk adjustment into a single update cycle.
 */

import { EventEmitter } from 'events';
import { LiquidityScanner } from './liquidity-scanner';
import { VolatilityAnalyzer } from './volatility-analyzer';
import { BacktestScheduler } from './backtest-scheduler';
import { RiskAdjuster } from './risk-adjuster';
import type { AssetUniverseConfig, SymbolInfo } from '../expansion-config-types';

export { LiquidityScanner } from './liquidity-scanner';
export { VolatilityAnalyzer } from './volatility-analyzer';
export { BacktestScheduler } from './backtest-scheduler';
export { RiskAdjuster } from './risk-adjuster';

export interface UniverseSnapshot {
  symbols: SymbolInfo[];
  liveList: string[];
  updatedAt: number;
}

export class AssetUniverseManager extends EventEmitter {
  private readonly scanner: LiquidityScanner;
  private readonly analyzer: VolatilityAnalyzer;
  private readonly scheduler: BacktestScheduler;
  private readonly adjuster: RiskAdjuster;
  private readonly config: AssetUniverseConfig;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(config: AssetUniverseConfig) {
    super();
    this.config = config;
    this.scanner = new LiquidityScanner({ minVolume24h: config.minVolume24h });
    this.analyzer = new VolatilityAnalyzer({ bounds: config.volatilityBounds });
    this.scheduler = new BacktestScheduler({ sharpeThreshold: config.sharpeThreshold });
    this.adjuster = new RiskAdjuster({
      basePositionUsd: 1000,
      maxPositionUsd: 10_000,
      minPositionUsd: 100,
    });
  }

  /** Run one full update cycle: scan → filter → backtest → adjust. */
  async runCycle(): Promise<UniverseSnapshot> {
    const liquid = await this.scanner.scanLiquidSymbols();
    const volatilityFiltered = this.analyzer.filterByVolatility(liquid);
    await this.scheduler.scheduleBacktests(volatilityFiltered);
    this.adjuster.adjustAll(volatilityFiltered);

    const snapshot: UniverseSnapshot = {
      symbols: volatilityFiltered,
      liveList: this.scheduler.getLiveList(),
      updatedAt: Date.now(),
    };

    this.emit('cycle-complete', snapshot);
    return snapshot;
  }

  /** Start recurring update cycles. */
  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(
      () => void this.runCycle(),
      this.config.updateIntervalMs,
    );
    this.emit('started');
  }

  /** Stop recurring cycles. */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.emit('stopped');
    }
  }
}
