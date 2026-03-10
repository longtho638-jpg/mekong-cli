/**
 * AntiBotSentinel configuration types
 * Defines all interfaces for the anti-bot monitoring system
 */

/** Severity levels for detected threats */
export type ThreatSeverity = 'WARNING' | 'CRITICAL';

/** Types of patterns the sentinel can detect */
export type DetectionType =
  | 'RATE_LIMIT'
  | 'ERROR_SPIKE'
  | 'ORDER_REJECTION'
  | 'SLIPPAGE_ANOMALY'
  | 'LATENCY_SHIFT';

/** Defensive actions the system can take */
export type DefensiveAction =
  | 'rotateProxy'
  | 'increaseJitter'
  | 'rebalanceShards'
  | 'switchAccount'
  | 'pauseSymbol'
  | 'pauseGlobal'
  | 'alert';

/** Raw exchange event captured by data collector */
export interface ExchangeEvent {
  id: string;
  exchange: string;
  timestamp: number;
  type: 'http_response' | 'order_result' | 'ws_event' | 'ws_disconnect';
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  orderResult?: 'filled' | 'rejected' | 'partial';
  rejectionReason?: string;
  slippageActualBps?: number;
  slippageExpectedBps?: number;
  symbol?: string;
  endpoint?: string;
}

/** Detection result from pattern detector */
export interface DetectionResult {
  type: DetectionType;
  exchange: string;
  severity: ThreatSeverity;
  confidence: number;
  timestamp: number;
  details: string;
  affectedSymbols?: string[];
  metrics?: Record<string, number>;
}

/** Action execution record */
export interface ActionRecord {
  action: DefensiveAction;
  exchange: string;
  timestamp: number;
  trigger: DetectionResult;
  success: boolean;
  details?: string;
}

/** Exchange health score */
export interface ExchangeHealth {
  exchange: string;
  score: number;
  lastUpdated: number;
  activeDefenses: ActionRecord[];
  recentDetections: DetectionResult[];
}

/** Detection thresholds configuration */
export interface DetectionConfig {
  rateLimitThreshold: number;
  errorRateThreshold: number;
  rejectionSpikeThreshold: number;
  slippageMultiplier: number;
  latencyShiftThresholdMs: number;
  useML: boolean;
}

/** Per-exchange action mapping */
export interface ExchangeActionConfig {
  WARNING: DefensiveAction[];
  CRITICAL: DefensiveAction[];
}

/** Cooldown periods per action (seconds) */
export type CooldownConfig = Partial<Record<DefensiveAction, number>>;

/** Full antibot configuration */
export interface AntiBotConfig {
  exchanges: string[];
  dataRetentionSeconds: number;
  detection: DetectionConfig;
  actions: Record<string, ExchangeActionConfig>;
  cooldownPeriods: CooldownConfig;
  alertChannels: string[];
}

/** Default configuration */
export const DEFAULT_ANTIBOT_CONFIG: AntiBotConfig = {
  exchanges: ['binance', 'bybit', 'okx'],
  dataRetentionSeconds: 3600,
  detection: {
    rateLimitThreshold: 0.8,
    errorRateThreshold: 0.05,
    rejectionSpikeThreshold: 3,
    slippageMultiplier: 2.0,
    latencyShiftThresholdMs: 100,
    useML: false,
  },
  actions: {
    binance: {
      WARNING: ['rotateProxy', 'increaseJitter'],
      CRITICAL: ['switchAccount', 'pauseSymbol'],
    },
    bybit: {
      WARNING: ['rotateProxy'],
      CRITICAL: ['pauseGlobal'],
    },
    okx: {
      WARNING: ['rotateProxy', 'increaseJitter'],
      CRITICAL: ['pauseSymbol', 'alert'],
    },
  },
  cooldownPeriods: {
    rotateProxy: 60,
    pauseSymbol: 300,
    pauseGlobal: 600,
    switchAccount: 120,
    increaseJitter: 30,
  },
  alertChannels: ['telegram', 'slack'],
};
