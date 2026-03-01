/**
 * Multi-Tenant Strategy Manager for RaaS AGI.
 * Isolates strategy execution per tenant with independent risk limits.
 * Inspired by n8n multi-workflow + Portkey per-key tracking.
 */

import { logger } from '../utils/logger';
import { CredentialVault } from '../utils/CredentialVault';

export interface TenantAccount {
  exchangeId: string;
  accountName: string; // Identifier within the tenant (e.g. 'main', 'scalping')
  isTestnet: boolean;
  vaultKey: string; // Key name in CredentialVault
}

export interface TenantConfig {
  id: string;
  name: string;
  maxStrategies: number;
  maxDailyLossUsd: number;
  maxPositionSizeUsd: number;
  allowedExchanges: string[];
  tier: 'free' | 'pro' | 'enterprise';
}

export interface TenantStrategy {
  strategyId: string;
  strategyName: string;
  accountName: string;
  status: 'active' | 'paused' | 'stopped';
  pnl: number;
  trades: number;
  startedAt: number;
  configOverrides?: Record<string, any>;
}

export interface TenantState {
  config: TenantConfig;
  accounts: TenantAccount[];
  strategies: TenantStrategy[];
  dailyPnl: number;
  dailyTrades: number;
  lastResetAt: number;
  circuitBreakerTripped: boolean;
}

const TIER_MAX_STRATEGIES: Record<TenantConfig['tier'], number> = {
  free: 1,
  pro: 5,
  enterprise: Infinity,
};

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
    this.tenants.set(config.id, {
      config,
      accounts: [],
      strategies: [],
      dailyPnl: 0,
      dailyTrades: 0,
      lastResetAt: Date.now(),
      circuitBreakerTripped: false,
    });
    logger.info(`Tenant added: ${config.id} (${config.tier})`);
  }

  /** Add an exchange account to a tenant */
  addAccount(tenantId: string, account: TenantAccount): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    if (tenant.accounts.find(a => a.accountName === account.accountName)) {
      logger.warn(`Account ${account.accountName} already exists for tenant ${tenantId}`);
      return false;
    }

    tenant.accounts.push(account);
    logger.info(`Account added: ${account.accountName} (${account.exchangeId}) for tenant ${tenantId}`);
    return true;
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
    configOverrides?: Record<string, any>
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      logger.warn(`startStrategy: tenant ${tenantId} not found`);
      return false;
    }

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
      tenant.strategies.push({
        strategyId,
        strategyName,
        accountName,
        status: 'active',
        pnl: 0,
        trades: 0,
        startedAt: Date.now(),
        configOverrides,
      });
      logger.info(`Strategy started: ${strategyId} on account ${accountName} for tenant ${tenantId}`);
    }
    return true;
  }

  /** Stop a strategy for a tenant */
  stopStrategy(tenantId: string, strategyId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    const strategy = tenant.strategies.find(s => s.strategyId === strategyId);
    if (!strategy) return false;
    strategy.status = 'stopped';
    logger.info(`Strategy stopped: ${strategyId} for tenant ${tenantId}`);
    return true;
  }

  /** Record a trade result for a tenant's strategy */
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
  async getCredentials(tenantId: string, accountName: string, password?: string): Promise<{ apiKey: string; secret: string } | null> {
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
      // If not JSON, assume it's just the API key (legacy/simple support)
      return { apiKey: credentialsStr, secret: '' };
    }
  }

  /** Reset daily counters (call on 24h boundary) */
  resetDaily(): void {
    const now = Date.now();
    for (const tenant of this.tenants.values()) {
      tenant.dailyPnl = 0;
      tenant.dailyTrades = 0;
      tenant.lastResetAt = now;
      tenant.circuitBreakerTripped = false;
      tenant.strategies.forEach(s => { if (s.status === 'paused') s.status = 'active'; });
      logger.info(`Daily reset for tenant ${tenant.config.id}`);
    }
  }
}
