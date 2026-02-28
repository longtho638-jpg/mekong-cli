/**
 * Arbitrage CLI commands — All arb:* commands extracted from index.ts.
 * Registers: arb:scan, arb:run, arb:engine, arb:orchestrator, arb:auto
 */

import { Command } from 'commander';
import { ArbitrageScanner } from '../arbitrage/ArbitrageScanner';
import { ArbitrageExecutor } from '../arbitrage/ArbitrageExecutor';
import { SpreadDetectorEngine } from '../arbitrage/SpreadDetectorEngine';
import { ArbitrageOrchestrator } from '../arbitrage/ArbitrageOrchestrator';
import { logger } from '../utils/logger';
import {
  parseList,
  validateMinExchanges,
  buildExchangeClients,
  buildAuthenticatedClients,
  buildExchangeConfigs,
} from './exchange-factory';

/**
 * Register all arb:* subcommands on a Commander program.
 */
export function registerArbCommands(program: Command): void {
  registerArbScan(program);
  registerArbRun(program);
  registerArbEngine(program);
  registerArbOrchestrator(program);
  registerArbAuto(program);
}

function registerArbScan(program: Command): void {
  program
    .command('arb:scan')
    .description('Scan cross-exchange arbitrage opportunities (dry-run)')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit,gateio')
    .option('-t, --threshold <number>', 'Min spread % to report', '0.1')
    .option('-n, --polls <number>', 'Number of poll cycles', '10')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      const threshold = parseFloat(options.threshold);
      const maxPolls = parseInt(options.polls);

      logger.info(`[ArbScan] Scanning ${symbols.join(', ')} across ${exchangeIds.join(', ')} (threshold: ${threshold}%)`);

      const scanner = new ArbitrageScanner({
        symbols,
        minSpreadPercent: threshold,
        pollIntervalMs: 3000,
      });

      const clients = buildExchangeClients(exchangeIds);
      for (const [id, client] of clients) {
        scanner.addExchange(id, client);
      }

      let pollCount = 0;
      scanner.onOpportunity(opp => {
        logger.info(
          `[ARB] ${opp.symbol}: BUY@${opp.buyExchange}=$${opp.buyPrice.toFixed(2)} → SELL@${opp.sellExchange}=$${opp.sellPrice.toFixed(2)} | ` +
          `Spread: ${opp.spreadPercent.toFixed(3)}% | Net: ${opp.netProfitPercent.toFixed(3)}% | Est: $${opp.estimatedProfitUsd.toFixed(2)}`
        );
      });

      try {
        await scanner.start();

        const checkInterval = setInterval(() => {
          pollCount++;
          const stats = scanner.getStats();
          if (pollCount % 5 === 0) {
            logger.info(`[ArbScan] Poll ${stats.totalPolls} | Opportunities: ${stats.opportunitiesFound} | Avg latency: ${stats.avgLatencyMs.toFixed(0)}ms`);
          }
          if (stats.totalPolls >= maxPolls) {
            clearInterval(checkInterval);
            scanner.stop();
            logger.info(`[ArbScan] Scan complete: ${stats.totalPolls} polls, ${stats.opportunitiesFound} opportunities found`);
          }
        }, 3000);
      } catch (error: unknown) {
        logger.error(`Arb scan failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function registerArbRun(program: Command): void {
  program
    .command('arb:run')
    .description('Run live cross-exchange arbitrage bot')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx')
    .option('-s, --size <number>', 'Max position size USD', '500')
    .option('-t, --threshold <number>', 'Min spread %', '0.15')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      logger.info(`[ArbBot] Starting: ${exchangeIds.join(' vs ')} | Pairs: ${symbols.join(', ')} | Max: $${options.size}`);

      const scanner = new ArbitrageScanner({
        symbols,
        minSpreadPercent: parseFloat(options.threshold),
        pollIntervalMs: 2000,
        positionSizeUsd: parseFloat(options.size),
      });

      const executor = new ArbitrageExecutor({
        maxPositionSizeUsd: parseFloat(options.size),
        maxConcurrentTrades: 3,
        cooldownMs: 10000,
      });

      const clients = buildAuthenticatedClients(exchangeIds);
      for (const [id, client] of clients) {
        scanner.addExchange(id, client);
        executor.addExchange(id, client);
      }

      scanner.onOpportunity(async (opp) => {
        const result = await executor.execute(opp);
        if (result.success) {
          executor.printDashboard();
        }
      });

      try {
        await scanner.start();
        logger.info('[ArbBot] Running. Press Ctrl+C to stop.');

        const shutdown = () => {
          scanner.stop();
          executor.printDashboard();
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: unknown) {
        logger.error(`Arb bot failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

function registerArbEngine(program: Command): void {
  program
    .command('arb:engine')
    .description('Run full SpreadDetectorEngine with scoring, orderbook validation, circuit breaker')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('-s, --size <number>', 'Max position size USD', '1000')
    .option('-t, --threshold <number>', 'Min spread %', '0.05')
    .option('--equity <number>', 'Initial equity USD', '10000')
    .option('--max-loss <number>', 'Max daily loss USD', '100')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      const exchanges = buildExchangeConfigs(exchangeIds);

      logger.info(`[SpreadDetector] Starting: ${exchangeIds.join('/')} | Pairs: ${symbols.join(', ')} | Max: $${options.size}`);

      const engine = new SpreadDetectorEngine({
        exchanges,
        symbols,
        scanner: { minSpreadPercent: parseFloat(options.threshold), pollIntervalMs: 2000 },
        executor: { maxPositionSizeUsd: parseFloat(options.size), maxConcurrentTrades: 3 },
        scorer: { executeThreshold: 65 },
        circuitBreaker: { maxDailyLossUsd: parseFloat(options.maxLoss), maxConsecutiveLosses: 5 },
        initialEquity: parseFloat(options.equity),
        maxOpportunitiesPerCycle: 5,
        enableOrderBookValidation: true,
        enableSignalScoring: true,
        enableSpreadHistory: true,
      });

      try {
        await engine.init();
        await engine.start();
        logger.info('[SpreadDetector] Running. Press Ctrl+C to stop.');

        const shutdown = () => {
          engine.stop();
          const stats = engine.getStats();
          const profit = engine.getProfitSummary();
          logger.info(`\n[SpreadDetector] Final: ${stats.totalDetections} detections, ${stats.totalExecuted} executed, ${stats.successfulExecutions} successful`);
          logger.info(`[SpreadDetector] P&L: $${profit.cumulativePnl.toFixed(2)} | Drawdown: ${profit.maxDrawdownPercent.toFixed(1)}%`);
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: unknown) {
        logger.error(`SpreadDetector failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

function registerArbOrchestrator(program: Command): void {
  program
    .command('arb:orchestrator')
    .description('Run ArbitrageOrchestrator with latency optimizer + adaptive threshold')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('-s, --size <number>', 'Max position size USD', '1000')
    .option('-t, --threshold <number>', 'Min spread %', '0.1')
    .option('--equity <number>', 'Initial equity USD', '10000')
    .option('--max-drawdown <number>', 'Max drawdown % before halt', '20')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      const exchanges = buildExchangeConfigs(exchangeIds);

      logger.info(`[Orchestrator] Starting: ${exchangeIds.join('/')} | Pairs: ${symbols.join(', ')}`);

      const orchestrator = new ArbitrageOrchestrator({
        exchanges,
        symbols,
        scanner: { minSpreadPercent: parseFloat(options.threshold), pollIntervalMs: 2000 },
        executor: { maxPositionSizeUsd: parseFloat(options.size), maxConcurrentTrades: 3 },
        enableLatencyOptimizer: true,
        enableProfitTracker: true,
        enableAdaptiveThreshold: true,
        enableWebSocket: false,
        initialEquity: parseFloat(options.equity),
        maxDrawdownPercent: parseFloat(options.maxDrawdown),
      });

      try {
        await orchestrator.init();
        await orchestrator.start();
        logger.info('[Orchestrator] Running. Press Ctrl+C to stop.');

        const shutdown = () => {
          orchestrator.stop();
          const stats = orchestrator.getStats();
          logger.info(`\n[Orchestrator] Final: ${stats.totalOpportunities} opps, ${stats.totalExecutions} executed, ${stats.successfulExecutions} successful`);
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: unknown) {
        logger.error(`Orchestrator failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

function registerArbAuto(program: Command): void {
  program
    .command('arb:auto')
    .description('Unified auto-execution: SpreadDetector + Orchestrator (scoring, orderbook, circuit breaker)')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('-s, --size <number>', 'Max position size USD', '1000')
    .option('-t, --threshold <number>', 'Min spread %', '0.05')
    .option('--equity <number>', 'Initial equity USD', '10000')
    .option('--max-loss <number>', 'Max daily loss USD', '100')
    .option('--score-threshold <number>', 'Min signal score (0-100) to execute', '65')
    .option('--max-trades <number>', 'Max concurrent trades', '3')
    .option('--no-orderbook', 'Disable orderbook validation')
    .option('--no-scoring', 'Disable signal scoring')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      const exchanges = buildExchangeConfigs(exchangeIds);

      logger.info(`[AutoExec] Starting: ${exchangeIds.join('/')} | ${symbols.join(', ')} | Size: $${options.size} | Score>=${options.scoreThreshold}`);

      const engine = new SpreadDetectorEngine({
        exchanges,
        symbols,
        scanner: { minSpreadPercent: parseFloat(options.threshold), pollIntervalMs: 2000 },
        executor: {
          maxPositionSizeUsd: parseFloat(options.size),
          maxConcurrentTrades: parseInt(options.maxTrades),
        },
        scorer: { executeThreshold: parseInt(options.scoreThreshold) },
        circuitBreaker: { maxDailyLossUsd: parseFloat(options.maxLoss), maxConsecutiveLosses: 5 },
        initialEquity: parseFloat(options.equity),
        maxOpportunitiesPerCycle: 5,
        enableOrderBookValidation: options.orderbook !== false,
        enableSignalScoring: options.scoring !== false,
        enableSpreadHistory: true,
      });

      try {
        await engine.init();
        await engine.start();

        logger.info('[AutoExec] Auto-execution ACTIVE — full pipeline: detect->score->validate->execute');
        logger.info(`[AutoExec] Orderbook: ${options.orderbook !== false ? 'ON' : 'OFF'} | Scoring: ${options.scoring !== false ? 'ON' : 'OFF'} | Circuit breaker: ON`);

        const shutdown = () => {
          engine.stop();
          const stats = engine.getStats();
          const profit = engine.getProfitSummary();
          logger.info('\n[AutoExec] === FINAL REPORT ===');
          logger.info(`[AutoExec] Detections: ${stats.totalDetections} | Scored: ${stats.totalScored} | Executed: ${stats.totalExecuted} | Success: ${stats.successfulExecutions}`);
          logger.info(`[AutoExec] Skip/Score: ${stats.skippedByScorer} | Skip/OB: ${stats.skippedByOrderbook} | Skip/CB: ${stats.skippedByCircuitBreaker}`);
          logger.info(`[AutoExec] P&L: $${profit.cumulativePnl.toFixed(2)} | Drawdown: ${profit.maxDrawdownPercent.toFixed(1)}% | Circuit: ${stats.circuitState}`);
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: unknown) {
        logger.error(`AutoExec failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
