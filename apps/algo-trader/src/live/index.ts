/**
 * Live Trading Orchestrator — main entry point.
 * Initializes all live components: vault, proxy, ghost, anti-bot, compliance, canary.
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadCredentials, isCredentialValid, maskCredential } from './account-vault';
import type { VaultConfig, AccountCredential } from './account-vault';
import { createPoolState, getPoolHealth } from './proxy-pool-manager';
import type { ProxyPoolConfig, ProxyPoolState } from './proxy-pool-manager';
import { applyOverrides, applyRiskProfile, getCanaryConfig } from './ghost-configurator';
import type { GhostConfig, LiveGhostOverrides } from './ghost-configurator';
import { createMonitorState } from './anti-bot-monitor';
import type { AntiBotConfig, MonitorState } from './anti-bot-monitor';
import { createComplianceLog } from './compliance-logger';
import type { ComplianceLog } from './compliance-logger';
import { generateReadinessReport } from './canary-preparer';
import type { ReadinessReport } from './canary-preparer';

export interface LiveConfig {
  accounts: VaultConfig['accounts'];
  proxyPool: ProxyPoolConfig;
  ghostConfig: GhostConfig;
  antiBotMonitor: Partial<AntiBotConfig>;
  complianceLogPath: string;
  canaryMode: boolean;
}

export interface LiveOrchestratorState {
  credentials: AccountCredential[];
  proxyPool: ProxyPoolState;
  ghostConfig: GhostConfig;
  monitorState: MonitorState;
  complianceLog: ComplianceLog;
  canaryMode: boolean;
  initialized: boolean;
}

/** Loads live config from JSON file */
export function loadLiveConfig(configPath: string): LiveConfig {
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    accounts: parsed.accounts ?? {},
    proxyPool: {
      provider: parsed.proxyPool?.provider ?? 'brightdata',
      apiTokenEnv: parsed.proxyPool?.apiTokenEnv ?? 'BRIGHTDATA_TOKEN',
      rotationIntervalSec: parsed.proxyPool?.rotationIntervalSec ?? 30,
      maxConcurrentProxies: parsed.proxyPool?.maxConcurrentProxies ?? 50,
      healthCheckUrl: parsed.proxyPool?.healthCheckUrl ?? 'https://api.binance.com/api/v3/ping',
      stickySession: parsed.proxyPool?.stickySession ?? false,
      fallbackToDirect: parsed.proxyPool?.fallbackToDirect ?? true,
    },
    ghostConfig: {
      jitterMeanMs: parsed.ghostConfig?.jitterMeanMs ?? 8,
      jitterStdMs: parsed.ghostConfig?.jitterStdMs ?? 3,
      fingerprintRotation: parsed.ghostConfig?.fingerprintRotation ?? 'perRequest',
      webSocketShards: parsed.ghostConfig?.webSocketShards ?? 5,
      chameleonActions: parsed.ghostConfig?.chameleonActions ?? ['cancelRandom', 'tinyOrder'],
    },
    antiBotMonitor: parsed.antiBotMonitor ?? {},
    complianceLogPath: parsed.complianceLogPath ?? './logs/compliance/',
    canaryMode: parsed.canaryMode ?? true,
  };
}

/** Initializes the live orchestrator */
export function initializeOrchestrator(config: LiveConfig): LiveOrchestratorState {
  // Load and validate credentials
  const credentials = loadCredentials({ accounts: config.accounts });
  const validCreds = credentials.filter(isCredentialValid);

  // Setup ghost config (canary mode = conservative settings)
  let ghostConfig = config.ghostConfig;
  if (config.canaryMode) {
    ghostConfig = getCanaryConfig(ghostConfig);
  }

  return {
    credentials: validCreds,
    proxyPool: createPoolState(),
    ghostConfig,
    monitorState: createMonitorState(),
    complianceLog: createComplianceLog(),
    canaryMode: config.canaryMode,
    initialized: true,
  };
}

/** Returns orchestrator status summary (safe for logging) */
export function getOrchestratorStatus(state: LiveOrchestratorState): Record<string, unknown> {
  const poolHealth = getPoolHealth(state.proxyPool);
  return {
    initialized: state.initialized,
    canaryMode: state.canaryMode,
    accounts: state.credentials.map(maskCredential),
    proxyPool: poolHealth,
    ghostConfig: state.ghostConfig,
    alerts: state.monitorState.alerts.length,
    trades: state.complianceLog.entries.length,
    pausedExchanges: Object.keys(state.monitorState.pausedExchanges),
  };
}

// Re-export submodules
export { encrypt, decrypt, loadCredentials, isCredentialValid, rotateAccount, maskCredential } from './account-vault';
export type { AccountCredential, VaultConfig } from './account-vault';
export { createPoolState, fetchProxies, getNextProxy, shouldRotate, updateProxyHealth, forceRotate, getPoolHealth } from './proxy-pool-manager';
export type { ProxyEntry, ProxyPoolConfig, ProxyPoolState } from './proxy-pool-manager';
export { applyOverrides, applyRiskProfile, generateJitter, escalateJitter, getCanaryConfig } from './ghost-configurator';
export type { GhostConfig, ExchangeRiskProfile, LiveGhostOverrides } from './ghost-configurator';
export { createMonitorState, recordResponse, pauseExchange, isExchangePaused, resetEscalation } from './anti-bot-monitor';
export type { AntiBotConfig, ExchangeResponse, EscalationAction, AntiBotAlert, MonitorState } from './anti-bot-monitor';
export { createComplianceLog, appendEntry, serializeEncrypted, toCSV, filterByDateRange, getLogSummary } from './compliance-logger';
export type { TradeLogEntry, ComplianceLog } from './compliance-logger';
export { testConnectivity, testAuthentication, testGhostProtocol, testDryRunOrder, generateReadinessReport } from './canary-preparer';
export type { CanaryTestResult, ReadinessReport, CanaryConfig } from './canary-preparer';
