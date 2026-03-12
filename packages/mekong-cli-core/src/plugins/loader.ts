/**
 * Plugin Loader — discover, validate, and load plugins.
 * Locations: ~/.mekong/plugins/, ./mekong-plugins/, marketplace packages.
 */
import type { PluginManifest, PluginInstance, PluginHooks, PluginApi } from './types.js';
import type { Result } from '../types/common.js';

export class PluginLoader {
  private readonly plugins = new Map<string, PluginInstance>();
  private readonly approvedPermissions = new Map<string, string[]>();

  constructor(
    private readonly pluginDirs: string[],
    private readonly api: PluginApi,
  ) {}

  /** Discover and load all plugins */
  async loadAll(): Promise<{ loaded: string[]; failed: Array<{ name: string; error: string }> }> {
    throw new Error('Not implemented');
  }

  /** Load a specific plugin by manifest path */
  async load(_manifestPath: string): Promise<Result<PluginInstance>> {
    throw new Error('Not implemented');
  }

  /** Unload a plugin */
  async unload(_pluginName: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** Get all loaded plugins */
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /** Dispatch lifecycle hook to all plugins */
  async dispatchHook<K extends keyof PluginHooks>(hook: K, ...args: unknown[]): Promise<void> {
    throw new Error('Not implemented');
  }
}
