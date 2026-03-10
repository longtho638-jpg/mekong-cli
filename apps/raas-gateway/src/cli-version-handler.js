/**
 * CLI Version Handler — Check for latest CLI version
 *
 * Returns version info with enforcement flags for auto-update mechanism.
 * Supports:
 *  - Latest version metadata
 *  - Critical update flags
 *  - Security patch indicators
 *  - Download/checksum/signature URLs
 *
 * Usage:
 *   GET /v1/cli/version
 *   Authorization: Bearer mk_... or JWT
 */

import { trackUsage } from './kv-usage-meter.js';

/**
 * Get latest CLI version info
 *
 * @param {object} env - Cloudflare Worker environment
 * @param {string} tenantId - Tenant ID from auth
 * @param {string} role - Tenant role from auth
 * @returns {Promise<Response>}
 */
export async function getCliVersionInfo(env, tenantId, role) {
  // Version config — in production, this comes from KV or env vars
  const CLI_VERSION = env.CLI_LATEST_VERSION || '0.2.0';
  const CLI_RELEASES_URL = 'https://github.com/longtho638-jpg/mekong-cli/releases';

  // Build download URLs
  const tarballUrl = `${CLI_RELEASES_URL}/download/v${CLI_VERSION}/mekong-cli-${CLI_VERSION}.tar.gz`;
  const checksumUrl = `${CLI_RELEASES_URL}/download/v${CLI_VERSION}/sha256sum.txt`;
  const signatureUrl = `${CLI_RELEASES_URL}/download/v${CLI_VERSION}/mekong-cli-${CLI_VERSION}.tar.gz.sig`;

  // Critical update logic — check from KV if this version is enforced
  const criticalUpdates = await getCriticalUpdates(env);
  const isCritical = criticalUpdates.includes(CLI_VERSION);

  // Security update flag — check from KV
  const securityUpdates = await getSecurityUpdates(env);
  const isSecurityUpdate = securityUpdates.includes(CLI_VERSION);

  // Build response
  const response = {
    latest_version: CLI_VERSION,
    download_url: tarballUrl,
    checksum_url: checksumUrl,
    signature_url: signatureUrl,
    is_critical: isCritical,
    is_security_update: isSecurityUpdate,
    release_notes: await getReleaseNotes(env, CLI_VERSION),
    released_at: await getReleaseDate(env, CLI_VERSION),
    changelog_url: `${CLI_RELEASES_URL}/tag/v${CLI_VERSION}`
  };

  // Track usage (non-blocking)
  trackVersionCheck(env, tenantId, role, CLI_VERSION).catch(err => {
    console.error('Version check tracking error:', err);
  });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'X-CLI-Version': CLI_VERSION,
      'X-Critical-Update': String(isCritical),
      'X-Security-Update': String(isSecurityUpdate)
    }
  });
}

/**
 * Get list of critical versions that require enforcement
 *
 * @param {object} env - Cloudflare Worker environment
 * @returns {Promise<string[]>} Array of critical version strings
 */
async function getCriticalUpdates(env) {
  try {
    const kv = await env.RAAS_USAGE_KV || env.RATE_LIMIT_KV;
    if (!kv) return [];

    const data = await kv.get('cli_critical_versions', 'json');
    return data || [];
  } catch (error) {
    console.error('Failed to get critical updates:', error);
    return [];
  }
}

/**
 * Get list of security patch versions
 *
 * @param {object} env - Cloudflare Worker environment
 * @returns {Promise<string[]>} Array of security version strings
 */
async function getSecurityUpdates(env) {
  try {
    const kv = await env.RAAS_USAGE_KV || env.RATE_LIMIT_KV;
    if (!kv) return [];

    const data = await kv.get('cli_security_versions', 'json');
    return data || [];
  } catch (error) {
    console.error('Failed to get security updates:', error);
    return [];
  }
}

/**
 * Get release notes for a version
 *
 * @param {object} env - Cloudflare Worker environment
 * @param {string} version - Version string
 * @returns {Promise<string>} Release notes
 */
async function getReleaseNotes(env, version) {
  try {
    const kv = await env.RAAS_USAGE_KV || env.RATE_LIMIT_KV;
    if (!kv) return 'Bug fixes and improvements';

    const key = `cli_release_notes_${version.replace(/\./g, '_')}`;
    const notes = await kv.get(key);
    return notes || 'Bug fixes and improvements';
  } catch (error) {
    console.error('Failed to get release notes:', error);
    return 'Bug fixes and improvements';
  }
}

/**
 * Get release date for a version
 *
 * @param {object} env - Cloudflare Worker environment
 * @param {string} version - Version string
 * @returns {Promise<string>} ISO 8601 date string
 */
async function getReleaseDate(env, version) {
  try {
    const kv = await env.RAAS_USAGE_KV || env.RATE_LIMIT_KV;
    if (!kv) return new Date().toISOString();

    const key = `cli_release_date_${version.replace(/\./g, '_')}`;
    const date = await kv.get(key);
    return date || new Date().toISOString();
  } catch (error) {
    console.error('Failed to get release date:', error);
    return new Date().toISOString();
  }
}

/**
 * Track version check event for usage metering
 *
 * @param {object} env - Cloudflare Worker environment
 * @param {string} licenseKey - License key (mk_ API key)
 * @param {string} tenantId - Tenant ID
 * @param {string} tier - Tenant tier
 * @param {string} checkedVersion - Version that was checked
 */
export async function trackVersionCheck(env, licenseKey, tenantId, tier) {
  try {
    // Use existing trackUsage with endpoint type 'version_check'
    await trackUsage(
      env,
      licenseKey,
      tenantId,
      tier,
      '/v1/cli/version',
      'GET',
      0 // No payload for GET request
    );
  } catch (error) {
    console.error('Version check tracking failed:', error);
  }
}
