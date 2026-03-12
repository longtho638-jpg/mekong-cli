/**
 * Marketplace Publisher — publish SOP packages to GitHub-based registry.
 * Uses GitHub Releases API as storage (free, no server needed).
 */
import type { SopPackage, MarketplaceListing } from './types.js';
import type { Result } from '../types/common.js';

export class MarketplacePublisher {
  private readonly registryRepo: string;
  private readonly githubToken?: string;

  constructor(config: { registryRepo: string; githubTokenEnv?: string }) {
    this.registryRepo = config.registryRepo;
    this.githubToken = config.githubTokenEnv ? process.env[config.githubTokenEnv] : undefined;
  }

  /** Publish package to marketplace */
  async publish(_mkg: string): Promise<Result<{ url: string }>> {
    throw new Error('Not implemented');
  }

  /** Unpublish a version */
  async unpublish(_packageName: string, _version: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
