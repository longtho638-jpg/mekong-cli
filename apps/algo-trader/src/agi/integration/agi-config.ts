// AGI Feature Flag Configuration

export interface AGIFeatureFlags {
  agiEnabled: boolean;
  agiBaseUrl: string;
  agiModel: string;
  agiTimeoutMs: number;
  agiMinConfidence: number;
  agiFallbackToRules: boolean;
  agiDryRun: boolean; // Log decisions without executing
  agiDebugMode: boolean; // Verbose logging
}

/**
 * Load AGI config from environment variables
 */
export function loadAGIConfig(): AGIFeatureFlags {
  return {
    agiEnabled: process.env.AGI_ENABLED === 'true' || process.env.AGI_ENABLED === '1',
    agiBaseUrl: process.env.AGI_BASE_URL || 'http://localhost:11434',
    agiModel: process.env.AGI_MODEL || 'llama3.1:8b',
    agiTimeoutMs: parseInt(process.env.AGI_TIMEOUT_MS || '5000', 10),
    agiMinConfidence: parseFloat(process.env.AGI_MIN_CONFIDENCE || '0.6'),
    agiFallbackToRules: process.env.AGI_FALLBACK_TO_RULES !== 'false',
    agiDryRun: process.env.AGI_DRY_RUN === 'true' || process.env.AGI_DRY_RUN === '1',
    agiDebugMode: process.env.AGI_DEBUG_MODE === 'true' || process.env.AGI_DEBUG_MODE === '1',
  };
}

/**
 * Get current AGI config as environment variables
 */
export function getAGIEnvVars(flags: AGIFeatureFlags): Record<string, string> {
  return {
    AGI_ENABLED: flags.agiEnabled ? 'true' : 'false',
    AGI_BASE_URL: flags.agiBaseUrl,
    AGI_MODEL: flags.agiModel,
    AGI_TIMEOUT_MS: flags.agiTimeoutMs.toString(),
    AGI_MIN_CONFIDENCE: flags.agiMinConfidence.toString(),
    AGI_FALLBACK_TO_RULES: flags.agiFallbackToRules ? 'true' : 'false',
    AGI_DRY_RUN: flags.agiDryRun ? 'true' : 'false',
    AGI_DEBUG_MODE: flags.agiDebugMode ? 'true' : 'false',
  };
}

/**
 * Validate AGI configuration
 */
export function validateAGIConfig(flags: AGIFeatureFlags): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (flags.agiMinConfidence < 0 || flags.agiMinConfidence > 1) {
    errors.push('AGI_MIN_CONFIDENCE must be between 0 and 1');
  }

  if (flags.agiTimeoutMs < 1000 || flags.agiTimeoutMs > 60000) {
    errors.push('AGI_TIMEOUT_MS must be between 1000 and 60000');
  }

  if (!flags.agiBaseUrl.startsWith('http')) {
    errors.push('AGI_BASE_URL must be a valid HTTP URL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
