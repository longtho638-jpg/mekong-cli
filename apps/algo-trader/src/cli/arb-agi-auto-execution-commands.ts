/**
 * AGI and auto-execution arbitrage commands — arb:agi, arb:auto.
 * arb:agi: intelligent spread detection with regime detection, Kelly sizing, self-tuning.
 *   Supports --paper (virtual balances), --dashboard (CLI real-time view), --export (CSV/JSON on exit).
 * arb:auto: unified auto-execution with SpreadDetector + full pipeline (detect→score→validate→execute).
 */

import { Command } from 'commander';
import {
  AgiArbitrageEngine,
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
import { PaperTradingArbBridge } from '../execution/paper-trading-arbitrage-bridge';
import { ArbCliDashboard } from '../ui/arbitrage-cli-realtime-dashboard';
import { exportArbHistory } from '../reporting/arbitrage-trade-history-exporter';

/** Bridge: creates ExchangeClientBase (CCXT) from generic ExchangeConfig */
function exchangeFactory(config: ExchangeConfig): ExchangeClientBase {
  return new ExchangeClientBase(config.id, config.apiKey, config.secret);
}

export function registerArbAgi(program: Command): void {
  program
    .command('arb:agi')
    .description('AGI Arbitrage: intelligent spread detection with regime detection, Kelly sizing, self-tuning')
    .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
    .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit')
    .option('-s, --size <number>', 'Max position size USD', '1000')
    .option('-t, --threshold <number>', 'Min spread %', '0.05')
    .option('--equity <number>', 'Initial equity USD', '10000')
    .option('--max-loss <number>', 'Max daily loss USD', '100')
    .option('--score-threshold <number>', 'Base signal score threshold (0-100)', '65')
    .option('--no-regime', 'Disable regime detection')
    .option('--no-kelly', 'Disable Kelly position sizing')
    .option('--no-self-tune', 'Disable self-tuning thresholds')
    .option('--regime-interval <number>', 'Regime detection interval ms', '30000')
    .option('--paper', 'Enable paper trading mode (no real orders, virtual balances)')
    .option('--dashboard', 'Show real-time CLI dashboard (disables logger console output)')
    .option('--export <format>', 'Export trade history on exit: csv or json')
    .option('--export-path <path>', 'Export file path (default: ./arb-history)', './arb-history')
    .action(async (options) => {
      const symbols = parseList(options.pairs);
      const exchangeIds = parseList(options.exchanges);
      validateMinExchanges(exchangeIds);

      // Paper mode: create virtual bridge, skip real exchange API validation
      let paperBridge: PaperTradingArbBridge | null = null;
      if (options.paper) {
        paperBridge = new PaperTradingArbBridge({
          exchanges: exchangeIds,
          initialBalancePerExchange: parseFloat(options.equity),
        });
        logger.info('[AGI] PAPER MODE — virtual balances, no real orders');
      }

      // Dashboard mode: suppress logger console output to avoid conflict
      let dashboard: ArbCliDashboard | null = null;
      if (options.dashboard) {
        dashboard = new ArbCliDashboard(1000);
        dashboard.setPaperMode(!!options.paper);
        dashboard.start();
        // Remove console transport to avoid overwriting dashboard
        logger.transports.forEach((t) => {
          if (t instanceof (require('winston').transports.Console)) {
            logger.remove(t);
          }
        });
      }

      const exchanges = options.paper ? [] : buildExchangeConfigs(exchangeIds);

      logger.info(`[AGI] Starting: ${exchangeIds.join('/')} | ${symbols.join(', ')} | Size: $${options.size} | Score>=${options.scoreThreshold}`);

      const engine = new AgiArbitrageEngine({
        engine: {
          exchanges,
          symbols,
          exchangeFactory,
          scanner: { minSpreadPercent: parseFloat(options.threshold), pollIntervalMs: 2000 },
          executor: { maxPositionSizeUsd: parseFloat(options.size), maxConcurrentTrades: 3 },
          scorer: { executeThreshold: parseInt(options.scoreThreshold) },
          circuitBreaker: { maxDailyLossUsd: parseFloat(options.maxLoss), maxConsecutiveLosses: 5 },
          initialEquity: parseFloat(options.equity),
          maxOpportunitiesPerCycle: 5,
          enableOrderBookValidation: true,
          enableSignalScoring: true,
          enableSpreadHistory: true,
        },
        enableRegimeDetection: options.regime !== false,
        enableKellySizing: options.kelly !== false,
        enableSelfTuning: options.selfTune !== false,
        regimeIntervalMs: parseInt(options.regimeInterval),
        initialEquity: parseFloat(options.equity),
      });

      try {
        await engine.init();
        await engine.start();

        logger.info('[AGI] AGI arbitrage engine ACTIVE — intelligent spread detection running');
        logger.info(`[AGI] Regime: ${options.regime !== false ? 'ON' : 'OFF'} | Kelly: ${options.kelly !== false ? 'ON' : 'OFF'} | Self-tune: ${options.selfTune !== false ? 'ON' : 'OFF'}`);

        const shutdown = async () => {
          engine.stop();
          dashboard?.stop();

          // Export history on exit if requested
          if (options.export && paperBridge) {
            const fmt = options.export as 'csv' | 'json';
            const history = paperBridge.getCombinedHistory();
            const result = await exportArbHistory(history, {
              format: fmt,
              outputPath: options.exportPath,
            });
            logger.info(`[AGI] Exported ${result.count} trades → ${result.path}`);
          }

          const stats = engine.getStats();
          const profit = engine.getProfitSummary();
          logger.info('\n[AGI] === FINAL REPORT ===');
          logger.info(`[AGI] Regime: ${stats.currentRegime} (confidence: ${(stats.regimeConfidence * 100).toFixed(0)}%)`);
          logger.info(`[AGI] Kelly fraction: ${(stats.kellyFraction * 100).toFixed(1)}% | Position: $${stats.currentPositionSize.toFixed(0)}`);
          logger.info(`[AGI] Effective thresholds: score=${stats.effectiveScoreThreshold.toFixed(0)} | spread=${stats.effectiveSpreadThreshold.toFixed(3)}%`);
          logger.info(`[AGI] Detections: ${stats.totalDetections} | Executed: ${stats.totalExecuted} | Success: ${stats.successfulExecutions}`);
          logger.info(`[AGI] P&L: $${profit.cumulativePnl.toFixed(2)} | EMA profit: $${stats.emaProfitability.toFixed(2)} | Regime shifts: ${stats.totalRegimeShifts}`);
          logger.info(`[AGI] Circuit: ${stats.circuitState}`);
          if (paperBridge) {
            const pnl = paperBridge.getAggregatedPnl();
            logger.info(`[AGI] Paper P&L: $${pnl.realized.toFixed(2)} realized | $${pnl.unrealized.toFixed(2)} unrealized`);
          }
          process.exit(0);
        };
        process.on('SIGINT', () => { void shutdown(); });
        process.on('SIGTERM', () => { void shutdown(); });
      } catch (error: unknown) {
        logger.error(`AGI failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

export function registerArbAuto(program: Command): void {
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
        exchangeFactory,
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
