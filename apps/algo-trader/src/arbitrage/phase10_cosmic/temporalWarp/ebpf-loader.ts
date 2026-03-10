/**
 * eBPF/XDP Program Loader — mock kernel-space packet filter attachment.
 * In production: calls libbpf or bpftool to load compiled .o objects into kernel.
 * Mock: tracks loaded programs in-memory with simulated program IDs.
 * All programs default to disabled/dry-run mode.
 */

import { randomBytes } from 'crypto';

export interface EbpfLoaderConfig {
  /** Dry-run mode — simulate load without touching kernel. */
  dryRun: boolean;
  /** Network interface to attach XDP program to. */
  interface: string;
  /** Path to compiled eBPF object file (.o). */
  objectPath: string;
  /** Max concurrent programs (kernel limit simulation). */
  maxPrograms: number;
}

export interface EbpfProgramInfo {
  id: string;
  name: string;
  objectPath: string;
  interface: string;
  loadedAt: number;
  /** Simulated kernel program ID (uint32). */
  kernelId: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: EbpfLoaderConfig = {
  dryRun: true,
  interface: 'lo',
  objectPath: './bpf/xdp_inject.o',
  maxPrograms: 8,
};

export class EbpfLoader {
  private readonly cfg: EbpfLoaderConfig;
  private readonly programs = new Map<string, EbpfProgramInfo>();
  private kernelIdCounter = 1000;

  constructor(config: Partial<EbpfLoaderConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load an eBPF/XDP program and attach it to the configured interface.
   * Returns program info including the assigned kernel ID.
   * Throws if maxPrograms limit reached.
   */
  loadProgram(name: string, objectPath?: string): EbpfProgramInfo {
    if (this.programs.size >= this.cfg.maxPrograms) {
      throw new Error(`eBPF program limit reached (max ${this.cfg.maxPrograms})`);
    }

    const id = randomBytes(6).toString('hex');
    const info: EbpfProgramInfo = {
      id,
      name,
      objectPath: objectPath ?? this.cfg.objectPath,
      interface: this.cfg.interface,
      loadedAt: Date.now(),
      kernelId: this.kernelIdCounter++,
      dryRun: this.cfg.dryRun,
    };

    this.programs.set(id, info);
    return info;
  }

  /**
   * Detach and unload a program by its ID.
   * Returns true if the program existed and was removed.
   */
  unloadProgram(id: string): boolean {
    return this.programs.delete(id);
  }

  /**
   * Retrieve info for a loaded program.
   * Returns undefined if not found.
   */
  getProgramInfo(id: string): EbpfProgramInfo | undefined {
    return this.programs.get(id);
  }

  /** List all currently loaded programs (metadata only). */
  listPrograms(): EbpfProgramInfo[] {
    return Array.from(this.programs.values());
  }

  getProgramCount(): number {
    return this.programs.size;
  }

  getConfig(): EbpfLoaderConfig {
    return { ...this.cfg };
  }
}
