/**
 * Plugin Sandbox — safety layer for plugin execution.
 * Plugins run in same process but with restricted API surface via createPluginApi.
 * Future: VM2/isolated-vm for stronger isolation.
 */
import type { PluginManifest, PluginPermission } from './types.js';
import type { Result } from '../types/common.js';

/** Check if requested permissions are within allowed set */
export function validatePermissions(
  manifest: PluginManifest,
  allowedPermissions: PluginPermission[],
): Result<void> {
  const denied = manifest.permissions.filter(p => !allowedPermissions.includes(p));
  if (denied.length > 0) {
    return { ok: false, error: new Error(`Denied permissions: ${denied.join(', ')}`) };
  }
  return { ok: true, value: undefined };
}

/**
 * Check semver compatibility — plugin's mekongVersion must be <= current version.
 * Supports: "^0.3.0" (compatible), ">=0.2.0" (min), or exact "0.3.0".
 */
export function checkVersionCompat(
  requiredVersion: string,
  currentVersion: string,
): Result<void> {
  const clean = requiredVersion.replace(/^[\^~>=<]/, '').trim();
  const [reqMajor, reqMinor] = clean.split('.').map(Number);
  const [curMajor, curMinor] = currentVersion.split('.').map(Number);

  if (isNaN(reqMajor) || isNaN(reqMinor)) {
    return { ok: true, value: undefined }; // unparseable — allow
  }

  if (curMajor !== reqMajor) {
    return {
      ok: false,
      error: new Error(
        `Plugin requires mekong v${clean} (major ${reqMajor}), current is v${currentVersion}`,
      ),
    };
  }

  if ((curMinor ?? 0) < (reqMinor ?? 0)) {
    return {
      ok: false,
      error: new Error(
        `Plugin requires mekong v${clean}, current is v${currentVersion} (minor too old)`,
      ),
    };
  }

  return { ok: true, value: undefined };
}
