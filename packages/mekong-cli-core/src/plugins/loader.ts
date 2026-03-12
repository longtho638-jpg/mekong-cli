/**
 * Plugin Loader — discover, validate, and load plugins.
 * Locations: ~/.mekong/plugins/, ./mekong-plugins/, marketplace packages.
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import type { PluginManifest, PluginInstance, PluginHooks, PluginApi, PluginPermission } from './types.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';
import { validatePermissions, checkVersionCompat } from './sandbox.js';

const CURRENT_VERSION = '0.3.0';

export class PluginLoader {
  private readonly plugins = new Map<string, PluginInstance>();
  private readonly approvedPermissions = new Map<string, PluginPermission[]>();

  constructor(
    private readonly pluginDirs: string[],
    private readonly api: PluginApi,
  ) {}

  /** Discover and load all plugins from configured dirs */
  async loadAll(): Promise<{ loaded: string[]; failed: Array<{ name: string; error: string }> }> {
    const loaded: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const dir of this.pluginDirs) {
      let entries: string[];
      try {
        const dirent = await fs.readdir(dir, { withFileTypes: true });
        entries = dirent
          .filter(d => d.isDirectory())
          .map(d => join(dir, d.name, 'plugin.json'));
      } catch {
        continue; // Directory doesn't exist — skip
      }

      for (const manifestPath of entries) {
        try {
          await fs.access(manifestPath);
        } catch {
          continue; // No manifest — skip
        }

        const result = await this.load(manifestPath);
        if (result.ok) {
          loaded.push(result.value.manifest.name);
        } else {
          const name = manifestPath.split('/').slice(-2)[0] ?? manifestPath;
          failed.push({ name, error: result.error.message });
        }
      }
    }

    return { loaded, failed };
  }

  /** Load a specific plugin by manifest path */
  async load(manifestPath: string): Promise<Result<PluginInstance>> {
    try {
      // Read and parse manifest
      const raw = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw) as PluginManifest;

      // Validate required fields
      const validationError = this.validateManifest(manifest);
      if (validationError) return err(new Error(validationError));

      // Check version compatibility
      const compatResult = checkVersionCompat(manifest.mekongVersion, CURRENT_VERSION);
      if (!compatResult.ok) return err(compatResult.error);

      // Validate permissions
      const allPermissions = manifest.permissions;
      const approvedForPlugin = this.approvedPermissions.get(manifest.name) ?? allPermissions;
      const permResult = validatePermissions(manifest, approvedForPlugin);
      if (!permResult.ok) return err(permResult.error);

      // Load plugin hooks via dynamic import
      const pluginDir = manifestPath.substring(0, manifestPath.lastIndexOf('/'));
      const mainPath = join(pluginDir, manifest.main);

      let hooks: PluginHooks = {};
      try {
        const mod = await import(mainPath) as { default?: PluginHooks; hooks?: PluginHooks };
        hooks = mod.default ?? mod.hooks ?? {};
        // Call onLoad if provided, passing the plugin API
        if (typeof (hooks as Record<string, unknown>)['setup'] === 'function') {
          await (hooks as { setup?: (api: PluginApi) => Promise<void> }).setup?.(this.api);
        }
        if (hooks.onLoad) await hooks.onLoad();
      } catch {
        // Plugin main not loadable — keep empty hooks (manifest-only plugin)
        hooks = {};
      }

      const instance: PluginInstance = {
        manifest,
        hooks,
        enabled: true,
        loadedAt: new Date().toISOString(),
        errors: [],
      };

      this.plugins.set(manifest.name, instance);
      return ok(instance);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Unload a plugin */
  async unload(pluginName: string): Promise<Result<void>> {
    const instance = this.plugins.get(pluginName);
    if (!instance) {
      return err(new Error(`Plugin "${pluginName}" is not loaded`));
    }

    try {
      if (instance.hooks.onUnload) await instance.hooks.onUnload();
    } catch (e) {
      instance.errors.push(`onUnload error: ${e instanceof Error ? e.message : String(e)}`);
    }

    this.plugins.delete(pluginName);
    return ok(undefined);
  }

  /** Get all loaded plugins */
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /** Dispatch lifecycle hook to all enabled plugins */
  async dispatchHook<K extends keyof PluginHooks>(hook: K, ...args: unknown[]): Promise<void> {
    for (const instance of this.plugins.values()) {
      if (!instance.enabled) continue;
      const fn = instance.hooks[hook];
      if (typeof fn !== 'function') continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (fn as (...a: unknown[]) => Promise<any>)(...args);
      } catch (e) {
        instance.errors.push(
          `${hook} error: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  /** Approve specific permissions for a plugin (before loading) */
  approvePermissions(pluginName: string, permissions: PluginPermission[]): void {
    this.approvedPermissions.set(pluginName, permissions);
  }

  private validateManifest(m: PluginManifest): string | null {
    if (!m.name) return 'Plugin manifest missing: name';
    if (!m.version) return 'Plugin manifest missing: version';
    if (!m.main) return 'Plugin manifest missing: main';
    if (!m.mekongVersion) return 'Plugin manifest missing: mekongVersion';
    if (!Array.isArray(m.permissions)) return 'Plugin manifest missing: permissions array';
    return null;
  }
}
