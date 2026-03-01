/**
 * A2UI — Agent-to-User Interface for Algo Trader.
 * Google A2UI protocol adapted for RaaS AGI trading.
 */

export * from './types';
export { AgentEventBus } from './agent-event-bus';
export { SurfaceManager } from './surface-manager';
export type { Surface } from './surface-manager';
export { AutonomyController, DEFAULT_AUTONOMY_CONFIG } from '../core/autonomy-controller';
export type { AutonomyConfig } from '../core/autonomy-controller';
export { SignalExplainer } from './signal-explainer';
export type { ConfidenceFactor } from './signal-explainer';
export { TradeAuditLogger } from './trade-audit-logger';
export type { AuditEntry } from './trade-audit-logger';
