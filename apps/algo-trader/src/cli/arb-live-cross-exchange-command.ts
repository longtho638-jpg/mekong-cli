/**
 * arb:live CLI Command — Real-time cross-exchange arbitrage.
 * Wires LiveExchangeManager + ArbitrageScanner + ExecutionEngine + Telegram.
 * Detects price discrepancies across exchanges and executes atomic trades.
 */

import { Command } from 'commander';
import { logger } from '../utils/logger';
import { ExchangeRegistry } from '../execution/exchange-registry';
import { ExchangeHealthMonitor } from '../execution/exchange-health-monitor';
import { AdaptiveCircuitBreaker } from '../execution/adaptive-circuit-breaker-per-exchange';
import { RealtimeArbitrageScanner } from '../execution/realtime-arbitrage-scanner';
import { ArbitrageExecutionEngine } from '../execution/arbitrage-execution-engine';
import { TelegramTradeAlertBot } from '../execution/telegram-trade-alert-bot';
import type { IExchange } from '../interfaces/IExchange';
import type { PriceTick } from '../execution/websocket-multi-exchange-price-feed-manager';

export interface ArbLiveConfig {
  exchanges: string[];
  symbols: string[];
  dryRun: boolean;
  positionSizeBase?: number;
  minSpreadPct?: number;
  scanIntervalMs?: number;
  cooldownMs?: number;
  maxDailyLossUsd?: number;
  telegram?: { botToken: string; chatId: string };
}

export class ArbLiveOrchestrator {
  private registry: ExchangeRegistry;
  private healthMonitor: ExchangeHealthMonitor;
  private circuitBreaker: AdaptiveCircuitBreaker;
  private scanner: RealtimeArbitrageScanner;
  private engine: ArbitrageExecutionEngine;
  private telegram: TelegramTradeAlertBot | null = null;
  private running = false;

  constructor(
    private readonly config: ArbLiveConfig,
    exchangeInstances?: Map<string, IExchange>,
  ) {
    this.registry = new ExchangeRegistry();
    this.healthMonitor = new ExchangeHealthMonitor();
    this.circuitBreaker = new AdaptiveCircuitBreaker();

    // Register exchanges
    for (const id of config.exchanges) {
      this.registry.register({
        id,
        enabled: true,
        tradingPairs: config.symbols,
      });
      this.healthMonitor.initExchange(id);
    }
    this.registry.loadFromEnv(config.exchanges);

    // Scanner
    this.scanner = new RealtimeArbitrageScanner({
      symbols: config.symbols,
      minNetSpreadPct: config.minSpreadPct,
      scanIntervalMs: config.scanIntervalMs,
      positionSizeUsd: (config.positionSizeBase ?? 0.01) * 50_000, // rough BTC estimate
    });

    // Engine
    this.engine = new ArbitrageExecutionEngine(
      {
        dryRun: config.dryRun,
        positionSizeBase: config.positionSizeBase,
        cooldownMs: config.cooldownMs,
        maxDailyLossUsd: config.maxDailyLossUsd,
      },
      exchangeInstances ?? new Map(),
      this.circuitBreaker,
    );

    // Telegram
    if (config.telegram) {
      this.telegram = new TelegramTradeAlertBot(config.telegram);
    }
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info(`[ArbLive] Starting — ${this.config.exchanges.length} exchanges, ${this.config.symbols.length} symbols, dryRun=${this.config.dryRun}`);

    // Wire scanner → engine
    this.scanner.on('opportunity', (opp) => {
      void this.engine.processOpportunity(opp);
    });

    // Wire engine → telegram
    if (this.telegram) {
      this.telegram.start();
      this.engine.on('trade', (record) => {
        const s = record.opportunity.spread;
        this.telegram?.alertSignal(
          'CrossExchangeArb',
          'buy',
          `${s.symbol} ${s.buyExchange}→${s.sellExchange}`,
          s.netSpreadPct * 100,
          1,
        );
      });
      this.engine.on('halted', () => {
        this.telegram?.alertAnomaly('DAILY_LOSS_LIMIT', 'Arbitrage engine halted — daily loss limit reached');
      });
    }

    // Wire health → circuit breaker
    this.healthMonitor.on('health:change', (evt: { exchangeId: string; newStatus: string }) => {
      if (evt.newStatus === 'disconnected') {
        for (const symbol of this.config.symbols) {
          this.circuitBreaker.recordFailure(AdaptiveCircuitBreaker.key(evt.exchangeId, symbol));
        }
      }
    });

    this.scanner.start();
    this.healthMonitor.startChecks();
  }

  /** Feed a price tick into the scanner */
  feedTick(tick: PriceTick): void {
    this.scanner.onTick(tick);
    this.healthMonitor.recordSuccess(tick.exchange, 1);
  }

  async stop(): Promise<string> {
    this.running = false;
    this.scanner.stop();
    this.healthMonitor.stopChecks();
    this.telegram?.stop();
    this.circuitBreaker.destroy();
    return this.generateReport();
  }

  isRunning(): boolean {
    return this.running;
  }

  private generateReport(): string {
    const scanStats = this.scanner.getStats();
    const engineMetrics = this.engine.getMetrics();
    const sign = engineMetrics.totalPnlUsd >= 0 ? '+' : '';

    return [
      '=== Cross-Exchange Arbitrage Report ===',
      `Mode: ${this.config.dryRun ? 'DRY-RUN' : 'LIVE'}`,
      `Exchanges: ${this.config.exchanges.join(', ')}`,
      `Symbols: ${this.config.symbols.join(', ')}`,
      `Total Scans: ${scanStats.totalScans}`,
      `Opportunities Found: ${scanStats.opportunitiesFound} (hit rate ${scanStats.hitRatePct.toFixed(1)}%)`,
      `Best Spread: ${(scanStats.bestSpreadPct * 100).toFixed(4)}%`,
      `Trades: ${engineMetrics.totalExecutions} (${engineMetrics.successfulTrades} success, ${engineMetrics.failedTrades} failed)`,
      `Win Rate: ${(engineMetrics.winRate * 100).toFixed(1)}%`,
      `Total PnL: ${sign}$${engineMetrics.totalPnlUsd.toFixed(2)}`,
      `Daily PnL: ${sign}$${engineMetrics.dailyPnlUsd.toFixed(2)}`,
      `Avg Latency: ${engineMetrics.avgLatencyMs.toFixed(0)}ms`,
      `Halted: ${engineMetrics.halted ? 'YES' : 'No'}`,
    ].join('\n');
  }
}

/** Register arb:live CLI command */
export function registerArbLiveCommand(program: Command): void {
  program
    .command('arb:live')
    .description('Real-time cross-exchange arbitrage scanner & executor')
    .option('--live', 'Enable live execution (default: dry-run)', false)
    .option('--exchanges <list>', 'Comma-separated exchanges', 'binance,okx,bybit')
    .option('--symbols <list>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('--size <n>', 'Position size in base asset', '0.01')
    .option('--min-spread <n>', 'Min net spread % to trade', '0.05')
    .option('--cooldown <ms>', 'Cooldown per pair (ms)', '30000')
    .option('--max-loss <usd>', 'Max daily loss USD', '100')
    .action(async (opts) => {
      const config: ArbLiveConfig = {
        exchanges: (opts.exchanges as string).split(','),
        symbols: (opts.symbols as string).split(','),
        dryRun: !opts.live,
        positionSizeBase: parseFloat(opts.size as string),
        minSpreadPct: parseFloat(opts.minSpread as string) / 100,
        cooldownMs: parseInt(opts.cooldown as string, 10),
        maxDailyLossUsd: parseFloat(opts.maxLoss as string),
        telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          ? { botToken: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID }
          : undefined,
      };

      const orchestrator = new ArbLiveOrchestrator(config);
      await orchestrator.start();

      logger.info(`[ArbLive] Running ${config.dryRun ? '(DRY-RUN)' : '(LIVE)'} — Ctrl+C to stop`);

      const shutdown = async () => {
        const report = await orchestrator.stop();
        console.log('\n' + report);
        process.exit(0);
      };

      process.on('SIGINT', () => void shutdown());
      process.on('SIGTERM', () => void shutdown());
    });
}
