/**
 * Real-time Arbitrage Scanner — Listens to WebSocket price feeds across
 * multiple exchanges, maintains latest bid/ask per exchange:symbol,
 * and emits 'opportunity' events when profitable spreads are detected.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import type { PriceTick } from './websocket-multi-exchange-price-feed-manager';
import { FeeAwareCrossExchangeSpreadCalculator, type SpreadResult, type SpreadCalculatorConfig } from './fee-aware-cross-exchange-spread-calculator';

export interface ArbitrageScannerConfig {
  symbols: string[];
  /** Min net spread to emit opportunity. Default 0.0005 (0.05%) */
  minNetSpreadPct?: number;
  /** Scan interval (ms). Default 500 */
  scanIntervalMs?: number;
  /** Position size for profit estimation. Default 1000 USD */
  positionSizeUsd?: number;
  /** Stale tick threshold (ms). Default 10_000 */
  staleTickMs?: number;
}

export interface ArbitrageOpportunity {
  spread: SpreadResult;
  scannedAt: number;
  tickAgeBuyMs: number;
  tickAgeSellMs: number;
}

export interface ScannerStats {
  totalScans: number;
  opportunitiesFound: number;
  hitRatePct: number;
  avgNetSpreadPct: number;
  bestSpreadPct: number;
  lastScanAt: number;
}

export class RealtimeArbitrageScanner extends EventEmitter {
  private latestTicks = new Map<string, PriceTick>(); // key: exchange:symbol
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private stats: ScannerStats = {
    totalScans: 0,
    opportunitiesFound: 0,
    hitRatePct: 0,
    avgNetSpreadPct: 0,
    bestSpreadPct: 0,
    lastScanAt: 0,
  };
  private spreadSumPct = 0;
  private readonly config: Required<ArbitrageScannerConfig>;
  private readonly spreadCalc: FeeAwareCrossExchangeSpreadCalculator;

  constructor(
    config: ArbitrageScannerConfig,
    exchangeClients: Record<string, { fetchTradingFee(symbol: string): Promise<{ taker?: number }> }> = {},
  ) {
    super();
    this.config = {
      symbols: config.symbols,
      minNetSpreadPct: config.minNetSpreadPct ?? 0.0005,
      scanIntervalMs: config.scanIntervalMs ?? 500,
      positionSizeUsd: config.positionSizeUsd ?? 1000,
      staleTickMs: config.staleTickMs ?? 10_000,
    };

    const calcConfig: SpreadCalculatorConfig = {
      minProfitThresholdPct: this.config.minNetSpreadPct,
      positionSizeUsd: this.config.positionSizeUsd,
    };
    this.spreadCalc = new FeeAwareCrossExchangeSpreadCalculator(exchangeClients, calcConfig);
  }

  /** Feed a price tick (call from WS manager event handler) */
  onTick(tick: PriceTick): void {
    const key = `${tick.exchange}:${tick.symbol}`;
    this.latestTicks.set(key, tick);
  }

  /** Start periodic scanning */
  start(): void {
    if (this.scanTimer) return;
    this.scanTimer = setInterval(() => void this.scan(), this.config.scanIntervalMs);
    this.scanTimer.unref();
    logger.info(`[ArbScanner] Started — ${this.config.symbols.length} symbols, interval ${this.config.scanIntervalMs}ms`);
  }

  /** Stop scanning */
  stop(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    logger.info('[ArbScanner] Stopped');
  }

  /** Run a single scan across all exchange pairs */
  async scan(): Promise<ArbitrageOpportunity[]> {
    const now = Date.now();
    this.stats.totalScans++;
    this.stats.lastScanAt = now;

    // Filter out stale ticks
    const freshTicks = new Map<string, PriceTick>();
    for (const [key, tick] of this.latestTicks) {
      if ((now - tick.timestamp) < this.config.staleTickMs) {
        freshTicks.set(key, tick);
      }
    }

    const opportunities: ArbitrageOpportunity[] = [];

    try {
      const spreads = await this.spreadCalc.calculateAllSpreads(freshTicks, this.config.symbols);

      for (const spread of spreads) {
        if (!spread.profitable) continue;

        const buyTick = freshTicks.get(`${spread.buyExchange}:${spread.symbol}`);
        const sellTick = freshTicks.get(`${spread.sellExchange}:${spread.symbol}`);

        const opp: ArbitrageOpportunity = {
          spread,
          scannedAt: now,
          tickAgeBuyMs: buyTick ? now - buyTick.timestamp : 0,
          tickAgeSellMs: sellTick ? now - sellTick.timestamp : 0,
        };

        opportunities.push(opp);
        this.stats.opportunitiesFound++;
        this.spreadSumPct += spread.netSpreadPct;

        if (spread.netSpreadPct > this.stats.bestSpreadPct) {
          this.stats.bestSpreadPct = spread.netSpreadPct;
        }

        this.emit('opportunity', opp);
      }
    } catch (err) {
      logger.error(`[ArbScanner] Scan error: ${err instanceof Error ? err.message : String(err)}`);
      this.emit('error', err);
    }

    // Update stats
    if (this.stats.totalScans > 0) {
      this.stats.hitRatePct = (this.stats.opportunitiesFound / this.stats.totalScans) * 100;
    }
    if (this.stats.opportunitiesFound > 0) {
      this.stats.avgNetSpreadPct = this.spreadSumPct / this.stats.opportunitiesFound;
    }

    return opportunities;
  }

  getStats(): ScannerStats {
    return { ...this.stats };
  }

  getLatestTicks(): Map<string, PriceTick> {
    return new Map(this.latestTicks);
  }

  /** Get number of exchanges currently providing ticks */
  getActiveExchangeCount(): number {
    const now = Date.now();
    const exchanges = new Set<string>();
    for (const [, tick] of this.latestTicks) {
      if ((now - tick.timestamp) < this.config.staleTickMs) {
        exchanges.add(tick.exchange);
      }
    }
    return exchanges.size;
  }
}
