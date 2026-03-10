/**
 * Monitor Aggregator - Collects metrics from all components during chaos tests.
 * Tracks logs, order execution, circuit breaker events, and latency.
 */

export type MetricType = 'log' | 'order' | 'circuit-breaker' | 'swarm-realloc' | 'latency';

export interface MetricEntry {
  timestamp: number;
  type: MetricType;
  source: string;
  message: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface LatencyHistogram {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  count: number;
}

/** In-memory metric store */
let metrics: MetricEntry[] = [];

/**
 * Record a metric entry.
 */
export function recordMetric(entry: Omit<MetricEntry, 'timestamp'>): void {
  metrics.push({ ...entry, timestamp: Date.now() });
}

/**
 * Record a log message from a container/service.
 */
export function recordLog(source: string, message: string): void {
  recordMetric({ type: 'log', source, message });
}

/**
 * Record an order execution result.
 */
export function recordOrder(source: string, success: boolean, details?: string): void {
  recordMetric({
    type: 'order',
    source,
    message: success ? 'Order executed' : 'Order failed',
    value: success ? 1 : 0,
    metadata: details ? { details } : undefined,
  });
}

/**
 * Record a circuit breaker trigger.
 */
export function recordCircuitBreaker(source: string, triggered: boolean): void {
  recordMetric({
    type: 'circuit-breaker',
    source,
    message: triggered ? 'Circuit breaker OPEN' : 'Circuit breaker CLOSED',
    value: triggered ? 1 : 0,
  });
}

/**
 * Record a latency measurement.
 */
export function recordLatency(source: string, latencyMs: number): void {
  recordMetric({
    type: 'latency',
    source,
    message: `Latency: ${latencyMs}ms`,
    value: latencyMs,
  });
}

/**
 * Get all collected metrics.
 */
export function getMetrics(): MetricEntry[] {
  return [...metrics];
}

/**
 * Get metrics filtered by type.
 */
export function getMetricsByType(type: MetricType): MetricEntry[] {
  return metrics.filter((m) => m.type === type);
}

/**
 * Compute a latency histogram from recorded latency metrics.
 */
export function computeLatencyHistogram(): LatencyHistogram {
  const latencies = metrics
    .filter((m) => m.type === 'latency' && m.value !== undefined)
    .map((m) => m.value as number)
    .sort((a, b) => a - b);

  if (latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
  }

  const sum = latencies.reduce((a, b) => a + b, 0);
  const percentile = (p: number) => latencies[Math.floor(latencies.length * p / 100)] || 0;

  return {
    min: latencies[0],
    max: latencies[latencies.length - 1],
    avg: sum / latencies.length,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    count: latencies.length,
  };
}

/**
 * Clear all metrics (reset between tests).
 */
export function clearMetrics(): void {
  metrics = [];
}
