/**
 * Quickstart command — One command does everything:
 * 1. Check if .env exists (if not → run setup wizard)
 * 2. Run demo backtest to prove system works
 * 3. Show available commands for next steps
 *
 * Goal: customer enters API key → runs immediately, zero extra config.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { StrategyLoader } from '../core/StrategyLoader';
import { MockDataProvider } from '../data/MockDataProvider';
import { BacktestRunner } from '../backtest/BacktestRunner';
import { runSetupWizard } from './setup-wizard-command';
import { logger } from '../utils/logger';

const ENV_PATH = path.resolve(process.cwd(), '.env');

function readEnvContent(): string {
  if (!fs.existsSync(ENV_PATH)) return '';
  return fs.readFileSync(ENV_PATH, 'utf-8');
}

function hasValidEnv(content: string): boolean {
  return /^\w+=.+/m.test(content);
}

function getConfiguredExchanges(content: string): string[] {
  const exchanges: string[] = [];
  if (/BINANCE_API_KEY=(?!your_).{10,}/.test(content)) exchanges.push('Binance');
  if (/OKX_API_KEY=(?!your_).{10,}/.test(content)) exchanges.push('OKX');
  if (/BYBIT_API_KEY=(?!your_).{10,}/.test(content)) exchanges.push('Bybit');
  return exchanges;
}

async function runDemoBacktest(): Promise<void> {
  console.log('');
  console.log('📊 Running demo backtest (RsiSma, 30 days, $10,000)...');
  console.log('');

  const strategy = StrategyLoader.load('RsiSma');
  const dataProvider = new MockDataProvider();
  const runner = new BacktestRunner(strategy, dataProvider, 10000);
  const result = await runner.run(30, true);

  console.log('┌─────────────────────────────────────┐');
  console.log('│        DEMO BACKTEST RESULTS         │');
  console.log('├─────────────────────────────────────┤');
  console.log(`│  Return:      ${result.totalReturn.toFixed(2).padStart(10)}%         │`);
  console.log(`│  Sharpe:      ${result.sharpeRatio.toFixed(3).padStart(10)}          │`);
  console.log(`│  Max DD:      ${result.maxDrawdown.toFixed(2).padStart(10)}%         │`);
  console.log(`│  Win Rate:    ${result.winRate.toFixed(1).padStart(10)}%         │`);
  console.log(`│  Trades:      ${String(result.totalTrades).padStart(10)}          │`);
  console.log('└─────────────────────────────────────┘');
}

export function registerQuickstartCommand(program: Command): void {
  program
    .command('quickstart')
    .description('Zero-config start — setup + demo backtest + ready to trade')
    .option('--skip-backtest', 'Skip demo backtest')
    .action(async (options) => {
      try {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║     AGI Algo Trader — Quickstart             ║');
        console.log('╚══════════════════════════════════════════════╝');

        // Step 1: Check .env
        let envContent = readEnvContent();
        if (!hasValidEnv(envContent)) {
          console.log('');
          console.log('⚠️  No .env found. Running setup wizard...');
          console.log('');

          await runSetupWizard();

          // Re-check after setup
          envContent = readEnvContent();
          if (!hasValidEnv(envContent)) {
            logger.error('Setup did not complete. Run "npm run setup" manually.');
            process.exit(1);
          }
        } else {
          console.log('');
          console.log('✅ .env found');
        }

        // Step 2: Show configured exchanges
        const exchanges = getConfiguredExchanges(envContent);
        if (exchanges.length > 0) {
          console.log(`✅ Exchanges configured: ${exchanges.join(', ')}`);
        } else {
          console.log('ℹ️  No exchange keys — backtest & dry-run mode only');
        }

        // Step 3: Demo backtest
        if (!options.skipBacktest) {
          await runDemoBacktest();
        }

        // Step 4: Show next steps
        console.log('');
        console.log('🚀 System ready! Available commands:');
        console.log('');
        console.log('  ── Backtesting (no API key needed) ──────────');
        console.log('  npm run dev backtest                 # Basic backtest');
        console.log('  npm run dev backtest:advanced         # With Sharpe/Sortino/Monte Carlo');
        console.log('  npm run dev compare                  # Compare all strategies');
        console.log('');

        if (exchanges.length >= 2) {
          console.log('  ── Arbitrage (requires 2+ exchanges) ────────');
          console.log('  npm run dev arb:agi                  # AGI arbitrage (recommended)');
          console.log('  npm run dev arb:spread               # Cross-exchange spread detector');
          console.log('  npm run dev arb:auto                 # Unified auto-execution');
          console.log('');
        }

        if (exchanges.length >= 1) {
          console.log('  ── Live Trading (REAL MONEY ⚠️) ────────────');
          console.log('  npm run dev live -s BTC/USDT         # Single exchange live');
          console.log('');
        }

        console.log('  ── API Server ────────────────────────────────');
        console.log('  npm run dev api:serve                # Start RaaS API');
        console.log('');
        console.log('📖 Docs: docs/deployment-guide.md');
        console.log('');
      } catch (error: unknown) {
        logger.error(`Quickstart failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
