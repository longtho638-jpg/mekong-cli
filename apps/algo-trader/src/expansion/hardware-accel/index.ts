/**
 * HardwareAccelerationManager — initializes FPGA detection, eBPF loading,
 * and latency benchmarking, then reports aggregated status.
 */

import { EventEmitter } from 'events';
import { FpgaDetector } from './fpga-detector';
import { EbpfOptimizer } from './ebpf-optimizer';
import { LatencyBenchmark } from './latency-benchmark';
import type { HardwareAccelerationConfig } from '../expansion-config-types';

export { FpgaDetector } from './fpga-detector';
export { EbpfOptimizer } from './ebpf-optimizer';
export { LatencyBenchmark } from './latency-benchmark';

export interface HardwareStatus {
  fpgaAvailable: boolean;
  ebpfLoaded: boolean;
  swLatencyUs: number;
  hwLatencyUs: number;
  improvementFactor: number;
}

export class HardwareAccelerationManager extends EventEmitter {
  private readonly detector: FpgaDetector;
  private readonly optimizer: EbpfOptimizer;
  private readonly benchmark: LatencyBenchmark;
  private readonly config: HardwareAccelerationConfig;

  constructor(config: HardwareAccelerationConfig) {
    super();
    this.config = config;
    this.detector = new FpgaDetector();
    this.optimizer = new EbpfOptimizer();
    this.benchmark = new LatencyBenchmark();
  }

  /** Initialize all hardware acceleration components and report status. */
  async initialize(): Promise<HardwareStatus> {
    await this.detector.scan();
    const fpgaAvailable = this.config.fpgaEnabled && this.detector.hasAvailableDevice();

    let ebpfLoaded = false;
    if (this.config.ebpfEnabled) {
      await this.optimizer.loadAll();
      ebpfLoaded = this.optimizer.isFullyOptimized();
    }

    const comparison = await this.benchmark.compare(100);

    const status: HardwareStatus = {
      fpgaAvailable,
      ebpfLoaded,
      swLatencyUs: comparison.sw.meanLatencyUs,
      hwLatencyUs: comparison.hw.meanLatencyUs,
      improvementFactor: comparison.improvementFactor,
    };

    this.emit('initialized', status);
    return status;
  }

  getFpgaDetector(): FpgaDetector {
    return this.detector;
  }

  getEbpfOptimizer(): EbpfOptimizer {
    return this.optimizer;
  }

  getBenchmark(): LatencyBenchmark {
    return this.benchmark;
  }
}
