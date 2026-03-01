/**
 * CLI commands for Strategy Marketplace + Tenant Management.
 * Registers marketplace:* and tenant:* commands.
 */

import { randomUUID } from 'crypto';
import { Command } from 'commander';
import { StrategyMarketplace, MarketplaceEntry } from '../core/strategy-marketplace';
import { TenantStrategyManager, TenantConfig } from '../core/tenant-strategy-manager';
import { StrategyProviderRegistry } from '../core/strategy-provider-registry';
import { StrategyLoader } from '../core/StrategyLoader';
import { logger } from '../utils/logger';

const hr = (ch: string, n: number) => ch.repeat(n);

/** Register all marketplace and tenant CLI commands */
export function registerMarketplaceCommands(program: Command, registry?: StrategyProviderRegistry): void {
  const marketplace = bootstrapMarketplace();
  const tenantManager = new TenantStrategyManager();
  void registry; // optional: caller may pass pre-built registry

  program
    .command('marketplace:list')
    .description('List all strategies in marketplace')
    .option('--type <type>', 'Filter by type (trend, momentum, arbitrage, etc.)')
    .option('--min-rating <number>', 'Minimum rating (0-5)', '0')
    .action((opts: { type?: string; minRating: string }) => {
      const minRating = parseFloat(opts.minRating);
      const entries = marketplace.search({ type: opts.type, minRating: minRating > 0 ? minRating : undefined });
      if (entries.length === 0) { logger.info('[Marketplace] No strategies match filters.'); return; }
      logger.info('\n=== STRATEGY MARKETPLACE ===');
      logger.info('Strategy            | Type           | Risk   | Rating | Return%');
      logger.info(hr('-', 63));
      for (const e of entries) {
        const n = e.metadata.name.padEnd(19);
        const t = e.metadata.type.padEnd(14);
        const r = e.metadata.riskLevel.padEnd(6);
        const rt = e.rating.toFixed(1).padStart(6);
        const ret = e.avgReturn.toFixed(2).padStart(7);
        logger.info(`${n} | ${t} | ${r} | ${rt} | ${ret}%`);
      }
      logger.info(`${hr('=', 28)} (${entries.length} strategies)\n`);
    });

  program
    .command('marketplace:stats')
    .description('Show marketplace statistics')
    .action(() => {
      const s = marketplace.getStats();
      logger.info(`\n=== MARKETPLACE STATS ===\nTotal: ${s.totalStrategies} | Avg rating: ${s.avgRating.toFixed(2)}/5`);
      logger.info('By type: ' + Object.entries(s.byType).map(([k, v]) => `${k}=${v}`).join(', '));
      if (s.topPerformers.length > 0) {
        logger.info('Top 3:');
        s.topPerformers.forEach((e, i) =>
          logger.info(`  ${i + 1}. ${e.metadata.name} — Sharpe ${e.avgSharpe.toFixed(3)}, Return ${e.avgReturn.toFixed(2)}%`)
        );
      }
      logger.info(hr('=', 25) + '\n');
    });

  program
    .command('marketplace:top')
    .description('Show top performing strategies')
    .option('-n, --count <number>', 'Number of top strategies', '5')
    .action((opts: { count: string }) => {
      const n = parseInt(opts.count);
      const top = marketplace.getTopPerformers(n);
      if (top.length === 0) { logger.info('[Marketplace] No performance data yet.'); return; }
      logger.info(`\n=== TOP ${n} STRATEGIES (by Sharpe) ===`);
      logger.info('Rank | Strategy            | Sharpe | Return% | Author');
      logger.info(hr('-', 52));
      top.forEach((e, i) => {
        logger.info(`${String(i + 1).padStart(4)} | ${e.metadata.name.padEnd(19)} | ${e.avgSharpe.toFixed(3).padStart(6)} | ${e.avgReturn.toFixed(2).padStart(7)}% | ${e.author}`);
      });
      logger.info(hr('=', 52) + '\n');
    });

  program
    .command('tenant:create')
    .description('Create a new trading tenant')
    .requiredOption('--name <string>', 'Tenant name')
    .option('--tier <string>', 'Tier: free, pro, enterprise', 'free')
    .option('--max-loss <number>', 'Max daily loss USD', '100')
    .action((opts: { name: string; tier: string; maxLoss: string }) => {
      const tier = opts.tier as TenantConfig['tier'];
      if (!['free', 'pro', 'enterprise'].includes(tier)) {
        logger.error(`Invalid tier "${tier}". Use: free, pro, enterprise`); return;
      }
      const config: TenantConfig = {
        id: randomUUID(), name: opts.name, tier,
        maxDailyLossUsd: parseFloat(opts.maxLoss),
        maxPositionSizeUsd: tier === 'enterprise' ? 10000 : tier === 'pro' ? 2000 : 500,
        maxStrategies: tier === 'enterprise' ? 100 : tier === 'pro' ? 10 : 2,
        allowedExchanges: ['binance', 'okx', 'bybit'],
      };
      tenantManager.addTenant(config);
      logger.info(`\n=== TENANT CREATED ===\nID: ${config.id}\nName: ${config.name} | Tier: ${config.tier} | Max loss: $${config.maxDailyLossUsd} | Strategies: ${config.maxStrategies}\n`);
    });

  program
    .command('tenant:add-account')
    .description('Add an exchange account to a tenant')
    .requiredOption('--tenant-id <id>', 'Tenant ID')
    .requiredOption('--name <string>', 'Account name (unique identifier)')
    .requiredOption('--exchange <id>', 'Exchange ID (binance, okx, etc.)')
    .requiredOption('--vault-key <string>', 'Vault key for API credentials')
    .option('--testnet', 'Use testnet', false)
    .action((opts: { tenantId: string; name: string; exchange: string; vaultKey: string; testnet: boolean }) => {
      const success = tenantManager.addAccount(opts.tenantId, {
        exchangeId: opts.exchange,
        accountName: opts.name,
        isTestnet: opts.testnet,
        vaultKey: opts.vaultKey,
      });
      if (success) {
        logger.info(`Account "${opts.name}" added to tenant ${opts.tenantId}`);
      } else {
        logger.error(`Failed to add account to tenant ${opts.tenantId}`);
      }
    });

  program
    .command('tenant:start-strategy')
    .description('Start a strategy for a tenant')
    .requiredOption('--tenant-id <id>', 'Tenant ID')
    .requiredOption('--strategy <id>', 'Strategy ID')
    .requiredOption('--account <name>', 'Account name to use')
    .option('--overrides <json>', 'Config overrides in JSON format')
    .action((opts: { tenantId: string; strategy: string; account: string; overrides?: string }) => {
      let overrides = {};
      if (opts.overrides) {
        try { overrides = JSON.parse(opts.overrides); }
        catch (e) { logger.error('Invalid JSON in overrides'); return; }
      }

      const entry = marketplace.search({}).find(e => e.metadata.id === opts.strategy);
      if (!entry) { logger.error(`Strategy "${opts.strategy}" not found in marketplace.`); return; }

      const success = tenantManager.startStrategy(
        opts.tenantId,
        opts.strategy,
        entry.metadata.name,
        opts.account,
        overrides
      );
      if (success) {
        logger.info(`Strategy "${opts.strategy}" started for tenant ${opts.tenantId} using account "${opts.account}"`);
      } else {
        logger.error(`Failed to start strategy for tenant ${opts.tenantId}`);
      }
    });

  program
    .command('tenant:add-account')
    .description('Add an exchange account to a tenant')
    .requiredOption('--id <string>', 'Tenant ID')
    .requiredOption('--exchange <string>', 'Exchange ID (binance, okx, etc.)')
    .requiredOption('--account <string>', 'Account name (e.g. main)')
    .option('--testnet', 'Use testnet', false)
    .requiredOption('--vault-key <string>', 'Key name in CredentialVault')
    .action((opts: { id: string; exchange: string; account: string; testnet: boolean; vaultKey: string }) => {
      const success = tenantManager.addAccount(opts.id, {
        exchangeId: opts.exchange,
        accountName: opts.account,
        isTestnet: opts.testnet,
        vaultKey: opts.vaultKey,
      });
      if (success) {
        logger.info(`[Tenant] Account "${opts.account}" added to tenant ${opts.id}`);
      } else {
        logger.error(`[Tenant] Failed to add account to tenant ${opts.id}`);
      }
    });

  program
    .command('tenant:start-strategy')
    .description('Start a strategy for a tenant')
    .requiredOption('--id <string>', 'Tenant ID')
    .requiredOption('--strategy <string>', 'Strategy ID from marketplace')
    .requiredOption('--account <string>', 'Account name to use')
    .action((opts: { id: string; strategy: string; account: string }) => {
      const entry = marketplace.search({}).find(e => e.metadata.id === opts.strategy);
      if (!entry) {
        logger.error(`Strategy "${opts.strategy}" not found in marketplace.`);
        return;
      }
      const success = tenantManager.startStrategy(opts.id, entry.metadata.id, entry.metadata.name, opts.account);
      if (success) {
        logger.info(`[Tenant] Strategy "${entry.metadata.name}" started for tenant ${opts.id} on account ${opts.account}`);
      } else {
        logger.error(`[Tenant] Failed to start strategy for tenant ${opts.id}`);
      }
    });

  program
    .command('tenant:list')
    .description('List all tenants')
    .action(() => {
      const tenants = tenantManager.listTenants();
      if (tenants.length === 0) { logger.info('[Tenant] No tenants yet.'); return; }
      logger.info('\n=== TENANTS ===');
      logger.info('Name                 | Tier       | Active | Daily P&L  | Circuit');
      logger.info(hr('-', 60));
      for (const t of tenants) {
        const active = t.strategies.filter(s => s.status === 'active').length;
        logger.info(`${t.config.name.padEnd(20)} | ${t.config.tier.padEnd(10)} | ${String(active).padStart(6)} | $${t.dailyPnl.toFixed(2).padStart(9)} | ${t.circuitBreakerTripped ? 'TRIPPED' : 'OK'}`);
      }
      logger.info(hr('=', 15) + '\n');
    });

  program
    .command('tenant:status')
    .description('Show tenant status')
    .requiredOption('--id <string>', 'Tenant ID')
    .action((opts: { id: string }) => {
      const state = tenantManager.getTenant(opts.id);
      if (!state) { logger.error(`Tenant "${opts.id}" not found.`); return; }
      const perf = tenantManager.getPerformance(opts.id);
      logger.info(`\n=== TENANT: ${state.config.name} (${state.config.tier}) ===`);
      logger.info(`ID: ${state.config.id} | Circuit: ${state.circuitBreakerTripped ? 'TRIPPED' : 'OK'} | Can trade: ${tenantManager.canTrade(opts.id).allowed ? 'YES' : 'NO'}`);
      logger.info(`Daily P&L: $${state.dailyPnl.toFixed(2)} / limit -$${state.config.maxDailyLossUsd}`);

      if (state.accounts.length > 0) {
        logger.info('Accounts:');
        for (const a of state.accounts) {
          logger.info(`  - ${a.accountName.padEnd(12)} | ${a.exchangeId.padEnd(10)} | ${a.isTestnet ? 'TESTNET' : 'LIVE'} | Vault: ${a.vaultKey}`);
        }
      }

      if (perf) logger.info(`Total P&L: $${perf.totalPnl.toFixed(2)} | Trades: ${perf.totalTrades} | Win rate: ${(perf.winRate * 100).toFixed(1)}%`);

      if (state.strategies.length > 0) {
        logger.info('Strategies:');
        for (const s of state.strategies) {
          logger.info(`  ${s.strategyName.padEnd(18)} [${s.status}] on ${s.accountName.padEnd(10)} | P&L: $${s.pnl.toFixed(2)}, trades: ${s.trades}`);
        }
      }
      logger.info(hr('=', 36) + '\n');
    });

  program
    .command('tenant:add-account')
    .description('Add an exchange account to a tenant')
    .requiredOption('--tenant-id <string>', 'Tenant ID')
    .requiredOption('--name <string>', 'Account name (e.g. main)')
    .requiredOption('--exchange <string>', 'Exchange ID (binance, okx, etc.)')
    .requiredOption('--vault-key <string>', 'Key in credential vault')
    .option('--testnet', 'Is this a testnet account', false)
    .action((opts: { tenantId: string; name: string; exchange: string; vaultKey: string; testnet: boolean }) => {
      const success = tenantManager.addAccount(opts.tenantId, {
        accountName: opts.name,
        exchangeId: opts.exchange,
        vaultKey: opts.vaultKey,
        isTestnet: opts.testnet
      });
      if (success) {
        logger.info(`Account "${opts.name}" added successfully to tenant ${opts.tenantId}`);
      } else {
        logger.error(`Failed to add account. Ensure tenant exists and account name is unique.`);
      }
    });
}

/** Bootstrap marketplace with built-in strategies from StrategyLoader */
export function bootstrapMarketplace(): StrategyMarketplace {
  const marketplace = new StrategyMarketplace();
  const TYPE_MAP: Record<string, MarketplaceEntry['metadata']['type']> = {
    RsiSma: 'trend', RsiCrossover: 'momentum', Bollinger: 'mean-reversion',
    MacdCrossover: 'trend', MacdBollingerRsi: 'hybrid',
    CrossExchange: 'arbitrage', Triangular: 'arbitrage', Statistical: 'arbitrage',
  };
  for (const name of StrategyLoader.getNames()) {
    const type = TYPE_MAP[name] ?? 'hybrid';
    marketplace.publish(
      {
        metadata: {
          id: name.toLowerCase(), name, version: '1.0.0', type,
          supportedPairs: ['BTC/USDT', 'ETH/USDT', '*'],
          supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
          riskLevel: type === 'arbitrage' ? 'high' : type === 'mean-reversion' ? 'low' : 'medium',
          description: `Built-in ${type} strategy: ${name}`,
          requiredIndicators: [], minHistoryCandles: 50,
        },
        detect: () => true,
        create: () => StrategyLoader.load(name),
      },
      'algo-trader-core',
      [type, 'built-in'],
    );
  }
  return marketplace;
}
