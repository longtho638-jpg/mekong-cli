// AGI SOP Engine Types

export interface SOPDefinition {
  id: string;
  name: string;
  description: string;
  triggers: TriggerCondition[];
  action: SOPAction;
  priority: number;
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: TriggerOperator;
  value: number | string | boolean;
}

export type TriggerOperator =
  | 'gt'    // greater than
  | 'lt'    // less than
  | 'gte'   // greater than or equal
  | 'lte'   // less than or equal
  | 'eq'    // equal
  | 'neq'   // not equal
  | 'between'
  | 'crosses_above'
  | 'crosses_below';

export interface SOPAction {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface SOPDecision {
  sopId: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  triggeredAt: number;
  latency: number;
  metadata?: {
    model?: string;
    signalData?: Record<string, any>;
  };
}

export interface SignalContext {
  symbol: string;
  timestamp: number;
  price: number;
  indicators: Record<string, number>;
  metadata?: Record<string, any>;
}
