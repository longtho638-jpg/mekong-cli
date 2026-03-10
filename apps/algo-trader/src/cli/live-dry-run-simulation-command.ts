/**
 * Live Dry-Run Simulation CLI Command — Connects to real exchange
 * WebSocket feeds but executes paper orders only. Safe testing
 * with live market data before going live.
 *
 * Wires: ExchangeRegistry → LiveExchangeManager → SignalOrderPipeline
 *        (dryRun=true) + PaperTradingEngine + StrategyPositionManager
 *        + AdaptiveCircuitBreaker + TelegramAlertBot (optional)
 */

import { Command } from 'commander';
import { ExchangeRegistry } from '../execution/exchange-registry';
import { LiveExchangeManager } from '../execution/live-exchange-manager';
import { SignalOrderPipeline, PipelineOrderResult } from '../execution/signal-order-pipeline-live-trading';
import { StrategyPositionManager } from '../execution/strategy-position-manager';
import { AdaptiveCircuitBreaker } from '../execution/adaptive-circuit-breaker-per-exchange';
import { TelegramTradeAlertBot } from '../execution/telegram-trade-alert-bot';
import { PaperTradingEngine } from '../core/paper-trading-engine';
import { StrategyLoader } from '../core/StrategyLoader';
import { logger } from '../utils/logger';

export function registerDryRunCommand(program: Command): void {
  program
    .command('live:dry-run')
    .description('Run live trading simulation with real market data and paper orders')
    .requiredOption('-e, --exchanges <ids>', 'Comma-separated exchange IDs (binance,okx,bybit)')
    .requiredOption('-p, --pairs <pairs>', 'Comma-separated trading pairs (BTC/USDT,ETH/USDT)')
    .requiredOption('-s, --strategy <name>', 'Strategy name (e.g. RSI, MACD, QLearning)')
    .option('-i, --interval <ms>', 'Candle interval in ms', '60000')
    .option('--initial-balance <usd>', 'Initial paper balance USD', '10000')
    .option('--max-position <usd>', 'Max position size USD', '1000')
    .option('--max-concurrent <n>', 'Max concurrent positions', '3')
    .option('--telegram-token <token>', 'Telegram bot token for alerts')
    .option('--telegram-chat <id>', 'Telegram chat ID for alerts')
    .action(async (opts) => {
      const exchangeIds = opts.exchanges.split(',').map((s: string) => s.trim());
      const pairs = opts.pairs.split(',').map((s: string) => s.trim());
      const strategyName = opts.strategy;
      const intervalMs = parseInt(opts.interval);
      const initialBalance = parseFloat(opts.initialBalance);
      const maxPosition = parseFloat(opts.maxPosition);
      const maxConcurrent = parseInt(opts.maxConcurrent);

      // 1. Load strategy
      StrategyLoader.registerMLStrategies();
      const strategy = StrategyLoader.load(strategyName);
      if (!strategy) {
        logger.error(`Strategy "${strategyName}" not found. Available: ${StrategyLoader.getNames().join(', ')}`);
        return;
      }

      // 2. Setup registry
      const registry = new ExchangeRegistry();
      for (const id of exchangeIds) {
        registry.register({ id, enabled: true, tradingPairs: pairs });
      }
      registry.loadFromEnv(exchangeIds);

      // 3. Setup components
      const manager = new LiveExchangeManager({ registry });
      const positionMgr = new StrategyPositionManager({
        maxPositionSizeUsd: maxPosition,
        maxConcurrentPositions: maxConcurrent,
        maxDailyLossUsd: initialBalance * 0.05, // 5% daily loss limit
      });
      const circuitBreaker = new AdaptiveCircuitBreaker();
      const paperEngine = new PaperTradingEngine({
        initialBalances: { USDT: initialBalance },
      });

      // 4. Pipeline (dry-run mode)
      const pipeline = new SignalOrderPipeline({
        manager,
        strategies: [strategy],
        symbol: pairs[0],
        candleIntervalMs: intervalMs,
        dryRun: true,
        maxPositionUsd: maxPosition,
      });

      // 5. Optional Telegram
      let telegram: TelegramTradeAlertBot | null = null;
      if (opts.telegramToken && opts.telegramChat) {
        telegram = new TelegramTradeAlertBot({
          botToken: opts.telegramToken,
          chatId: opts.telegramChat,
        });
        telegram.start();
      }

      // 6. Wire events
      pipeline.on('order', (result: PipelineOrderResult) => {
        logger.info(`[DryRun] ${result.side.toUpperCase()} ${result.symbol} | Confirmations: ${result.confirmations}`);
        telegram?.alertSignal(strategyName, result.side, result.symbol, 0, result.confirmations);
      });

      pipeline.on('tick', (tick) => {
        paperEngine.updatePrice(pairs[0], (tick.bid + tick.ask) / 2);
      });

      manager.on('health:change', (event) => {
        logger.info(`[DryRun] Health: ${event.exchangeId} ${event.oldStatus} → ${event.newStatus}`);
        if (event.newStatus === 'disconnected') {
          circuitBreaker.recordFailure(AdaptiveCircuitBreaker.key(event.exchangeId));
        }
      });

      // 7. Graceful shutdown
      const shutdown = async () => {
        logger.info('[DryRun] Shutting down...');
        await pipeline.stop();
        await manager.stop();
        telegram?.stop();

        // Final report
        const pnl = paperEngine.getPnl();
        const summary = positionMgr.getSummary();
        const trades = paperEngine.getTradeHistory();
        logger.info('=== DRY RUN REPORT ===');
        logger.info(`Trades: ${trades.length} | P&L: $${pnl.total.toFixed(2)} (realized: $${pnl.realized.toFixed(2)})`);
        logger.info(`Positions: ${summary.openPositions} open, ${summary.closedPositions} closed`);
        logger.info(`Win rate: ${(summary.winRate * 100).toFixed(1)}% | Circuit breakers tripped: ${circuitBreaker.getTripped().length}`);
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // 8. Start
      try {
        await manager.start();
        await pipeline.start();
        logger.info(`[DryRun] Live simulation started: ${strategyName} on ${pairs.join(', ')} via ${exchangeIds.join(', ')}`);
        logger.info(`[DryRun] Paper balance: $${initialBalance} | Max position: $${maxPosition} | Interval: ${intervalMs}ms`);
        logger.info('[DryRun] Press Ctrl+C to stop and see report');
      } catch (err) {
        logger.error(`[DryRun] Failed to start: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
