/**
 * Metrics Collector — gathers data from all modules into unified time series.
 * Storage: ~/.mekong/kaizen/metrics.jsonl (append-only, rotated monthly)
 */
import type { MetricPoint, MetricSeries } from './types.js';
import type { Result } from '../types/common.js';

export class MetricsCollector {
  private buffer: MetricPoint[] = [];
  private readonly metricsPath: string;

  constructor(metricsDir: string) {
    this.metricsPath = `${metricsDir}/metrics.jsonl`;
  }

  /** Record a single metric point */
  record(name: string, value: number, unit: string, labels: Record<string, string> = {}): void {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      value,
      labels: { metric: name, unit, ...labels },
    });
    if (this.buffer.length >= 100) void this.flush();
  }

  /** Convenience: record SOP step completion */
  recordSopStep(sopName: string, stepId: string, duration: number, success: boolean, cost: number): void {
    this.record('sop.step.duration', duration, 'ms', { sop: sopName, step: stepId });
    this.record('sop.step.success', success ? 1 : 0, 'count', { sop: sopName, step: stepId });
    this.record('sop.step.cost', cost, 'usd', { sop: sopName, step: stepId });
  }

  /** Convenience: record agent task completion */
  recordAgentTask(agent: string, duration: number, tokens: number, cost: number, success: boolean): void {
    this.record('agent.task.duration', duration, 'ms', { agent });
    this.record('agent.task.tokens', tokens, 'tokens', { agent });
    this.record('agent.task.cost', cost, 'usd', { agent });
    this.record('agent.task.success', success ? 1 : 0, 'count', { agent });
  }

  /** Convenience: record tool call */
  recordToolCall(tool: string, duration: number, success: boolean): void {
    this.record('tool.call.duration', duration, 'ms', { tool });
    this.record('tool.call.success', success ? 1 : 0, 'count', { tool });
  }

  /** Query metrics for a time range */
  async query(_name: string, _from: string, _to: string, _labels?: Record<string, string>): Promise<MetricSeries> {
    throw new Error('Not implemented');
  }

  /** Flush buffer to disk */
  async flush(): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Rotate old metrics (keep last 90 days) */
  async rotate(): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Subscribe to real-time events from event bus */
  subscribeToEvents(): void {
    throw new Error('Not implemented');
  }
}
