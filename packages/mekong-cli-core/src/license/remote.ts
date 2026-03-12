/**
 * remote.ts — RemoteLicenseClient: validates license key against remote API
 * with local cache fallback for offline use. Uses native fetch().
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { LicenseKey } from './types.js';

const DEFAULT_API_BASE = process.env['MEKONG_LICENSE_API'] ?? 'https://api.mekong.ai/v1';
const DEFAULT_CACHE_PATH = join(homedir(), '.mekong', 'license-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

interface CacheEntry {
  license: LicenseKey;
  fetchedAt: number;
}

interface RemoteValidateResponse {
  license: LicenseKey;
}

/** Exponential backoff sleep */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RemoteLicenseClient {
  private readonly apiBase: string;
  private readonly cachePath: string;

  constructor(apiBase?: string, cachePath?: string) {
    this.apiBase = apiBase ?? DEFAULT_API_BASE;
    this.cachePath = cachePath ?? DEFAULT_CACHE_PATH;
  }

  /**
   * Validate a license key against the remote API.
   * Falls back to cached result if the request fails.
   */
  async validate(key: string): Promise<Result<LicenseKey, Error>> {
    const remote = await this.fetchRemote(key);
    if (remote.ok) {
      await this.writeCache(remote.value);
      return ok(remote.value);
    }

    // Offline / error — try cache
    const cached = await this.readCache();
    if (cached.ok && cached.value && cached.value.license.key === key) {
      return ok(cached.value.license);
    }

    return err(remote.error);
  }

  private async fetchRemote(key: string, attempt = 0): Promise<Result<LicenseKey, Error>> {
    try {
      const res = await fetch(`${this.apiBase}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (res.status === 429 && attempt < 3) {
        const backoff = Math.pow(2, attempt) * 500;
        await sleep(backoff);
        return this.fetchRemote(key, attempt + 1);
      }

      if (res.status === 401 || res.status === 403) {
        return err(new Error(`License key rejected (HTTP ${res.status}).`));
      }

      if (!res.ok) {
        return err(new Error(`Remote license API error: HTTP ${res.status}`));
      }

      const data = (await res.json()) as RemoteValidateResponse;
      return ok(data.license);
    } catch (e) {
      return err(new Error(`Remote license API unreachable: ${String(e)}`));
    }
  }

  private async readCache(): Promise<Result<CacheEntry | null, Error>> {
    try {
      if (!existsSync(this.cachePath)) return ok(null);
      const raw = await readFile(this.cachePath, 'utf-8');
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return ok(null);
      return ok(entry);
    } catch {
      return ok(null);
    }
  }

  private async writeCache(license: LicenseKey): Promise<void> {
    try {
      const dir = join(this.cachePath, '..');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      const entry: CacheEntry = { license, fetchedAt: Date.now() };
      await writeFile(this.cachePath, JSON.stringify(entry, null, 2), { encoding: 'utf-8', mode: 0o600 });
    } catch {
      // Cache write failure is non-fatal
    }
  }
}
