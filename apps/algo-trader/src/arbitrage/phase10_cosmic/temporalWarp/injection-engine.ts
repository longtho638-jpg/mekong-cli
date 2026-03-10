/**
 * Injection Engine — sends orders with minimal latency by bypassing standard HTTP/WS stacks.
 * Uses EbpfLoader (kernel packet filter) + FpgaAccelerator (hardware signing) +
 * ZeroCopyParser (frame parsing) to achieve sub-microsecond order injection.
 * In production: routes packets directly through XDP/AF_XDP sockets.
 * Mock: validates and records injections without real network I/O.
 */

import { EbpfLoader } from './ebpf-loader';
import { FpgaAccelerator } from './fpga-accelerator';
import { ZeroCopyParser } from './zero-copy-parser';

export interface InjectionEngineConfig {
  /** Dry-run mode — record injections but do not send real packets. */
  dryRun: boolean;
  /** Network interface for raw packet injection. */
  interface: string;
  /** eBPF object file path for XDP program. */
  ebpfObjectPath: string;
  /** FPGA PCIe device path. */
  fpgaDevicePath: string;
  /** Max injections per second (rate limit). */
  maxInjectionsPerSecond: number;
}

export interface InjectionOrder {
  /** Symbol to trade (e.g. BTC/USDT). */
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  /** Arbitrary order metadata as key=value pairs for raw encoding. */
  meta?: Record<string, string>;
}

export interface InjectionResult {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  /** FPGA-signed packet signature. */
  signature: string;
  /** FPGA processing latency in nanoseconds. */
  latencyNs: number;
  injectedAt: number;
  dryRun: boolean;
}

export interface InjectionStats {
  totalInjections: number;
  totalErrors: number;
  avgLatencyNs: number;
  lastInjectedAt: number | null;
}

const DEFAULT_CONFIG: InjectionEngineConfig = {
  dryRun: true,
  interface: 'lo',
  ebpfObjectPath: './bpf/xdp_inject.o',
  fpgaDevicePath: '/dev/uio0',
  maxInjectionsPerSecond: 1_000_000,
};

let orderSeq = 0;

/** Encode an InjectionOrder as a FIX-like SOH-delimited buffer. */
function encodeOrderToBuffer(order: InjectionOrder): Buffer {
  const soh = '\x01';
  const fields = [
    `8=FIX.4.4`,
    `35=D`,
    `49=INJECTOR`,
    `55=${order.symbol}`,
    `54=${order.side === 'buy' ? '1' : '2'}`,
    `38=${order.qty}`,
    `44=${order.price}`,
    ...(order.meta ? Object.entries(order.meta).map(([k, v]) => `${k}=${v}`) : []),
    `10=000`,
  ];
  return Buffer.from(fields.join(soh) + soh, 'ascii');
}

export class InjectionEngine {
  private readonly cfg: InjectionEngineConfig;
  private readonly ebpf: EbpfLoader;
  private readonly fpga: FpgaAccelerator;
  private readonly parser: ZeroCopyParser;

  private ebpfProgramId: string | null = null;
  private totalInjections = 0;
  private totalErrors = 0;
  private totalLatencyNs = 0;
  private lastInjectedAt: number | null = null;

  constructor(
    config: Partial<InjectionEngineConfig> = {},
    ebpf?: EbpfLoader,
    fpga?: FpgaAccelerator,
    parser?: ZeroCopyParser,
  ) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.ebpf = ebpf ?? new EbpfLoader({
      dryRun: this.cfg.dryRun,
      interface: this.cfg.interface,
      objectPath: this.cfg.ebpfObjectPath,
    });
    this.fpga = fpga ?? new FpgaAccelerator({
      dryRun: this.cfg.dryRun,
      devicePath: this.cfg.fpgaDevicePath,
    });
    this.parser = parser ?? new ZeroCopyParser();
  }

  /**
   * Initialize subsystems: load eBPF program and initialize FPGA.
   * Must be called once before injectOrder().
   */
  initialize(): void {
    if (!this.fpga.isInitialized()) {
      this.fpga.initialize();
    }
    if (this.ebpfProgramId === null) {
      const info = this.ebpf.loadProgram('xdp_inject', this.cfg.ebpfObjectPath);
      this.ebpfProgramId = info.id;
    }
  }

  /**
   * Inject an order with minimal latency:
   * 1. Encode order to FIX buffer
   * 2. Sign via FPGA
   * 3. Validate encoding via ZeroCopyParser
   * 4. Record injection (or send via XDP in production)
   */
  injectOrder(order: InjectionOrder): InjectionResult {
    this.validateOrder(order);

    const buf = encodeOrderToBuffer(order);
    let packet;
    try {
      packet = this.fpga.generatePacket(buf);
    } catch {
      this.totalErrors++;
      throw new Error('FPGA not initialized — call initialize() first');
    }

    // Validate the encoded buffer parses correctly (zero-copy round-trip check)
    const parsed = this.parser.parseFix(buf);
    if (!parsed.valid) {
      this.totalErrors++;
      throw new Error('Order encoding produced invalid FIX message');
    }

    const orderId = `ord-${(++orderSeq).toString(16).padStart(8, '0')}`;
    this.totalInjections++;
    this.totalLatencyNs += packet.latencyNs;
    this.lastInjectedAt = packet.generatedAt;

    return {
      orderId,
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      price: order.price,
      signature: packet.signature,
      latencyNs: packet.latencyNs,
      injectedAt: packet.generatedAt,
      dryRun: this.cfg.dryRun,
    };
  }

  /** Return cumulative injection statistics. */
  getStats(): InjectionStats {
    return {
      totalInjections: this.totalInjections,
      totalErrors: this.totalErrors,
      avgLatencyNs: this.totalInjections > 0
        ? this.totalLatencyNs / this.totalInjections
        : 0,
      lastInjectedAt: this.lastInjectedAt,
    };
  }

  getConfig(): InjectionEngineConfig { return { ...this.cfg }; }

  private validateOrder(order: InjectionOrder): void {
    if (!order.symbol || order.symbol.trim() === '') {
      throw new Error('InjectionOrder.symbol must be non-empty');
    }
    if (order.side !== 'buy' && order.side !== 'sell') {
      throw new Error(`Invalid side: ${order.side}`);
    }
    if (order.qty <= 0) {
      throw new Error(`qty must be > 0, got ${order.qty}`);
    }
    if (order.price <= 0) {
      throw new Error(`price must be > 0, got ${order.price}`);
    }
  }
}
