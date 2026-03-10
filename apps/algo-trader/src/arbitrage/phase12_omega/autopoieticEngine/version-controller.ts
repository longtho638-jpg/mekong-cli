/**
 * Phase 12 Omega — Autopoietic Code Evolution.
 * Module: VersionController
 *
 * Manages in-memory version history of auto-generated code evolutions.
 * Supports storing, retrieving, and rolling back to previous versions.
 */

import type { ExecutionMetrics } from './sandbox-executor';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CodeVersion {
  id: string;
  version: number;
  code: string;
  metrics: ExecutionMetrics;
  changeDescription: string;
  createdAt: number;
  isActive: boolean;
}

export interface RollbackResult {
  success: boolean;
  rolledBackTo: CodeVersion | null;
  message: string;
}

export interface VersionControllerConfig {
  /** Maximum versions to retain in history. Default: 20 */
  maxVersions: number;
}

const DEFAULT_CONFIG: VersionControllerConfig = {
  maxVersions: 20,
};

// ── ID generation ─────────────────────────────────────────────────────────────

let _idCounter = 0;
function generateId(): string {
  _idCounter++;
  return `v${Date.now()}-${_idCounter.toString().padStart(4, '0')}`;
}

// ── VersionController class ───────────────────────────────────────────────────

export class VersionController {
  private readonly config: VersionControllerConfig;
  private readonly versions: CodeVersion[] = [];
  private activeVersionId: string | null = null;
  private versionCounter = 0;

  constructor(config: Partial<VersionControllerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Store a new code version.
   * The newly stored version is NOT automatically activated — call activate() explicitly.
   */
  store(
    code: string,
    metrics: ExecutionMetrics,
    changeDescription: string,
  ): CodeVersion {
    this.versionCounter++;

    const entry: CodeVersion = {
      id: generateId(),
      version: this.versionCounter,
      code,
      metrics,
      changeDescription,
      createdAt: Date.now(),
      isActive: false,
    };

    this.versions.push(entry);

    // Prune oldest entries beyond maxVersions
    if (this.versions.length > this.config.maxVersions) {
      const oldest = this.versions.shift();
      // If pruned version was active, clear active pointer
      if (oldest && oldest.id === this.activeVersionId) {
        this.activeVersionId = null;
      }
    }

    return entry;
  }

  /** Mark a version as the currently active one. */
  activate(versionId: string): boolean {
    const target = this.versions.find((v) => v.id === versionId);
    if (!target) return false;

    // Deactivate all
    for (const v of this.versions) {
      v.isActive = false;
    }

    target.isActive = true;
    this.activeVersionId = versionId;
    return true;
  }

  /** Return the currently active version, or null if none set. */
  getActive(): CodeVersion | null {
    if (!this.activeVersionId) return null;
    return this.versions.find((v) => v.id === this.activeVersionId) ?? null;
  }

  /** Return a specific version by id. */
  getById(versionId: string): CodeVersion | null {
    return this.versions.find((v) => v.id === versionId) ?? null;
  }

  /** Return all stored versions (oldest first). */
  getAll(): CodeVersion[] {
    return [...this.versions];
  }

  /** Return the N most recent versions. */
  getRecent(n: number): CodeVersion[] {
    return this.versions.slice(-n).reverse();
  }

  /**
   * Rollback to the previous version (one before current active).
   * If no previous version exists, returns failure result.
   */
  rollback(): RollbackResult {
    if (this.versions.length < 2) {
      return {
        success: false,
        rolledBackTo: null,
        message: 'No previous version available to roll back to',
      };
    }

    const activeIndex = this.activeVersionId
      ? this.versions.findIndex((v) => v.id === this.activeVersionId)
      : this.versions.length - 1;

    const previousIndex = activeIndex > 0 ? activeIndex - 1 : -1;

    if (previousIndex < 0) {
      return {
        success: false,
        rolledBackTo: null,
        message: 'Active version is already the oldest stored version',
      };
    }

    const previous = this.versions[previousIndex];
    this.activate(previous.id);

    return {
      success: true,
      rolledBackTo: previous,
      message: `Rolled back to version ${previous.version} (${previous.id})`,
    };
  }

  /**
   * Rollback to a specific version by id.
   */
  rollbackTo(versionId: string): RollbackResult {
    const target = this.versions.find((v) => v.id === versionId);
    if (!target) {
      return {
        success: false,
        rolledBackTo: null,
        message: `Version ${versionId} not found in history`,
      };
    }

    this.activate(target.id);

    return {
      success: true,
      rolledBackTo: target,
      message: `Rolled back to version ${target.version} (${target.id})`,
    };
  }

  /** Clear all version history and reset state. */
  reset(): void {
    this.versions.length = 0;
    this.activeVersionId = null;
    this.versionCounter = 0;
  }

  /** Number of stored versions. */
  get size(): number {
    return this.versions.length;
  }
}
