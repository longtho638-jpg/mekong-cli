import { Command } from 'commander';
import { BotEngine } from './core/BotEngine';
import { RsiSmaStrategy } from './strategies/RsiSmaStrategy';
import { StrategyLoader } from './core/StrategyLoader';
import { MockDataProvider } from './data/MockDataProvider';
import { ExchangeClient } from './execution/ExchangeClient';
import { BacktestRunner, BacktestResult } from './backtest/BacktestRunner';
import { BacktestEngine } from './backtest/BacktestEngine';
import { ArbitrageScanner } from './arbitrage/ArbitrageScanner';
import { ArbitrageExecutor } from './arbitrage/ArbitrageExecutor';
import { SpreadDetectorEngine } from './arbitrage/SpreadDetectorEngine';
import { ArbitrageOrchestrator } from './arbitrage/ArbitrageOrchestrator';
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

program
  .command('arb:scan')
  .description('Scan cross-exchange arbitrage opportunities (dry-run)')
  .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
  .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx,bybit,gateio')
  .option('-t, --threshold <number>', 'Min spread % to report', '0.1')
  .option('-n, --polls <number>', 'Number of poll cycles', '10')
  .action(async (options) => {
    const symbols = options.pairs.split(',');
    const exchangeIds = options.exchanges.split(',');
    const threshold = parseFloat(options.threshold);
    const maxPolls = parseInt(options.polls);

    logger.info(`[ArbScan] Scanning ${symbols.join(', ')} across ${exchangeIds.join(', ')} (threshold: ${threshold}%)`);

    const scanner = new ArbitrageScanner({
      symbols,
      minSpreadPercent: threshold,
      pollIntervalMs: 3000,
    });

    for (const id of exchangeIds) {
      try {
        const client = new ExchangeClient(id);
        scanner.addExchange(id, client);
      } catch (err) {
        logger.warn(`Skipping ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
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

      // Run for maxPolls cycles then stop
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

program
  .command('arb:run')
  .description('Run live cross-exchange arbitrage bot')
  .option('-p, --pairs <string>', 'Comma-separated trading pairs', 'BTC/USDT,ETH/USDT')
  .option('-e, --exchanges <string>', 'Comma-separated exchange IDs', 'binance,okx')
  .option('-s, --size <number>', 'Max position size USD', '500')
  .option('-t, --threshold <number>', 'Min spread %', '0.15')
  .action(async (options) => {
    const symbols = options.pairs.split(',');
    const exchangeIds: string[] = options.exchanges.split(',');

    if (exchangeIds.length < 2) {
      logger.error('Need at least 2 exchanges for arbitrage');
      process.exit(1);
    }

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

    for (const id of exchangeIds) {
      const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
      const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

      if (!apiKey || apiKey.length < 10) {
        logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
        process.exit(1);
      }

      const client = new ExchangeClient(id, apiKey, secret);
      scanner.addExchange(id, client);
      executor.addExchange(id, client);
    }

    // Wire scanner → executor
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
    const symbols = options.pairs.split(',');
    const exchangeIds: string[] = options.exchanges.split(',');

    if (exchangeIds.length < 2) {
      logger.error('Need at least 2 exchanges for spread detection');
      process.exit(1);
    }

    const exchanges = exchangeIds.map((id: string) => {
      const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
      const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

      if (!apiKey || apiKey.length < 10) {
        logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
        process.exit(1);
      }

      return { id, apiKey, secret, enabled: true };
    });

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
    const symbols = options.pairs.split(',');
    const exchangeIds: string[] = options.exchanges.split(',');

    if (exchangeIds.length < 2) {
      logger.error('Need at least 2 exchanges for arbitrage');
      process.exit(1);
    }

    const exchanges = exchangeIds.map((id: string) => {
      const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
      const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

      if (!apiKey || apiKey.length < 10) {
        logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
        process.exit(1);
      }

      return { id, apiKey, secret, enabled: true };
    });

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
    const symbols = options.pairs.split(',');
    const exchangeIds: string[] = options.exchanges.split(',');

    if (exchangeIds.length < 2) {
      logger.error('Need at least 2 exchanges for auto-execution');
      process.exit(1);
    }

    const exchanges = exchangeIds.map((id: string) => {
      const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
      const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

      if (!apiKey || apiKey.length < 10) {
        logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
        process.exit(1);
      }

      return { id, apiKey, secret, enabled: true };
    });

    logger.info(`[AutoExec] Starting: ${exchangeIds.join('/')} | ${symbols.join(', ')} | Size: $${options.size} | Score≥${options.scoreThreshold}`);

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

      logger.info('[AutoExec] 🤖 Auto-execution ACTIVE — full pipeline: detect→score→validate→execute');
      logger.info(`[AutoExec] Orderbook: ${options.orderbook !== false ? 'ON' : 'OFF'} | Scoring: ${options.scoring !== false ? 'ON' : 'OFF'} | Circuit breaker: ON`);

      const shutdown = () => {
        engine.stop();
        const stats = engine.getStats();
        const profit = engine.getProfitSummary();
        logger.info('\n[AutoExec] ═══ FINAL REPORT ═══');
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
