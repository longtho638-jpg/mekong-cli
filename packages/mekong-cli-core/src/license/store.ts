/**
 * LicenseStore — persists/loads license key from ~/.mekong/license.json
 * File permissions set to 0o600 (owner read/write only)
 */
import { readFile, writeFile, unlink, mkdir, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { LicenseKey } from './types.js';

const DEFAULT_LICENSE_PATH = join(homedir(), '.mekong', 'license.json');

export class LicenseStore {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? DEFAULT_LICENSE_PATH;
  }

  /** Load license from disk. Returns ok(null) when no file exists. */
  async load(): Promise<Result<LicenseKey | null, Error>> {
    try {
      if (!existsSync(this.filePath)) {
        return ok(null);
      }
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as LicenseKey;
      return ok(parsed);
    } catch (e) {
      return err(new Error(`Failed to load license: ${String(e)}`));
    }
  }

  /** Save license to disk with 0o600 permissions. */
  async save(license: LicenseKey): Promise<Result<void, Error>> {
    try {
      const dir = join(this.filePath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      const json = JSON.stringify(license, null, 2);
      await writeFile(this.filePath, json, { encoding: 'utf-8', mode: 0o600 });
      // Enforce permissions explicitly (writeFile mode may not apply on all platforms)
      await chmod(this.filePath, 0o600);
      return ok(undefined);
    } catch (e) {
      return err(new Error(`Failed to save license: ${String(e)}`));
    }
  }

  /** Remove license file from disk. Returns ok(null) when file didn't exist. */
  async clear(): Promise<Result<void, Error>> {
    try {
      if (!existsSync(this.filePath)) {
        return ok(undefined);
      }
      await unlink(this.filePath);
      return ok(undefined);
    } catch (e) {
      return err(new Error(`Failed to clear license: ${String(e)}`));
    }
  }

  /** Returns path used by this store (useful for tests). */
  getPath(): string {
    return this.filePath;
  }
}
