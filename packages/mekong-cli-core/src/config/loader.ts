import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { ConfigSchema, type MekongConfig } from '../types/config.js';
import { fileExists } from '../utils/file.js';

/** Load and merge config from all sources (priority: overrides > env > project > user > defaults) */
export async function loadConfig(
  overrides?: Partial<MekongConfig>
): Promise<MekongConfig> {
  let merged: Record<string, unknown> = {};

  // 1. Load user-level config (~/.mekong/config.yaml)
  const userConfigPath = join(homedir(), '.mekong', 'config.yaml');
  if (await fileExists(userConfigPath)) {
    const content = await readFile(userConfigPath, 'utf-8');
    const parsed = parseYaml(content);
    if (parsed && typeof parsed === 'object') {
      merged = deepMerge(merged, parsed as Record<string, unknown>);
    }
  }

  // 2. Load project-level config (./mekong.yaml)
  const projectConfigPath = resolve('mekong.yaml');
  if (await fileExists(projectConfigPath)) {
    const content = await readFile(projectConfigPath, 'utf-8');
    const parsed = parseYaml(content);
    if (parsed && typeof parsed === 'object') {
      merged = deepMerge(merged, parsed as Record<string, unknown>);
    }
  }

  // 3. Apply env vars (MEKONG_LLM_DEFAULT_PROVIDER, etc.)
  merged = applyEnvVars(merged);

  // 4. Apply CLI overrides
  if (overrides) {
    merged = deepMerge(merged, overrides as Record<string, unknown>);
  }

  // 5. Validate with Zod (fills in defaults)
  const config = ConfigSchema.parse(merged);

  // 6. Resolve api_key_env → actual key
  return resolveApiKeys(config);
}

/** Deep merge objects (source overrides target, arrays replaced not merged) */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
      targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

/** Map MEKONG_* env vars to config paths */
function applyEnvVars(config: Record<string, unknown>): Record<string, unknown> {
  const envMap: Record<string, string[]> = {
    MEKONG_LLM_DEFAULT_PROVIDER: ['llm', 'default_provider'],
    MEKONG_LLM_DEFAULT_MODEL: ['llm', 'default_model'],
    MEKONG_BUDGET_MAX_COST: ['budget', 'max_cost_per_task'],
    MEKONG_BUDGET_MAX_TOKENS: ['budget', 'max_tokens_per_task'],
    MEKONG_AGENTS_WIP_LIMIT: ['agents', 'wip_limit'],
    MEKONG_TOOLS_AUTO_APPROVE: ['tools', 'auto_approve_level'],
  };

  const result = { ...config };
  for (const [envKey, path] of Object.entries(envMap)) {
    const value = process.env[envKey];
    if (value !== undefined) {
      setNestedValue(result, path, isNaN(Number(value)) ? value : Number(value));
    }
  }
  return result;
}

/** Set nested value in object by key path */
function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = {};
    }
    current = current[path[i]] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

/** Resolve api_key_env references to actual env values */
function resolveApiKeys(config: MekongConfig): MekongConfig {
  const resolved = { ...config, llm: { ...config.llm, providers: { ...config.llm.providers } } };
  for (const [name, provider] of Object.entries(resolved.llm.providers)) {
    if (provider.api_key_env && !provider.api_key) {
      const key = process.env[provider.api_key_env];
      if (key) {
        resolved.llm.providers[name] = { ...provider, api_key: key };
      }
    }
  }
  return resolved;
}
