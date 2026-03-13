import { Command } from 'commander';
import { BotEngine } from './core/BotEngine';
import { RsiSmaStrategy } from './strategies/RsiSmaStrategy';
import { StrategyLoader } from './core/StrategyLoader';
import { MockDataProvider } from './data/MockDataProvider';
import { ExchangeClientBase as ExchangeClient } from '@agencyos/trading-core/exchanges';
import { BacktestRunner, BacktestResult } from './backtest/BacktestRunner';
import { BacktestEngine } from './backtest/BacktestEngine';
import { LicenseError } from './lib/raas-gate';
import { initLicenseValidation } from './lib/license-validator';
import { registerArbCommands } from './cli/arb-cli-commands';
import { registerSpreadDetectorCommand } from './cli/spread-detector-command';
import { registerMarketplaceCommands } from './cli/strategy-marketplace-tenant-cli-commands';
import { registerMLCommands } from './cli/ml-train-and-backtest-commands';
import { registerDryRunCommand } from './cli/live-dry-run-simulation-command';
import { registerAgiTradeCommand } from './cli/agi-trade-multi-exchange-golive-command';
import { registerArbLiveCommand } from './cli/arb-live-cross-exchange-command';
import { registerUnifiedArbCommand } from './cli/unified-agi-arbitrage-command';
import { registerSetupCommand } from './cli/setup-wizard-command';
import { registerQuickstartCommand } from './cli/quickstart-zero-config-command';
import { registerTelegramBotCommand } from './cli/telegram-phone-trading-bot-command';
import { registerPolymarketTelegramCommand } from './cli/polymarket-telegram-command';
import { registerPolymarketOrderbookCommand, registerPolymarketOrderbookAnalyzeCommand } from './cli/polymarket-orderbook-command';
import { registerLiveTradingCommands } from './cli/live-trading-cli';
import { registerRiskDashboardCommand } from './cli/risk-dashboard-command';
import { logger } from './utils/logger';
import { startRaasServer, stopRaasServer, setReady } from './api/fastify-raas-server';
import * as dotenv from 'dotenv';

// Load environment variables securely
dotenv.config();

// Initialize license validation (exit if invalid)
const licenseResult = initLicenseValidation();
logger.info(`📄 License status: ${licenseResult.valid ? 'VALID' : 'FREE TIER'}`);

const program = new Command();

program
  .version('0.1.0')
  .description('Algo Trader CLI');

program
  .command('api:serve')
  .description('Start Fastify RaaS API server')
  .option('-p, --port <number>', 'Port to listen on', '3000')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    logger.info(`Starting Fastify RaaS API on port ${port}...`);
    try {
      await startRaasServer({ port });
      setReady(true);

      const shutdown = async () => {
        setReady(false);
        logger.info('Shutting down API server...');
        await stopRaasServer();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (error) {
      logger.error(`Failed to start API: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('backtest')
  .description('Run backtest with selected strategy')
  .option('-s, --strategy <string>', 'Strategy name (RsiSma, RsiCrossover)', 'RsiSma')
  .option('-d, --days <number>', 'Number of days to backtest', '30')
  .option('-b, --balance <number>', 'Initial balance', '10000')
  .action(async (options) => {
    logger.info(`Starting Backtest with strategy: ${options.strategy}...`);
    try {
      const strategy = StrategyLoader.load(options.strategy);
      const dataProvider = new MockDataProvider();

      const runner = new BacktestRunner(strategy, dataProvider, parseFloat(options.balance));
      await runner.run(parseInt(options.days));
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Backtest failed: ${error.message}`);
      } else {
        logger.error(`Backtest failed: ${String(error)}`);
      }
    }
  });

program
  .command('live')
  .description('Run live trading bot')
  .option('-s, --symbol <string>', 'Trading symbol', 'BTC/USDT')
  .option('-e, --exchange <string>', 'Exchange ID (ccxt)', 'binance')
  .action(async (options) => {
    logger.info(`Starting Live Bot on ${options.exchange} for ${options.symbol}`);

    try {
      // For demo purposes, using MockDataProvider even in "live" mode
      // In production, you'd implement a WebSocketDataProvider or PollingDataProvider
      const dataProvider = new MockDataProvider();

      // Exchange Client
      // NOTE: In a real scenario, you'd load API keys from .env
      const apiKey = process.env.EXCHANGE_API_KEY || '';
      const apiSecret = process.env.EXCHANGE_SECRET || '';

      const hasValidKeys = apiKey && apiSecret
        && apiKey !== 'YOUR_API_KEY' && apiKey !== 'your_api_key_here'
        && apiSecret !== 'YOUR_API_SECRET' && apiSecret !== 'your_secret_here'
        && apiKey.length >= 10 && apiSecret.length >= 10;

      if (!hasValidKeys) {
        logger.error('LỖI: Live trading yêu cầu API Key/Secret hợp lệ trong .env file.');
        logger.error('Xem .env.example để cấu hình. KHÔNG ĐƯỢC trade live với key mặc định.');
        process.exit(1);
      }

      const exchange = new ExchangeClient(options.exchange, apiKey, apiSecret);

      const strategy = new RsiSmaStrategy();

      const engine = new BotEngine(strategy, dataProvider, exchange, {
        tenantId: 'default',
        symbol: options.symbol,
        riskPercentage: 1, // 1%
        pollInterval: 1000
      });

      await engine.start();
      setReady(true);

      const shutdown = async () => {
        setReady(false);
        await engine.stop();
        await stopRaasServer();
        process.exit(0);
      };

      // Keep process alive
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Live bot failed: ${error.message}`);
      } else {
        logger.error(`Live bot failed: ${String(error)}`);
      }
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare all strategies via backtest')
  .option('-d, --days <number>', 'Number of days to backtest', '30')
  .option('-b, --balance <number>', 'Initial balance', '10000')
  .action(async (options) => {
    logger.info('Running multi-strategy comparison...');
    try {
      // Only compare non-arbitrage strategies (arb strategies need special metadata)
      const nonArbNames = ['RsiSma', 'RsiCrossover', 'Bollinger', 'MacdCrossover', 'MacdBollingerRsi'];
      const results: (BacktestResult & { strategyKey: string })[] = [];

      for (const name of nonArbNames) {
        try {
          const strategy = StrategyLoader.load(name);
          const dataProvider = new MockDataProvider();
          const runner = new BacktestRunner(strategy, dataProvider, parseFloat(options.balance));
          const result = await runner.run(parseInt(options.days), true);
          results.push({ ...result, strategyKey: name });
        } catch (err) {
          logger.warn(`Skipping ${name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Sort by Sharpe ratio descending
      results.sort((a, b) => b.sharpeRatio - a.sharpeRatio);

      logger.info('\n=== STRATEGY COMPARISON ===');
      logger.info('Strategy          | Return %  | Sharpe | MaxDD % | WinRate % | Trades | Fees $');
      logger.info('------------------|-----------|--------|---------|-----------|--------|-------');
      for (const r of results) {
        const name = r.strategyKey.padEnd(17);
        const ret = r.totalReturn.toFixed(2).padStart(8);
        const sharpe = r.sharpeRatio.toFixed(3).padStart(6);
        const dd = r.maxDrawdown.toFixed(2).padStart(6);
        const wr = r.winRate.toFixed(1).padStart(8);
        const trades = String(r.totalTrades).padStart(6);
        const fees = r.totalFees.toFixed(2).padStart(6);
        logger.info(`${name} | ${ret}% | ${sharpe} | ${dd}% | ${wr}% | ${trades} | $${fees}`);
      }
      logger.info('==========================\n');

      if (results.length > 0) {
        logger.info(`Best strategy: ${results[0].strategyKey} (Sharpe: ${results[0].sharpeRatio.toFixed(3)}, Return: ${results[0].totalReturn.toFixed(2)}%)`);
      }
    } catch (error: unknown) {
      logger.error(`Compare failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

program
  .command('backtest:advanced')
  .description('Run advanced backtest with equity curve, Sortino, Calmar, MAE/MFE')
  .option('-s, --strategy <string>', 'Strategy name', 'RsiSma')
  .option('-d, --days <number>', 'Number of days', '30')
  .option('-b, --balance <number>', 'Initial balance', '10000')
  .action(async (options) => {
    logger.info(`Advanced Backtest: ${options.strategy}`);
    try {
      const dataProvider = new MockDataProvider();
      const limit = parseInt(options.days) * 24 * 60;
      const candles = await dataProvider.getHistory(limit);

      const engine = new BacktestEngine();
      const strategy = StrategyLoader.load(options.strategy);
      const result = await engine.runDetailed(strategy, candles, parseFloat(options.balance));

      logger.info('\n=== ADVANCED BACKTEST ===');
      logger.info(`Strategy:     ${result.strategyName}`);
      logger.info(`Return:       ${result.totalReturn.toFixed(2)}%`);
      logger.info(`Sharpe:       ${result.sharpeRatio.toFixed(3)}`);
      logger.info(`Sortino:      ${result.sortinoRatio.toFixed(3)}`);
      logger.info(`Calmar:       ${result.calmarRatio.toFixed(3)}`);
      logger.info(`Max Drawdown: ${result.maxDrawdown.toFixed(2)}%`);
      logger.info(`Expectancy:   $${result.expectancy.toFixed(2)}/trade`);
      logger.info(`Win Rate:     ${result.winRate.toFixed(1)}%`);
      logger.info(`Trades:       ${result.totalTrades}`);
      logger.info(`Equity pts:   ${result.equityCurve.length}`);
      logger.info('========================\n');

      // Monte Carlo robustness
      if (result.detailedTrades.length > 5) {
        const mc = engine.monteCarlo(result.detailedTrades, parseFloat(options.balance), 500);
        logger.info('--- Monte Carlo (500 sims) ---');
        logger.info(`Median Return:   ${mc.medianReturn.toFixed(2)}%`);
        logger.info(`5th Percentile:  ${mc.p5Return.toFixed(2)}%`);
        logger.info(`95th Percentile: ${mc.p95Return.toFixed(2)}%`);
        logger.info(`Ruin Prob:       ${mc.ruinProbability.toFixed(1)}%`);
        logger.info('-----------------------------\n');
      }
    } catch (error: unknown) {
      logger.error(`Advanced backtest failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

program
  .command('backtest:walk-forward')
  .description('Walk-forward analysis to detect overfitting')
  .option('-s, --strategy <string>', 'Strategy name', 'RsiSma')
  .option('-d, --days <number>', 'Number of days', '90')
  .option('-w, --windows <number>', 'Number of walk-forward windows', '5')
  .option('-b, --balance <number>', 'Initial balance', '10000')
  .action(async (options) => {
    logger.info(`Walk-Forward Analysis: ${options.strategy} (${options.windows} windows)`);
    try {
      const dataProvider = new MockDataProvider();
      const limit = parseInt(options.days) * 24 * 60;
      const candles = await dataProvider.getHistory(limit);

      const engine = new BacktestEngine();
      const result = await engine.walkForward(
        () => StrategyLoader.load(options.strategy),
        candles,
        parseInt(options.windows),
        0.7,
        parseFloat(options.balance)
      );

      logger.info('\n=== WALK-FORWARD ANALYSIS ===');
      logger.info(`Windows:          ${result.windows.length}`);
      logger.info(`Avg Test Return:  ${result.aggregateTestReturn.toFixed(2)}%`);
      logger.info(`Avg Test Sharpe:  ${result.aggregateTestSharpe.toFixed(3)}`);
      logger.info(`Robustness Ratio: ${result.robustnessRatio.toFixed(3)}`);
      logger.info(`Overfit:          ${result.overfit ? 'YES ⚠️' : 'NO ✅'}`);

      for (let i = 0; i < result.windows.length; i++) {
        const w = result.windows[i];
        logger.info(`  Window ${i + 1}: Train=${w.trainResult.totalReturn.toFixed(2)}% → Test=${w.testResult.totalReturn.toFixed(2)}%`);
      }
      logger.info('=============================\n');
    } catch (error: unknown) {
      logger.error(`Walk-forward failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Register all arb:* commands from extracted module
registerArbCommands(program);
registerSpreadDetectorCommand(program);
registerMarketplaceCommands(program);
registerMLCommands(program);
registerDryRunCommand(program);
registerAgiTradeCommand(program);
registerArbLiveCommand(program);
registerUnifiedArbCommand(program);
registerSetupCommand(program);
registerQuickstartCommand(program);
registerTelegramBotCommand(program);
registerPolymarketTelegramCommand(program);
registerPolymarketOrderbookCommand(program);
registerPolymarketOrderbookAnalyzeCommand(program);
registerLiveTradingCommands(program);
registerRiskDashboardCommand(program);

// Register ML strategies in StrategyLoader (PRO feature - gracefully handle FREE tier)
try {
  StrategyLoader.registerMLStrategies();
} catch (error) {
  // LicenseError expected for FREE tier - ML strategies won't be registered
  if (error instanceof LicenseError) {
    logger.debug('ML strategies not registered: FREE tier (upgrade to PRO for ML features)');
  } else {
    // Re-throw unexpected errors
    throw error;
  }
}

// Global handlers for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

program.parse(process.argv);
