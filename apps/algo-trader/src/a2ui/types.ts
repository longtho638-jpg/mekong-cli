/**
 * A2UI Core Types — Google Agent-to-User Interface protocol mapped to trading domain.
 * Declarative UI surfaces emitted by agent, rendered by client.
 */

// --- Autonomy Dial (4-tier control spectrum) ---

export enum AutonomyLevel {
  /** Agent observes only, no actions */
  OBSERVE = 'OBSERVE',
  /** Agent plans, shows intent, waits for approval */
  PLAN = 'PLAN',
  /** Agent acts but requires confirmation per trade */
  ACT_CONFIRM = 'ACT_CONFIRM',
  /** Agent fully autonomous — executes without confirmation */
  AUTONOMOUS = 'AUTONOMOUS',
}

// --- A2UI Component Catalog (whitelisted widget types) ---

export type ComponentType =
  | 'Card'
  | 'DataTable'
  | 'Alert'
  | 'Button'
  | 'Badge'
  | 'ProgressBar'
  | 'TextField'
  | 'Gauge'
  | 'Chart'
  | 'Timeline';

export interface A2UIComponent {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  children?: string[]; // IDs of child components
}

// --- A2UI Messages (protocol messages agent → client) ---

export interface BeginRenderingMessage {
  type: 'beginRendering';
  surfaceId: string;
  title: string;
  timestamp: number;
}

export interface SurfaceUpdateMessage {
  type: 'surfaceUpdate';
  surfaceId: string;
  components: A2UIComponent[];
  timestamp: number;
}

export interface DataModelUpdateMessage {
  type: 'dataModelUpdate';
  surfaceId: string;
  path: string; // e.g. "/portfolio/pnl"
  value: unknown;
  timestamp: number;
}

export interface DeleteSurfaceMessage {
  type: 'deleteSurface';
  surfaceId: string;
  timestamp: number;
}

export type A2UIMessage =
  | BeginRenderingMessage
  | SurfaceUpdateMessage
  | DataModelUpdateMessage
  | DeleteSurfaceMessage;

// --- User Actions (client → agent) ---

export interface UserAction {
  actionId: string;
  surfaceId: string;
  componentId: string;
  actionType: 'click' | 'input' | 'confirm' | 'reject' | 'dismiss';
  payload?: Record<string, unknown>;
  timestamp: number;
}

// --- Agent Events (internal events for UX patterns) ---

export enum AgentEventType {
  INTENT_PREVIEW = 'INTENT_PREVIEW',
  SIGNAL_RATIONALE = 'SIGNAL_RATIONALE',
  CONFIDENCE_UPDATE = 'CONFIDENCE_UPDATE',
  THOUGHT_SUMMARY = 'THOUGHT_SUMMARY',
  TRADE_EXECUTED = 'TRADE_EXECUTED',
  TRADE_AUDIT = 'TRADE_AUDIT',
  ESCALATION = 'ESCALATION',
  AUTONOMY_CHANGE = 'AUTONOMY_CHANGE',
  RISK_ALERT = 'RISK_ALERT',
}

export interface BaseAgentEvent {
  type: AgentEventType;
  tenantId: string; // Multi-tenant isolation
  timestamp: number;
}

export interface IntentPreviewEvent extends BaseAgentEvent {
  type: AgentEventType.INTENT_PREVIEW;
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  amount: number;
  price: number;
  rationale: string;
  confidence: number; // 0-1
  requiresConfirmation: boolean;
}

export interface SignalRationaleEvent extends BaseAgentEvent {
  type: AgentEventType.SIGNAL_RATIONALE;
  strategy: string;
  indicators: Record<string, number>;
  reasoning: string;
  signal: 'BUY' | 'SELL' | 'NONE';
}

export interface ConfidenceUpdateEvent extends BaseAgentEvent {
  type: AgentEventType.CONFIDENCE_UPDATE;
  overall: number; // 0-1
  factors: { name: string; score: number; weight: number }[];
}

export interface ThoughtSummaryEvent extends BaseAgentEvent {
  type: AgentEventType.THOUGHT_SUMMARY;
  steps: string[];
  conclusion: string;
  regime?: string; // e.g. 'trending', 'mean-reverting'
}

export interface TradeExecutedEvent extends BaseAgentEvent {
  type: AgentEventType.TRADE_EXECUTED;
  orderId: string;
  side: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  fee: number;
  pnl?: number;
}

export interface TradeAuditEvent extends BaseAgentEvent {
  type: AgentEventType.TRADE_AUDIT;
  entryId: string;
  action: string;
  detail: string;
  undoable: boolean;
}

export interface EscalationEvent extends BaseAgentEvent {
  type: AgentEventType.ESCALATION;
  severity: 'info' | 'warning' | 'critical';
  reason: string;
  suggestedAction: string;
  autoHalted: boolean;
}

export interface AutonomyChangeEvent extends BaseAgentEvent {
  type: AgentEventType.AUTONOMY_CHANGE;
  previousLevel: AutonomyLevel;
  newLevel: AutonomyLevel;
  reason: string;
}

export interface RiskAlertEvent extends BaseAgentEvent {
  type: AgentEventType.RISK_ALERT;
  alertType: 'drawdown' | 'daily_loss' | 'stop_loss' | 'take_profit' | 'volatility';
  value: number;
  threshold: number;
  message: string;
}

export type AgentEvent =
  | IntentPreviewEvent
  | SignalRationaleEvent
  | ConfidenceUpdateEvent
  | ThoughtSummaryEvent
  | TradeExecutedEvent
  | TradeAuditEvent
  | EscalationEvent
  | AutonomyChangeEvent
  | RiskAlertEvent;
