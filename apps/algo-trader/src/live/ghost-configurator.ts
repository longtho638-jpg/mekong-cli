/**
 * Ghost Configurator — applies live-specific overrides to Phase 6 Ghost Protocol config.
 * Manages jitter, fingerprint rotation, WebSocket sharding, and chameleon actions.
 */

export interface GhostConfig {
  jitterMeanMs: number;
  jitterStdMs: number;
  fingerprintRotation: 'perRequest' | 'perSession' | 'perMinute';
  webSocketShards: number;
  chameleonActions: string[];
}

export interface ExchangeRiskProfile {
  exchange: string;
  riskLevel: 'low' | 'medium' | 'high';
  disabledActions: string[];
  maxJitterMs: number;
  minShards: number;
}

export interface LiveGhostOverrides {
  jitterMeanMs?: number;
  jitterStdMs?: number;
  fingerprintRotation?: 'perRequest' | 'perSession' | 'perMinute';
  webSocketShards?: number;
  chameleonActions?: string[];
}

const DEFAULT_RISK_PROFILES: Record<string, ExchangeRiskProfile> = {
  binance: { exchange: 'binance', riskLevel: 'high', disabledActions: [], maxJitterMs: 15, minShards: 5 },
  okx: { exchange: 'okx', riskLevel: 'medium', disabledActions: ['tinyOrder'], maxJitterMs: 20, minShards: 3 },
  bybit: { exchange: 'bybit', riskLevel: 'medium', disabledActions: [], maxJitterMs: 25, minShards: 3 },
};

/** Merges base Ghost config with live overrides */
export function applyOverrides(base: GhostConfig, overrides: LiveGhostOverrides): GhostConfig {
  return {
    jitterMeanMs: overrides.jitterMeanMs ?? base.jitterMeanMs,
    jitterStdMs: overrides.jitterStdMs ?? base.jitterStdMs,
    fingerprintRotation: overrides.fingerprintRotation ?? base.fingerprintRotation,
    webSocketShards: overrides.webSocketShards ?? base.webSocketShards,
    chameleonActions: overrides.chameleonActions ?? [...base.chameleonActions],
  };
}

/** Applies exchange-specific risk adjustments */
export function applyRiskProfile(
  config: GhostConfig,
  exchange: string,
  customProfiles?: Record<string, ExchangeRiskProfile>
): GhostConfig {
  const profiles = { ...DEFAULT_RISK_PROFILES, ...customProfiles };
  const profile = profiles[exchange];
  if (!profile) return config;

  const result = { ...config };

  // Cap jitter to exchange max
  if (result.jitterMeanMs > profile.maxJitterMs) {
    result.jitterMeanMs = profile.maxJitterMs;
  }

  // Ensure minimum shard count
  if (result.webSocketShards < profile.minShards) {
    result.webSocketShards = profile.minShards;
  }

  // Remove disabled chameleon actions for this exchange
  if (profile.disabledActions.length > 0) {
    result.chameleonActions = result.chameleonActions.filter(
      (a) => !profile.disabledActions.includes(a)
    );
  }

  // High-risk exchanges: force perRequest fingerprint rotation
  if (profile.riskLevel === 'high') {
    result.fingerprintRotation = 'perRequest';
  }

  return result;
}

/** Generates a jitter delay using normal distribution */
export function generateJitter(meanMs: number, stdMs: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
  const jitter = meanMs + z * stdMs;
  return Math.max(0, Math.round(jitter));
}

/** Increases jitter parameters (used by anti-bot escalation) */
export function escalateJitter(config: GhostConfig, factor: number): GhostConfig {
  return {
    ...config,
    jitterMeanMs: Math.round(config.jitterMeanMs * factor),
    jitterStdMs: Math.round(config.jitterStdMs * factor),
  };
}

/** Returns recommended config for canary mode (conservative settings) */
export function getCanaryConfig(base: GhostConfig): GhostConfig {
  return {
    ...base,
    jitterMeanMs: Math.max(base.jitterMeanMs * 2, 15),
    jitterStdMs: Math.max(base.jitterStdMs * 2, 5),
    fingerprintRotation: 'perRequest',
    webSocketShards: Math.max(base.webSocketShards, 5),
  };
}
