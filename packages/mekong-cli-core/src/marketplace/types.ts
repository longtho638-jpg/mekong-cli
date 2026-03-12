import type { Id, Timestamp } from '../types/common.js';

/** SOP package metadata */
export interface SopPackage {
  name: string;
  version: string;
  description: string;
  author: { name: string; email?: string; url?: string };
  license: string;
  category: string;
  tags: string[];
  mekongVersion: string;
  dependencies: Record<string, string>;
  files: string[];
  repository?: string;
  homepage?: string;
  readme?: string;
  pricing: { type: 'free' | 'paid' | 'freemium'; price?: number; trialRuns?: number };
}

/** Marketplace listing (what users see when browsing) */
export interface MarketplaceListing {
  package: SopPackage;
  stats: {
    downloads: number;
    stars: number;
    lastUpdated: Timestamp;
    reviews: number;
    avgRating: number;
  };
  verified: boolean;
  featured: boolean;
}

/** Local installed package record */
export interface InstalledPackage {
  package: SopPackage;
  installedAt: Timestamp;
  installPath: string;
  enabled: boolean;
  runCount: number;
  lastRun?: Timestamp;
}

/** Marketplace search query */
export interface MarketplaceSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  pricing?: 'free' | 'paid' | 'all';
  sortBy?: 'downloads' | 'stars' | 'recent' | 'rating';
  limit?: number;
  offset?: number;
}

/** Marketplace config */
export interface MarketplaceConfig {
  registryRepo: string;
  cacheDir: string;
  packagesDir: string;
  updateCheckHours: number;
}
