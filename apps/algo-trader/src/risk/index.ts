/**
 * Risk Module — Core risk management types and event system.
 *
 * @packageDocumentation
 */

export * from './types';
export { RiskEventEmitter } from '../core/risk-events';
export { CircuitBreaker, type CircuitState, type CircuitBreakerConfig, type CircuitBreakerMetrics } from './circuit-breaker';
export { DrawdownTracker, type DrawdownTrackerConfig, type DrawdownSnapshot, type RollingWindowStats } from './drawdown-tracker';
export { PnLTracker, type TradeRecord, type Position, type RollingPnL, type StrategyPnL } from './pnl-tracker';
export { PnLAlerts, type AlertThreshold, type AlertConfig } from './pnl-alerts';
export { AlertRules, type WebhookConfig, type AlertRule, type AlertAction } from './alert-rules';
export { SharpeCalculator, type SharpeConfig, type SharpeResult } from './sharpe-calculator';
export { RollingMetrics, type RollingWindowConfig, type RollingMetricsResult, type ReturnEntry, type RollingWindowType } from './rolling-metrics';
