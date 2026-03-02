/**
 * AGI Trade Multi-Exchange Go-Live Command — The ultimate orchestrator
 * that wires ALL Phase 7 components into a single production-ready
 * live trading system across multiple exchanges.
 *
 * Composes: ExchangeRegistry → LiveExchangeManager → SignalOrderPipeline
 *   → StrategyPositionManager → AdaptiveCircuitBreaker → TelegramAlertBot
 *
 * Usage: algo-trader agi:trade --exchanges binance,okx --pairs BTC/USDT --strategy RSI
 */

import { Command } from 'commander';
import { ExchangeRegistry } from '../execution/exchange-registry';
import { LiveExchangeManager } from '../execution/live-exchange-manager';
import { SignalOrderPipeline, PipelineOrderResult, PipelineSignal } from '../execution/signal-order-pipeline-live-trading';
import { StrategyPositionManager } from '../execution/strategy-position-manager';
import { AdaptiveCircuitBreaker } from '../execution/adaptive-circuit-breaker-per-exchange';
import { TelegramTradeAlertBot } from '../execution/telegram-trade-alert-bot';
import { StrategyLoader } from '../core/StrategyLoader';
import { IStrategy } from '../interfaces/IStrategy';
import { logger } from '../utils/logger';

export interface AgiTradeConfig {
  exchanges: string[];
  pairs: string[];
  strategies: string[];
  dryRun: boolean;
  candleIntervalMs: number;
  maxPositionUsd: number;
  maxConcurrent: number;
  maxDailyLossUsd: number;
  minConfirmations: number;
  telegramToken?: string;
  telegramChatId?: string;
}

export class AgiTradeOrchestrator {
  private config: AgiTradeConfig;
  private registry: ExchangeRegistry;
  private manager: LiveExchangeManager | null = null;
  private pipeline: SignalOrderPipeline | null = null;
  private positionMgr: StrategyPositionManager;
  private circuitBreaker: AdaptiveCircuitBreaker;
  private telegram: TelegramTradeAlertBot | null = null;
  private strategies: IStrategy[] = [];
  private running = false;
  private startedAt = 0;

  constructor(config: AgiTradeConfig) {
    this.config = config;
    this.registry = new ExchangeRegistry();
    this.positionMgr = new StrategyPositionManager({
      maxPositionSizeUsd: config.maxPositionUsd,
      maxConcurrentPositions: config.maxConcurrent,
      maxDailyLossUsd: config.maxDailyLossUsd,
    });
    this.circuitBreaker = new AdaptiveCircuitBreaker();
  }

  async start(): Promise<void> {
    if (this.running) return;

    // 1. Load strategies
    StrategyLoader.registerMLStrategies();
    for (const name of this.config.strategies) {
      const s = StrategyLoader.load(name);
      if (!s) throw new Error(`Strategy "${name}" not found. Available: ${StrategyLoader.getNames().join(', ')}`);
      this.strategies.push(s);
    }

    // 2. Registry
    for (const id of this.config.exchanges) {
      this.registry.register({ id, enabled: true, tradingPairs: this.config.pairs });
    }
    this.registry.loadFromEnv(this.config.exchanges);

    // 3. Exchange manager
    this.manager = new LiveExchangeManager({ registry: this.registry });

    // 4. Pipeline
    this.pipeline = new SignalOrderPipeline({
      manager: this.manager,
      strategies: this.strategies,
      symbol: this.config.pairs[0],
      candleIntervalMs: this.config.candleIntervalMs,
      dryRun: this.config.dryRun,
      maxPositionUsd: this.config.maxPositionUsd,
      minConfirmations: this.config.minConfirmations,
    });

    // 5. Telegram (optional)
    if (this.config.telegramToken && this.config.telegramChatId) {
      this.telegram = new TelegramTradeAlertBot({
        botToken: this.config.telegramToken,
        chatId: this.config.telegramChatId,
      });
      this.telegram.start();
    }

    // 6. Wire events
    this.wireEvents();

    // 7. Start
    await this.manager.start();
    await this.pipeline.start();
    this.running = true;
    this.startedAt = Date.now();

    const mode = this.config.dryRun ? 'DRY-RUN' : 'LIVE';
    logger.info(`[AGI-Trade] ${mode} started: ${this.config.strategies.join('+')} on ${this.config.pairs.join(',')} via ${this.config.exchanges.join(',')}`);
    this.telegram?.sendRaw(`🚀 AGI Trade ${mode} started\nStrategies: ${this.config.strategies.join(', ')}\nPairs: ${this.config.pairs.join(', ')}`);
  }

  async stop(): Promise<string> {
    if (!this.running) return '';
    this.running = false;

    await this.pipeline?.stop();
    await this.manager?.stop();
    this.telegram?.stop();

    const report = this.generateReport();
    logger.info(report);
    return report;
  }

  isRunning(): boolean { return this.running; }
  getPositionManager(): StrategyPositionManager { return this.positionMgr; }
  getCircuitBreaker(): AdaptiveCircuitBreaker { return this.circuitBreaker; }

  private wireEvents(): void {
    // Pipeline signals → position tracking + telegram
    this.pipeline?.on('signals', (signals: PipelineSignal[]) => {
      for (const s of signals) {
        logger.info(`[AGI-Trade] Signal: ${s.signal.type} from ${s.strategy} @ $${s.signal.price}`);
      }
    });

    this.pipeline?.on('order', (result: PipelineOrderResult) => {
      const stratNames = this.config.strategies.join('+');
      this.telegram?.alertSignal(stratNames, result.side, result.symbol, 0, result.confirmations);

      // Track position
      if (result.side === 'buy') {
        this.positionMgr.openPosition({
          strategy: stratNames,
          symbol: result.symbol,
          side: 'long',
          entryPrice: 0, // actual price filled by exchange
          amount: this.config.maxPositionUsd / 50000, // approximate
        });
      }
    });

    // Health → circuit breaker
    this.manager?.on('health:change', (event: { exchangeId: string; newStatus: string }) => {
      if (event.newStatus === 'disconnected') {
        const key = AdaptiveCircuitBreaker.key(event.exchangeId);
        this.circuitBreaker.recordFailure(key);
        if (!this.circuitBreaker.isAllowed(key)) {
          this.telegram?.alertAnomaly('Circuit Breaker', `${event.exchangeId} TRIPPED`);
        }
      } else if (event.newStatus === 'connected') {
        this.circuitBreaker.recordSuccess(AdaptiveCircuitBreaker.key(event.exchangeId));
      }
    });

    // Risk limits
    this.positionMgr.on('risk:limit', (event: { type: string }) => {
      this.telegram?.alertAnomaly('Risk Limit', `${event.type} triggered`);
    });
  }

  private generateReport(): string {
    const uptime = Math.round((Date.now() - this.startedAt) / 1000);
    const summary = this.positionMgr.getSummary();
    const tripped = this.circuitBreaker.getTripped();
    const mode = this.config.dryRun ? 'DRY-RUN' : 'LIVE';

    return [
      `=== AGI TRADE REPORT (${mode}) ===`,
      `Uptime: ${uptime}s`,
      `Strategies: ${this.config.strategies.join(', ')}`,
      `Exchanges: ${this.config.exchanges.join(', ')}`,
      `Positions: ${summary.openPositions} open, ${summary.closedPositions} closed`,
      `PnL: $${summary.totalPnl.toFixed(2)} (realized: $${summary.realizedPnl.toFixed(2)})`,
      `Win rate: ${(summary.winRate * 100).toFixed(1)}%`,
      `Circuit breakers tripped: ${tripped.length > 0 ? tripped.join(', ') : 'none'}`,
    ].join('\n');
  }
}

export function registerAgiTradeCommand(program: Command): void {
  program
    .command('agi:trade')
    .description('AGI multi-exchange live trading with ML + traditional strategies')
    .requiredOption('-e, --exchanges <ids>', 'Comma-separated exchange IDs')
    .requiredOption('-p, --pairs <pairs>', 'Comma-separated trading pairs')
    .requiredOption('-s, --strategies <names>', 'Comma-separated strategy names')
    .option('--dry-run', 'Paper trading mode (default)', true)
    .option('--live', 'Enable LIVE trading (real money)')
    .option('-i, --interval <ms>', 'Candle interval ms', '60000')
    .option('--max-position <usd>', 'Max position USD', '1000')
    .option('--max-concurrent <n>', 'Max concurrent positions', '3')
    .option('--max-daily-loss <usd>', 'Max daily loss USD', '500')
    .option('--min-confirmations <n>', 'Min strategy confirmations', '1')
    .option('--telegram-token <token>', 'Telegram bot token')
    .option('--telegram-chat <id>', 'Telegram chat ID')
    .action(async (opts) => {
      const orchestrator = new AgiTradeOrchestrator({
        exchanges: opts.exchanges.split(',').map((s: string) => s.trim()),
        pairs: opts.pairs.split(',').map((s: string) => s.trim()),
        strategies: opts.strategies.split(',').map((s: string) => s.trim()),
        dryRun: !opts.live,
        candleIntervalMs: parseInt(opts.interval),
        maxPositionUsd: parseFloat(opts.maxPosition),
        maxConcurrent: parseInt(opts.maxConcurrent),
        maxDailyLossUsd: parseFloat(opts.maxDailyLoss),
        minConfirmations: parseInt(opts.minConfirmations),
        telegramToken: opts.telegramToken,
        telegramChatId: opts.telegramChat,
      });

      const shutdown = async () => {
        const report = await orchestrator.stop();
        console.log(report);
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      try {
        await orchestrator.start();
        logger.info('[AGI-Trade] Press Ctrl+C to stop');
      } catch (err) {
        logger.error(`[AGI-Trade] ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
