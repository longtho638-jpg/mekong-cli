/**
 * Observability facade — metrics, traces, logs, alerting
 */
export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
  type: 'counter' | 'gauge' | 'histogram';
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: string;
  duration: number;
  status: 'ok' | 'error';
  attributes: Record<string, string>;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  channels: string[];
  severity: 'critical' | 'warning' | 'info';
}

export class ObservabilityFacade {
  async recordMetric(metric: Metric): Promise<void> {
    throw new Error('Implement with vibe-observability provider');
  }

  async startSpan(operationName: string, attributes?: Record<string, string>): Promise<Span> {
    throw new Error('Implement with vibe-observability provider');
  }

  async createAlert(rule: AlertRule): Promise<void> {
    throw new Error('Implement with vibe-observability provider');
  }
}
