/**
 * Multi-Tenant Strategy Manager for RaaS AGI.
 * Isolates strategy execution per tenant with independent risk limits.
 * Inspired by n8n multi-workflow + Portkey per-key tracking.
 */

import { logger } from '../utils/logger';
import { CredentialVault } from '../utils/CredentialVault';

// Re-export types for backward compatibility
export type {
  TenantAccount,
  TenantConfig,
  TenantStrategy,
  TenantState,
} from './tenant-strategy-manager-types';

import {
  TenantAccount,
  TenantConfig,
  TenantState,
} from './tenant-strategy-manager-types';

import {
  createTenantState,
  addAccountToTenant,
  startStrategyOnTenant,
  stopStrategyOnTenant,
  resetTenantDailyCounters,
} from './tenant-crud-operations';

export class TenantStrategyManager {
  private tenants = new Map<string, TenantState>();
  private vault: CredentialVault;

  constructor(vault?: CredentialVault) {
    this.vault = vault ?? new CredentialVault();
  }

  /** Register a new tenant */
  addTenant(config: TenantConfig): void {
    if (this.tenants.has(config.id)) {
      logger.warn(`Tenant ${config.id} already registered — skipping`);
      return;
    }
    this.tenants.set(config.id, createTenantState(config));
    logger.info(`Tenant added: ${config.id} (${config.tier})`);
  }

  /** Add an exchange account to a tenant */
  addAccount(tenantId: string, account: TenantAccount): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    return addAccountToTenant(tenant, account);
  }

  /** Remove a tenant */
  removeTenant(tenantId: string): boolean {
    const removed = this.tenants.delete(tenantId);
    if (removed) logger.info(`Tenant removed: ${tenantId}`);
    return removed;
  }

  /** Start a strategy for a tenant */
  startStrategy(
    tenantId: string,
    strategyId: string,
    strategyName: string,
    accountName: string,
    configOverrides?: Record<string, unknown>,
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      logger.warn(`startStrategy: tenant ${tenantId} not found`);
      return false;
    }
    return startStrategyOnTenant(tenant, strategyId, strategyName, accountName, configOverrides);
  }

  /** Stop a strategy for a tenant */
  stopStrategy(tenantId: string, strategyId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    return stopStrategyOnTenant(tenant, strategyId);
  }

  /** Record a trade result; trips circuit breaker if daily loss limit exceeded */
  recordTrade(tenantId: string, strategyId: string, pnl: number): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    const strategy = tenant.strategies.find(s => s.strategyId === strategyId);
    if (!strategy || strategy.status !== 'active') return false;

    strategy.pnl += pnl;
    strategy.trades += 1;
    tenant.dailyPnl += pnl;
    tenant.dailyTrades += 1;

    if (tenant.dailyPnl < -tenant.config.maxDailyLossUsd) {
      tenant.circuitBreakerTripped = true;
      tenant.strategies.forEach(s => { if (s.status === 'active') s.status = 'paused'; });
      logger.warn(`Circuit breaker tripped for tenant ${tenantId}: dailyPnl=${tenant.dailyPnl.toFixed(2)}`);
    }
    return true;
  }

  /** Check if tenant can trade (within limits) */
  canTrade(tenantId: string): { allowed: boolean; reason?: string } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return { allowed: false, reason: 'Tenant not found' };
    if (tenant.circuitBreakerTripped) return { allowed: false, reason: 'Circuit breaker tripped' };
    return { allowed: true };
  }

  /** Get tenant state */
  getTenant(tenantId: string): TenantState | undefined {
    return this.tenants.get(tenantId);
  }

  /** List all tenants */
  listTenants(): TenantState[] {
    return Array.from(this.tenants.values());
  }

  /** Get tenant performance summary */
  getPerformance(tenantId: string): {
    totalPnl: number;
    totalTrades: number;
    activeStrategies: number;
    winRate: number;
  } | undefined {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;

    const totalPnl = tenant.strategies.reduce((sum, s) => sum + s.pnl, 0);
    const totalTrades = tenant.strategies.reduce((sum, s) => sum + s.trades, 0);
    const activeStrategies = tenant.strategies.filter(s => s.status === 'active').length;
    const winners = tenant.strategies.reduce((sum, s) => sum + (s.pnl > 0 ? 1 : 0), 0);
    const winRate = tenant.strategies.length > 0 ? winners / tenant.strategies.length : 0;

    return { totalPnl, totalTrades, activeStrategies, winRate };
  }

  /** Get an account for a tenant */
  getAccount(tenantId: string, accountName: string): TenantAccount | undefined {
    const tenant = this.tenants.get(tenantId);
    return tenant?.accounts.find(a => a.accountName === accountName);
  }

  /** Get credentials from vault for an account */
  async getCredentials(
    tenantId: string,
    accountName: string,
    password?: string,
  ): Promise<{ apiKey: string; secret: string } | null> {
    const account = this.getAccount(tenantId, accountName);
    if (!account) return null;

    if (password) {
      this.vault.unlock(password);
    }

    const credentialsStr = this.vault.get(account.vaultKey);
    if (!credentialsStr) return null;

    try {
      return JSON.parse(credentialsStr);
    } catch {
      return { apiKey: credentialsStr, secret: '' };
    }
  }

  /** Reset daily counters for all tenants (call on 24h boundary) */
  resetDaily(): void {
    for (const tenant of this.tenants.values()) {
      resetTenantDailyCounters(tenant);
    }
  }
}
