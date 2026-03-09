import { LatencyBenchmark } from '../../../src/expansion/hardware-accel/latency-benchmark';

describe('LatencyBenchmark', () => {
  it('run returns result with correct mode', async () => {
    const bench = new LatencyBenchmark();
    const result = await bench.run('hardware', 100);
    expect(result.mode).toBe('hardware');
    expect(result.samples).toBe(100);
  });

  it('hardware latency is lower than software latency', async () => {
    const bench = new LatencyBenchmark();
    const hw = await bench.run('hardware', 200);
    const sw = await bench.run('software', 200);
    expect(hw.meanLatencyUs).toBeLessThan(sw.meanLatencyUs);
  });

  it('p99 >= mean >= min', async () => {
    const bench = new LatencyBenchmark();
    const result = await bench.run('software', 200);
    expect(result.p99LatencyUs).toBeGreaterThanOrEqual(result.meanLatencyUs);
    expect(result.meanLatencyUs).toBeGreaterThanOrEqual(result.minLatencyUs);
  });

  it('max >= p99', async () => {
    const bench = new LatencyBenchmark();
    const result = await bench.run('hardware', 200);
    expect(result.maxLatencyUs).toBeGreaterThanOrEqual(result.p99LatencyUs);
  });

  it('compare returns improvementFactor > 1', async () => {
    const bench = new LatencyBenchmark();
    const { improvementFactor } = await bench.compare(100);
    expect(improvementFactor).toBeGreaterThan(1);
  });

  it('emits benchmark-complete event', async () => {
    const bench = new LatencyBenchmark();
    const events: unknown[] = [];
    bench.on('benchmark-complete', (r) => events.push(r));
    await bench.run('hardware', 50);
    expect(events).toHaveLength(1);
  });

  it('getLastResults accumulates across runs', async () => {
    const bench = new LatencyBenchmark();
    await bench.run('hardware', 50);
    await bench.run('software', 50);
    expect(bench.getLastResults()).toHaveLength(2);
  });

  it('compare emits comparison-complete event', async () => {
    const bench = new LatencyBenchmark();
    const events: unknown[] = [];
    bench.on('comparison-complete', (c) => events.push(c));
    await bench.compare(50);
    expect(events).toHaveLength(1);
  });
});
