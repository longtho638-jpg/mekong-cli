/**
 * arb:spread — Dedicated BTC/ETH cross-exchange spread detector with auto-execution.
 *
 * Combines SpreadDetectorEngine scanning with real-time dashboard output.
 * Defaults: BTC/USDT + ETH/USDT on Binance/OKX/Bybit.
 * Modes: scan-only (dry-run) or auto-execute when spread > threshold.
 */

import { Command } from 'commander';
import {
  SpreadDetectorEngine,
  ExchangeConfig,
} from '@agencyos/trading-core/arbitrage';
import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';
import { logger } from '../utils/logger';
import {
  parseList,
  validateMinExchanges,
  buildExchangeConfigs,
} from './exchange-factory';

/** Bridge: creates ExchangeClientBase from ExchangeConfig */
function exchangeFactory(config: ExchangeConfig): ExchangeClientBase {
  return new ExchangeClientBase(config.id, config.apiKey, config.secret);
}

/**
 * Register the arb:spread command on a Commander program.
 */
export function registerSpreadDetectorCommand(program: Command): void {
  program
    .command('arb:spread')
    .description('Cross-exchange spread detector BTC/ETH with auto-execution (Binance/OKX/Bybit)')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('-s, --size <number>', 'Max position size USD', '500')
    .option('-t, --threshold <number>', 'Min spread % to trigger execution', '0.08')
    .option('--score-threshold <number>', 'Min signal score (0-100)', '60')
    .option('--equity <number>', 'Initial equity USD', '10000')
    .option('--max-loss <number>', 'Max daily loss USD', '50')
    .option('--poll <number>', 'Poll interval ms', '2000')
    .option('--dry-run', 'Scan only, no execution')
    .option('--max-polls <number>', 'Stop after N polls (0=infinite)', '0')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      const isDryRun = !!options.dryRun;
      const maxPolls = parseInt(options.maxPolls);
      const pollMs = parseInt(options.poll);

      logger.info(`[SpreadDetector] ${isDryRun ? 'DRY-RUN' : 'AUTO-EXEC'} mode`);
      logger.info(`[SpreadDetector] Pairs: ${symbols.join(', ')} | Exchanges: ${exchangeIds.join('/')}`);
      logger.info(`[SpreadDetector] Spread >= ${options.threshold}% | Score >= ${options.scoreThreshold} | Size: $${options.size}`);

      const exchanges = buildExchangeConfigs(exchangeIds);

      const engine = new SpreadDetectorEngine({
        exchanges,
        symbols,
        exchangeFactory,
        scanner: {
          minSpreadPercent: parseFloat(options.threshold),
          pollIntervalMs: pollMs,
        },
        executor: {
          maxPositionSizeUsd: parseFloat(options.size),
          maxConcurrentTrades: 2,
        },
        scorer: { executeThreshold: parseInt(options.scoreThreshold) },
        circuitBreaker: {
          maxDailyLossUsd: parseFloat(options.maxLoss),
          maxConsecutiveLosses: 3,
        },
        initialEquity: parseFloat(options.equity),
        maxOpportunitiesPerCycle: 5,
        enableOrderBookValidation: !isDryRun,
        enableSignalScoring: true,
        enableSpreadHistory: true,
      });

      try {
        await engine.init();
        await engine.start();

        logger.info('[SpreadDetector] Engine ACTIVE — scanning spreads...');

        let pollCount = 0;
        const dashboardInterval = setInterval(() => {
          pollCount++;
          const stats = engine.getStats();
          const profit = engine.getProfitSummary();

          // Dashboard every 5 cycles
          if (pollCount % 5 === 0) {
            logger.info(`\n--- Spread Dashboard (cycle ${pollCount}) ---`);
            logger.info(`  Detections: ${stats.totalDetections} | Scored: ${stats.totalScored} | Executed: ${stats.totalExecuted}`);
            logger.info(`  P&L: $${profit.cumulativePnl.toFixed(2)} | Circuit: ${stats.circuitState}`);
            logger.info('---');
          }

          // Stop after max polls
          if (maxPolls > 0 && pollCount >= maxPolls) {
            clearInterval(dashboardInterval);
            engine.stop();
            printFinalReport(engine);
            process.exit(0);
          }
        }, pollMs);

        const shutdown = () => {
          clearInterval(dashboardInterval);
          engine.stop();
          printFinalReport(engine);
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: unknown) {
        logger.error(`[SpreadDetector] Failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

/** Print final report on shutdown */
function printFinalReport(engine: SpreadDetectorEngine): void {
  const stats = engine.getStats();
  const profit = engine.getProfitSummary();

  logger.info('\n=== SPREAD DETECTOR — FINAL REPORT ===');
  logger.info(`  Detections:  ${stats.totalDetections}`);
  logger.info(`  Scored:      ${stats.totalScored}`);
  logger.info(`  Executed:    ${stats.totalExecuted}`);
  logger.info(`  Successful:  ${stats.successfulExecutions}`);
  logger.info(`  Skip/Score:  ${stats.skippedByScorer}`);
  logger.info(`  Skip/OB:     ${stats.skippedByOrderbook}`);
  logger.info(`  Skip/CB:     ${stats.skippedByCircuitBreaker}`);
  logger.info(`  P&L:         $${profit.cumulativePnl.toFixed(2)}`);
  logger.info(`  Drawdown:    ${profit.maxDrawdownPercent.toFixed(1)}%`);
  logger.info(`  Circuit:     ${stats.circuitState}`);
  logger.info('======================================\n');
}
