/**
 * Unified AGI Arbitrage Command — Wires all arbitrage strategies
 * (cross-exchange, triangular, funding-rate) into one CLI command: arb:agi
 *
 * Composes: ExchangeRegistry → ExchangeHealthMonitor → AdaptiveCircuitBreaker
 *   → MarketRegimeDetector → RealtimeArbitrageScanner → TriangularArbitrageLiveScanner
 *   → FundingRateArbitrageScanner → ArbitrageExecutionEngine → TelegramTradeAlertBot
 */

import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ExchangeRegistry } from '../execution/exchange-registry';
import { ExchangeHealthMonitor } from '../execution/exchange-health-monitor';
import { AdaptiveCircuitBreaker } from '../execution/adaptive-circuit-breaker-per-exchange';
import { MarketRegimeDetector } from '../execution/market-regime-detector';
import { RealtimeArbitrageScanner } from '../execution/realtime-arbitrage-scanner';
import { TriangularArbitrageLiveScanner } from '../execution/triangular-arbitrage-live-scanner';
import { FundingRateArbitrageScanner } from '../execution/funding-rate-arbitrage-scanner';
import { ArbitrageExecutionEngine } from '../execution/arbitrage-execution-engine';
import { TelegramTradeAlertBot } from '../execution/telegram-trade-alert-bot';
import type { PriceTick } from '../execution/websocket-multi-exchange-price-feed-manager';
import type { ArbitrageOpportunity } from '../execution/realtime-arbitrage-scanner';
import type { TriArbOpportunity } from '../execution/triangular-arbitrage-live-scanner';
import type { FundingRateOpportunity } from '../execution/funding-rate-arbitrage-scanner';

export interface UnifiedArbConfig {
  exchanges: string[];
  symbols: string[];
  dryRun: boolean;
  enableCrossExchange: boolean;
  enableTriangular: boolean;
  enableFundingRate: boolean;
  minSpreadPct?: number;
  telegram?: {
    botToken: string;
    chatId: string;
  };
}

export interface UnifiedArbReport {
  uptime: number;
  mode: string;
  exchanges: string[];
  symbols: string[];
  crossExchange: {
    enabled: boolean;
    totalScans: number;
    opportunitiesFound: number;
    hitRatePct: number;
    bestSpreadPct: number;
  };
  triangular: {
    enabled: boolean;
    totalScans: number;
    opportunitiesFound: number;
    bestProfitPct: number;
  };
  fundingRate: {
    enabled: boolean;
    totalScans: number;
    opportunitiesFound: number;
    bestDifferential: number;
    activeSymbols: number;
    activeExchanges: number;
  };
  engine: {
    totalExecutions: number;
    successfulTrades: number;
    failedTrades: number;
    totalPnlUsd: number;
    winRate: number;
    avgLatencyMs: number;
    dailyPnlUsd: number;
    halted: boolean;
  };
  circuitBreakersTripped: string[];
  regimeHistory: Array<{ regime: string; timestamp: number }>;
}

export class UnifiedAgiArbOrchestrator {
  private readonly config: UnifiedArbConfig;
  private registry: ExchangeRegistry;
  private healthMonitor: ExchangeHealthMonitor;
  private circuitBreaker: AdaptiveCircuitBreaker;
  private regimeDetector: MarketRegimeDetector;
  private crossExchangeScanner: RealtimeArbitrageScanner | null = null;
  private triScanner: TriangularArbitrageLiveScanner | null = null;
  private fundingScanner: FundingRateArbitrageScanner | null = null;
  private engine: ArbitrageExecutionEngine;
  private telegram: TelegramTradeAlertBot | null = null;
  private running = false;
  private startedAt = 0;
  private regimeHistory: Array<{ regime: string; timestamp: number }> = [];

  constructor(config: UnifiedArbConfig) {
    this.config = {
      ...config,
      minSpreadPct: config.minSpreadPct ?? 0.05,
    };

    this.registry = new ExchangeRegistry();
    this.healthMonitor = new ExchangeHealthMonitor();
    this.circuitBreaker = new AdaptiveCircuitBreaker();
    this.regimeDetector = new MarketRegimeDetector();

    // Engine is always created; scanners are conditional
    this.engine = new ArbitrageExecutionEngine(
      { dryRun: this.config.dryRun },
      new Map(),
      this.circuitBreaker,
    );
  }

  start(): void {
    if (this.running) return;

    // 1. Register exchanges
    for (const id of this.config.exchanges) {
      this.registry.register({ id, enabled: true, tradingPairs: this.config.symbols });
      this.healthMonitor.initExchange(id);
    }
    this.healthMonitor.startChecks();

    // 2. Regime detector — track regime changes
    this.regimeDetector.on('regime:change', (ev: { current: string; previous: string }) => {
      this.regimeHistory.push({ regime: ev.current, timestamp: Date.now() });
      logger.info(`[UnifiedArb] Regime: ${ev.previous} → ${ev.current}`);
      // Apply regime-suggested params to cross-exchange scanner
      if (this.crossExchangeScanner) {
        const suggestion = this.regimeDetector.suggestArbParams();
        logger.info(`[UnifiedArb] Regime params: ${suggestion.reason}`);
      }
    });

    const minSpread = this.config.minSpreadPct ?? 0.05;

    // 3. Create enabled scanners
    if (this.config.enableCrossExchange) {
      this.crossExchangeScanner = new RealtimeArbitrageScanner({
        symbols: this.config.symbols,
        minNetSpreadPct: minSpread / 100,
      });

      this.crossExchangeScanner.on('opportunity', (opp: ArbitrageOpportunity) => {
        void this.engine.processOpportunity(opp);
        if (this.telegram) {
          const { spread } = opp;
          this.telegram.sendRaw(
            `ARB: ${spread.symbol} buy@${spread.buyExchange} sell@${spread.sellExchange} spread=${(spread.netSpreadPct * 100).toFixed(3)}%`,
          );
        }
      });

      this.crossExchangeScanner.start();
    }

    if (this.config.enableTriangular) {
      this.triScanner = new TriangularArbitrageLiveScanner({
        minProfitPct: minSpread / 100,
      });

      this.triScanner.on('opportunity', (opp: TriArbOpportunity) => {
        logger.info(`[UnifiedArb] TriArb: ${opp.path} profit=${(opp.profitPct * 100).toFixed(3)}%`);
        this.telegram?.sendRaw(
          `TRI-ARB: ${opp.path} profit=${(opp.profitPct * 100).toFixed(3)}%`,
        );
      });

      this.triScanner.start();
    }

    if (this.config.enableFundingRate) {
      this.fundingScanner = new FundingRateArbitrageScanner();

      this.fundingScanner.on('opportunity', (opp: FundingRateOpportunity) => {
        logger.info(
          `[UnifiedArb] FundingArb: ${opp.symbol} diff=${opp.rateDifferential.toFixed(6)} annualized=${opp.annualizedReturnPct.toFixed(2)}%`,
        );
        this.telegram?.sendRaw(
          `FUNDING-ARB: ${opp.symbol} long@${opp.longExchange} short@${opp.shortExchange} ann=${opp.annualizedReturnPct.toFixed(2)}%`,
        );
      });

      this.fundingScanner.start();
    }

    // 4. Telegram (optional)
    if (this.config.telegram) {
      this.telegram = new TelegramTradeAlertBot(this.config.telegram);
      this.telegram.start();
    }

    this.running = true;
    this.startedAt = Date.now();
    const mode = this.config.dryRun ? 'DRY-RUN' : 'LIVE';
    logger.info(
      `[UnifiedArb] ${mode} started — cross-ex:${this.config.enableCrossExchange} tri:${this.config.enableTriangular} funding:${this.config.enableFundingRate}`,
    );
  }

  /** Feed a price tick to all active components */
  feedTick(tick: PriceTick): void {
    // Feed regime detector (use mid price)
    const mid = (tick.bid + tick.ask) / 2;
    this.regimeDetector.addPrice(mid);

    // Feed cross-exchange scanner
    this.crossExchangeScanner?.onTick(tick);

    // Feed triangular scanner
    this.triScanner?.onTick({
      exchange: tick.exchange,
      symbol: tick.symbol,
      bid: tick.bid,
      ask: tick.ask,
      timestamp: tick.timestamp,
    });

    // Update health monitor
    this.healthMonitor.recordSuccess(tick.exchange, 0);
  }

  /** Feed funding rate data to the funding scanner */
  feedFundingRate(exchange: string, symbol: string, rate: number, nextFundingTime: number): void {
    this.fundingScanner?.updateRate(exchange, symbol, rate, nextFundingTime);
  }

  /** Graceful shutdown — returns comprehensive report */
  stop(): UnifiedArbReport {
    if (!this.running) {
      return this.buildReport();
    }

    this.crossExchangeScanner?.stop();
    this.triScanner?.stop();
    this.fundingScanner?.stop();
    this.healthMonitor.stopChecks();
    this.telegram?.stop();
    this.circuitBreaker.destroy();

    this.running = false;

    const report = this.buildReport();
    logger.info(`[UnifiedArb] Stopped — report generated`);
    return report;
  }

  isRunning(): boolean {
    return this.running;
  }

  private buildReport(): UnifiedArbReport {
    const crossStats = this.crossExchangeScanner?.getStats();
    const triStats = this.triScanner?.getStats();
    const fundingStats = this.fundingScanner?.getStats();
    const engineMetrics = this.engine.getMetrics();

    return {
      uptime: this.startedAt > 0 ? Math.round((Date.now() - this.startedAt) / 1000) : 0,
      mode: this.config.dryRun ? 'DRY-RUN' : 'LIVE',
      exchanges: this.config.exchanges,
      symbols: this.config.symbols,
      crossExchange: {
        enabled: this.config.enableCrossExchange,
        totalScans: crossStats?.totalScans ?? 0,
        opportunitiesFound: crossStats?.opportunitiesFound ?? 0,
        hitRatePct: crossStats?.hitRatePct ?? 0,
        bestSpreadPct: crossStats?.bestSpreadPct ?? 0,
      },
      triangular: {
        enabled: this.config.enableTriangular,
        totalScans: triStats?.totalScans ?? 0,
        opportunitiesFound: triStats?.opportunitiesFound ?? 0,
        bestProfitPct: triStats?.bestProfitPct ?? 0,
      },
      fundingRate: {
        enabled: this.config.enableFundingRate,
        totalScans: fundingStats?.totalScans ?? 0,
        opportunitiesFound: fundingStats?.opportunitiesFound ?? 0,
        bestDifferential: fundingStats?.bestDifferential ?? 0,
        activeSymbols: fundingStats?.activeSymbols ?? 0,
        activeExchanges: fundingStats?.activeExchanges ?? 0,
      },
      engine: engineMetrics,
      circuitBreakersTripped: this.circuitBreaker.getTripped(),
      regimeHistory: [...this.regimeHistory],
    };
  }
}

export function registerUnifiedArbCommand(program: Command): void {
  program
    .command('arb:agi')
    .description('Unified AGI arbitrage — cross-exchange, triangular, and funding-rate strategies')
    .option('--live', 'Enable LIVE trading (default: dry-run)')
    .option('--exchanges <list>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('--symbols <list>', 'Comma-separated symbols', 'BTC/USDT,ETH/USDT')
    .option('--no-cross-exchange', 'Disable cross-exchange arbitrage')
    .option('--no-triangular', 'Disable triangular arbitrage')
    .option('--no-funding-rate', 'Disable funding rate arbitrage')
    .option('--min-spread <pct>', 'Min spread % to trigger (e.g. 0.05)', '0.05')
    .option('--telegram-token <token>', 'Telegram bot token')
    .option('--telegram-chat <id>', 'Telegram chat ID')
    .action((opts) => {
      const config: UnifiedArbConfig = {
        exchanges: opts.exchanges.split(',').map((s: string) => s.trim()),
        symbols: opts.symbols.split(',').map((s: string) => s.trim()),
        dryRun: !opts.live,
        enableCrossExchange: opts.crossExchange !== false,
        enableTriangular: opts.triangular !== false,
        enableFundingRate: opts.fundingRate !== false,
        minSpreadPct: parseFloat(opts.minSpread),
        telegram:
          opts.telegramToken && opts.telegramChat
            ? { botToken: opts.telegramToken, chatId: opts.telegramChat }
            : undefined,
      };

      const orchestrator = new UnifiedAgiArbOrchestrator(config);

      const shutdown = () => {
        const report = orchestrator.stop();
        const mode = report.mode;
        console.log(`\n=== UNIFIED AGI ARB REPORT (${mode}) ===`);
        console.log(`Uptime: ${report.uptime}s`);
        console.log(`Cross-Exchange: ${report.crossExchange.opportunitiesFound} opps, best spread ${report.crossExchange.bestSpreadPct.toFixed(4)}%`);
        console.log(`Triangular: ${report.triangular.opportunitiesFound} opps, best profit ${report.triangular.bestProfitPct.toFixed(4)}%`);
        console.log(`Funding Rate: ${report.fundingRate.opportunitiesFound} opps, best diff ${report.fundingRate.bestDifferential.toFixed(6)}`);
        console.log(`Engine: ${report.engine.totalExecutions} trades, PnL $${report.engine.totalPnlUsd.toFixed(2)}`);
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      try {
        orchestrator.start();
        logger.info('[UnifiedArb] Running — press Ctrl+C to stop');
      } catch (err) {
        logger.error(`[UnifiedArb] ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
