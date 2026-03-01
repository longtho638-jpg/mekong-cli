/**
 * Strategy Config Cascade — Nixpacks-inspired configuration resolution.
 *
 * Priority cascade (lowest to highest, higher overrides lower):
 * 1. Provider defaults — strategy's built-in defaults
 * 2. Config file     — trader-config.json (like nixpacks.toml)
 * 3. Environment vars — ALGO_TRADER_* env vars
 * 4. CLI flags        — command-line arguments
 *
 * Each layer can partially override the previous.
 * Inspired by Nixpacks' Provider < File < Environment < CLI cascade.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Resolved strategy configuration */
export interface StrategyConfig {
  pair: string;
  timeframe: string;
  exchangeId: string;
  maxPositionSizeUsd: number;
  maxDailyLossUsd: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  pollIntervalMs: number;
  mode: 'backtest' | 'paper' | 'live';
  [key: string]: string | number | boolean;
}

/** Default config values (layer 1: provider defaults) */
const PROVIDER_DEFAULTS: StrategyConfig = {
  pair: 'BTC/USDT',
  timeframe: '1h',
  exchangeId: 'binance',
  maxPositionSizeUsd: 500,
  maxDailyLossUsd: 50,
  stopLossPercent: 2.0,
  takeProfitPercent: 5.0,
  pollIntervalMs: 2000,
  mode: 'paper',
};

/** Environment variable prefix for config */
const ENV_PREFIX = 'ALGO_TRADER_';

/**
 * Resolve configuration through the cascade.
 * Each layer merges on top of previous (shallow merge, undefined values skipped).
 */
export function resolveConfig(options: {
  providerDefaults?: Partial<StrategyConfig>;
  configFilePath?: string;
  cliOverrides?: Partial<StrategyConfig>;
}): StrategyConfig {
  // Layer 1: Provider defaults
  const base = { ...PROVIDER_DEFAULTS, ...stripUndefined(options.providerDefaults) };

  // Layer 2: Config file (trader-config.json)
  const fileConfig = loadConfigFile(options.configFilePath);

  // Layer 3: Environment variables
  const envConfig = loadEnvConfig();

  // Layer 4: CLI overrides
  const cliConfig = stripUndefined(options.cliOverrides) ?? {};

  // Merge cascade: base < file < env < CLI
  return { ...base, ...fileConfig, ...envConfig, ...cliConfig } as StrategyConfig;
}

/** Load config from JSON file (layer 2) */
function loadConfigFile(filePath?: string): Partial<StrategyConfig> {
  const target = filePath ?? path.join(process.cwd(), 'trader-config.json');
  try {
    if (fs.existsSync(target)) {
      const raw = fs.readFileSync(target, 'utf-8');
      return JSON.parse(raw) as Partial<StrategyConfig>;
    }
  } catch {
    // Config file missing or invalid — skip silently
  }
  return {};
}

/** Load config from environment variables (layer 3) */
function loadEnvConfig(): Partial<StrategyConfig> {
  const config: Partial<StrategyConfig> = {};
  const mapping: Record<string, keyof StrategyConfig> = {
    [`${ENV_PREFIX}PAIR`]: 'pair',
    [`${ENV_PREFIX}TIMEFRAME`]: 'timeframe',
    [`${ENV_PREFIX}EXCHANGE`]: 'exchangeId',
    [`${ENV_PREFIX}MAX_POSITION`]: 'maxPositionSizeUsd',
    [`${ENV_PREFIX}MAX_DAILY_LOSS`]: 'maxDailyLossUsd',
    [`${ENV_PREFIX}STOP_LOSS`]: 'stopLossPercent',
    [`${ENV_PREFIX}TAKE_PROFIT`]: 'takeProfitPercent',
    [`${ENV_PREFIX}POLL_INTERVAL`]: 'pollIntervalMs',
    [`${ENV_PREFIX}MODE`]: 'mode',
  };

  for (const [envKey, configKey] of Object.entries(mapping)) {
    const val = process.env[envKey];
    if (val !== undefined) {
      // Auto-parse numeric values
      const num = Number(val);
      (config as Record<string, unknown>)[configKey] = isNaN(num) ? val : num;
    }
  }
  return config;
}

/** Remove undefined values from partial config */
function stripUndefined<T extends Record<string, unknown>>(obj?: Partial<T>): Partial<T> {
  if (!obj) return {};
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

/** Get the provider defaults (exported for testing) */
export function getProviderDefaults(): StrategyConfig {
  return { ...PROVIDER_DEFAULTS };
}
