/**
 * Marketplace Installer — download, install, update SOP packages.
 * Installed packages available via `mekong sop list` and `mekong sop run`.
 */
import type { SopPackage, InstalledPackage } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplaceInstaller {
  constructor(
    private readonly cacheDir: string,
    private readonly packagesDir: string,
    private readonly registryRepo: string,
  ) {}

  /** Install a package from marketplace */
  async install(_packageName: string, _version?: string): Promise<Result<InstalledPackage>> {
    throw new Error('Not implemented');
  }

  /** Update installed package to latest */
  async update(_packageName: string): Promise<Result<InstalledPackage>> {
    throw new Error('Not implemented');
  }

  /** Uninstall package */
  async uninstall(_packageName: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** List installed packages */
  async listInstalled(): Promise<InstalledPackage[]> {
    throw new Error('Not implemented');
  }

  /** Check for available updates */
  async checkUpdates(): Promise<Array<{ package: string; current: string; latest: string }>> {
    throw new Error('Not implemented');
  }
}
