/**
 * Mock eBPF/XDP program loading for kernel-bypass network optimization.
 * No real kernel interaction — all state is simulated.
 */

import { EventEmitter } from 'events';

export interface EbpfProgram {
  name: string;
  type: 'xdp' | 'tc' | 'socket_filter';
  interface: string;
  loaded: boolean;
}

const MOCK_PROGRAMS: EbpfProgram[] = [
  { name: 'xdp-order-fast-path', type: 'xdp', interface: 'eth0', loaded: false },
  { name: 'tc-latency-shaper', type: 'tc', interface: 'eth0', loaded: false },
  { name: 'socket-market-data', type: 'socket_filter', interface: 'eth1', loaded: false },
];

export class EbpfOptimizer extends EventEmitter {
  private readonly programs: EbpfProgram[];

  constructor() {
    super();
    // Deep-copy so tests don't share mutable state
    this.programs = MOCK_PROGRAMS.map((p) => ({ ...p }));
  }

  /** Simulate loading all eBPF programs into the kernel. */
  async loadAll(): Promise<EbpfProgram[]> {
    await Promise.resolve();
    for (const prog of this.programs) {
      prog.loaded = true;
      this.emit('program-loaded', prog);
    }
    return [...this.programs];
  }

  /** Simulate unloading a specific program by name. */
  unload(name: string): boolean {
    const prog = this.programs.find((p) => p.name === name);
    if (!prog) return false;
    prog.loaded = false;
    this.emit('program-unloaded', prog);
    return true;
  }

  /** Returns programs currently marked as loaded. */
  getLoadedPrograms(): EbpfProgram[] {
    return this.programs.filter((p) => p.loaded);
  }

  /** Returns true if all programs are loaded. */
  isFullyOptimized(): boolean {
    return this.programs.every((p) => p.loaded);
  }
}
