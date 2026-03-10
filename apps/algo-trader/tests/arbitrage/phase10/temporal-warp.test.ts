/**
 * Tests: Temporal Warp Execution & Network Injection — Phase 10 Module 1.
 * Covers: eBPF program loading, FPGA packet signing, zero-copy FIX/WS/raw parsing,
 * order injection pipeline, latency statistics, and initTemporalWarp factory.
 */

import {
  EbpfLoader,
  FpgaAccelerator,
  ZeroCopyParser,
  InjectionEngine,
  LatencyMonitor,
  initTemporalWarp,
} from '../../../src/arbitrage/phase10_cosmic/temporalWarp/index';

import type {
  EbpfLoaderConfig,
  EbpfProgramInfo,
  FpgaAcceleratorConfig,
  FpgaPacket,
  ZeroCopyParserConfig,
  ParsedMessage,
  InjectionEngineConfig,
  InjectionOrder,
  InjectionResult,
  InjectionStats,
  LatencyMonitorConfig,
  LatencyStats,
  LatencyAlert,
  TemporalWarpConfig,
} from '../../../src/arbitrage/phase10_cosmic/temporalWarp/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SOH = '\x01';

function makeFix(fields: Record<string, string>): Buffer {
  const msg = Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(SOH) + SOH;
  return Buffer.from(msg, 'ascii');
}

function makeOrder(overrides: Partial<InjectionOrder> = {}): InjectionOrder {
  return { symbol: 'BTC/USDT', side: 'buy', qty: 0.5, price: 50_000, ...overrides };
}

function makeInitializedEngine(cfg: Partial<InjectionEngineConfig> = {}): InjectionEngine {
  const engine = new InjectionEngine({ dryRun: true, ...cfg });
  engine.initialize();
  return engine;
}

// ── EbpfLoader — loadProgram ──────────────────────────────────────────────────

describe('EbpfLoader — loadProgram', () => {
  it('loads a program and returns EbpfProgramInfo', () => {
    const loader = new EbpfLoader();
    const info = loader.loadProgram('xdp_test');
    expect(info).toHaveProperty('id');
    expect(info).toHaveProperty('kernelId');
    expect(info.name).toBe('xdp_test');
    expect(info.dryRun).toBe(true);
  });

  it('uses config objectPath by default', () => {
    const loader = new EbpfLoader({ objectPath: './custom.o' });
    expect(loader.loadProgram('prog').objectPath).toBe('./custom.o');
  });

  it('overrides objectPath when supplied to loadProgram', () => {
    const loader = new EbpfLoader({ objectPath: './default.o' });
    expect(loader.loadProgram('prog', './override.o').objectPath).toBe('./override.o');
  });

  it('assigns unique IDs across multiple loads', () => {
    const loader = new EbpfLoader();
    const ids = Array.from({ length: 5 }, (_, i) => loader.loadProgram(`p${i}`).id);
    expect(new Set(ids).size).toBe(5);
  });

  it('assigns incrementing kernelIds', () => {
    const loader = new EbpfLoader();
    const k1 = loader.loadProgram('a').kernelId;
    const k2 = loader.loadProgram('b').kernelId;
    expect(k2).toBeGreaterThan(k1);
  });

  it('records loadedAt as recent timestamp', () => {
    const loader = new EbpfLoader();
    const before = Date.now();
    const info = loader.loadProgram('t');
    expect(info.loadedAt).toBeGreaterThanOrEqual(before);
    expect(info.loadedAt).toBeLessThanOrEqual(Date.now());
  });

  it('respects configured interface', () => {
    const loader = new EbpfLoader({ interface: 'eth0' });
    expect(loader.loadProgram('p').interface).toBe('eth0');
  });

  it('throws when maxPrograms limit is reached', () => {
    const loader = new EbpfLoader({ maxPrograms: 2 });
    loader.loadProgram('a');
    loader.loadProgram('b');
    expect(() => loader.loadProgram('c')).toThrow('limit reached');
  });

  it('getProgramCount returns correct count', () => {
    const loader = new EbpfLoader();
    expect(loader.getProgramCount()).toBe(0);
    loader.loadProgram('a');
    loader.loadProgram('b');
    expect(loader.getProgramCount()).toBe(2);
  });
});

describe('EbpfLoader — getProgramInfo / unloadProgram', () => {
  it('getProgramInfo returns info for loaded program', () => {
    const loader = new EbpfLoader();
    const info = loader.loadProgram('prog');
    expect(loader.getProgramInfo(info.id)).toEqual(info);
  });

  it('getProgramInfo returns undefined for unknown id', () => {
    expect(new EbpfLoader().getProgramInfo('nonexistent')).toBeUndefined();
  });

  it('unloadProgram removes the program and returns true', () => {
    const loader = new EbpfLoader();
    const info = loader.loadProgram('prog');
    expect(loader.unloadProgram(info.id)).toBe(true);
    expect(loader.getProgramInfo(info.id)).toBeUndefined();
    expect(loader.getProgramCount()).toBe(0);
  });

  it('unloadProgram returns false for unknown id', () => {
    expect(new EbpfLoader().unloadProgram('ghost')).toBe(false);
  });

  it('listPrograms returns all loaded programs', () => {
    const loader = new EbpfLoader();
    loader.loadProgram('a');
    loader.loadProgram('b');
    expect(loader.listPrograms()).toHaveLength(2);
  });

  it('unloading frees a slot for a new load', () => {
    const loader = new EbpfLoader({ maxPrograms: 1 });
    const info = loader.loadProgram('a');
    loader.unloadProgram(info.id);
    expect(() => loader.loadProgram('b')).not.toThrow();
  });

  it('getConfig returns merged config', () => {
    const loader = new EbpfLoader({ interface: 'eth1', maxPrograms: 4 });
    const cfg = loader.getConfig();
    expect(cfg.interface).toBe('eth1');
    expect(cfg.maxPrograms).toBe(4);
  });
});

// ── FpgaAccelerator — initialize ──────────────────────────────────────────────

describe('FpgaAccelerator — initialize', () => {
  it('initializes successfully with default config', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    expect(fpga.isInitialized()).toBe(true);
  });

  it('is not initialized before initialize()', () => {
    expect(new FpgaAccelerator().isInitialized()).toBe(false);
  });

  it('double initialize does not throw', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    expect(() => fpga.initialize()).not.toThrow();
  });

  it('throws if devicePath is empty', () => {
    expect(() => new FpgaAccelerator({ devicePath: '' }).initialize()).toThrow('device path');
  });
});

describe('FpgaAccelerator — signPacket', () => {
  it('returns a 64-char hex signature', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    const sig = fpga.signPacket(Buffer.from('hello'));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBe(64);
  });

  it('is deterministic for same payload', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    const p = Buffer.from('order-data');
    expect(fpga.signPacket(p)).toBe(fpga.signPacket(p));
  });

  it('produces different signatures for different payloads', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    expect(fpga.signPacket(Buffer.from('aaa'))).not.toBe(fpga.signPacket(Buffer.from('bbb')));
  });

  it('throws if called before initialize()', () => {
    expect(() => new FpgaAccelerator().signPacket(Buffer.from('x'))).toThrow('initialized');
  });
});

describe('FpgaAccelerator — generatePacket', () => {
  it('returns a valid FpgaPacket shape', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    const pkt = fpga.generatePacket(Buffer.from('payload'));
    expect(pkt).toHaveProperty('seq');
    expect(pkt).toHaveProperty('payload');
    expect(pkt).toHaveProperty('signature');
    expect(pkt).toHaveProperty('generatedAt');
    expect(pkt).toHaveProperty('latencyNs');
  });

  it('seq increments on each call', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    const p1 = fpga.generatePacket(Buffer.from('a'));
    const p2 = fpga.generatePacket(Buffer.from('b'));
    expect(p2.seq).toBe(p1.seq + 1);
  });

  it('latencyNs equals configured fixedLatencyNs', () => {
    const fpga = new FpgaAccelerator({ fixedLatencyNs: 1234 });
    fpga.initialize();
    expect(fpga.generatePacket(Buffer.from('x')).latencyNs).toBe(1234);
  });

  it('getLatencyNs returns configured value without initializing', () => {
    expect(new FpgaAccelerator({ fixedLatencyNs: 999 }).getLatencyNs()).toBe(999);
  });

  it('getPacketCount increments after each generatePacket', () => {
    const fpga = new FpgaAccelerator();
    fpga.initialize();
    fpga.generatePacket(Buffer.from('a'));
    fpga.generatePacket(Buffer.from('b'));
    expect(fpga.getPacketCount()).toBe(2);
  });

  it('getFirmwareVersion returns config value', () => {
    expect(new FpgaAccelerator({ firmwareVersion: '2.0.0' }).getFirmwareVersion()).toBe('2.0.0');
  });

  it('throws if generatePacket called before initialize()', () => {
    expect(() => new FpgaAccelerator().generatePacket(Buffer.from('x'))).toThrow('initialized');
  });
});

// ── ZeroCopyParser — parseFix ─────────────────────────────────────────────────

describe('ZeroCopyParser — parseFix', () => {
  it('parses a valid FIX message', () => {
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'SENDER', '55': 'BTC/USDT' });
    const msg = new ZeroCopyParser().parseFix(buf);
    expect(msg.protocol).toBe('FIX');
    expect(msg.valid).toBe(true);
    expect(msg.fields.get('8')).toBe('FIX.4.4');
    expect(msg.fields.get('55')).toBe('BTC/USDT');
  });

  it('marks message invalid when required tags missing', () => {
    expect(new ZeroCopyParser().parseFix(makeFix({ '55': 'ETH/USDT' })).valid).toBe(false);
  });

  it('bytesConsumed equals buffer length', () => {
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'ME' });
    expect(new ZeroCopyParser().parseFix(buf).bytesConsumed).toBe(buf.length);
  });

  it('parsedAt is a recent timestamp', () => {
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'X' });
    const before = Date.now();
    expect(new ZeroCopyParser().parseFix(buf).parsedAt).toBeGreaterThanOrEqual(before);
  });

  it('throws when message exceeds maxFixMessageBytes', () => {
    const parser = new ZeroCopyParser({ maxFixMessageBytes: 10 });
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'X' });
    expect(() => parser.parseFix(buf)).toThrow('max size');
  });

  it('trims whitespace when trimValues=true', () => {
    const raw = Buffer.from('8= FIX.4.4 \x0135= D \x0149=ME\x01', 'ascii');
    expect(new ZeroCopyParser({ trimValues: true }).parseFix(raw).fields.get('8')).toBe('FIX.4.4');
  });

  it('increments parseCount on success', () => {
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'X' });
    const parser = new ZeroCopyParser();
    parser.parseFix(buf);
    parser.parseFix(buf);
    expect(parser.getParseCount()).toBe(2);
  });

  it('increments errorCount on invalid message', () => {
    const parser = new ZeroCopyParser();
    parser.parseFix(makeFix({ '55': 'BTC' }));
    expect(parser.getErrorCount()).toBe(1);
  });
});

// ── ZeroCopyParser — parseWsBinary ────────────────────────────────────────────

describe('ZeroCopyParser — parseWsBinary', () => {
  function makeWsFrame(payload: string, opcode = 0x02): Buffer {
    const payloadBuf = Buffer.from(payload, 'utf8');
    const frame = Buffer.alloc(2 + payloadBuf.length);
    frame[0] = 0x80 | opcode;
    frame[1] = payloadBuf.length;
    payloadBuf.copy(frame, 2);
    return frame;
  }

  it('parses unmasked binary frame', () => {
    const msg = new ZeroCopyParser().parseWsBinary(makeWsFrame('hello'));
    expect(msg.protocol).toBe('WS_BINARY');
    expect(msg.valid).toBe(true);
    expect(msg.fields.get('opcode')).toBe('2');
  });

  it('extracts payload content', () => {
    expect(new ZeroCopyParser().parseWsBinary(makeWsFrame('test-payload')).fields.get('payload')).toContain('test-payload');
  });

  it('throws when frame is too short', () => {
    expect(() => new ZeroCopyParser().parseWsBinary(Buffer.alloc(1))).toThrow('too short');
  });

  it('parses masked frame and unmasks payload', () => {
    const payload = Buffer.from('hi', 'utf8');
    const maskKey = Buffer.from([0x37, 0xfa, 0x21, 0x3d]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ maskKey[i % 4];
    const frame = Buffer.concat([Buffer.from([0x82, 0x82]), maskKey, masked]);
    const msg = new ZeroCopyParser().parseWsBinary(frame);
    expect(msg.valid).toBe(true);
    expect(msg.fields.get('masked')).toBe('true');
  });

  it('marks continuation frame (opcode=0) as invalid', () => {
    expect(new ZeroCopyParser().parseWsBinary(makeWsFrame('cont', 0x00)).valid).toBe(false);
  });

  it('throws when payload exceeds maxWsPayloadBytes', () => {
    expect(() => new ZeroCopyParser({ maxWsPayloadBytes: 2 }).parseWsBinary(makeWsFrame('toolong'))).toThrow('max');
  });

  it('increments parseCount', () => {
    const parser = new ZeroCopyParser();
    parser.parseWsBinary(makeWsFrame('a'));
    parser.parseWsBinary(makeWsFrame('b'));
    expect(parser.getParseCount()).toBe(2);
  });
});

// ── ZeroCopyParser — parseRaw ─────────────────────────────────────────────────

describe('ZeroCopyParser — parseRaw', () => {
  it('parses newline-delimited key=value pairs', () => {
    const msg = new ZeroCopyParser().parseRaw(Buffer.from('symbol=BTC/USDT\nside=buy\n'));
    expect(msg.protocol).toBe('RAW');
    expect(msg.valid).toBe(true);
    expect(msg.fields.get('symbol')).toBe('BTC/USDT');
  });

  it('marks empty buffer as invalid', () => {
    const msg = new ZeroCopyParser().parseRaw(Buffer.alloc(0));
    expect(msg.valid).toBe(false);
    expect(msg.fields.size).toBe(0);
  });

  it('skips lines without = separator', () => {
    const msg = new ZeroCopyParser().parseRaw(Buffer.from('noequals\nkey=value\n'));
    expect(msg.fields.size).toBe(1);
    expect(msg.fields.get('key')).toBe('value');
  });

  it('handles value containing = sign', () => {
    expect(new ZeroCopyParser().parseRaw(Buffer.from('url=http://x.com?a=1\n')).fields.get('url')).toContain('=');
  });

  it('increments parseCount', () => {
    const parser = new ZeroCopyParser();
    parser.parseRaw(Buffer.from('k=v\n'));
    expect(parser.getParseCount()).toBe(1);
  });

  it('getConfig returns config', () => {
    expect(new ZeroCopyParser({ maxFixMessageBytes: 512 }).getConfig().maxFixMessageBytes).toBe(512);
  });
});

// ── InjectionEngine — initialize ──────────────────────────────────────────────

describe('InjectionEngine — initialize', () => {
  it('initializes without throwing', () => {
    expect(() => new InjectionEngine({ dryRun: true }).initialize()).not.toThrow();
  });

  it('double initialize does not throw', () => {
    const engine = new InjectionEngine({ dryRun: true });
    engine.initialize();
    expect(() => engine.initialize()).not.toThrow();
  });

  it('loads eBPF program during initialization', () => {
    const ebpf = new EbpfLoader();
    const engine = new InjectionEngine({ dryRun: true }, ebpf, new FpgaAccelerator(), new ZeroCopyParser());
    engine.initialize();
    expect(ebpf.getProgramCount()).toBe(1);
  });
});

describe('InjectionEngine — injectOrder', () => {
  it('returns valid InjectionResult for a good order', () => {
    const result = makeInitializedEngine().injectOrder(makeOrder());
    expect(result).toHaveProperty('orderId');
    expect(result).toHaveProperty('signature');
    expect(result).toHaveProperty('latencyNs');
    expect(result.symbol).toBe('BTC/USDT');
    expect(result.side).toBe('buy');
    expect(result.dryRun).toBe(true);
  });

  it('orderId is unique across calls', () => {
    const engine = makeInitializedEngine();
    expect(engine.injectOrder(makeOrder()).orderId).not.toBe(engine.injectOrder(makeOrder()).orderId);
  });

  it('injectedAt is a recent timestamp', () => {
    const before = Date.now();
    expect(makeInitializedEngine().injectOrder(makeOrder()).injectedAt).toBeGreaterThanOrEqual(before);
  });

  it('signature is a non-empty hex string', () => {
    const sig = makeInitializedEngine().injectOrder(makeOrder()).signature;
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('throws when symbol is empty', () => {
    expect(() => makeInitializedEngine().injectOrder(makeOrder({ symbol: '' }))).toThrow('symbol');
  });

  it('throws when side is invalid', () => {
    expect(() => makeInitializedEngine().injectOrder(makeOrder({ side: 'hold' as 'buy' }))).toThrow('side');
  });

  it('throws when qty <= 0', () => {
    expect(() => makeInitializedEngine().injectOrder(makeOrder({ qty: 0 }))).toThrow('qty');
  });

  it('throws when price <= 0', () => {
    expect(() => makeInitializedEngine().injectOrder(makeOrder({ price: -1 }))).toThrow('price');
  });

  it('accepts sell side order', () => {
    expect(makeInitializedEngine().injectOrder(makeOrder({ side: 'sell' })).side).toBe('sell');
  });

  it('accepts order with meta fields', () => {
    expect(() => makeInitializedEngine().injectOrder(makeOrder({ meta: { clientId: 'test-123' } }))).not.toThrow();
  });
});

describe('InjectionEngine — getStats', () => {
  it('returns zero stats before any injection', () => {
    const stats = makeInitializedEngine().getStats();
    expect(stats.totalInjections).toBe(0);
    expect(stats.totalErrors).toBe(0);
    expect(stats.avgLatencyNs).toBe(0);
    expect(stats.lastInjectedAt).toBeNull();
  });

  it('totalInjections increments correctly', () => {
    const engine = makeInitializedEngine();
    engine.injectOrder(makeOrder());
    engine.injectOrder(makeOrder());
    expect(engine.getStats().totalInjections).toBe(2);
  });

  it('avgLatencyNs is non-zero after injections', () => {
    const engine = makeInitializedEngine();
    engine.injectOrder(makeOrder());
    expect(engine.getStats().avgLatencyNs).toBeGreaterThan(0);
  });

  it('lastInjectedAt is populated after injection', () => {
    const engine = makeInitializedEngine();
    engine.injectOrder(makeOrder());
    expect(engine.getStats().lastInjectedAt).not.toBeNull();
  });

  it('getConfig returns merged config', () => {
    expect(new InjectionEngine({ dryRun: true, interface: 'eth0' }).getConfig().interface).toBe('eth0');
  });
});

// ── LatencyMonitor — record ───────────────────────────────────────────────────

describe('LatencyMonitor — record', () => {
  it('accepts valid nanosecond samples', () => {
    const m = new LatencyMonitor();
    expect(() => m.record(500)).not.toThrow();
    expect(() => m.record(0)).not.toThrow();
  });

  it('throws for negative latency', () => {
    expect(() => new LatencyMonitor().record(-1)).toThrow('>= 0');
  });

  it('getSampleCount reflects retained samples', () => {
    const m = new LatencyMonitor();
    m.record(100);
    m.record(200);
    expect(m.getSampleCount()).toBe(2);
  });

  it('getTotalSamples tracks all samples including evicted', () => {
    const m = new LatencyMonitor({ maxSamples: 2 });
    m.record(100);
    m.record(200);
    m.record(300);
    expect(m.getTotalSamples()).toBe(3);
    expect(m.getSampleCount()).toBe(2);
  });

  it('evicts oldest when maxSamples reached', () => {
    const m = new LatencyMonitor({ maxSamples: 3 });
    [100, 200, 300, 400].forEach((v) => m.record(v));
    expect(m.getSampleCount()).toBe(3);
  });
});

// ── LatencyMonitor — getStats ─────────────────────────────────────────────────

describe('LatencyMonitor — getStats', () => {
  it('returns zero stats when no samples', () => {
    const stats = new LatencyMonitor().getStats();
    expect(stats.count).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.avg).toBe(0);
    expect(stats.p50).toBe(0);
    expect(stats.p95).toBe(0);
    expect(stats.p99).toBe(0);
    expect(stats.movingAvg).toBe(0);
    expect(stats.alertCount).toBe(0);
  });

  it('computes min and max correctly', () => {
    const m = new LatencyMonitor();
    [500, 100, 900, 300].forEach((v) => m.record(v));
    const stats = m.getStats();
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(900);
  });

  it('computes avg correctly', () => {
    const m = new LatencyMonitor();
    [100, 200, 300].forEach((v) => m.record(v));
    expect(m.getStats().avg).toBeCloseTo(200, 0);
  });

  it('p99 >= p95 >= p50', () => {
    const m = new LatencyMonitor();
    for (let i = 1; i <= 100; i++) m.record(i * 100);
    const stats = m.getStats();
    expect(stats.p99).toBeGreaterThanOrEqual(stats.p95);
    expect(stats.p95).toBeGreaterThanOrEqual(stats.p50);
  });

  it('single sample: min/max/p50/p99 all equal that sample', () => {
    const m = new LatencyMonitor();
    m.record(777);
    const stats = m.getStats();
    expect(stats.min).toBe(777);
    expect(stats.max).toBe(777);
    expect(stats.p50).toBe(777);
    expect(stats.p99).toBe(777);
  });

  it('count reflects number of retained samples', () => {
    const m = new LatencyMonitor();
    m.record(100);
    m.record(200);
    expect(m.getStats().count).toBe(2);
  });

  it('alertCount reflects samples exceeding threshold', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 500 });
    m.record(100);   // below
    m.record(1000);  // above
    m.record(2000);  // above
    expect(m.getStats().alertCount).toBe(2);
  });

  it('movingAvg equals avg when samples < windowSize', () => {
    const m = new LatencyMonitor({ windowSize: 100 });
    [100, 200, 300].forEach((v) => m.record(v));
    const stats = m.getStats();
    expect(stats.movingAvg).toBeCloseTo(stats.avg, 5);
  });
});

// ── LatencyMonitor — onAlert ──────────────────────────────────────────────────

describe('LatencyMonitor — onAlert', () => {
  it('calls handler when latency exceeds alertThresholdNs', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 100 });
    const received: LatencyAlert[] = [];
    m.onAlert((a) => received.push(a));
    m.record(200);
    expect(received).toHaveLength(1);
    expect(received[0].latencyNs).toBe(200);
    expect(received[0].threshold).toBe(100);
  });

  it('does not call handler for sample at or below threshold', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 1000 });
    const received: LatencyAlert[] = [];
    m.onAlert((a) => received.push(a));
    m.record(50);
    expect(received).toHaveLength(0);
  });

  it('unsubscribe stops future alerts', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 100 });
    const received: LatencyAlert[] = [];
    const unsub = m.onAlert((a) => received.push(a));
    unsub();
    m.record(500);
    expect(received).toHaveLength(0);
  });

  it('alert has sampleIndex and timestamp', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 0 });
    let alert: LatencyAlert | null = null;
    m.onAlert((a) => { alert = a; });
    m.record(1);
    expect(alert).not.toBeNull();
    expect(alert!).toHaveProperty('sampleIndex');
    expect(alert!).toHaveProperty('timestamp');
  });

  it('getAlerts returns independent copy', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 100 });
    m.record(500);
    const alerts = m.getAlerts();
    expect(alerts).toHaveLength(1);
    alerts.pop();
    expect(m.getAlerts()).toHaveLength(1); // original unchanged
  });

  it('swallows exceptions thrown by handler', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 0 });
    m.onAlert(() => { throw new Error('boom'); });
    expect(() => m.record(1)).not.toThrow();
  });
});

// ── LatencyMonitor — reset ────────────────────────────────────────────────────

describe('LatencyMonitor — reset', () => {
  it('clears all samples', () => {
    const m = new LatencyMonitor();
    m.record(100);
    m.reset();
    expect(m.getSampleCount()).toBe(0);
    expect(m.getStats().count).toBe(0);
  });

  it('clears alerts', () => {
    const m = new LatencyMonitor({ alertThresholdNs: 0 });
    m.record(100);
    m.reset();
    expect(m.getAlerts()).toHaveLength(0);
  });

  it('resets totalSamples', () => {
    const m = new LatencyMonitor();
    m.record(100);
    m.reset();
    expect(m.getTotalSamples()).toBe(0);
  });

  it('allows recording after reset', () => {
    const m = new LatencyMonitor();
    m.record(100);
    m.reset();
    m.record(500);
    expect(m.getSampleCount()).toBe(1);
    expect(m.getStats().avg).toBe(500);
  });

  it('getConfig returns config copy', () => {
    const cfg = new LatencyMonitor({ maxSamples: 999, alertThresholdNs: 42 }).getConfig();
    expect(cfg.maxSamples).toBe(999);
    expect(cfg.alertThresholdNs).toBe(42);
  });
});

// ── initTemporalWarp factory ──────────────────────────────────────────────────

describe('initTemporalWarp', () => {
  it('returns all required component fields', () => {
    const tw = initTemporalWarp();
    expect(tw.ebpfLoader).toBeInstanceOf(EbpfLoader);
    expect(tw.fpgaAccelerator).toBeInstanceOf(FpgaAccelerator);
    expect(tw.zeroCopyParser).toBeInstanceOf(ZeroCopyParser);
    expect(tw.injectionEngine).toBeInstanceOf(InjectionEngine);
    expect(tw.latencyMonitor).toBeInstanceOf(LatencyMonitor);
    expect(tw).toHaveProperty('config');
  });

  it('default config has enabled=false (dryRun=true)', () => {
    const tw = initTemporalWarp();
    expect(tw.config.enabled).toBe(false);
    expect(tw.injectionEngine.getConfig().dryRun).toBe(true);
  });

  it('enabled=true sets dryRun=false on injectionEngine', () => {
    const tw = initTemporalWarp({ enabled: true });
    expect(tw.injectionEngine.getConfig().dryRun).toBe(false);
  });

  it('applies custom interface to config and injectionEngine', () => {
    const tw = initTemporalWarp({ interface: 'eth0' });
    expect(tw.config.interface).toBe('eth0');
    expect(tw.injectionEngine.getConfig().interface).toBe('eth0');
  });

  it('applies custom ebpfObjectPath to ebpfLoader', () => {
    const tw = initTemporalWarp({ ebpfObjectPath: './custom.o' });
    expect(tw.config.ebpfObjectPath).toBe('./custom.o');
    expect(tw.ebpfLoader.getConfig().objectPath).toBe('./custom.o');
  });

  it('applies custom fpgaDevicePath to fpgaAccelerator', () => {
    const tw = initTemporalWarp({ fpgaDevicePath: '/dev/uio1' });
    expect(tw.config.fpgaDevicePath).toBe('/dev/uio1');
    expect(tw.fpgaAccelerator.getConfig().devicePath).toBe('/dev/uio1');
  });

  it('injectionEngine can inject an order', () => {
    const tw = initTemporalWarp();
    const result = tw.injectionEngine.injectOrder(makeOrder());
    expect(result).toHaveProperty('orderId');
    expect(result.dryRun).toBe(true);
  });

  it('latencyMonitor can record samples', () => {
    const tw = initTemporalWarp();
    tw.latencyMonitor.record(800);
    tw.latencyMonitor.record(900);
    expect(tw.latencyMonitor.getSampleCount()).toBe(2);
  });

  it('zeroCopyParser can parse FIX messages', () => {
    const tw = initTemporalWarp();
    const buf = makeFix({ '8': 'FIX.4.4', '35': 'D', '49': 'X' });
    expect(tw.zeroCopyParser.parseFix(buf).valid).toBe(true);
  });

  it('ebpfLoader has one program loaded after factory init', () => {
    expect(initTemporalWarp().ebpfLoader.getProgramCount()).toBe(1);
  });

  it('fpgaAccelerator is initialized after factory init', () => {
    expect(initTemporalWarp().fpgaAccelerator.isInitialized()).toBe(true);
  });

  it('injectionEngine produces unique orderIds across calls', () => {
    const tw = initTemporalWarp();
    const ids = Array.from({ length: 5 }, () => tw.injectionEngine.injectOrder(makeOrder()).orderId);
    expect(new Set(ids).size).toBe(5);
  });

  it('injectionEngine throws for invalid order', () => {
    expect(() => initTemporalWarp().injectionEngine.injectOrder(makeOrder({ qty: -1 }))).toThrow('qty');
  });

  it('config field is snapshot of resolved defaults', () => {
    const tw = initTemporalWarp({ interface: 'lo' });
    expect(tw.config.interface).toBe('lo');
    expect(tw.config.fpgaDevicePath).toBe('/dev/uio0');
  });
});
