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
export {
  TradeMonitorService,
  getGlobalTradeMonitor,
  type TradeMetrics,
} from '../monitoring/trade-monitor-service';
export {
  AnomalyDetector,
  type AnomalyEvent,
  type AnomalyType,
  type AnomalySeverity,
} from '../monitoring/anomaly-detector';
export {
  PrometheusExporter,
  type MetricLabels,
  type HistogramMetric,
  type CounterMetric,
  type GaugeMetric,
} from '../monitoring/prometheus-exporter';
export {
  MetricsWebhookSender,
  type WebhookPayload,
  type WebhookDeliveryResult,
  type AnomalyWebhookPayload,
  type UsageWebhookPayload,
} from '../monitoring/metrics-webhook-sender';

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
