/**
 * feature-map.ts — maps CLI command names to minimum required license tier
 */
import type { LicenseTier } from './types.js';
import { TIER_ORDER } from './types.js';

export interface FeatureEntry {
  command: string;
  minTier: LicenseTier;
  description: string;
}

/** Complete feature→tier map. Free commands are not listed (always allowed). */
export const FEATURE_MAP: FeatureEntry[] = [
  // Free tier (listed for documentation; always allowed)
  { command: 'run',      minTier: 'free',       description: 'Run a natural language task' },
  { command: 'sop',      minTier: 'free',       description: 'Execute SOP files' },
  { command: 'status',   minTier: 'free',       description: 'Engine status' },
  { command: 'license',  minTier: 'free',       description: 'License management' },
  { command: 'usage',    minTier: 'free',       description: 'Usage statistics' },

  // Starter tier
  { command: 'crm',       minTier: 'starter',   description: 'CRM management' },
  { command: 'finance',   minTier: 'starter',   description: 'Finance tracking' },
  { command: 'dashboard', minTier: 'starter',   description: 'Business dashboard' },

  // Pro tier
  { command: 'kaizen',      minTier: 'pro',     description: 'Kaizen analytics' },
  { command: 'marketplace', minTier: 'pro',     description: 'SOP marketplace' },
  { command: 'plugin',      minTier: 'pro',     description: 'Plugin management' },
  { command: 'mcp',         minTier: 'pro',     description: 'MCP server management' },

  // Enterprise tier
  { command: 'self-improve', minTier: 'enterprise', description: 'AI self-improvement' },
];

/** Returns true if `current` meets or exceeds `required`. */
export function tierMeetsMinimum(current: LicenseTier, required: LicenseTier): boolean {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required);
}

/** Returns the minimum tier required for a command, or 'free' if unknown. */
export function getRequiredTier(command: string): LicenseTier {
  const entry = FEATURE_MAP.find(f => f.command === command);
  return entry?.minTier ?? 'free';
}
