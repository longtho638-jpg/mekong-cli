/**
 * Execution Module
 *
 * Core execution components:
 * - Idempotency store for duplicate prevention
 * - Audit logging & compliance
 * - Order lifecycle management
 * - Monitoring & metrics (Prometheus export)
 * - Distributed tracing (correlation IDs)
 * - Webhook alerts for anomalies
 */

export * from './idempotency-store';

// Audit Logging & Compliance
export * from './audit-log-repository';
export * from './audit-logger';
export * from './compliance-audit-logger';
export * from './order-lifecycle-manager';
export * from './order-state-machine';

// Monitoring (re-export from monitoring module)
export { getGlobalTradeMonitor } from '../monitoring/trade-monitor-service';
export type { TradeMetrics, TradeMonitorService } from '../monitoring/trade-monitor-service';
export type { AnomalyDetector, AnomalyEvent, AnomalyType, AnomalySeverity } from '../monitoring/anomaly-detector';
export type { PrometheusExporter, MetricLabels, HistogramMetric, CounterMetric, GaugeMetric } from '../monitoring/prometheus-exporter';
export type { MetricsWebhookSender, WebhookPayload, WebhookDeliveryResult, AnomalyWebhookPayload, UsageWebhookPayload } from '../monitoring/metrics-webhook-sender';

// Tracing (re-export from tracing module)
export {
  generateCorrelationId,
  extractCorrelationId,
  injectCorrelationId,
  isValidUuid,
  getOrCreateCorrelationId,
  createCorrelationMiddleware,
  createTraceLogger,
  type CorrelationId,
  CORRELATION_ID_HEADER,
} from '../tracing/correlation-id';
