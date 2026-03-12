/**
 * SOP Package Builder — packs SOP + dependencies into .mkg (tar.gz) archive.
 * Structure: package.json, sop.yaml, agents/, tools/, templates/, README.md
 */
import type { SopPackage } from './types.js';
import type { Result } from '../types/common.js';

export class SopPackager {
  /** Pack a directory into .mkg file */
  async pack(_sourceDir: string, _outputPath: string): Promise<Result<{ path: string; size: number }>> {
    throw new Error('Not implemented');
  }

  /** Unpack .mkg file to directory */
  async unpack(_mkg: string, _targetDir: string): Promise<Result<SopPackage>> {
    throw new Error('Not implemented');
  }

  /** Validate a package directory before packing */
  async validate(_sourceDir: string): Promise<Result<{ warnings: string[]; errors: string[] }>> {
    throw new Error('Not implemented');
  }
}
