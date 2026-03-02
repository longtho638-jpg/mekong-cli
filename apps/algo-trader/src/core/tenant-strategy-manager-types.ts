/**
 * tenant-strategy-manager-types — Shared types and constants for multi-tenant strategy management.
 * Extracted from TenantStrategyManager to enable reuse across CRUD and business logic modules.
 */

export interface TenantAccount {
  exchangeId: string;
  accountName: string; // Identifier within the tenant (e.g. 'main', 'scalping')
  isTestnet: boolean;
  vaultKey: string;    // Key name in CredentialVault
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
  configOverrides?: Record<string, unknown>;
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

export const TIER_MAX_STRATEGIES: Record<TenantConfig['tier'], number> = {
  free: 1,
  pro: 5,
  enterprise: Infinity,
};
