import {
  recordMetric, recordLog, recordOrder, recordCircuitBreaker, recordLatency,
  getMetrics, getMetricsByType, computeLatencyHistogram, clearMetrics,
} from '../../../src/testing/chaos/monitor-aggregator';

describe('monitor-aggregator', () => {
  beforeEach(() => clearMetrics());

  it('should record and retrieve metrics', () => {
    recordLog('phase1', 'Started');
    recordLog('phase2', 'Processing');
    expect(getMetrics()).toHaveLength(2);
  });

  it('should record order metrics', () => {
    recordOrder('phase1', true, 'BTC/USDT');
    recordOrder('phase1', false, 'ETH/USDT');
    const orders = getMetricsByType('order');
    expect(orders).toHaveLength(2);
    expect(orders[0].value).toBe(1);
    expect(orders[1].value).toBe(0);
  });

  it('should record circuit breaker events', () => {
    recordCircuitBreaker('phase5', true);
    const cbs = getMetricsByType('circuit-breaker');
    expect(cbs).toHaveLength(1);
    expect(cbs[0].message).toContain('OPEN');
  });

  it('should record latency metrics', () => {
    recordLatency('exchange', 50);
    recordLatency('exchange', 120);
    const latencies = getMetricsByType('latency');
    expect(latencies).toHaveLength(2);
  });

  it('should compute latency histogram', () => {
    recordLatency('s1', 10);
    recordLatency('s1', 20);
    recordLatency('s1', 30);
    recordLatency('s1', 100);

    const hist = computeLatencyHistogram();
    expect(hist.min).toBe(10);
    expect(hist.max).toBe(100);
    expect(hist.avg).toBe(40);
    expect(hist.count).toBe(4);
  });

  it('should return zero histogram when empty', () => {
    const hist = computeLatencyHistogram();
    expect(hist.count).toBe(0);
    expect(hist.min).toBe(0);
    expect(hist.avg).toBe(0);
  });

  it('should filter metrics by type', () => {
    recordLog('s1', 'log');
    recordLatency('s1', 50);
    recordOrder('s1', true);
    expect(getMetricsByType('log')).toHaveLength(1);
    expect(getMetricsByType('latency')).toHaveLength(1);
    expect(getMetricsByType('order')).toHaveLength(1);
  });

  it('should clear all metrics', () => {
    recordLog('s1', 'test');
    recordLatency('s1', 10);
    clearMetrics();
    expect(getMetrics()).toHaveLength(0);
  });
});
