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

/** Check semver compatibility with current mekong-cli version */
export function checkVersionCompat(
  _requiredVersion: string,
  _currentVersion: string,
): Result<void> {
  throw new Error('Not implemented');
}
