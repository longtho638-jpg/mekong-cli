import { Command } from 'commander';
import { BotEngine } from './core/BotEngine';
import { RsiSmaStrategy } from './strategies/RsiSmaStrategy';
import { StrategyLoader } from './core/StrategyLoader';
import { MockDataProvider } from './data/MockDataProvider';
import { ExchangeClient } from './execution/ExchangeClient';
import { BacktestRunner, BacktestResult } from './backtest/BacktestRunner';
import { logger } from './utils/logger';
import * as dotenv from 'dotenv';

// Load environment variables securely
dotenv.config();

const program = new Command();

program
  .version('0.1.0')
  .description('Algo Trader CLI');

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
        symbol: options.symbol,
        riskPercentage: 1, // 1%
        pollInterval: 1000
      });

      await engine.start();

      const shutdown = async () => {
        await engine.stop();
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
