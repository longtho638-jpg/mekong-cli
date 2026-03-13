/**
 * Risk Core Types — Foundational interfaces for risk management system.
 * Used by all risk modules: PnL tracking, circuit breakers, position limits.
 */

// --- Risk Metrics (portfolio-level risk measurements) ---

export interface RiskMetrics {
  /** Total cumulative PnL across all positions */
  totalPnl: number;
  /** PnL for current trading day */
  dailyPnl: number;
  /** Maximum drawdown from peak (as decimal, e.g. -0.15 = -15%) */
  drawdown: number;
  /** Risk-adjusted return metric */
  sharpeRatio: number;
  /** Percentage of available position utilization used */
  positionUtilization: number;
}

// --- Alert System (risk event notifications) ---

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'pnl:alert'
  | 'drawdown:warning'
  | 'circuit:trip'
  | 'circuit:reset'
  | 'limit:breached'
  | 'custom';

export interface AlertEvent {
  /** Event type identifier */
  type: AlertType;
  /** Severity level */
  severity: AlertSeverity;
  /** Human-readable alert message */
  message: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Optional metadata for programmatic handling */
  metadata?: Record<string, unknown>;
}

// --- Position Limits (exposure controls) ---

export interface PositionLimits {
  /** Maximum position size per strategy */
  perStrategy: Record<string, number>;
  /** Maximum total exposure across all positions */
  maxExposure: number;
  /** Maximum leverage multiplier allowed */
  maxLeverage: number;
}

// --- Circuit Breaker State (automatic halt mechanism) ---

export interface CircuitBreakerState {
  /** Whether circuit breaker is currently tripped */
  tripped: boolean;
  /** Reason for tripping (if tripped) */
  tripReason?: string;
  /** Unix timestamp when breaker can be reset */
  resetTime?: number;
}

// --- Rolling Window Configuration (time-series analysis) ---

export interface RollingWindowConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Minimum number of samples required for valid calculation */
  minSamples: number;
}

// --- Risk Event Types (typed event payloads) ---

export interface PnLAlertEvent extends AlertEvent {
  type: 'pnl:alert';
  metadata: {
    currentPnl: number;
    threshold: number;
    period: 'daily' | 'total';
    tradeId?: string;
    realizedPnl?: number;
    strategy?: string;
  };
}

export interface DrawdownWarningEvent extends AlertEvent {
  type: 'drawdown:warning';
  metadata: {
    currentDrawdown: number;
    threshold: number;
    peakValue: number;
  };
}

export interface CircuitTripEvent extends AlertEvent {
  type: 'circuit:trip';
  severity: 'critical';
  metadata: {
    breakerId: string;
    triggerValue: number;
    threshold: number;
  };
}

export interface CircuitResetEvent extends AlertEvent {
  type: 'circuit:reset';
  metadata: {
    breakerId: string;
    downtimeMs: number;
  };
}

export interface LimitBreachedEvent extends AlertEvent {
  type: 'limit:breached';
  severity: 'warning' | 'critical';
  metadata: {
    limitType: 'exposure' | 'leverage' | 'position';
    currentValue: number;
    limit: number;
    strategyId?: string;
  };
}

/** Union type of all risk events */
export type RiskEvent =
  | PnLAlertEvent
  | DrawdownWarningEvent
  | CircuitTripEvent
  | CircuitResetEvent
  | LimitBreachedEvent;
