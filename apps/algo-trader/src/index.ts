import { Command } from 'commander';
import { BotEngine } from './core/BotEngine';
import { RsiSmaStrategy } from './strategies/RsiSmaStrategy';
import { StrategyLoader } from './core/StrategyLoader';
import { MockDataProvider } from './data/MockDataProvider';
import { ExchangeClient } from './execution/ExchangeClient';
import { BacktestRunner } from './backtest/BacktestRunner';
import { logger } from './utils/logger';

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

    // For demo purposes, using MockDataProvider even in "live" mode
    // In production, you'd implement a WebSocketDataProvider or PollingDataProvider
    const dataProvider = new MockDataProvider();

    // Exchange Client
    // NOTE: In a real scenario, you'd load API keys from .env
    const exchange = new ExchangeClient(options.exchange, process.env.API_KEY, process.env.API_SECRET);

    const strategy = new RsiSmaStrategy();

    const engine = new BotEngine(strategy, dataProvider, exchange, {
      symbol: options.symbol,
      riskPercentage: 1, // 1%
      pollInterval: 1000
    });

    await engine.start();

    // Keep process alive
    process.on('SIGINT', async () => {
      await engine.stop();
      process.exit(0);
    });
  });

program.parse(process.argv);
