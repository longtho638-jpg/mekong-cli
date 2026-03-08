/**
 * Execution module exports
 */

export * from './idempotency-store';

// Audit Logging & Compliance
export * from './audit-log-repository';
export * from './compliance-audit-logger';
export * from './audit-logger';
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
