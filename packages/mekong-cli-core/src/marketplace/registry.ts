/**
 * Local SOP/plugin registry — tracks installed marketplace packages.
 * Storage: ~/.mekong/marketplace/registry.json
 */
import type { InstalledPackage } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplaceRegistry {
  constructor(private readonly registryPath: string) {}

  /** Load registry from disk */
  async load(): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Save registry to disk */
  async save(): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Add installed package to registry */
  async add(pkg: InstalledPackage): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** Remove package from registry */
  async remove(packageName: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** Get installed package by name */
  get(packageName: string): InstalledPackage | undefined {
    throw new Error('Not implemented');
  }

  /** List all installed packages */
  list(): InstalledPackage[] {
    throw new Error('Not implemented');
  }

  /** Check if package is installed */
  has(packageName: string): boolean {
    throw new Error('Not implemented');
  }
}
