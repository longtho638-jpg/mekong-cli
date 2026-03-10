/**
 * Build Cache Manager - Multi-tier Cache (Local + RaaS KV + Cloudflare KV)
 * RaaS Gateway v2.0.0 Compatible
 *
 * Cache hierarchy:
 * 1. Local filesystem (fastest, 24h TTL)
 * 2. RaaS KV (shared across CI/CD, 1h TTL)
 * 3. Cloudflare KV (Worker builds)
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import * as fse from 'fs-extra';
import { RaaSCacheClient } from './raas-cache-client';

interface CacheMetadata {
  version: string;
  gitSha: string;
  tsConfigHash: string;
  sourceHash: string;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  localSize: number;
  tier: 'local' | 'raas' | 'miss';
}

const CACHE_TTL = 3600; // 1 hour for RaaS/KV
const LOCAL_TTL = 24 * 60 * 60; // 24 hours for local
const MAX_LOCAL_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

export class BuildCache {
  private cacheDir: string;
  private metadataFile: string;
  private raasClient?: RaaSCacheClient;
  private hits = 0;
  private misses = 0;

  constructor(
    cacheDir: string = '.build-cache',
    agencyId?: string,
    apiKey?: string
  ) {
    this.cacheDir = cacheDir;
    this.metadataFile = join(cacheDir, 'metadata.json');

    // Initialize RaaS client if credentials provided
    if (agencyId && apiKey) {
      this.raasClient = new RaaSCacheClient(agencyId, apiKey);
    }
  }

  /**
   * Generate cache key from source files
   */
  generateCacheKey(): string {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const gitSha = execSync('git rev-parse HEAD').toString().trim();
    const tsConfig = readFileSync('tsconfig.json', 'utf-8');

    // Hash all source files
    const sourceFiles = execSync('find src -type f -name "*.ts"').toString().split('\n').filter(Boolean);
    const sourceHash = createHash('sha256');
    sourceFiles.forEach(file => {
      if (existsSync(file)) {
        sourceHash.update(readFileSync(file));
      }
    });

    return createHash('sha256').update(
      JSON.stringify({
        version: pkg.version,
        gitSha,
        tsConfigHash: createHash('sha256').update(tsConfig).digest('hex'),
        sourceHash: sourceHash.digest('hex')
      })
    ).digest('hex');
  }

  /**
   * Check if cache exists for current build
   * Multi-tier: local -> RaaS -> miss
   */
  async hasValidCache(cacheKey: string): Promise<boolean> {
    // Tier 1: Check local filesystem cache
    if (!existsSync(this.cacheDir)) {
      console.log('⚠️ No cache directory');
      this.misses++;
      return false;
    }

    const localCachePath = join(this.cacheDir, cacheKey, 'dist');
    if (existsSync(localCachePath)) {
      // Check metadata age (cache valid for 24h)
      if (existsSync(this.metadataFile)) {
        const metadata: CacheMetadata = JSON.parse(
          readFileSync(this.metadataFile, 'utf-8')
        );
        const age = Date.now() - metadata.timestamp;
        if (age > LOCAL_TTL * 1000) {
          console.log('⚠️ Local cache expired (24h TTL)');
          this.misses++;
          return false;
        }
      }
      console.log('✅ Local cache HIT');
      this.hits++;
      return true;
    }

    // Tier 2: Check RaaS KV cache
    if (this.raasClient) {
      console.log('🔍 Checking RaaS KV cache...');
      const raasHas = await this.raasClient.has(cacheKey);
      if (raasHas) {
        console.log('✅ RaaS KV cache HIT');
        this.hits++;
        return true;
      }
    }

    console.log('❌ Cache MISS');
    this.misses++;
    return false;
  }

  /**
   * Restore build from cache (multi-tier)
   */
  async restoreBuild(cacheKey: string): Promise<boolean> {
    // Try local first
    const localCachePath = join(this.cacheDir, cacheKey, 'dist');
    if (existsSync(localCachePath)) {
      console.log('📦 Restoring from local cache...');
      fse.copySync(localCachePath, 'dist');
      console.log('✅ Build restored from local');
      return true;
    }

    // Try RaaS KV
    if (this.raasClient) {
      console.log('📦 Restoring from RaaS KV...');
      const data = await this.raasClient.get(cacheKey);
      if (data) {
        await fse.ensureDir('dist');
        // Write buffer directly to dist folder
        // For simplicity, assume single tarball or extract logic here
        console.log('⚠️ RaaS KV restore requires extraction logic');
        // TODO: Implement tarball extraction
      }
    }

    return false;
  }

  /**
   * Save build to cache (multi-tier: local + RaaS)
   */
  async saveBuild(cacheKey: string): Promise<void> {
    if (!existsSync('dist')) {
      console.warn('⚠️ No dist/ folder to cache');
      return;
    }

    // Save to local cache
    const localCachePath = join(this.cacheDir, cacheKey);
    fse.copySync('dist', join(localCachePath, 'dist'));

    // Calculate dist size
    const distSize = this.getDirectorySize('dist');

    // Save metadata
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const gitSha = execSync('git rev-parse HEAD').toString().trim();
    const tsConfig = readFileSync('tsconfig.json', 'utf-8');

    const metadata: CacheMetadata = {
      version: pkg.version,
      gitSha,
      tsConfigHash: createHash('sha256').update(tsConfig).digest('hex'),
      sourceHash: cacheKey,
      timestamp: Date.now(),
    };

    await fse.ensureDir(this.cacheDir);
    writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    console.log('💾 Local build cached');

    // Save to RaaS KV (if available)
    if (this.raasClient) {
      console.log('☁️ Saving to RaaS KV...');
      // Create tarball for RaaS storage
      const tarball = await this.createTarball('dist');
      await this.raasClient.set(cacheKey, tarball, CACHE_TTL);
      console.log('✅ RaaS KV cache updated');
    }

    const hitRate = ((this.hits / (this.hits + this.misses)) * 100).toFixed(1);
    console.log(`📊 Cache stats: ${this.hits} hits, ${this.misses} misses (${hitRate}% hit rate)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      localSize: this.getDirectorySize(this.cacheDir),
      tier: this.hits > 0 ? 'local' : 'miss',
    };
  }

  private getDirectorySize(dirPath: string): number {
    if (!existsSync(dirPath)) return 0;
    try {
      const stat = fse.statSync(dirPath);
      if (stat.isFile()) return stat.size;
      if (stat.isDirectory()) {
        let size = 0;
        const entries = fse.readdirSync(dirPath);
        for (const entry of entries) {
          size += this.getDirectorySize(join(dirPath, entry));
        }
        return size;
      }
    } catch {
      return 0;
    }
    return 0;
  }

  private async createTarball(dirPath: string): Promise<Buffer> {
    // Simple implementation: read all files and concatenate
    // In production, use tar package for proper tarball creation
    const files: Buffer[] = [];
    const entries = fse.readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = fse.statSync(fullPath);
      if (stat.isFile()) {
        files.push(fse.readFileSync(fullPath));
      } else if (stat.isDirectory()) {
        // Recursively read subdirectories
        files.push(await this.createTarball(fullPath));
      }
    }
    return Buffer.concat(files);
  }

  /**
   * Cleanup old cache entries
   */
  async cleanup(maxAgeDays: number = 7): Promise<void> {
    if (!existsSync(this.cacheDir)) return;

    const entries = await fse.readdir(this.cacheDir);
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const entry of entries) {
      const entryPath = join(this.cacheDir, entry);
      const stat = await fse.stat(entryPath);

      if (stat.isDirectory() && now - stat.mtimeMs > maxAge) {
        await fse.remove(entryPath);
        console.log(`🗑️ Cleaned up old cache: ${entry}`);
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const agencyId = process.env.AGENCY_ID;
  const apiKey = process.env.RAAS_API_KEY;
  const cache = new BuildCache('.build-cache', agencyId, apiKey);
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'check': {
        const key = cache.generateCacheKey();
        const valid = await cache.hasValidCache(key);
        process.exit(valid ? 0 : 1);
      }
      case 'restore': {
        const key = cache.generateCacheKey();
        await cache.restoreBuild(key);
        break;
      }
      case 'save': {
        const key = cache.generateCacheKey();
        await cache.saveBuild(key);
        break;
      }
      case 'cleanup': {
        const days = parseInt(process.argv[3]) || 7;
        await cache.cleanup(days);
        break;
      }
      case 'stats': {
        const stats = cache.getStats();
        console.log('=== Cache Stats ===');
        console.log(`Hits: ${stats.hits}`);
        console.log(`Misses: ${stats.misses}`);
        console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
        console.log(`Local Size: ${(stats.localSize / 1024 / 1024).toFixed(2)} MB`);
        break;
      }
      default:
        console.log('Usage: build-cache.ts [check|restore|save|cleanup|stats]');
    }
  })();
}
