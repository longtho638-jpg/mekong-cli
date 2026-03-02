/**
 * tenant-crud-operations — Pure CRUD helpers for tenant and account registry management.
 * Add/remove tenants and accounts, start/stop strategies with tier and limit enforcement.
 * Extracted from TenantStrategyManager to separate data mutation from business logic.
 */

import { logger } from '../utils/logger';
import {
  TenantConfig,
  TenantAccount,
  TenantState,
  TenantStrategy,
  TIER_MAX_STRATEGIES,
} from './tenant-strategy-manager-types';

/** Create a fresh TenantState from a config */
export function createTenantState(config: TenantConfig): TenantState {
  return {
    config,
    accounts: [],
    strategies: [],
    dailyPnl: 0,
    dailyTrades: 0,
    lastResetAt: Date.now(),
    circuitBreakerTripped: false,
  };
}

/** Add an account to a tenant; returns false if account name already exists */
export function addAccountToTenant(tenant: TenantState, account: TenantAccount): boolean {
  if (tenant.accounts.find(a => a.accountName === account.accountName)) {
    logger.warn(`Account ${account.accountName} already exists for tenant ${tenant.config.id}`);
    return false;
  }
  tenant.accounts.push(account);
  logger.info(`Account added: ${account.accountName} (${account.exchangeId}) for tenant ${tenant.config.id}`);
  return true;
}

/**
 * Start or resume a strategy on a tenant account.
 * Enforces circuit breaker, tier limits, and config limits.
 */
export function startStrategyOnTenant(
  tenant: TenantState,
  strategyId: string,
  strategyName: string,
  accountName: string,
  configOverrides?: Record<string, unknown>,
): boolean {
  const tenantId = tenant.config.id;

  const account = tenant.accounts.find(a => a.accountName === accountName);
  if (!account) {
    logger.warn(`startStrategy: account ${accountName} not found for tenant ${tenantId}`);
    return false;
  }

  if (tenant.circuitBreakerTripped) {
    logger.warn(`startStrategy: circuit breaker tripped for ${tenantId}`);
    return false;
  }

  const tierLimit = TIER_MAX_STRATEGIES[tenant.config.tier];
  const activeCount = tenant.strategies.filter(s => s.status === 'active').length;
  const configLimit = tenant.config.maxStrategies;
  const effectiveLimit = Math.min(tierLimit === Infinity ? configLimit : tierLimit, configLimit);

  if (activeCount >= effectiveLimit) {
    logger.warn(`startStrategy: ${tenantId} at strategy limit (${effectiveLimit})`);
    return false;
  }

  const existing = tenant.strategies.find(s => s.strategyId === strategyId);
  if (existing) {
    existing.status = 'active';
    existing.accountName = accountName;
    existing.configOverrides = configOverrides;
    logger.info(`Strategy resumed: ${strategyId} for tenant ${tenantId}`);
  } else {
    const newStrategy: TenantStrategy = {
      strategyId,
      strategyName,
      accountName,
      status: 'active',
      pnl: 0,
      trades: 0,
      startedAt: Date.now(),
      configOverrides,
    };
    tenant.strategies.push(newStrategy);
    logger.info(`Strategy started: ${strategyId} on account ${accountName} for tenant ${tenantId}`);
  }
  return true;
}

/** Stop a strategy; returns false if strategy not found */
export function stopStrategyOnTenant(tenant: TenantState, strategyId: string): boolean {
  const strategy = tenant.strategies.find(s => s.strategyId === strategyId);
  if (!strategy) return false;
  strategy.status = 'stopped';
  logger.info(`Strategy stopped: ${strategyId} for tenant ${tenant.config.id}`);
  return true;
}

/** Reset daily PnL counters and unpause strategies paused by circuit breaker */
export function resetTenantDailyCounters(tenant: TenantState): void {
  tenant.dailyPnl = 0;
  tenant.dailyTrades = 0;
  tenant.lastResetAt = Date.now();
  tenant.circuitBreakerTripped = false;
  tenant.strategies.forEach(s => {
    if (s.status === 'paused') s.status = 'active';
  });
  logger.info(`Daily reset for tenant ${tenant.config.id}`);
}
