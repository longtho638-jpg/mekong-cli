/**
 * Phase 10 Module 1: Temporal Warp Execution — barrel exports.
 *
 * Components:
 * 1. EbpfLoader        — Mock eBPF/XDP kernel program attachment
 * 2. FpgaAccelerator   — Mock PCIe FPGA packet signing
 * 3. ZeroCopyParser    — FIX / WS binary frame parsing
 * 4. InjectionEngine   — Ultra-low latency order injection
 * 5. LatencyMonitor    — Latency stats tracking + alerts
 *
 * All modules default to disabled / dry-run mode.
 */

export { EbpfLoader } from './ebpf-loader';
export type { EbpfLoaderConfig, EbpfProgramInfo } from './ebpf-loader';

export { FpgaAccelerator } from './fpga-accelerator';
export type { FpgaAcceleratorConfig, FpgaPacket } from './fpga-accelerator';

export { ZeroCopyParser } from './zero-copy-parser';
export type { ZeroCopyParserConfig, ParsedMessage } from './zero-copy-parser';

export { InjectionEngine } from './injection-engine';
export type {
  InjectionEngineConfig,
  InjectionOrder,
  InjectionResult,
  InjectionStats,
} from './injection-engine';

export { LatencyMonitor } from './latency-monitor';
export type {
  LatencyMonitorConfig,
  LatencyStats,
  LatencyAlert,
} from './latency-monitor';

// ── Temporal Warp unified config ─────────────────────────────────────────────

export interface TemporalWarpConfig {
  /** Master switch — all components disabled when false. Default: false. */
  enabled: boolean;
  /** Network interface for XDP attachment. Default: 'lo'. */
  interface: string;
  /** Path to compiled eBPF object. Default: './bpf/xdp_inject.o'. */
  ebpfObjectPath: string;
  /** FPGA PCIe device path. Default: '/dev/uio0'. */
  fpgaDevicePath: string;
  /** P99 warning threshold for latency monitor. */
  p99WarningThresholdNs?: number;
}

import { EbpfLoader } from './ebpf-loader';
import { FpgaAccelerator } from './fpga-accelerator';
import { ZeroCopyParser } from './zero-copy-parser';
import { InjectionEngine } from './injection-engine';
import type { InjectionOrder, InjectionResult } from './injection-engine';
import { LatencyMonitor } from './latency-monitor';

export interface TemporalWarpInstances {
  /** Convenience: inject order and record latency in one call. */
  sendOrder: (order: InjectionOrder) => InjectionResult;
  /** Short aliases */
  engine: InjectionEngine;
  monitor: LatencyMonitor;
  ebpf: EbpfLoader;
  fpga: FpgaAccelerator;
  parser: ZeroCopyParser;
  /** Full names */
  ebpfLoader: EbpfLoader;
  fpgaAccelerator: FpgaAccelerator;
  zeroCopyParser: ZeroCopyParser;
  injectionEngine: InjectionEngine;
  latencyMonitor: LatencyMonitor;
  config: TemporalWarpConfig;
}

const DEFAULT_TW_CONFIG: TemporalWarpConfig = {
  enabled: false,
  interface: 'lo',
  ebpfObjectPath: './bpf/xdp_inject.o',
  fpgaDevicePath: '/dev/uio0',
};

/**
 * Factory: initialise all Temporal Warp components from a single config.
 * Initializes engine subsystems and wires latency recording.
 */
export function initTemporalWarp(
  config: Partial<TemporalWarpConfig> = {},
): TemporalWarpInstances {
  const cfg: TemporalWarpConfig = { ...DEFAULT_TW_CONFIG, ...config };
  const dryRun = !cfg.enabled;

  const ebpfLoader = new EbpfLoader({
    dryRun,
    interface: cfg.interface,
    objectPath: cfg.ebpfObjectPath,
  });

  const fpgaAccelerator = new FpgaAccelerator({
    dryRun,
    devicePath: cfg.fpgaDevicePath,
  });

  const zeroCopyParser = new ZeroCopyParser();

  const injectionEngine = new InjectionEngine(
    {
      dryRun,
      interface: cfg.interface,
      ebpfObjectPath: cfg.ebpfObjectPath,
      fpgaDevicePath: cfg.fpgaDevicePath,
    },
    ebpfLoader,
    fpgaAccelerator,
    zeroCopyParser,
  );

  // Initialize engine subsystems (load eBPF program + init FPGA)
  injectionEngine.initialize();

  const latencyMonitor = new LatencyMonitor({
    label: 'temporal-warp',
    ...(cfg.p99WarningThresholdNs != null
      ? { p99WarningThresholdNs: cfg.p99WarningThresholdNs }
      : {}),
  });

  /** Inject order and automatically record latency in monitor. */
  function sendOrder(order: InjectionOrder): InjectionResult {
    const result = injectionEngine.injectOrder(order);
    latencyMonitor.record(result.latencyNs);
    return result;
  }

  return {
    sendOrder,
    // Short aliases
    engine: injectionEngine,
    monitor: latencyMonitor,
    ebpf: ebpfLoader,
    fpga: fpgaAccelerator,
    parser: zeroCopyParser,
    // Full names
    ebpfLoader,
    fpgaAccelerator,
    zeroCopyParser,
    injectionEngine,
    latencyMonitor,
    config: cfg,
  };
}
