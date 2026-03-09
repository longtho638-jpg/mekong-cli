import { EbpfOptimizer } from '../../../src/expansion/hardware-accel/ebpf-optimizer';

describe('EbpfOptimizer', () => {
  it('loadAll marks all programs as loaded', async () => {
    const optimizer = new EbpfOptimizer();
    const loaded = await optimizer.loadAll();
    expect(loaded.length).toBeGreaterThan(0);
    loaded.forEach((p) => expect(p.loaded).toBe(true));
  });

  it('isFullyOptimized returns true after loadAll', async () => {
    const optimizer = new EbpfOptimizer();
    await optimizer.loadAll();
    expect(optimizer.isFullyOptimized()).toBe(true);
  });

  it('isFullyOptimized returns false before loadAll', () => {
    const optimizer = new EbpfOptimizer();
    expect(optimizer.isFullyOptimized()).toBe(false);
  });

  it('getLoadedPrograms returns loaded programs', async () => {
    const optimizer = new EbpfOptimizer();
    await optimizer.loadAll();
    const loaded = optimizer.getLoadedPrograms();
    expect(loaded.length).toBeGreaterThan(0);
  });

  it('unload removes a program from loaded set', async () => {
    const optimizer = new EbpfOptimizer();
    await optimizer.loadAll();
    const before = optimizer.getLoadedPrograms().length;
    optimizer.unload('xdp-order-fast-path');
    expect(optimizer.getLoadedPrograms().length).toBe(before - 1);
  });

  it('unload returns false for unknown program', () => {
    const optimizer = new EbpfOptimizer();
    expect(optimizer.unload('nonexistent')).toBe(false);
  });

  it('emits program-loaded for each loaded program', async () => {
    const optimizer = new EbpfOptimizer();
    const events: unknown[] = [];
    optimizer.on('program-loaded', (p) => events.push(p));
    await optimizer.loadAll();
    expect(events.length).toBeGreaterThan(0);
  });

  it('instances do not share mutable state', async () => {
    const a = new EbpfOptimizer();
    const b = new EbpfOptimizer();
    await a.loadAll();
    expect(b.isFullyOptimized()).toBe(false);
  });
});
